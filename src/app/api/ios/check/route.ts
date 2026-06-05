import { type NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      drug1?: string;
      drug2?: string;
      method1?: string;
      method2?: string;
    };
    const { drug1, drug2 } = body;

    if (!drug1 || !drug2) {
      return NextResponse.json(
        { error: "Missing drugs" },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    const geminiApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!geminiApiKey) {
      return NextResponse.json(
        { error: "GOOGLE_GENERATIVE_AI_API_KEY is not set" },
        { status: 503, headers: CORS_HEADERS },
      );
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: `You are a drug interaction checker. Return ONLY valid JSON, no other text:\n{"risk_level":"HIGH|MODERATE|LOW","interaction_type":"type label","simple_explanation":"2-3 sentences","mechanism":"1-2 sentences"}\n\nInteraction between: ${drug1} and ${drug2}` }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 400 },
    });
    const raw = result.response.text();

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      parsed = match
        ? JSON.parse(match[0])
        : {
            risk_level: "UNKNOWN",
            interaction_type: "Unable to analyze",
            simple_explanation: raw.slice(0, 200),
            mechanism: "",
          };
    }

    return NextResponse.json(parsed, { headers: CORS_HEADERS });
  } catch (err) {
    console.error("[ios/check]", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json(
      { error: message },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}
