// ─── Drug database pre-fetch utility ─────────────────────────────────────────
// Fetches RxNorm, FDA label, DailyMed, and PharmGKB data before AI calls.
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

interface DailyMedResult {
  dailyMedWarnings: string | null;
  dailyMedInteractions: string | null;
}

// ─── Public types ──────────────────────────────────────────────────────────────

export interface DrugData {
  inputName: string;
  rxcui: string | null;
  standardName: string | null;
  warnings: string | null;
  interactions: string | null;
  description: string | null;
  dailyMedWarnings: string | null;
  dailyMedInteractions: string | null;
  pharmGKBData: string | null;
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

// ─── DailyMed ─────────────────────────────────────────────────────────────────

async function getDailyMedData(drugName: string): Promise<DailyMedResult> {
  const enc = encodeURIComponent(drugName);
  console.log("[dailymed] Fetching:", drugName);
  try {
    const searchRes = await fetchWithTimeout(
      `https://dailymed.nih.gov/dailymed/services/v2/spls.json?drug_name=${enc}&pagesize=1`,
    );
    console.log("[dailymed] Search status:", searchRes.status);
    if (!searchRes.ok) return { dailyMedWarnings: null, dailyMedInteractions: null };

    const searchData = (await searchRes.json()) as {
      data?: Array<{ setid?: string; title?: string }>;
    };
    console.log("[dailymed] Search result:", JSON.stringify(searchData).slice(0, 200));

    const setId = searchData.data?.[0]?.setid;
    if (!setId) return { dailyMedWarnings: null, dailyMedInteractions: null };

    const labelRes = await fetchWithTimeout(
      `https://dailymed.nlm.nih.gov/dailymed/services/v2/spls/${setId}/sections.json`,
    );
    console.log("[dailymed] Label status:", labelRes.status);
    if (!labelRes.ok) return { dailyMedWarnings: null, dailyMedInteractions: null };

    const labelData = (await labelRes.json()) as {
      data?: Array<{
        section_code?: string;
        section_name?: string;
        text?: string;
      }>;
    };

    const sections = labelData.data ?? [];

    const warningsSection = sections.find(
      (s) =>
        s.section_code === "34071-1" ||
        s.section_name?.toLowerCase().includes("warning"),
    );
    const interactionsSection = sections.find(
      (s) =>
        s.section_code === "34073-7" ||
        s.section_name?.toLowerCase().includes("drug interaction"),
    );

    const dailyMedWarnings = warningsSection?.text?.slice(0, 600) ?? null;
    const dailyMedInteractions = interactionsSection?.text?.slice(0, 600) ?? null;

    console.log(
      "[dailymed] Found warnings:",
      !!dailyMedWarnings,
      "interactions:",
      !!dailyMedInteractions,
    );

    return { dailyMedWarnings, dailyMedInteractions };
  } catch (err) {
    console.log("[drug-data] CATCH ERROR in getDailyMedData:", err);
    return { dailyMedWarnings: null, dailyMedInteractions: null };
  }
}

// ─── PharmGKB ─────────────────────────────────────────────────────────────────

async function getPharmGKBData(drugName: string): Promise<{ pharmGKBData: string | null }> {
  const enc = encodeURIComponent(drugName);
  console.log("[pharmgkb] Fetching:", drugName);
  try {
    const res = await fetchWithTimeout(
      `https://api.pharmgkb.org/v1/data/chemical?name=${enc}&view=base`,
    );
    console.log("[pharmgkb] Status:", res.status);
    if (!res.ok) return { pharmGKBData: null };

    const data = (await res.json()) as {
      data?: Array<{
        id?: string;
        name?: string;
        clinicalAnnotationCount?: number;
        variantAnnotationCount?: number;
      }>;
    };

    const drug = data.data?.[0];
    if (!drug?.id) return { pharmGKBData: null };

    const ddiRes = await fetchWithTimeout(
      `https://api.pharmgkb.org/v1/data/drugInteraction?entity1Id=${drug.id}&view=base`,
    );

    if (ddiRes.ok) {
      const ddiData = (await ddiRes.json()) as {
        data?: Array<{
          entity1?: { name?: string };
          entity2?: { name?: string };
          description?: string;
        }>;
      };

      const interactions = ddiData.data
        ?.slice(0, 3)
        .map(
          (d) =>
            `${d.entity1?.name ?? ""} + ${d.entity2?.name ?? ""}: ${d.description ?? ""}`,
        )
        .join("; ");

      const pharmGKBData = interactions
        ? `PharmGKB interactions for ${drug.name}: ${interactions}`.slice(0, 500)
        : `PharmGKB: Drug found (${drug.name}), clinical annotations: ${drug.clinicalAnnotationCount ?? 0}`;

      console.log("[pharmgkb] Found data:", !!pharmGKBData);
      return { pharmGKBData };
    }

    return { pharmGKBData: null };
  } catch (err) {
    console.log("[drug-data] CATCH ERROR in getPharmGKBData:", err);
    return { pharmGKBData: null };
  }
}

// ─── Build prompt context string ──────────────────────────────────────────────

export function buildDataContext(
  drug1Data: DrugData,
  drug2Data: DrugData,
  _knownInteraction: NIHInteractionResult,
): string {
  return (
    `VERIFIED DRUG DATABASE DATA (use this to inform your analysis):\n\n` +
    `Drug A (${drug1Data.inputName}):\n` +
    `- FDA Warnings: ${drug1Data.warnings ?? "Not found"}\n` +
    `- FDA Interactions: ${drug1Data.interactions ?? "Not found"}\n` +
    `- DailyMed Warnings: ${drug1Data.dailyMedWarnings ?? "Not found"}\n` +
    `- DailyMed Interactions: ${drug1Data.dailyMedInteractions ?? "Not found"}\n` +
    `- PharmGKB Data: ${drug1Data.pharmGKBData ?? "Not found"}\n\n` +
    `Drug B (${drug2Data.inputName}):\n` +
    `- FDA Warnings: ${drug2Data.warnings ?? "Not found"}\n` +
    `- FDA Interactions: ${drug2Data.interactions ?? "Not found"}\n` +
    `- DailyMed Warnings: ${drug2Data.dailyMedWarnings ?? "Not found"}\n` +
    `- DailyMed Interactions: ${drug2Data.dailyMedInteractions ?? "Not found"}\n` +
    `- PharmGKB Data: ${drug2Data.pharmGKBData ?? "Not found"}\n\n` +
    `NIH Interaction Database: Not available (deprecated)\n\n` +
    `Base your analysis on this data where available. ` +
    `If database data conflicts with your training knowledge, ` +
    `prioritize the database data.\n\n`
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

    const [fda1, fda2, dailyMed1, dailyMed2, pharmGKB1, pharmGKB2] =
      await Promise.all([
        getFDALabel(drug1),
        getFDALabel(drug2),
        getDailyMedData(drug1),
        getDailyMedData(drug2),
        getPharmGKBData(drug1),
        getPharmGKBData(drug2),
      ]);

    return {
      drug1Data: {
        inputName: drug1,
        ...rxNorm1,
        ...fda1,
        ...dailyMed1,
        ...pharmGKB1,
      },
      drug2Data: {
        inputName: drug2,
        ...rxNorm2,
        ...fda2,
        ...dailyMed2,
        ...pharmGKB2,
      },
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
        dailyMedWarnings: null,
        dailyMedInteractions: null,
        pharmGKBData: null,
      },
      drug2Data: {
        inputName: drug2,
        rxcui: null,
        standardName: null,
        warnings: null,
        interactions: null,
        description: null,
        dailyMedWarnings: null,
        dailyMedInteractions: null,
        pharmGKBData: null,
      },
      knownInteraction: {
        hasInteraction: false,
        severity: null,
        description: null,
      },
    };
  }
}
