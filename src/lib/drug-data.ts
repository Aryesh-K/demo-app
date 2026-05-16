// ─── Drug database pre-fetch utility ─────────────────────────────────────────
// Fetches RxNorm, FDA label, DailyMed, PharmGKB, and KEGG data before AI calls.
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
  keggInteractions: string | null;
  keggDrugClass: string | null;
  aggregatedWarnings: string | null;
  aggregatedInteractions: string | null;
  dataSourceCount: number;
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

// ─── KEGG Drug ────────────────────────────────────────────────────────────────

async function getKEGGData(
  drugName: string,
): Promise<{ keggInteractions: string | null; keggDrugClass: string | null }> {
  const enc = encodeURIComponent(drugName);
  console.log("[kegg] Fetching:", drugName);
  try {
    const findRes = await fetchWithTimeout(
      `https://rest.kegg.jp/find/drug/${enc}`,
    );
    console.log("[kegg] Find status:", findRes.status);
    if (!findRes.ok) return { keggInteractions: null, keggDrugClass: null };

    const findText = await findRes.text();
    const idMatch = findText.match(/^(dr:D\d+)\t/m);
    if (!idMatch?.[1]) return { keggInteractions: null, keggDrugClass: null };

    const keggId = idMatch[1];
    console.log("[kegg] Found ID:", keggId);

    const getRes = await fetchWithTimeout(
      `https://rest.kegg.jp/get/${keggId}`,
    );
    console.log("[kegg] Get status:", getRes.status);
    if (!getRes.ok) return { keggInteractions: null, keggDrugClass: null };

    const entry = await getRes.text();

    const interactionMatch = entry.match(
      /^INTERACTION\s+([\s\S]+?)(?=^\S|\Z)/m,
    );
    const classMatch = entry.match(/^CLASS\s+(.+)/m);

    const keggInteractions = interactionMatch?.[1]
      ? `KEGG interactions: ${interactionMatch[1].replace(/\s+/g, " ").trim()}`.slice(0, 500)
      : null;
    const keggDrugClass = classMatch?.[1]?.trim() ?? null;

    console.log(
      "[kegg] interactions:",
      !!keggInteractions,
      "class:",
      keggDrugClass,
    );
    return { keggInteractions, keggDrugClass };
  } catch (err) {
    console.log("[drug-data] CATCH ERROR in getKEGGData:", err);
    return { keggInteractions: null, keggDrugClass: null };
  }
}

// ─── Aggregation ──────────────────────────────────────────────────────────────

function aggregateDrugData(
  _drugName: string,
  fda: FDAResult,
  dailyMed: DailyMedResult,
  pharmGKB: { pharmGKBData: string | null },
  kegg: { keggInteractions: string | null; keggDrugClass: string | null },
): {
  aggregatedWarnings: string | null;
  aggregatedInteractions: string | null;
  dataSourceCount: number;
} {
  const warningParts: string[] = [];
  if (fda.warnings) warningParts.push(`[FDA] ${fda.warnings}`);
  if (dailyMed.dailyMedWarnings)
    warningParts.push(`[DailyMed] ${dailyMed.dailyMedWarnings}`);

  const interactionParts: string[] = [];
  if (fda.interactions) interactionParts.push(`[FDA] ${fda.interactions}`);
  if (dailyMed.dailyMedInteractions)
    interactionParts.push(`[DailyMed] ${dailyMed.dailyMedInteractions}`);
  if (pharmGKB.pharmGKBData)
    interactionParts.push(`[PharmGKB] ${pharmGKB.pharmGKBData}`);
  if (kegg.keggInteractions)
    interactionParts.push(`[KEGG] ${kegg.keggInteractions}`);

  const sourcesWithData = [
    fda.warnings ?? fda.interactions ?? fda.description,
    dailyMed.dailyMedWarnings ?? dailyMed.dailyMedInteractions,
    pharmGKB.pharmGKBData,
    kegg.keggInteractions ?? kegg.keggDrugClass,
  ].filter(Boolean).length;

  return {
    aggregatedWarnings: warningParts.length
      ? warningParts.join("\n\n").slice(0, 1200)
      : null,
    aggregatedInteractions: interactionParts.length
      ? interactionParts.join("\n\n").slice(0, 1200)
      : null,
    dataSourceCount: sourcesWithData,
  };
}

