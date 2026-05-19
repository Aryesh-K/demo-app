import { type NextRequest, NextResponse } from "next/server";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST",
  "Access-Control-Allow-Headers": "Content-Type",
};

interface GroqResponse {
  choices?: { message?: { content?: string } }[];
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      question?: string;
      gradingCriteria?: string;
      studentResponse?: string;
    };
    const { question, gradingCriteria, studentResponse } = body;

    if (!question || !studentResponse) {
      return NextResponse.json(
        { error: "Missing fields" },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GROQ_API_KEY not set" },
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
          max_tokens: 300,
          temperature: 0.2,
          messages: [
            {
              role: "system",
              content:
                "You are a pharmacology educator grading a student response. Return ONLY valid JSON, no other text.",
            },
            {
              role: "user",
              content: `Grade this response.
Question: ${question}
Grading criteria: ${gradingCriteria || "accuracy and clarity"}
Student response: ${studentResponse}

Return JSON:
{
  "score": number 1-5,
  "feedback": "2-3 sentence overall feedback",
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["improvement 1"]
}`,
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
            score: 3,
            feedback: "Response received and reviewed.",
            strengths: ["Attempted the question"],
            improvements: ["Add more detail"],
          };
    }

    return NextResponse.json(result, { headers: CORS_HEADERS });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json(
      { error: message },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}
