import { type NextRequest, NextResponse } from "next/server";
import { env } from "~/env";
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
  level: 1 | 2 | 3;
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

// ─── Level-specific system prompts ───────────────────────────────────────────

const LEVEL_SYSTEM_PROMPTS: Record<1 | 2 | 3, string> = {
  1:
    "You are a biology teacher explaining drug interactions to middle and high school honors students. Always respond with valid JSON only.\n\n" +
    "Write at a 7th-8th grade reading level. Use simple words and everyday analogies. Explain what each drug does in the body like you are talking to a curious 13-year-old with no science background.\n\n" +
    "Focus on: basic organ function (liver, brain, stomach), simple cause and effect, what the person actually feels. Use analogies like locks and keys, traffic jams, messengers. Never use technical terms without immediately explaining them in plain language.\n\n" +
    "Risk levels - HIGH: serious harm or death risk, MODERATE: meaningful side effects, LOW: minimal risk. When in doubt choose HIGH.",

  2:
    "You are an AP Biology teacher explaining drug interactions to advanced high school students. Always respond with valid JSON only.\n\n" +
    "Write at an 11th-12th grade level. Include: enzyme kinetics and inhibition, cell signaling pathways, neurotransmitter systems (serotonin, dopamine, GABA, norepinephrine), protein structure/function, basic metabolism.\n\n" +
    "Stay at the molecular and cellular level. Reference specific enzymes, receptors, and pathways by name. Do not include clinical pharmacology or treatment recommendations — keep it biological.\n\n" +
    "Risk levels - HIGH: serious harm or death risk, MODERATE: meaningful side effects, LOW: minimal risk. When in doubt choose HIGH.",

  3:
    "You are a pharmacology professor explaining drug interactions to pre-med college students. Always respond with valid JSON only.\n\n" +
    "Write at a college sophomore/junior level. Include: pharmacokinetics (ADME — absorption, distribution, metabolism, excretion), CYP450 enzyme system (specific isoforms: CYP3A4, CYP2D6, CYP2C9, etc), drug receptor pharmacology (agonist, antagonist, partial agonist, inverse agonist), organ system pathophysiology, clinical presentation of the interaction, treatment implications.\n\n" +
    "Trace the full pathway from drug administration to clinical outcome. Be precise and use correct medical terminology.\n\n" +
    "Risk levels - HIGH: serious harm or death risk, MODERATE: meaningful side effects, LOW: minimal risk. When in doubt choose HIGH.",
};

const LEVEL_NAMES: Record<1 | 2 | 3, string> = {
  1: "Level 1 (Honors Biology / Middle & High School)",
  2: "Level 2 (AP Biology / Advanced High School)",
  3: "Level 3 (Pre-Med / College Level)",
};

const CONTEXT_ADDITION =
  "\nWhen treatment context is provided, explicitly reference it in your explanation. " +
  "When health profile is provided, flag any additional risks based on that profile. This is mandatory.";

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const apiKey = env.GROQ_API_KEY;

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  const { drugs, treatment_context, health_context, level } = body;

  if (!Array.isArray(drugs) || drugs.length < 2) {
    return NextResponse.json(
      { error: "At least 2 drugs required" },
      { status: 400 },
    );
  }

  const validLevel: 1 | 2 | 3 =
    level === 1 || level === 2 || level === 3 ? level : 2;

  const drugList = drugs
    .map((d, i) => `${i + 1}. ${describeDrug(d)}`)
    .join("\n");

  // ─── Pre-fetch FDA/NIH data for top 3 pairs ───────────────────────────────
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
        "[arn-interaction-premium] FDA drug1 data:",
        !!pd.drug1Data.warnings || !!pd.drug1Data.interactions,
      );
      console.log(
        "[arn-interaction-premium] FDA drug2 data:",
        !!pd.drug2Data.warnings || !!pd.drug2Data.interactions,
      );
      return buildDataContext(pd.drug1Data, pd.drug2Data, pd.knownInteraction);
    })
    .join("\n");
  // ─────────────────────────────────────────────────────────────────────────

  const systemPrompt = LEVEL_SYSTEM_PROMPTS[validLevel] + CONTEXT_ADDITION;

  const ctx = treatment_context?.trim();
  const contextLine = ctx ? `Goal/concern: ${ctx}\n` : "";
  const hp = health_context?.trim();
  const healthLine = hp ? `Health profile: ${hp}\n` : "";

  const userPrompt =
    dataContext +
    `Before analyzing, internalize these calibration examples:\n` +
    `- aspirin + ibuprofen = HIGH (two NSAIDs, GI bleed risk)\n` +
    `- acetaminophen + NyQuil = HIGH (duplicate acetaminophen, liver damage risk)\n` +
    `- fluoxetine + dextromethorphan = HIGH (serotonin syndrome)\n` +
    `- alcohol + benzodiazepines = HIGH (CNS depression, death)\n` +
    `- ibuprofen + acetaminophen = MODERATE (different mechanisms, generally safe short term)\n` +
    `- amoxicillin + birth control = MODERATE (reduced efficacy)\n` +
    `- vitamin C + iron supplement = LOW, efficacy (enhances absorption)\n` +
    `- benzoyl peroxide + vitamin C serum = LOW, efficacy (destroys vitamin C on contact)\n` +
    `- tetracycline + dairy/calcium = LOW, efficacy (calcium chelates the antibiotic)\n\n` +
    `Analyze interactions between:\n${drugList}\n\n` +
    contextLine +
    healthLine +
    `\nAnalyze at ${LEVEL_NAMES[validLevel]} understanding level.\n\n` +
    `Return this exact JSON for each drug pair:\n` +
    `{\n` +
    `  "combinations": [\n` +
    `    {\n` +
    `      "drug_a": "name",\n` +
    `      "drug_b": "name",\n` +
    `      "risk_level": "high" | "moderate" | "low",\n` +
    `      "interaction_type": "safety" | "efficacy" | "both",\n` +
    `      "classification": "CYP450 Metabolism | Serotonin Syndrome | CNS Depression | Additive Toxicity | Receptor Competition | Chemical Degradation | Absorption Interference | Duplicate Ingredients | Other",\n` +
    `      "explanation": "5-8 sentences fully written at the selected curriculum level. Start with what each drug does individually, then explain the interaction, then the outcome.",\n` +
    `      "key_terms": ["3-5 terms appropriate for the selected curriculum level"]\n` +
    `    }\n` +
    `  ],\n` +
    `  "overall_risk": "high" | "moderate" | "low",\n` +
    `  "overall_summary": "2-3 sentences at the selected level summarizing the most important finding.",\n` +
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
    console.error("[arn-interaction-premium] Network error:", err);
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
      explanation: string;
      key_terms: string[];
    };

    type ParsedResult = {
      combinations: ParsedCombination[];
      overall_risk: string;
      overall_summary: string;
      recommendation: string;
    };

    let result: ParsedResult;
    try {
      result = JSON.parse(cleaned) as ParsedResult;
    } catch {
      // Regex fallback
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
        combinations: combs,
        overall_risk: overallRiskMatch[1],
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
        risk_level: (
          rl === "high" || rl === "moderate" || rl === "low" ? rl : "moderate"
        ) as "high" | "moderate" | "low",
        interaction_type: (
          it === "safety" || it === "efficacy" || it === "both" ? it : "safety"
        ) as "safety" | "efficacy" | "both",
        classification: c.classification ?? "Other",
        explanation: c.explanation ?? "",
        key_terms: Array.isArray(c.key_terms) ? c.key_terms : [],
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
      "[arn-interaction-premium] Failed to parse:",
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
