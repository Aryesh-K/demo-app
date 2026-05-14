import { type NextRequest, NextResponse } from "next/server";

interface IdentifyRequest {
  foreignDrugName: string;
  countryName: string;
  language: string;
  purpose?: string;
}

interface GroqResponse {
  choices?: { message?: { content?: string } }[];
  error?: { message?: string };
}

async function tryRxNorm(drugName: string): Promise<string | null> {
  try {
    const enc = encodeURIComponent(drugName);
    const res = await fetch(
      `https://rxnav.nlm.nih.gov/REST/rxcui.json?name=${enc}&search=1`,
      { signal: AbortSignal.timeout(3000) },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      idGroup?: { name?: string; rxnormId?: string[] };
    };
    const ids = data.idGroup?.rxnormId;
    if (ids?.length) return data.idGroup?.name ?? null;
    return null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GROQ_API_KEY is not set" }, { status: 503 });
  }

  let body: IdentifyRequest;
  try {
    body = (await req.json()) as IdentifyRequest;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { foreignDrugName, countryName, language, purpose } = body;
  if (!foreignDrugName?.trim() || !countryName?.trim()) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const rxNormName = await tryRxNorm(foreignDrugName);

  const systemPrompt =
    "You are a clinical pharmacologist specializing in international drug nomenclature. " +
    "You identify foreign drug names and map them to their active ingredients and US equivalents. " +
    "Always prioritize patient safety — if uncertain, say so clearly. " +
    "Return ONLY valid JSON, no other text.";

  const rxNormLine = rxNormName
    ? `RxNorm database identified this as: ${rxNormName}. Use this as additional context.\n\n`
    : "";

  const userPrompt =
    `Identify this medication:\n` +
    `Drug name: ${foreignDrugName}\n` +
    `Country of origin: ${countryName}\n` +
    `Language: ${language}\n` +
    `Stated purpose: ${purpose?.trim() || "not specified"}\n\n` +
    rxNormLine +
    `Identify the active ingredient(s) and the US brand or generic name equivalent.\n\n` +
    `Return JSON with exactly this structure:\n` +
    `{\n` +
    `  "active_ingredient": "the INN or generic name",\n` +
    `  "us_equivalent": "US brand or generic name",\n` +
    `  "drug_class": "pharmacological class",\n` +
    `  "confidence": "high|medium|low",\n` +
    `  "confidence_reason": "brief explanation",\n` +
    `  "is_controlled_us": true or false,\n` +
    `  "controlled_note": "note if controlled, null if not",\n` +
    `  "food_interactions": ["food interaction 1", "food interaction 2"],\n` +
    `  "storage_note": "storage guidance for travelers",\n` +
    `  "additional_names": ["other brand names worldwide"]\n` +
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
        temperature: 0.2,
        max_tokens: 600,
      }),
    });
  } catch (err) {
    console.error("[identify-foreign-drug] Network error:", err);
    return NextResponse.json({ error: "Network error reaching Groq" }, { status: 502 });
  }

  const responseText = await apiResponse.text();
  if (!apiResponse.ok) {
    return NextResponse.json({ error: `Groq returned ${apiResponse.status}` }, { status: 502 });
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
    if (!jsonMatch) throw new Error("No JSON found");

    const result = JSON.parse(jsonMatch[0]) as {
      active_ingredient?: string;
      us_equivalent?: string;
      drug_class?: string;
      confidence?: string;
      confidence_reason?: string;
      is_controlled_us?: boolean;
      controlled_note?: string | null;
      food_interactions?: string[];
      storage_note?: string;
      additional_names?: string[];
    };

    const conf = result.confidence;
    const confidence: "high" | "medium" | "low" =
      conf === "high" || conf === "medium" || conf === "low" ? conf : "medium";

    return NextResponse.json({
      activeIngredient: result.active_ingredient ?? foreignDrugName,
      usEquivalent: result.us_equivalent ?? result.active_ingredient ?? foreignDrugName,
      drugClass: result.drug_class ?? "Unknown",
      confidence,
      confidenceReason: result.confidence_reason ?? "",
      isControlled: result.is_controlled_us ?? false,
      controlledNote: result.controlled_note ?? null,
      foodInteractions: Array.isArray(result.food_interactions) ? result.food_interactions : [],
      storageNote: result.storage_note ?? "",
      additionalNames: Array.isArray(result.additional_names) ? result.additional_names : [],
    });
  } catch (err) {
    console.error("[identify-foreign-drug] Parse error:", err, "raw:", content);
    return NextResponse.json({ error: "Failed to parse response" }, { status: 500 });
  }
}
