import { type NextRequest, NextResponse } from "next/server";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST",
  "Access-Control-Allow-Headers": "Content-Type",
};

interface GroqResponse {
  choices?: { message?: { content?: string } }[];
  error?: { message?: string };
}

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

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GROQ_API_KEY is not set" },
        { status: 503, headers: CORS_HEADERS },
      );
    }

    const groqRes = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          max_tokens: 400,
          temperature: 0.3,
          messages: [
            {
              role: "system",
              content:
                'You are a drug interaction checker. Return ONLY valid JSON, no other text:\n{"risk_level":"HIGH|MODERATE|LOW","interaction_type":"type label","simple_explanation":"2-3 sentences","mechanism":"1-2 sentences"}',
            },
            {
              role: "user",
              content: `Interaction between: ${drug1} and ${drug2}`,
            },
          ],
        }),
      },
    );

    const data = (await groqRes.json()) as GroqResponse;
    const raw = data.choices?.[0]?.message?.content ?? "";

    let result: unknown;
    try {
      result = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      result = match
        ? JSON.parse(match[0])
        : {
            risk_level: "UNKNOWN",
            interaction_type: "Unable to analyze",
            simple_explanation: raw.slice(0, 200),
            mechanism: "",
          };
    }

    return NextResponse.json(result, { headers: CORS_HEADERS });
  } catch (err) {
    console.error("[ios/check]", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json(
      { error: message },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}
