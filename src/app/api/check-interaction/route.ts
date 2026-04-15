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

  const { drug1, method1, amount1, unit1, drug2, method2, amount2, unit2 } =
    body;
  console.log("[check-interaction] Drugs:", drug1, "/", drug2);

  const drugADesc = describeDrug(drug1, method1, amount1, unit1);
  const drugBDesc = describeDrug(drug2, method2, amount2, unit2);

  const systemPrompt =
    "You are a biomedical assistant that analyzes drug and substance interactions. " +
    "Always respond with valid JSON only — no markdown, no code fences, no extra text.";

  const userPrompt =
    `Analyze the interaction between:\n` +
    `Drug A: ${drugADesc}\n` +
    `Drug B: ${drugBDesc}\n\n` +
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
    const cleaned = content
      .replace(/^```json?\s*/i, "")
      .replace(/```\s*$/, "")
      .trim();
    const result = JSON.parse(cleaned) as {
      risk_level: string;
      mechanism: string;
      simple_explanation: string;
    };

    if (!result.risk_level || !result.simple_explanation) {
      throw new Error("Missing required fields in model response");
    }

    const riskRaw = result.risk_level.toLowerCase();
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
    console.error(
      "[check-interaction] Failed to parse model JSON:",
      err,
      "raw content:",
      content,
    );
    return NextResponse.json(
      { error: "Failed to parse model response" },
      { status: 500 },
    );
  }
}
