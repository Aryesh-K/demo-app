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

    const geminiApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!geminiApiKey) {
      return NextResponse.json(
        { error: "GOOGLE_GENERATIVE_AI_API_KEY not set" },
        { status: 503, headers: CORS_HEADERS },
      );
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite-preview-06-17" });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: `You are a pharmacology educator grading a student response. Return ONLY valid JSON, no other text.\n\nGrade this response.\nQuestion: ${question}\nGrading criteria: ${gradingCriteria || "accuracy and clarity"}\nStudent response: ${studentResponse}\n\nReturn JSON:\n{\n  "score": number 1-5,\n  "feedback": "2-3 sentence overall feedback",\n  "strengths": ["strength 1", "strength 2"],\n  "improvements": ["improvement 1"]\n}` }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 300 },
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
            score: 3,
            feedback: "Response received and reviewed.",
            strengths: ["Attempted the question"],
            improvements: ["Add more detail"],
          };
    }

    return NextResponse.json(parsed, { headers: CORS_HEADERS });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json(
      { error: message },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}
