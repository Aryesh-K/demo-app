// ─── Drug database pre-fetch utility ─────────────────────────────────────────
// Fetches RxNorm, FDA label, and NIH interaction data before AI calls.
// All functions are safe: they never throw and always return null fields on failure.

const TIMEOUT_MS = 3000;

// ─── Internal API response types ──────────────────────────────────────────────

interface RxNormApiResponse {
  idGroup?: {
    name?: string;
    rxnormId?: string[];
  };
}

interface RxNormApproxResponse {
  approximateGroup?: {
    candidate?: Array<{ rxcui?: string }>;
  };
}

interface FDALabelApiResponse {
  results?: Array<{
    warnings?: string[];
    drug_interactions?: string[];
    description?: string[];
  }>;
}

// ─── Public types ──────────────────────────────────────────────────────────────

export interface DrugData {
  inputName: string;
  rxcui: string | null;
  standardName: string | null;
  warnings: string | null;
  interactions: string | null;
  description: string | null;
}

export interface NIHInteractionResult {
  hasInteraction: boolean;
  severity: string | null;
  description: string | null;
}

export interface DrugPairData {
  drug1Data: DrugData;
  drug2Data: DrugData;
  knownInteraction: NIHInteractionResult;
}

// ─── Fetch with timeout ────────────────────────────────────────────────────────

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

// ─── RxNorm ───────────────────────────────────────────────────────────────────

async function getRxNormData(
  drugName: string,
): Promise<{ rxcui: string | null; standardName: string | null }> {
  const enc = encodeURIComponent(drugName);
  console.log("[rxnorm] Fetching:", drugName);
  try {
    // Strategy 1: exact match
    const res1 = await fetchWithTimeout(
      `https://rxnav.nlm.nih.gov/REST/rxcui.json?name=${enc}&search=0`,
    );
    console.log("[rxnorm] Response status:", res1.status);
    if (res1.ok) {
      const data = (await res1.json()) as RxNormApiResponse;
      console.log(
        "[rxnorm] Raw response for",
        drugName,
        JSON.stringify(data).slice(0, 200),
      );
      const ids = data.idGroup?.rxnormId;
      if (ids?.length) {
        return {
          rxcui: ids[0] ?? null,
          standardName: data.idGroup?.name ?? null,
        };
      }
    }

    // Strategy 2: approximate match
    const res2 = await fetchWithTimeout(
      `https://rxnav.nlm.nih.gov/REST/rxcui.json?name=${enc}&search=1`,
    );
    console.log("[rxnorm] Response status (search=1):", res2.status);
    if (res2.ok) {
      const data = (await res2.json()) as RxNormApiResponse;
      console.log(
        "[rxnorm] Raw response for",
        drugName,
        JSON.stringify(data).slice(0, 200),
      );
      const ids = data.idGroup?.rxnormId;
      if (ids?.length) {
        return {
          rxcui: ids[0] ?? null,
          standardName: data.idGroup?.name ?? null,
        };
      }
    }

    // Strategy 3: spelling suggestions
    const res3 = await fetchWithTimeout(
      `https://rxnav.nlm.nih.gov/REST/approximateTerm.json?term=${enc}&maxEntries=1`,
    );
    console.log("[rxnorm] Response status (approx):", res3.status);
    if (res3.ok) {
      const data = (await res3.json()) as RxNormApproxResponse;
      console.log(
        "[rxnorm] Raw response for",
        drugName,
        JSON.stringify(data).slice(0, 200),
      );
      const rxcui = data.approximateGroup?.candidate?.[0]?.rxcui ?? null;
      if (rxcui) return { rxcui, standardName: null };
    }

    return { rxcui: null, standardName: null };
  } catch (err) {
    console.log("[drug-data] CATCH ERROR in getRxNormData:", err);
    return { rxcui: null, standardName: null };
  }
}

// ─── FDA Drug Label ────────────────────────────────────────────────────────────

