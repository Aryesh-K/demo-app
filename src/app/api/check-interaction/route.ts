import { type NextRequest, NextResponse } from "next/server";
import { buildDataContext, fetchDrugPairData } from "~/lib/drug-data";

interface RequestBody {
  drug1: string;
  method1: string;
  amount1?: string;
  unit1?: string;
  drug2: string;
  method2: string;
  amount2?: string;
  unit2?: string;
  treatment_context?: string;
  notes?: string;
}

interface OpenRouterResponse {
  choices?: { message?: { content?: string } }[];
  error?: { message?: string };
}

function describeDrug(
  name: string,
  method: string,
  amount?: string,
  unit?: string,
): string {
  const parts = [name.trim() || "unknown substance", method];
  if (amount?.trim()) parts.push(`${amount.trim()}${unit ? ` ${unit}` : ""}`);
  return parts.join(", ");
}

// ─── Unknown drug detection ───────────────────────────────────────────────────

const UNKNOWN_DRUG_PHRASES = [
  "not a medication",
  "not a drug",
  "not a real",
  "unknown substance",
  "cannot identify",
  "no such drug",
];

function findBadDrug(text: string, candidates: string[]): string | null {
  const lower = text.toLowerCase();
  if (!UNKNOWN_DRUG_PHRASES.some((p) => lower.includes(p))) return null;
  for (const phrase of UNKNOWN_DRUG_PHRASES) {
    const idx = lower.indexOf(phrase);
    if (idx === -1) continue;
    const win = lower.slice(Math.max(0, idx - 120), idx + 120);
    for (const c of candidates) {
      if (c.trim() && win.includes(c.toLowerCase().trim())) return c;
    }
  }
  return (
    candidates.filter((c) => c.trim()).join(" or ") ||
    "one of the entered substances"
  );
}

