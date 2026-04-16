import { type NextRequest, NextResponse } from "next/server";

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
}

interface GroqResponse {
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
  } = body;

  const drugADesc = describeDrug(drug1, method1, amount1, unit1);
  const drugBDesc = describeDrug(drug2, method2, amount2, unit2);

  const systemPrompt =
    "You are a biochemistry and pharmacology educator explaining drug interactions to students. " +
    "Always respond with valid JSON only — no markdown, no code fences, no extra text.\n\n" +
    "Your goal is to teach, not just warn. Explain the biological mechanisms clearly and accurately.\n\n" +
    "Use these strict risk level definitions:\n" +
    "- HIGH: serious harm, organ damage, or death risk. Includes: two drugs same class, duplicate ingredients, serotonin syndrome, severe liver/kidney toxicity, CNS/respiratory depression, significant bleeding risk\n" +
    "- MODERATE: meaningful side effects or reduced effectiveness but unlikely serious harm\n" +
    "- LOW: minimal or no clinically significant interaction\n" +
    "When in doubt between HIGH and MODERATE, choose HIGH.\n\n" +
    "Classify interaction_type:\n" +
    "- safety: health/safety risk\n" +
    "- efficacy: one substance degrades or blocks the other, rendering it ineffective\n" +
    "- both: affects both safety and efficacy\n\n" +
    "IMPORTANT: When treatment context is provided, you MUST explicitly mention it by name in BOTH simple_explanation AND intermediate_explanation. " +
    "Do not give generic responses. If the user says they are treating anxiety, both explanations must reference anxiety specifically " +
    "and explain how the interaction affects their ability to treat it. This is non-negotiable.\n\n" +
    "Always respond with valid JSON only.";

  const ctx = treatment_context?.trim();
  const contextLine = ctx
    ? `IMPORTANT: The user is treating: ${ctx}\n` +
      `You MUST mention "${ctx}" explicitly in both simple_explanation and intermediate_explanation.\n` +
      `Do not write a generic explanation — tailor everything to ${ctx}.\n\n`
    : "";

  const userPrompt =
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
    `Now analyze this interaction:\n` +
    `Drug A: ${drugADesc}\n` +
    `Drug B: ${drugBDesc}\n\n` +
    contextLine +
    `Respond with exactly this JSON structure:\n` +
    `{\n` +
    `  "risk_level": "high" | "moderate" | "low",\n` +
    `  "interaction_type": "safety" | "efficacy" | "both",\n` +
    `  "classification": "one of: CYP450 Metabolism | Serotonin Syndrome | CNS Depression | Additive Toxicity | Receptor Competition | Chemical Degradation | Absorption Interference | Duplicate Ingredients | Other",\n` +
    `  "simple_explanation": "5-7 sentences at a middle school reading level. Follow this exact structure: Sentence 1-2: What does Drug A normally do in the body on its own? Explain its job in simple terms. Sentence 3-4: What does Drug B normally do in the body on its own? Explain its job in simple terms. Sentence 5-6: What goes wrong when you take both together? What is the body overwhelmed by? Sentence 7: What does the person actually feel or experience physically? Never use technical terms without immediately explaining them in plain language. Write as if explaining to a curious 13 year old with no science background. Use everyday analogies.",\n` +
    `  "intermediate_explanation": "4-6 sentences for an A&P or AP Biology student. Explain what happens at the organ system level — which organ processes the drugs (liver, kidneys, GI tract, CNS), how the physiological response manifests, what symptoms or system-level effects occur. Reference specific anatomical structures and physiological processes. Trace the effect from molecule to organ to whole-body response.",\n` +
    `  "key_terms": ["term1", "term2", "term3"]\n` +
    `}`;

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
    console.error("[learn-interaction] Network error calling Groq:", err);
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

    type ParsedResult = {
      risk_level: string;
      interaction_type: string;
      classification: string;
      simple_explanation: string;
      intermediate_explanation: string;
      key_terms: string[];
    };

    let result: ParsedResult;
    try {
      result = JSON.parse(cleaned) as ParsedResult;
    } catch {
      // Regex fallback
      const riskMatch = cleaned.match(/"risk_level"\s*:\s*"([^"]+)"/);
      const typeMatch = cleaned.match(/"interaction_type"\s*:\s*"([^"]+)"/);
      const classMatch = cleaned.match(/"classification"\s*:\s*"([^"]+)"/);
      const simpMatch = cleaned.match(
        /"simple_explanation"\s*:\s*"([\s\S]+?)(?=",\s*"|"\s*})/,
      );
      const interMatch = cleaned.match(
        /"intermediate_explanation"\s*:\s*"([\s\S]+?)(?=",\s*"|"\s*})/,
      );

      if (!riskMatch || !simpMatch) throw new Error("Could not extract fields");

      result = {
        risk_level: riskMatch[1],
        interaction_type: typeMatch ? typeMatch[1] : "safety",
        classification: classMatch ? classMatch[1] : "Other",
        simple_explanation: simpMatch[1],
        intermediate_explanation: interMatch ? interMatch[1] : "",
        key_terms: [],
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

    return NextResponse.json({
      risk_level,
      interaction_type,
      classification: result.classification ?? "Other",
      simple_explanation: result.simple_explanation ?? "",
      intermediate_explanation: result.intermediate_explanation ?? "",
      key_terms: Array.isArray(result.key_terms) ? result.key_terms : [],
    });
  } catch (err) {
    console.error("[learn-interaction] Failed to parse:", err, "raw:", content);
    return NextResponse.json(
      { error: "Failed to parse model response" },
      { status: 500 },
    );
  }
}
