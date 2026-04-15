import { type NextRequest, NextResponse } from "next/server";
import { env } from "~/env";

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
  if (!env.OPENROUTER_API_KEY) {
    return NextResponse.json(
      { error: "API key not configured" },
      { status: 503 },
    );
  }

  const body = (await req.json()) as RequestBody;
  const { drug1, method1, amount1, unit1, drug2, method2, amount2, unit2 } =
    body;

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
    `  "mechanism": "1-2 sentence biochemical explanation of why this interaction occurs",\n` +
    `  "simple_explanation": "2-3 sentence plain English explanation at a middle school reading level"\n` +
    `}`;

  const apiResponse = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistralai/mistral-7b-instruct:free",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    },
  );

  if (!apiResponse.ok) {
    return NextResponse.json({ error: "Upstream API error" }, { status: 502 });
  }

  const data = (await apiResponse.json()) as OpenRouterResponse;
  const content = data.choices?.[0]?.message?.content ?? "";

  try {
    // Strip accidental code fences the model may add
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
      throw new Error("missing fields");
    }

    // Normalise risk level
    const riskRaw = result.risk_level.toLowerCase();
    const risk_level =
      riskRaw === "high" || riskRaw === "moderate" || riskRaw === "low"
        ? riskRaw
        : "moderate";

    return NextResponse.json({
      risk_level,
      mechanism: result.mechanism ?? "",
      simple_explanation: result.simple_explanation,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to parse model response" },
      { status: 500 },
    );
  }
}
