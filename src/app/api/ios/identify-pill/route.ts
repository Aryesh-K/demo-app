import { type NextRequest, NextResponse } from "next/server";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST",
  "Access-Control-Allow-Headers": "Content-Type",
};

interface GroqVisionResponse {
  choices?: { message?: { content?: string } }[];
}

interface OpenFDAResult {
  results?: {
    brand_name?: string[];
    generic_name?: string[];
    product_type?: string[];
    route?: string[];
    active_ingredient?: { name: string }[];
  }[];
}

interface PillResult {
  objectType: string;
  drugName: string | null;
  genericName?: string | null;
  brandName?: string | null;
  confidence: string;
  copyableName?: string | null;
  imprintFound?: string | null;
  additionalInfo?: string | null;
  boundingBox?: {
    position: string;
    width: number;
    height: number;
  };
  isForeign?: boolean;
  foreignCountry?: string | null;
  warning?: string | null;
  source?: string;
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      imageBase64?: string;
      mediaType?: string;
      imprintCode?: string;
      color?: string;
      shape?: string;
    };

    const {
      imageBase64,
      mediaType = "image/jpeg",
      imprintCode,
      color,
      shape,
    } = body;

    const groqApiKey = process.env.GROQ_API_KEY;
    const fdaApiKey = process.env.OPENFDA_API_KEY;

    // PATH A — Imprint code lookup (most reliable for US pills)
    if (imprintCode) {
      const fdaResult = await lookupByImprint(imprintCode, color, shape, fdaApiKey);
      if (fdaResult) {
        return NextResponse.json(fdaResult, { headers: CORS_HEADERS });
      }
    }

    // PATH B — Vision AI analysis
    if (imageBase64 && groqApiKey) {
      const visionResult = await analyzeWithVision(imageBase64, mediaType, groqApiKey);

      // If vision found an imprint, cross-reference with FDA
      if (visionResult.imprintFound && fdaApiKey) {
        const fdaCross = await lookupByImprint(
          visionResult.imprintFound as string,
          undefined,
          undefined,
          fdaApiKey,
        );
        if (fdaCross) {
          return NextResponse.json(
            {
              ...fdaCross,
              additionalInfo: visionResult.additionalInfo,
              boundingBox: visionResult.boundingBox,
              source: "vision+fda",
            },
            { headers: CORS_HEADERS },
          );
        }
      }

      return NextResponse.json(visionResult, { headers: CORS_HEADERS });
    }

    return NextResponse.json(
      {
        objectType: "unrecognizable",
        drugName: null,
        confidence: "low",
        error: "No image or imprint provided",
      },
      { status: 400, headers: CORS_HEADERS },
    );
  } catch (err) {
    console.error("[identify-pill]", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json(
      { objectType: "unrecognizable", error: message },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

async function lookupByImprint(
  imprint: string,
  color?: string,
  shape?: string,
  apiKey?: string,
): Promise<PillResult | null> {
  try {
    let query = `imprint:"${imprint}"`;
    if (color) query += `+AND+color:"${color}"`;
    if (shape) query += `+AND+shape:"${shape}"`;

    const keyParam = apiKey ? `&api_key=${apiKey}` : "";
    const url = `https://api.fda.gov/drug/ndc.json?search=${encodeURIComponent(query)}&limit=1${keyParam}`;

    const res = await fetch(url);
    if (!res.ok) return null;

    const data = (await res.json()) as OpenFDAResult;
    const result = data.results?.[0];
    if (!result) return null;

    const brandName = result.brand_name?.[0] ?? null;
    const genericName = result.generic_name?.[0] ?? null;
    const drugName = brandName ?? genericName;

    if (!drugName) return null;

    return {
      objectType: "pill",
      drugName,
      genericName,
      brandName,
      confidence: "high",
      copyableName: genericName ?? drugName,
      source: "openfda",
      additionalInfo: `Imprint: ${imprint}${color ? `, Color: ${color}` : ""}${shape ? `, Shape: ${shape}` : ""}`,
      boundingBox: { position: "center", width: 0.5, height: 0.3 },
    };
  } catch {
    return null;
  }
}

async function analyzeWithVision(
  imageBase64: string,
  mediaType: string,
  apiKey: string,
): Promise<PillResult> {
  const prompt = `Analyze this image and identify any medication, pill, tablet, capsule, or medication packaging.

Return ONLY valid JSON with no other text:
{
  "objectType": "pill" | "tablet" | "capsule" | "bottle" | "container" | "foreign_medication" | "unrecognizable",
  "drugName": "full drug name with dose if visible, or null",
  "genericName": "generic/chemical name if visible, or null",
  "brandName": "brand name if visible, or null",
  "confidence": "high" | "medium" | "low",
  "copyableName": "best single name to use for drug interaction check, or null",
  "imprintFound": "any imprint/marking code visible on pill, or null",
  "additionalInfo": "color, shape, markings, packaging text, foreign language text translated, or null",
  "boundingBox": {
    "position": "center" | "top" | "bottom" | "left" | "right" | "top-left" | "top-right" | "bottom-left" | "bottom-right",
    "width": 0.1 to 1.0,
    "height": 0.1 to 1.0
  },
  "isForeign": true | false,
  "foreignCountry": "country name if foreign packaging detected, or null",
  "warning": "any important warning or null"
}`;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.2-11b-vision-preview",
      max_tokens: 500,
      temperature: 0.1,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:${mediaType};base64,${imageBase64}` },
            },
            { type: "text", text: prompt },
          ],
        },
      ],
    }),
  });

  const data = (await res.json()) as GroqVisionResponse;
  const raw = data.choices?.[0]?.message?.content ?? "";

  try {
    return JSON.parse(raw) as PillResult;
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]) as PillResult;
      } catch {
        // fall through to default
      }
    }
    return {
      objectType: "unrecognizable",
      drugName: null,
      confidence: "low",
      copyableName: null,
      additionalInfo: raw.slice(0, 200),
      boundingBox: { position: "center", width: 0.5, height: 0.3 },
    };
  }
}