// ─── Build prompt context string ──────────────────────────────────────────────

export function buildDataContext(
  drug1Data: DrugData,
  drug2Data: DrugData,
  _knownInteraction: NIHInteractionResult,
): string {
  const fmt = (val: string | null | undefined, fallback = "Not found") =>
    val ?? fallback;

  return (
    `VERIFIED DRUG DATABASE DATA (aggregated from up to 4 sources: FDA, DailyMed, PharmGKB, KEGG):\n\n` +
    `Drug A (${drug1Data.inputName}) — data from ${drug1Data.dataSourceCount} of 4 sources:\n` +
    (drug1Data.keggDrugClass
      ? `- Drug Class (KEGG): ${drug1Data.keggDrugClass}\n`
      : "") +
    `- Warnings: ${fmt(drug1Data.aggregatedWarnings ?? drug1Data.warnings)}\n` +
    `- Interactions: ${fmt(drug1Data.aggregatedInteractions ?? drug1Data.interactions)}\n` +
    `- Description: ${fmt(drug1Data.description)}\n\n` +
    `Drug B (${drug2Data.inputName}) — data from ${drug2Data.dataSourceCount} of 4 sources:\n` +
    (drug2Data.keggDrugClass
      ? `- Drug Class (KEGG): ${drug2Data.keggDrugClass}\n`
      : "") +
    `- Warnings: ${fmt(drug2Data.aggregatedWarnings ?? drug2Data.warnings)}\n` +
    `- Interactions: ${fmt(drug2Data.aggregatedInteractions ?? drug2Data.interactions)}\n` +
    `- Description: ${fmt(drug2Data.description)}\n\n` +
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

    const [fda1, fda2, dailyMed1, dailyMed2, pharmGKB1, pharmGKB2, kegg1, kegg2] =
      await Promise.all([
        getFDALabel(drug1),
        getFDALabel(drug2),
        getDailyMedData(drug1),
        getDailyMedData(drug2),
        getPharmGKBData(drug1),
        getPharmGKBData(drug2),
        getKEGGData(drug1),
        getKEGGData(drug2),
      ]);

    const aggregated1 = aggregateDrugData(drug1, fda1, dailyMed1, pharmGKB1, kegg1);
    const aggregated2 = aggregateDrugData(drug2, fda2, dailyMed2, pharmGKB2, kegg2);

    return {
      drug1Data: {
        inputName: drug1,
        ...rxNorm1,
        ...fda1,
        ...dailyMed1,
        ...pharmGKB1,
        ...kegg1,
        ...aggregated1,
      },
      drug2Data: {
        inputName: drug2,
        ...rxNorm2,
        ...fda2,
        ...dailyMed2,
        ...pharmGKB2,
        ...kegg2,
        ...aggregated2,
      },
      knownInteraction: {
        hasInteraction: false,
        severity: null,
        description: null,
      },
    };
  } catch (err) {
    console.log("[drug-data] CATCH ERROR in fetchDrugPairData:", err);
    const nullDrug = (name: string): DrugData => ({
      inputName: name,
      rxcui: null,
      standardName: null,
      warnings: null,
      interactions: null,
      description: null,
      dailyMedWarnings: null,
      dailyMedInteractions: null,
      pharmGKBData: null,
      keggInteractions: null,
      keggDrugClass: null,
      aggregatedWarnings: null,
      aggregatedInteractions: null,
      dataSourceCount: 0,
    });
    return {
      drug1Data: nullDrug(drug1),
      drug2Data: nullDrug(drug2),
      knownInteraction: {
        hasInteraction: false,
        severity: null,
        description: null,
      },
    };
  }
}
