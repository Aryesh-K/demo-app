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
  } = body;
  console.log("[check-interaction] Drugs:", drug1, "/", drug2);

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
    "When treatment context is provided, always reference it directly in your plain English explanation. " +
    "Do not give a generic response — tailor it to what the user is trying to treat.";

  const ctx = treatment_context?.trim();
  const contextLine = ctx
    ? `The user is taking these substances to treat: ${ctx}.\n\n` +
      `You MUST address this directly in your simple_explanation field. ` +
      `Explain how this interaction specifically affects their ability to treat ${ctx}, ` +
      `and whether they should be concerned given what they're trying to treat.\n\n`
    : "";

  const userPrompt =
    `Before analyzing, internalize these calibration examples:\n` +
    `- aspirin + ibuprofen = HIGH (two NSAIDs, GI bleed risk)\n` +
    `- acetaminophen + NyQuil = HIGH (duplicate acetaminophen, liver damage risk)\n` +
    `- fluoxetine + dextromethorphan = HIGH (serotonin syndrome)\n` +
    `- alcohol + benzodiazepines = HIGH (CNS depression, death)\n` +
    `- ibuprofen + acetaminophen = MODERATE (different mechanisms, generally safe short term)\n` +
    `- amoxicillin + birth control = MODERATE (reduced efficacy)\n` +
    `- vitamin C + iron supplement = LOW (actually beneficial)\n\n` +
    `Now analyze this interaction using the same strict standards as the examples above:\n\n` +
    `Analyze the interaction between:\n` +
    `Drug A: ${drugADesc}\n` +
    `Drug B: ${drugBDesc}\n\n` +
    contextLine +
    `Respond with exactly this JSON structure:\n` +
    `{\n` +
    `  "risk_level": "high" | "moderate" | "low",\n` +
    `  "mechanism": "1-2 sentence biochemical explanation",\n` +
    `  "simple_explanation": "2-3 sentence plain English explanation at a middle school reading level"\n` +
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

    type ParsedResult = {
      risk_level: string;
      mechanism: string;
      simple_explanation: string;
    };

    // Try standard parse first
    let result: ParsedResult;
    try {
      result = JSON.parse(cleaned) as ParsedResult;
    } catch {
      // If that fails, extract fields with regex as fallback
      const riskMatch = cleaned.match(/"risk_level"\s*:\s*"([^"]+)"/);
      const mechMatch = cleaned.match(
        /"mechanism"\s*:\s*"([\s\S]+?)(?=",\s*"|"\s*})/,
      );
      const simpMatch = cleaned.match(
        /"simple_explanation"\s*:\s*"([\s\S]+?)(?="\s*}|",\s*")/,
      );

      if (!riskMatch || !simpMatch) throw new Error("Could not extract fields");

      result = {
        risk_level: riskMatch[1],
        mechanism: mechMatch ? mechMatch[1] : "",
        simple_explanation: simpMatch[1],
      };
    }

    const riskRaw = result.risk_level?.toLowerCase();
    const risk_level =
      riskRaw === "high" || riskRaw === "moderate" || riskRaw === "low"
        ? riskRaw
        : "moderate";

    console.log("[check-interaction] Success, risk:", risk_level);
    return NextResponse.json({
      risk_level,
      mechanism: result.mechanism ?? "",
      simple_explanation: result.simple_explanation,
    });
  } catch (err) {
    console.error("[check-interaction] Failed to parse:", err, "raw:", content);
    return NextResponse.json(
      { error: "Failed to parse model response" },
      { status: 500 },
    );
  }
}