interface FDAResult {
  warnings: string | null;
  interactions: string | null;
  description: string | null;
}

async function tryFDAUrl(url: string): Promise<FDAResult | null> {
  try {
    const res = await fetchWithTimeout(url);
    console.log("[fda] Response status:", res.status);
    if (!res.ok) return null;
    const data = (await res.json()) as FDALabelApiResponse;
    console.log("[fda] Response body:", JSON.stringify(data).slice(0, 300));
    const r = data.results?.[0];
    if (!r) return null;
    console.log(
      "[fda] Extracted warnings:",
      !!r.warnings,
      "interactions:",
      !!r.drug_interactions,
      "description:",
      !!r.description,
    );
    return {
      warnings: r.warnings?.[0]?.slice(0, 500) ?? null,
      interactions: r.drug_interactions?.[0]?.slice(0, 500) ?? null,
      description: r.description?.[0]?.slice(0, 300) ?? null,
    };
  } catch (err) {
    console.log("[drug-data] CATCH ERROR in tryFDAUrl:", err);
    return null;
  }
}

async function getFDALabel(drugName: string): Promise<FDAResult> {
  console.log("[fda] Fetching:", drugName);
  const enc = encodeURIComponent(drugName);
  return (
    (await tryFDAUrl(
      `https://api.fda.gov/drug/label.json?search=openfda.generic_name:"${enc}"&limit=1`,
    )) ??
    (await tryFDAUrl(
      `https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${enc}"&limit=1`,
    )) ??
    (await tryFDAUrl(
      `https://api.fda.gov/drug/label.json?search=openfda.substance_name:"${enc}"&limit=1`,
    )) ?? { warnings: null, interactions: null, description: null }
  );
}

// ─── Build prompt context string ──────────────────────────────────────────────

export function buildDataContext(
  drug1Data: DrugData,
  drug2Data: DrugData,
  _knownInteraction: NIHInteractionResult,
): string {
  const nihLine = "Not available (deprecated)";

  return (
    `VERIFIED DRUG DATABASE DATA (use this to inform your analysis):\n\n` +
    `Drug A (${drug1Data.inputName}):\n` +
    `- FDA Warnings: ${drug1Data.warnings ?? "Not found"}\n` +
    `- Known Interactions: ${drug1Data.interactions ?? "Not found"}\n\n` +
    `Drug B (${drug2Data.inputName}):\n` +
    `- FDA Warnings: ${drug2Data.warnings ?? "Not found"}\n` +
    `- Known Interactions: ${drug2Data.interactions ?? "Not found"}\n\n` +
    `NIH Interaction Database: ${nihLine}\n\n` +
    `Base your analysis on this data where available. If the database data conflicts with your training knowledge, prioritize the database data.\n\n`
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function fetchDrugPairData(
  drug1: string,
  drug2: string,
): Promise<DrugPairData> {
  try {
    const [rxNorm1, rxNorm2] = await Promise.all([
      getRxNormData(drug1),
      getRxNormData(drug2),
    ]);

    const [fda1, fda2] = await Promise.all([
      getFDALabel(drug1),
      getFDALabel(drug2),
    ]);

    return {
      drug1Data: { inputName: drug1, ...rxNorm1, ...fda1 },
      drug2Data: { inputName: drug2, ...rxNorm2, ...fda2 },
      knownInteraction: {
        hasInteraction: false,
        severity: null,
        description: null,
      },
    };
  } catch (err) {
    console.log("[drug-data] CATCH ERROR in fetchDrugPairData:", err);
    return {
      drug1Data: {
        inputName: drug1,
        rxcui: null,
        standardName: null,
        warnings: null,
        interactions: null,
        description: null,
      },
      drug2Data: {
        inputName: drug2,
        rxcui: null,
        standardName: null,
        warnings: null,
        interactions: null,
        description: null,
      },
      knownInteraction: {
        hasInteraction: false,
        severity: null,
        description: null,
      },
    };
  }
}
