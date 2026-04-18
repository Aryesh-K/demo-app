import { type NextRequest, NextResponse } from "next/server";
import { buildDataContext, fetchDrugPairData } from "~/lib/drug-data";

interface DrugInput {
  name: string;
  method: string;
  amount?: string;
  unit?: string;
}

interface RequestBody {
  drugs: DrugInput[];
  treatment_context?: string;
  health_context?: string;
  notes?: string;
  isSingleDrugMode?: boolean;
}

interface GroqResponse {
  choices?: { message?: { content?: string } }[];
  error?: { message?: string };
}

function describeDrug(drug: DrugInput): string {
  const parts = [drug.name.trim() || "unknown substance", drug.method];
  if (drug.amount?.trim())
    parts.push(`${drug.amount.trim()}${drug.unit ? ` ${drug.unit}` : ""}`);
  return parts.join(", ");
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GROQ_API_KEY is not set" },
      { status: 503 },
    );
  }

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  const { drugs, treatment_context, health_context, notes, isSingleDrugMode } = body;
  if (!Array.isArray(drugs) || (isSingleDrugMode ? drugs.length < 1 : drugs.length < 2)) {
    return NextResponse.json(
      { error: "At least 2 drugs required" },
      { status: 400 },
    );
  }

  const drugList = drugs
    .map((d, i) => `${i + 1}. ${describeDrug(d)}`)
    .join("\n");

  // ─── Multi-database pre-fetch (top 3 pairs) ────────────────────────────────
  const topPairs = drugs
    .flatMap((d1, i) =>
      drugs.slice(i + 1).map((d2) => ({ d1: d1.name, d2: d2.name })),
    )
    .slice(0, 3);

  const pairDataResults = await Promise.all(
    topPairs.map(({ d1, d2 }) => fetchDrugPairData(d1, d2)),
  );

  const dataContext = pairDataResults
    .map((pd) => {
      console.log(
        "[drug-data] FDA drug1 data:",
        !!pd.drug1Data.warnings || !!pd.drug1Data.interactions,
      );
      console.log(
        "[drug-data] FDA drug2 data:",
        !!pd.drug2Data.warnings || !!pd.drug2Data.interactions,
      );
      return buildDataContext(pd.drug1Data, pd.drug2Data, pd.knownInteraction);
    })
    .join("\n");
  // ──────────────────────────────────────────────────────────────────────────

  const systemPrompt =
    "You are a clinical pharmacology expert analyzing multiple drug interactions with medical precision. " +
    "Always respond with valid JSON only — no markdown, no code fences, no extra text.\n\n" +
    "Analyze ALL pairwise combinations between the provided drugs. Identify the most clinically significant interactions and rank them by danger level.\n\n" +
    "Risk levels:\n" +
    "- HIGH: serious harm, organ damage, or death. Includes: two drugs same class, duplicate ingredients, serotonin syndrome, severe liver/kidney toxicity, CNS/respiratory depression, significant bleeding risk\n" +
    "- MODERATE: meaningful side effects or reduced effectiveness\n" +
    "- LOW: minimal interaction\n" +
    "When in doubt choose HIGH.\n\n" +
    "Interaction types:\n" +
    "- safety: health/safety risk\n" +
    "- efficacy: one substance degrades or blocks the other\n" +
    "- both: affects both\n\n" +
    "For overall_risk, use the highest risk level found across all combinations.\n\n" +
    "When treatment context is provided, explicitly mention it in every explanation. This is mandatory.\n\n" +
    "Always respond with valid JSON only.";

  const ctx = treatment_context?.trim();
  const contextLine = ctx
    ? `The user is treating: ${ctx}. Reference this in all explanations.\n\n`
    : "";

  const hp = health_context?.trim();
  const healthLine = hp
    ? `User health profile: ${hp}. Factor this into your analysis and flag any additional risks based on this profile.\n\n`
    : "";

  const notesLine = notes?.trim()
    ? `Additional context from user: ${notes.trim()}\n\n`
    : "";

  const drugSection = isSingleDrugMode
    ? `Check how ${describeDrug(drugs[0]!)} interacts with each of the patient's current medications listed in the health profile. ` +
      `Treat each current medication as a separate Drug B and analyze pairwise. ` +
      `If no medications are listed in the health profile, return an empty combinations array.\n\n`
    : `Analyze interactions between these substances:\n${drugList}\n\n`;

  const userPrompt =
    dataContext +
    drugSection +
    contextLine +
    healthLine +
    notesLine +
    `Identify the most dangerous combinations and rank them.\n` +
    `Return this exact JSON:\n` +
    `{\n` +
    `  "overall_risk": "high" | "moderate" | "low",\n` +
    `  "combinations": [\n` +
    `    {\n` +
    `      "drug_a": "name",\n` +
    `      "drug_b": "name",\n` +
    `      "risk_level": "high" | "moderate" | "low",\n` +
    `      "interaction_type": "safety" | "efficacy" | "both",\n` +
    `      "classification": "CYP450 Metabolism | Serotonin Syndrome | CNS Depression | Additive Toxicity | Receptor Competition | Chemical Degradation | Absorption Interference | Duplicate Ingredients | Other",\n` +
    `      "simple_explanation": "3-4 sentences plain English middle school level. Mention treatment context if provided.",\n` +
    `      "real_world_context": "1-2 sentences explaining what this means practically for the user in their daily life."\n` +
    `    }\n` +
    `  ],\n` +
    `  "overall_summary": "2-3 sentences summarizing the most important risks across the entire regimen. Mention treatment context if provided.",\n` +
    `  "recommendation": "Avoid this combination | Consult your doctor | Use with caution | Generally safe"\n` +
    `}\n` +
    `Sort combinations from highest to lowest risk. Only include combinations with at least LOW interaction significance — skip truly inert pairs.`;

  let apiResponse: Response;
  try {
    apiResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      },
    );
  } catch (err) {
    console.error("[check-interaction-premium] Network error:", err);
    return NextResponse.json(
      { error: "Network error reaching Groq" },
      { status: 502 },
    );
  }

  const responseText = await apiResponse.text();
  if (!apiResponse.ok) {
    return NextResponse.json(
      { error: `Groq returned ${apiResponse.status}: ${responseText}` },
      { status: 502 },
    );
  }

  let data: GroqResponse;
  try {
    data = JSON.parse(responseText) as GroqResponse;
  } catch {
    return NextResponse.json(
      { error: "Unparseable response from Groq" },
      { status: 502 },
    );
  }

  if (data.error) {
    return NextResponse.json(
      { error: data.error.message ?? "Groq API error" },
      { status: 502 },
    );
  }

  const content = data.choices?.[0]?.message?.content ?? "";

  try {
    const cleaned = content
      .replace(/^```json?\s*/i, "")
      .replace(/```\s*$/, "")
      .trim();

    type ParsedCombination = {
      drug_a: string;
      drug_b: string;
      risk_level: string;
      interaction_type: string;
      classification: string;
      simple_explanation: string;
      real_world_context: string;
    };

    type ParsedResult = {
      overall_risk: string;
      combinations: ParsedCombination[];
      overall_summary: string;
      recommendation: string;
    };

    let result: ParsedResult;
    try {
      result = JSON.parse(cleaned) as ParsedResult;
    } catch {
      // Fallback: extract top-level scalars + try to parse combinations substring
      const overallRiskMatch = cleaned.match(/"overall_risk"\s*:\s*"([^"]+)"/);
      const summaryMatch = cleaned.match(
        /"overall_summary"\s*:\s*"([\s\S]+?)(?=",\s*"|"\s*})/,
      );
      const recMatch = cleaned.match(/"recommendation"\s*:\s*"([^"]+)"/);

      let combs: ParsedCombination[] = [];
      const combsText = cleaned.match(
        /"combinations"\s*:\s*(\[[\s\S]+?\])(?=\s*[,}])/,
      );
      if (combsText) {
        try {
          combs = JSON.parse(combsText[1]) as ParsedCombination[];
        } catch {
          /* leave empty */
        }
      }

      if (!overallRiskMatch) throw new Error("Could not extract fields");

      result = {
        overall_risk: overallRiskMatch[1],
        combinations: combs,
        overall_summary: summaryMatch ? summaryMatch[1] : "",
        recommendation: recMatch ? recMatch[1] : "Consult your doctor",
      };
    }

    const riskRaw = result.overall_risk?.toLowerCase();
    const overall_risk =
      riskRaw === "high" || riskRaw === "moderate" || riskRaw === "low"
        ? riskRaw
        : "moderate";

    const VALID_RECS = [
      "Avoid this combination",
      "Consult your doctor",
      "Use with caution",
      "Generally safe",
    ] as const;
    type ValidRec = (typeof VALID_RECS)[number];
    const recommendation = (VALID_RECS as readonly string[]).includes(
      result.recommendation,
    )
      ? (result.recommendation as ValidRec)
      : "Consult your doctor";

    const combinations = (
      Array.isArray(result.combinations) ? result.combinations : []
    ).map((c) => {
      const rl = c.risk_level?.toLowerCase();
      const it = c.interaction_type?.toLowerCase();
      return {
        drug_a: c.drug_a ?? "",
        drug_b: c.drug_b ?? "",
        risk_level: (rl === "high" || rl === "moderate" || rl === "low"
          ? rl
          : "moderate") as "high" | "moderate" | "low",
        interaction_type: (it === "safety" || it === "efficacy" || it === "both"
          ? it
          : "safety") as "safety" | "efficacy" | "both",
        classification: c.classification ?? "Other",
        simple_explanation: c.simple_explanation ?? "",
        real_world_context: c.real_world_context ?? "",
      };
    });

    return NextResponse.json({
      overall_risk,
      combinations,
      overall_summary: result.overall_summary ?? "",
      recommendation,
    });
  } catch (err) {
    console.error(
      "[check-interaction-premium] Failed to parse:",
      err,
      "raw:",
      content,
    );
    return NextResponse.json(
      { error: "Failed to parse model response" },
      { status: 500 },
    );
  }
}