export async function POST(req: NextRequest) {
  console.log("[check-interaction] POST received");
  console.log(
    "All env keys:",
    Object.keys(process.env).filter((k) => k.includes("OPEN")),
  );

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error("[check-interaction] GROQ_API_KEY is not set");
    return NextResponse.json(
      { error: "GROQ_API_KEY is not set" },
      { status: 503 },
    );
  }
  console.log("[check-interaction] API key present, length:", apiKey.length);

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch (err) {
    console.error("[check-interaction] Failed to parse request body:", err);
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  const {
    drug1,
    method1,
    amount1,
    unit1,
    drug2,
    method2,
    amount2,
    unit2,
    treatment_context,
    notes,
  } = body;
  console.log("[check-interaction] Drugs:", drug1, "/", drug2);

  const { drug1Data, drug2Data, knownInteraction } = await fetchDrugPairData(
    drug1,
    drug2,
  );
  console.log(
    "[drug-data] FDA drug1 data:",
    !!drug1Data.warnings || !!drug1Data.interactions,
  );
  console.log(
    "[drug-data] FDA drug2 data:",
    !!drug2Data.warnings || !!drug2Data.interactions,
  );
  const dataContext = buildDataContext(drug1Data, drug2Data, knownInteraction);

  const drugADesc = describeDrug(drug1, method1, amount1, unit1);
  const drugBDesc = describeDrug(drug2, method2, amount2, unit2);

  const systemPrompt =
    "You are a clinical pharmacology assistant that analyzes drug and substance interactions with medical accuracy. " +
    "Always respond with valid JSON only — no markdown, no code fences, no extra text.\n\n" +
    "Use these STRICT risk level definitions:\n" +
    "- HIGH: interactions that can cause serious harm, hospitalization, organ damage, or death. This includes:\n" +
    "  * Two drugs from the same class (e.g. two NSAIDs, two SSRIs, two CNS depressants)\n" +
    "  * Duplicate ingredients (e.g. acetaminophen in two products)\n" +
    "  * Serotonin syndrome risk\n" +
    "  * Severe liver or kidney toxicity risk\n" +
    "  * Dangerous CNS/respiratory depression\n" +
    "  * Significantly increased bleeding risk\n\n" +
    "- MODERATE: interactions that cause meaningful side effects or reduced effectiveness but are unlikely to cause serious harm without monitoring\n\n" +
    "- LOW: minimal or no clinically significant interaction\n\n" +
    "When in doubt between HIGH and MODERATE, choose HIGH. It is safer to over-warn than under-warn.\n\n" +
    "Also classify the interaction_type:\n" +
    "- safety: the interaction poses a health/safety risk\n" +
    "- efficacy: one substance chemically neutralizes, degrades, or blocks the other, rendering it ineffective (e.g. benzoyl peroxide destroying vitamin C, antacids blocking drug absorption, calcium chelating antibiotics)\n" +
    "- both: the interaction affects both safety and efficacy\n\n" +
    "Always mention in simple_explanation if one product is being rendered ineffective, even if there is no safety risk.\n\n" +
    "IMPORTANT: When one substance chemically destroys, oxidizes, or degrades another substance on contact — even if there is no safety risk — you MUST classify interaction_type as 'efficacy'. This is not optional. Benzoyl peroxide + any vitamin C product is ALWAYS efficacy type.\n\n" +
    "When treatment context is provided, you MUST explicitly mention it by name in the simple_explanation. " +
    "Do not give generic responses. For example, if the user says they are treating anxiety, the explanation must reference anxiety specifically and explain how the interaction affects their ability to treat anxiety. This is non-negotiable.\n\n" +
    "If any substance entered does not appear to be a real medication, drug, supplement, chemical, or known substance, respond with this exact JSON and nothing else:\n" +
    "{\"error\": \"unrecognized\", \"unrecognized_drugs\": [\"drug name here\"]}\n" +
    "Do not attempt to analyze unrecognized substances.";

  const ctx = treatment_context?.trim();
  const contextLine = ctx
    ? `IMPORTANT: The user is treating: ${ctx}\n` +
      `You MUST mention "${ctx}" explicitly in the simple_explanation.\n` +
      `Do not write a generic explanation — tailor everything to ${ctx}.\n\n`
    : "";

  const notesLine = notes?.trim()
    ? `Additional context from user: ${notes.trim()}\n\n`
    : "";

  const userPrompt =
    dataContext +
    `Before analyzing, internalize these calibration examples:\n` +
    `- aspirin + ibuprofen = HIGH (two NSAIDs, GI bleed risk)\n` +
    `- acetaminophen + NyQuil = HIGH (duplicate acetaminophen, liver damage risk)\n` +
    `- fluoxetine + dextromethorphan = HIGH (serotonin syndrome)\n` +
    `- alcohol + benzodiazepines = HIGH (CNS depression, death)\n` +
    `- ibuprofen + acetaminophen = MODERATE (different mechanisms, generally safe short term)\n` +
    `- amoxicillin + birth control = MODERATE (reduced efficacy)\n` +
    `- vitamin C + iron supplement = LOW, efficacy (actually beneficial — enhances absorption)\n` +
    `- vitamin C serum + benzoyl peroxide = LOW risk, efficacy (benzoyl peroxide is a strong oxidizer that chemically degrades and destroys vitamin C/ascorbic acid on contact, rendering the vitamin C completely ineffective. This is a well-documented incompatibility in dermatology.)\n` +
    `- tetracycline + dairy/calcium = LOW, efficacy (calcium chelates the antibiotic, blocking absorption)\n\n` +
    `Now analyze this interaction using the same strict standards as the examples above:\n\n` +
    `Analyze the interaction between:\n` +
    `Drug A: ${drugADesc}\n` +
    `Drug B: ${drugBDesc}\n\n` +
    contextLine +
    notesLine +
    `Respond with exactly this JSON structure:\n` +
    `{\n` +
    `  "risk_level": "high" | "moderate" | "low",\n` +
    `  "interaction_type": "safety" | "efficacy" | "both",\n` +
    `  "mechanism": "1-2 sentence biochemical explanation",\n` +
    `  "simple_explanation": "2-3 sentence plain English explanation at a middle school reading level",\n` +
    `  "confidence_score": number from 0-100 (90-100: well-documented in FDA labels, clinical literature, and multiple databases; 70-89: recognized but evidence varies across sources; 50-69: plausible based on mechanism but limited direct documentation; 0-49: theoretical or based primarily on AI inference with minimal database support)\n` +
    `}`;

  let apiResponse: Response;
  try {
    console.log("[check-interaction] Calling Groq...");
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
    console.error("[check-interaction] Network error calling Groq:", err);
    return NextResponse.json(
      { error: "Network error reaching OpenRouter" },
      { status: 502 },
    );
  }

  const responseText = await apiResponse.text();
  console.log(
    "[check-interaction] OpenRouter status:",
    apiResponse.status,
    "body:",
    responseText.slice(0, 500),
  );

  if (!apiResponse.ok) {
    return NextResponse.json(
      { error: `OpenRouter returned ${apiResponse.status}: ${responseText}` },
      { status: 502 },
    );
  }

  let data: OpenRouterResponse;
  try {
    data = JSON.parse(responseText) as OpenRouterResponse;
  } catch (err) {
    console.error("[check-interaction] Failed to parse OpenRouter JSON:", err);
    return NextResponse.json(
      { error: "Unparseable response from OpenRouter" },
      { status: 502 },
    );
  }

  if (data.error) {
    console.error("[check-interaction] OpenRouter API error:", data.error);
    return NextResponse.json(
      { error: data.error.message ?? "OpenRouter API error" },
      { status: 502 },
    );
  }

  const content = data.choices?.[0]?.message?.content ?? "";
  console.log("[check-interaction] Model content:", content.slice(0, 300));

  try {
    // Clean the response
    const cleaned = content
      .replace(/^```json?\s*/i, "")
      .replace(/```\s*$/, "")
      .trim();

    // Check for unrecognized drug signal from AI
    try {
      const probe = JSON.parse(cleaned) as {
        error?: string;
        unrecognized_drugs?: string[];
      };
      if (probe.error === "unrecognized") {
        return NextResponse.json({
          error: "unrecognized",
          unrecognized_drugs: probe.unrecognized_drugs ?? [],
        });
      }
    } catch {
      /* not JSON or no error field, proceed normally */
    }

    type ParsedResult = {
      risk_level: string;
      interaction_type: string;
      mechanism: string;
      simple_explanation: string;
      confidence_score?: number;
    };

    // Try standard parse first
    let result: ParsedResult;
    try {
      result = JSON.parse(cleaned) as ParsedResult;
    } catch {
      // If that fails, extract fields with regex as fallback
      const riskMatch = cleaned.match(/"risk_level"\s*:\s*"([^"]+)"/);
      const typeMatch = cleaned.match(/"interaction_type"\s*:\s*"([^"]+)"/);
      const mechMatch = cleaned.match(
        /"mechanism"\s*:\s*"([\s\S]+?)(?=",\s*"|"\s*})/,
      );
      const simpMatch = cleaned.match(
        /"simple_explanation"\s*:\s*"([\s\S]+?)(?="\s*}|",\s*")/,
      );
      const confMatch = cleaned.match(/"confidence_score"\s*:\s*(\d+)/);

      if (!riskMatch || !simpMatch) throw new Error("Could not extract fields");

      result = {
        risk_level: riskMatch[1],
        interaction_type: typeMatch ? typeMatch[1] : "safety",
        mechanism: mechMatch ? mechMatch[1] : "",
        simple_explanation: simpMatch[1],
        confidence_score: confMatch ? parseInt(confMatch[1], 10) : 70,
      };
    }

    const riskRaw = result.risk_level?.toLowerCase();
    const risk_level =
      riskRaw === "high" || riskRaw === "moderate" || riskRaw === "low"
        ? riskRaw
        : "moderate";

    const typeRaw = result.interaction_type?.toLowerCase();
    const interaction_type =
      typeRaw === "safety" || typeRaw === "efficacy" || typeRaw === "both"
        ? typeRaw
        : "safety";

    const checkText = `${result.simple_explanation ?? ""} ${result.mechanism ?? ""}`;
    const badDrug = findBadDrug(checkText, [drug1, drug2]);
    if (badDrug) {
      return NextResponse.json(
        {
          error: "unrecognized_drug",
          message: `We couldn't identify '${badDrug}' as a known medication or substance. Please check the spelling or try the generic name (e.g. 'acetaminophen' instead of 'Tylenol').`,
        },
        { status: 400 },
      );
    }

    console.log(
      "[check-interaction] Success, risk:",
      risk_level,
      "type:",
      interaction_type,
    );
    return NextResponse.json({
      risk_level,
      interaction_type,
      mechanism: result.mechanism ?? "",
      simple_explanation: result.simple_explanation,
      confidence_score:
        typeof result.confidence_score === "number"
          ? Math.min(100, Math.max(0, result.confidence_score))
          : 70,
      fda_found: !!(drug1Data.warnings || drug2Data.warnings),
      daily_med_found: !!(
        drug1Data.dailyMedWarnings || drug2Data.dailyMedWarnings
      ),
      pharm_gkb_found: !!(drug1Data.pharmGKBData || drug2Data.pharmGKBData),
      rxnorm_found: !!(drug1Data.rxcui || drug2Data.rxcui),
    });
  } catch (err) {
    console.error("[check-interaction] Failed to parse:", err, "raw:", content);
    return NextResponse.json(
      { error: "Failed to parse model response" },
      { status: 500 },
    );
  }
}
