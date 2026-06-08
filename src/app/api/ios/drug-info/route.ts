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
    const body = await req.json() as { drugs: string[] };
    const { drugs } = body;

    if (!drugs?.length) {
      return NextResponse.json({ error: "No drugs provided" }, { status: 400, headers: CORS_HEADERS });
    }

    const geminiApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!geminiApiKey) {
      return NextResponse.json({ error: "API key not set" }, { status: 503, headers: CORS_HEADERS });
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    const prompt = `For each of these drugs/substances, provide brief factual info. Return ONLY valid JSON, no other text.

Drugs: ${drugs.join(", ")}

Return this exact structure:
{
  "drugs": [
    {
      "name": "exact drug name as provided",
      "what_it_is": "one sentence: what class of drug it is and what it does",
      "active_ingredient": "the main active ingredient or generic name",
      "common_uses": "2-3 common uses separated by commas",
      "food_interactions": "key foods or drinks to avoid, or 'None known' if none",
      "timing_notes": "when to take it relative to meals, or any timing considerations"
    }
  ]
}`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 800 },
    });

    const raw = result.response.text();
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsed, { headers: CORS_HEADERS });
  } catch (err) {
    console.error("[drug-info]", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500, headers: CORS_HEADERS });
  }
}
