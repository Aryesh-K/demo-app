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

interface FDALabelApiResponse {
  results?: Array<{
    warnings?: string[];
    drug_interactions?: string[];
    description?: string[];
  }>;
}

interface NIHInteractionConcept {
  minConceptItem?: { rxcui?: string };
}

interface NIHInteractionPair {
  interactionConcept?: NIHInteractionConcept[];
  severity?: string;
  description?: string;
}

interface NIHInteractionApiResponse {
  interactionTypeGroup?: Array<{
    interactionType?: Array<{
      interactionPair?: NIHInteractionPair[];
    }>;
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
  try {
    const url = `https://rxnav.nlm.nih.gov/REST/rxcui.json?name=${encodeURIComponent(drugName)}&search=1`;
    console.log("[rxnorm] Fetching:", drugName);
    const res = await fetchWithTimeout(url);
    console.log("[rxnorm] Response status:", res.status);
    if (!res.ok) return { rxcui: null, standardName: null };
    const data = (await res.json()) as RxNormApiResponse;
    console.log("[rxnorm] Response body:", JSON.stringify(data).slice(0, 300));
    const ids = data.idGroup?.rxnormId;
    if (!ids?.length) return { rxcui: null, standardName: null };
    return {
      rxcui: ids[0] ?? null,
      standardName: data.idGroup?.name ?? null,
    };
  } catch {
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
    return {
      warnings: r.warnings?.[0]?.slice(0, 500) ?? null,
      interactions: r.drug_interactions?.[0]?.slice(0, 500) ?? null,
      description: r.description?.[0]?.slice(0, 300) ?? null,
    };
  } catch {
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
    )) ?? { warnings: null, interactions: null, description: null }
  );
}

// ─── NIH Drug Interaction ─────────────────────────────────────────────────────

async function getNIHInteractions(
  rxcui1: string | null,
  rxcui2: string | null,
): Promise<NIHInteractionResult> {
  const empty: NIHInteractionResult = {
    hasInteraction: false,
    severity: null,
    description: null,
  };
  if (!rxcui1 || !rxcui2) return empty;
  try {
    const url = `https://rxnav.nlm.nih.gov/REST/interaction/interaction.json?rxcui=${rxcui1}`;
    console.log("[nih] Fetching rxcui:", rxcui1);
    const res = await fetchWithTimeout(url);
    console.log("[nih] Response status:", res.status);
    if (!res.ok) return empty;
    const data = (await res.json()) as NIHInteractionApiResponse;
    console.log("[nih] Response body:", JSON.stringify(data).slice(0, 300));
    const pairs: NIHInteractionPair[] =
      data.interactionTypeGroup
        ?.flatMap((g) => g.interactionType ?? [])
        .flatMap((t) => t.interactionPair ?? []) ?? [];
    for (const pair of pairs) {
      const rxcuis =
        pair.interactionConcept?.map((c) => c.minConceptItem?.rxcui) ?? [];
      if (rxcuis.includes(rxcui2)) {
        return {
          hasInteraction: true,
          severity: pair.severity ?? null,
          description: pair.description ?? null,
        };
      }
    }
    return empty;
  } catch {
    return empty;
  }
}

// ─── Build prompt context string ──────────────────────────────────────────────

export function buildDataContext(
  drug1Data: DrugData,
  drug2Data: DrugData,
  knownInteraction: NIHInteractionResult,
): string {
  const nihLine = knownInteraction.hasInteraction
    ? `KNOWN INTERACTION FOUND — Severity: ${knownInteraction.severity ?? "unspecified"}, Details: ${knownInteraction.description ?? "none"}`
    : "No direct interaction record found";

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

    const [fda1, fda2, nihInteraction] = await Promise.all([
      getFDALabel(drug1),
      getFDALabel(drug2),
      getNIHInteractions(rxNorm1.rxcui, rxNorm2.rxcui),
    ]);

    return {
      drug1Data: { inputName: drug1, ...rxNorm1, ...fda1 },
      drug2Data: { inputName: drug2, ...rxNorm2, ...fda2 },
      knownInteraction: nihInteraction,
    };
  } catch {
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
