import { type NextRequest, NextResponse } from "next/server";

interface GradeRequest {
  question: string;
  gradingCriteria: string;
  studentResponse: string;
}

interface GroqResponse {
  choices?: { message?: { content?: string } }[];
  error?: { message?: string };
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GROQ_API_KEY is not set" }, { status: 503 });
  }

  let body: GradeRequest;
  try {
    body = (await req.json()) as GradeRequest;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { question, gradingCriteria, studentResponse } = body;
  if (!question || !gradingCriteria || !studentResponse?.trim()) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const systemPrompt =
    "You are a pharmacology educator grading a student's written response. " +
    "Grade strictly but fairly based on scientific accuracy. Return ONLY valid JSON with no markdown, no code fences.";

  const userPrompt =
    `Grade this student response to the question: ${question}\n\n` +
    `Grading criteria: ${gradingCriteria}\n\n` +
    `Student response: ${studentResponse}\n\n` +
    `Return JSON with exactly this structure:\n` +
    `{\n` +
    `  "score": <integer 1-5>,\n` +
    `  "feedback": "<overall feedback in 2-3 sentences>",\n` +
    `  "strengths": ["<strength 1>", "<strength 2>"],\n` +
    `  "improvements": ["<improvement 1>", "<improvement 2>"]\n` +
    `}`;

  let apiResponse: Response;
  try {
    apiResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
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
        temperature: 0.3,
        max_tokens: 600,
      }),
    });
  } catch (err) {
    console.error("[grade-written] Network error:", err);
    return NextResponse.json({ error: "Network error reaching Groq" }, { status: 502 });
  }

  const responseText = await apiResponse.text();
  if (!apiResponse.ok) {
    return NextResponse.json(
      { error: `Groq returned ${apiResponse.status}` },
      { status: 502 },
    );
  }

  let data: GroqResponse;
  try {
    data = JSON.parse(responseText) as GroqResponse;
  } catch {
    return NextResponse.json({ error: "Unparseable response from Groq" }, { status: 502 });
  }

  const content = data.choices?.[0]?.message?.content ?? "";
  try {
    const cleaned = content.replace(/^```json?\s*/i, "").replace(/```\s*$/, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON object found");
    const result = JSON.parse(jsonMatch[0]) as {
      score?: number;
      feedback?: string;
      strengths?: string[];
      improvements?: string[];
    };
    return NextResponse.json({
      score: Math.min(5, Math.max(1, Math.round(result.score ?? 3))),
      feedback: result.feedback ?? "",
      strengths: Array.isArray(result.strengths) ? result.strengths : [],
      improvements: Array.isArray(result.improvements) ? result.improvements : [],
    });
  } catch (err) {
    console.error("[grade-written] Parse error:", err, "raw:", content);
    return NextResponse.json({ error: "Failed to parse grading response" }, { status: 500 });
  }
}
