import { type NextRequest, NextResponse } from "next/server";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST",
  "Access-Control-Allow-Headers": "Content-Type",
};

interface AnthropicResponse {
  content?: { type: string; text?: string }[];
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
    if (imageBase64) {
      const visionResult = await analyzeWithVision(imageBase64, mediaType, groqApiKey ?? '');

      // Always run second identification step
      const identified = await identifyFromClues(visionResult, groqApiKey ?? '');

      // If FDA cross-reference found imprint
      if (identified.imprintFound && fdaApiKey) {
        const fdaCross = await lookupByImprint(
          identified.imprintFound,
          undefined,
          undefined,
          fdaApiKey,
        );
        if (fdaCross) {
          return NextResponse.json(
            { ...identified, ...fdaCross, source: 'vision+id+fda' },
            { headers: CORS_HEADERS },
          );
        }
      }

      return NextResponse.json(identified, { headers: CORS_HEADERS });
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
  apiKey: string
): Promise<any> {
  const res = await fetch(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        max_tokens: 600,
        temperature: 0.1,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mediaType};base64,${imageBase64}`,
                  detail: 'high'
                }
              },
              {
                type: 'text',
                text: `Read every word visible in this image. This is a medication identification task.

INSTRUCTIONS:
- If you see ANY text on packaging, read it exactly
- If you see a pill/tablet, describe its color, shape, and any imprint
- If you see a brand name like Motrin, Tylenol, Advil, Benadryl etc, use it
- If you see foreign text, translate it
- Be CONFIDENT if you can clearly read text

Return ONLY this JSON, no other text:
{
  "objectType": "pill" | "tablet" | "capsule" | "bottle" | "container" | "foreign_medication" | "unrecognizable",
  "drugName": "exact drug name and dose you can read, e.g. Motrin IB 200mg",
  "genericName": "generic name if known, e.g. Ibuprofen",
  "brandName": "brand name if visible",
  "confidence": "high" if text clearly readable | "medium" if partially visible | "low" if unclear,
  "copyableName": "single best name for interaction checking, e.g. Ibuprofen",
  "imprintFound": "imprint code on pill if visible, e.g. L484",
  "additionalInfo": "describe everything you see including colors, shapes, any text",
  "boundingBox": {
    "position": "center" | "top" | "bottom" | "left" | "right" | "top-left" | "top-right" | "bottom-left" | "bottom-right",
    "width": 0.4,
    "height": 0.4
  },
  "isForeign": false,
  "foreignCountry": null,
  "warning": null
}`
              }
            ]
          }
        ]
      })
    }
  )

  const data = await res.json() as any

  // Log the full Groq response for debugging
  console.log('[identify-pill] Groq response:',
    JSON.stringify(data).slice(0, 500))

  const raw = data.choices?.[0]?.message
    ?.content ?? ''

  console.log('[identify-pill] Raw content:',
    raw.slice(0, 300))

  try {
    return JSON.parse(raw)
  } catch {
    const match = raw.match(/\{[\s\S]*\}/)
    if (match) {
      try {
        return JSON.parse(match[0])
      } catch {}
    }
    return {
      objectType: 'unrecognizable',
      drugName: null,
      confidence: 'low',
      copyableName: null,
      additionalInfo: raw.slice(0, 200),
      boundingBox: {
        position: 'center',
        width: 0.5,
        height: 0.3
      }
    }
  }
}

async function identifyFromClues(
  visionRaw: any,
  apiKey: string
): Promise<any> {
  const clues = []

  if (visionRaw.additionalInfo) {
    clues.push(`Visual description: ${visionRaw.additionalInfo}`)
  }
  if (visionRaw.imprintFound) {
    clues.push(`Imprint code on pill: ${visionRaw.imprintFound}`)
  }
  if (visionRaw.drugName) {
    clues.push(`Text found: ${visionRaw.drugName}`)
  }
  if (visionRaw.brandName) {
    clues.push(`Brand text: ${visionRaw.brandName}`)
  }
  if (visionRaw.isForeign && visionRaw.additionalInfo) {
    clues.push(`Foreign packaging text: ${visionRaw.additionalInfo}`)
  }

  if (clues.length === 0) return visionRaw

  const res = await fetch(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 400,
        temperature: 0.1,
        messages: [
          {
            role: 'system',
            content: `You are a pharmaceutical expert with complete knowledge of:
- US brand and generic medications
- Pill imprint codes and their drugs
- Foreign medications and their US equivalents
- Distinctive pill appearances by color/shape

Your job: given clues about a medication, identify the actual drug name.

Rules:
- Imprint codes like L484 = Acetaminophen 500mg
- Imprint codes like IP 190 = Naproxen 500mg
- TEVA followed by numbers = identify by TEVA imprint database
- Red/blue capsule with no imprint = likely Tylenol PM or Benadryl
- If foreign text, translate AND identify US equivalent
- Return the GENERIC name as copyableName, not brand
- NEVER return imprint codes or foreign text as the drug name
- If you cannot identify with confidence, say so`
          },
          {
            role: 'user',
            content: `Identify this medication from these clues:

${clues.join('\n')}

Return ONLY valid JSON:
{
  "drugName": "Brand Name GenericName Dose, e.g. Tylenol Acetaminophen 500mg",
  "genericName": "generic name only, e.g. Acetaminophen",
  "brandName": "brand name if known, e.g. Tylenol",
  "copyableName": "single generic name for interaction checker, e.g. Acetaminophen",
  "confidence": "high" | "medium" | "low",
  "identificationMethod": "imprint" | "visual" | "text" | "foreign_translation",
  "usEquivalent": "US equivalent if foreign medication",
  "warning": "any important note or null"
}`
          }
        ]
      })
    }
  )

  const data = await res.json() as any
  const raw = data.choices?.[0]?.message?.content ?? ''

  console.log('[identify-pill] ID from clues:', raw.slice(0, 300))

  try {
    const identified = JSON.parse(raw)
    return {
      ...visionRaw,
      drugName: identified.drugName || visionRaw.drugName,
      genericName: identified.genericName || visionRaw.genericName,
      brandName: identified.brandName || visionRaw.brandName,
      copyableName: identified.copyableName || visionRaw.copyableName,
      confidence: identified.confidence || visionRaw.confidence,
      usEquivalent: identified.usEquivalent,
      warning: identified.warning || visionRaw.warning,
      identificationMethod: identified.identificationMethod,
    }
  } catch {
    const match = raw.match(/\{[\s\S]*\}/)
    if (match) {
      try {
        const identified = JSON.parse(match[0])
        return {
          ...visionRaw,
          drugName: identified.drugName || visionRaw.drugName,
          genericName: identified.genericName,
          copyableName: identified.copyableName || visionRaw.copyableName,
          confidence: identified.confidence,
        }
      } catch {}
    }
    return visionRaw
  }
}
