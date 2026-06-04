import { type NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from "@google/generative-ai";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST",
  "Access-Control-Allow-Headers": "Content-Type",
};

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

    const geminiApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
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
      const visionResult = await analyzeWithVision(imageBase64, mediaType, geminiApiKey ?? '');

      // Try DB-first lookup using physical attributes
      const dbResult = await lookupByPhysicalAttributes(
        visionResult.shape,
        visionResult.colors || [],
        visionResult.form,
        visionResult.imprintSide1,
        visionResult.imprintSide2,
        visionResult.imprintRaw,
      );

      if (dbResult) {
        return NextResponse.json(
          { ...dbResult, additionalInfo: dbResult.additionalInfo, boundingBox: visionResult.boundingBox },
          { headers: CORS_HEADERS },
        );
      }

      // Fallback: use old identifyFromClues if DB lookup failed
      const identified = await identifyFromClues(visionResult, geminiApiKey ?? '');
      if (identified.confidence === 'low') {
        identified.drugName = null;
        identified.genericName = null;
        identified.brandName = null;
        identified.copyableName = null;
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
): Promise<any | null> {
  const pillboxResult = await lookupPillboxDatabase(imprint, color, shape);
  if (pillboxResult) return pillboxResult;

  const fdaResult = await lookupOpenFDA(imprint, color, shape, apiKey);
  if (fdaResult) return fdaResult;

  const rxImageResult = await lookupRxImage(imprint, color, shape);
  if (rxImageResult) return rxImageResult;

  return null;
}

async function lookupPillboxDatabase(
  imprint: string,
  color?: string,
  shape?: string,
): Promise<any | null> {
  try {
    const cleanImprint = imprint
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '');

    const imprintParts = cleanImprint
      .split(/[;,\s]+/)
      .filter(p => p.length >= 2);

    console.log('[pillbox-db] Searching parts:', imprintParts);

    const searchTerms = [cleanImprint, ...imprintParts];

    let matches: any[] = [];

    for (const term of searchTerms) {
      const { data, error } = await supabase
        .from('pills')
        .select(`
          id,
          medicine_name,
          spl_strength,
          spl_ingredients,
          splimprint,
          pillbox_imprint,
          splcolor_text,
          pillbox_color_text,
          splshape_text,
          pillbox_shape_text,
          dosage_form,
          dea_schedule_code,
          dea_schedule_name,
          ndc9,
          rxcui,
          author,
          has_image,
          file_name,
          spp
        `)
        .ilike('enabled', 'true')
        .ilike('splimprint', `%${term}%`)
        .limit(10);

      console.log(`[pillbox-db] Term "${term}":`, data?.length, 'results', data?.[0]?.medicine_name);

      if (data?.length) {
        matches = data;
        break;
      }
    }

    if (!matches.length) return null;

    if (color && matches.length > 1) {
      const colorFiltered = matches.filter(m => {
        const pillColor = (m.splcolor_text || m.pillbox_color_text || '').toLowerCase();
        return pillColor.includes(color.toLowerCase());
      });
      if (colorFiltered.length > 0) matches = colorFiltered;
    }

    if (shape && matches.length > 1) {
      const shapeFiltered = matches.filter(m => {
        const plShape = (m.splshape_text || m.pillbox_shape_text || '').toLowerCase();
        return plShape.includes(shape.toLowerCase());
      });
      if (shapeFiltered.length > 0) matches = shapeFiltered;
    }

    const pill = matches[0];
    if (!pill.medicine_name) return null;

    const strengthMatch = pill.spl_strength?.match(/([\d.]+\s*(?:mg|mcg|g|ml|%|units|IU))/i);
    const strength = strengthMatch ? strengthMatch[1].trim() : null;

    const cleanMedicineName = pill.medicine_name
      ?.replace(/;/g, '')
      .trim()
      .replace(/\b\w/g, (c: string) => c.toUpperCase()) || '';

    const ingredientMatch = pill.spl_ingredients?.match(/^([A-Z\s]+)\[/);
    const genericName = ingredientMatch
      ? ingredientMatch[1].trim().toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase())
      : cleanMedicineName;

    const drugName = strength ? `${cleanMedicineName} ${strength}` : cleanMedicineName;

    const imprintDisplay = pill.splimprint
      ?.split(';')
      .filter(Boolean)
      .join(' / ') || imprint;

    const details = [
      pill.splimprint?.includes(';')
        ? `Imprint: ${imprintDisplay} (two-sided)`
        : `Imprint: ${imprintDisplay}`,
      pill.splcolor_text ? `Color: ${pill.splcolor_text}` : null,
      pill.splshape_text ? `Shape: ${pill.splshape_text}` : null,
      pill.dosage_form ? `Form: ${pill.dosage_form}` : null,
      pill.dea_schedule_name && pill.dea_schedule_name !== 'Not a controlled substance'
        ? `⚠️ ${pill.dea_schedule_name}` : null,
      'Source: NIH Pillbox Database',
    ].filter(Boolean).join(' · ');

    const { data: similarPills } = await supabase
      .from('pills')
      .select('id, medicine_name, spl_strength, splimprint, has_image, spp')
      .ilike('enabled', 'true')
      .ilike('medicine_name', `%${pill.medicine_name}%`)
      .neq('id', pill.id)
      .limit(3);

    const isExactMatch = searchTerms.some(
      t => pill.splimprint?.toUpperCase().replace(/\s+/g, '') === t,
    );
    const isControlledSubstance = !!(
      pill.dea_schedule_code && pill.dea_schedule_code !== 'Not a controlled substance'
    );
    const confidence = (!isExactMatch && isControlledSubstance) ? 'medium' : 'high';

    return {
      objectType: pill.dosage_form?.toLowerCase().includes('capsule') ? 'capsule'
        : pill.dosage_form?.toLowerCase().includes('tablet') ? 'tablet'
        : 'pill',
      drugName,
      genericName: genericName || cleanMedicineName,
      brandName: null,
      confidence,
      copyableName: genericName || cleanMedicineName,
      source: 'nihpillbox',
      sourceLabel: 'NIH Pillbox Database',
      additionalInfo: details,
      isControlled: !!(pill.dea_schedule_code && pill.dea_schedule_code !== 'Not a controlled substance'),
      controlledNote: pill.dea_schedule_name,
      ndc: pill.ndc9,
      rxcui: pill.rxcui,
      similarPills: (similarPills || []).map(p => ({
        ...p,
        medicine_name: p.medicine_name
          ?.replace(/;/g, '')
          .trim()
          .replace(/\b\w/g, (c: string) => c.toUpperCase()),
      })),
      boundingBox: { position: 'center', width: 0.5, height: 0.3 },
    };
  } catch (err) {
    console.error('[pillbox-db]', err);
    return null;
  }
}

async function lookupOpenFDA(
  imprint: string,
  color?: string,
  shape?: string,
  apiKey?: string,
): Promise<any | null> {
  try {
    const keyParam = apiKey ? `&api_key=${apiKey}` : '';

    let url = `https://api.fda.gov/drug/ndc.json?search=imprint:"${encodeURIComponent(imprint)}"&limit=3${keyParam}`;
    let res = await fetch(url);
    let data = await res.json() as any;

    if (!data.results?.length) {
      url = `https://api.fda.gov/drug/label.json?search=openfda.imprint:"${encodeURIComponent(imprint)}"&limit=3${keyParam}`;
      res = await fetch(url);
      data = await res.json() as any;
    }

    if (!data.results?.length) return null;

    const result = data.results[0];
    const brandName = result.brand_name?.[0] || result.openfda?.brand_name?.[0] || null;
    const genericName = result.generic_name?.[0] || result.openfda?.generic_name?.[0] || null;
    const drugName = brandName || genericName;
    if (!drugName) return null;

    return {
      objectType: 'pill',
      drugName: genericName && brandName ? `${brandName} (${genericName})` : drugName,
      genericName,
      brandName,
      confidence: 'high',
      copyableName: genericName || drugName,
      source: 'openfda',
      additionalInfo: `Imprint: ${imprint}${color ? `, Color: ${color}` : ''}${shape ? `, Shape: ${shape}` : ''}`,
      boundingBox: { position: 'center', width: 0.5, height: 0.3 },
    };
  } catch (err) {
    console.error('[openfda]', err);
    return null;
  }
}

async function lookupRxImage(
  imprint: string,
  color?: string,
  shape?: string,
): Promise<any | null> {
  try {
    const params = new URLSearchParams();
    if (imprint) params.set('imprint', imprint);
    if (color) params.set('color', color);
    if (shape) params.set('shape', shape);
    params.set('format', 'json');

    const url = `https://rximage.nlm.nih.gov/api/rximage/1/rxbase?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json() as any;
    if (!data.nlmRxImages?.length) return null;

    const pill = data.nlmRxImages[0];
    const genericName = pill.name || null;
    const ndc = pill.ndc11 || null;
    if (!genericName) return null;

    let brandName = null;
    if (ndc) {
      try {
        const fdaRes = await fetch(
          `https://api.fda.gov/drug/ndc.json?search=product_ndc:"${ndc}"&limit=1`,
        );
        const fdaData = await fdaRes.json() as any;
        brandName = fdaData.results?.[0]?.brand_name?.[0] || null;
      } catch {}
    }

    return {
      objectType: 'pill',
      drugName: brandName ? `${brandName} (${genericName})` : genericName,
      genericName,
      brandName,
      confidence: 'high',
      copyableName: genericName,
      source: 'rximage',
      additionalInfo: [
        `Imprint: ${imprint}`,
        pill.colorText ? `Color: ${pill.colorText}` : null,
        pill.shapeText ? `Shape: ${pill.shapeText}` : null,
        pill.dea_schedule_code ? `Schedule: ${pill.dea_schedule_code}` : null,
      ].filter(Boolean).join(', '),
      imageUrl: pill.imageUrl || null,
      boundingBox: { position: 'center', width: 0.5, height: 0.3 },
    };
  } catch (err) {
    console.error('[rximage]', err);
    return null;
  }
}

async function lookupByAppearance(
  color: string,
  shape: string,
  apiKey?: string,
): Promise<any | null> {
  try {
    const params = new URLSearchParams();
    if (color) params.set('color', color);
    if (shape) params.set('shape', shape);
    params.set('format', 'json');
    params.set('limit', '5');

    const url = `https://rximage.nlm.nih.gov/api/rximage/1/rxbase?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json() as any;
    if (!data.nlmRxImages?.length) return null;

    const pill = data.nlmRxImages[0];
    const genericName = pill.name || null;
    if (!genericName) return null;

    return {
      objectType: 'pill',
      drugName: genericName,
      genericName,
      confidence: 'medium',
      copyableName: genericName,
      source: 'rximage_appearance',
      additionalInfo: `Color: ${color}, Shape: ${shape}`,
      boundingBox: { position: 'center', width: 0.5, height: 0.3 },
    };
  } catch {
    return null;
  }
}

async function lookupByPhysicalAttributes(
  shape: string | null,
  colors: string[],
  form: string | null,
  imprintSide1: string | null,
  imprintSide2: string | null,
  imprintRaw: string | null,
): Promise<any | null> {
  let query = supabase
    .from('pills')
    .select('id, medicine_name, spl_strength, spl_ingredients, splimprint, splcolor_text, splshape_text, dosage_form, dea_schedule_code, dea_schedule_name, ndc9, rxcui, has_image, spp')
    .ilike('enabled', 'true')
    .limit(200);

  if (shape) query = query.ilike('splshape_text', `%${shape}%`);
  if (form === 'capsule') query = query.ilike('dosage_form', '%capsule%');
  else if (form === 'tablet') query = query.ilike('dosage_form', '%tablet%');

  const { data: candidates } = await query;
  if (!candidates?.length) return null;

  let colorFiltered = candidates;
  if (colors.length > 0) {
    const filtered = candidates.filter(p => {
      const pillColor = (p.splcolor_text || '').toLowerCase();
      return colors.some(c => pillColor.includes(c.toLowerCase()));
    });
    if (filtered.length > 0) colorFiltered = filtered;
  }

  const imprintCandidates: { pill: any; matchScore: number }[] = [];
  const searchTerms = [
    imprintRaw,
    imprintSide1,
    imprintSide2,
    imprintSide1 && imprintSide2 ? `${imprintSide1};${imprintSide2}` : null,
    imprintSide2 && imprintSide1 ? `${imprintSide2};${imprintSide1}` : null,
  ].filter(Boolean) as string[];

  for (const pill of colorFiltered) {
    const pillImprint = (pill.splimprint || '').toUpperCase();
    for (const term of searchTerms) {
      const t = term.toUpperCase().replace(/\s/g, '');
      if (
        pillImprint.includes(t) ||
        pillImprint.replace(/;/g, '').includes(t) ||
        t.includes(pillImprint.replace(/;/g, ''))
      ) {
        imprintCandidates.push({ pill, matchScore: t.length });
        break;
      }
    }
  }

  const finalCandidates = imprintCandidates.length > 0
    ? imprintCandidates.sort((a, b) => b.matchScore - a.matchScore).map(c => c.pill)
    : colorFiltered.slice(0, 5);

  const pill = finalCandidates[0];
  if (!pill?.medicine_name) return null;

  const hasImprintMatch = imprintCandidates.length > 0;
  const isControlled = pill.dea_schedule_code && pill.dea_schedule_code !== 'Not a controlled substance';
  const confidence = hasImprintMatch ? (isControlled ? 'medium' : 'high') : 'low';

  if (isControlled && !hasImprintMatch) return null;

  const strengthMatch = pill.spl_strength?.match(/([\d.]+\s*(?:mg|mcg|g|ml|%|units|IU))/i);
  const strength = strengthMatch ? strengthMatch[1].trim() : null;
  const cleanMedicineName = pill.medicine_name?.replace(/;/g, '').trim().replace(/\b\w/g, (c: string) => c.toUpperCase()) || '';
  const ingredientMatch = pill.spl_ingredients?.match(/^([A-Z\s]+)\[/);
  const genericName = ingredientMatch
    ? ingredientMatch[1].trim().toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase())
    : cleanMedicineName;
  const drugName = strength ? `${cleanMedicineName} ${strength}` : cleanMedicineName;
  const imprintDisplay = pill.splimprint?.split(';').filter(Boolean).join(' / ') || imprintRaw || '';
  const details = [
    imprintDisplay ? `Imprint: ${imprintDisplay}` : null,
    pill.splcolor_text ? `Color: ${pill.splcolor_text}` : null,
    pill.splshape_text ? `Shape: ${pill.splshape_text}` : null,
    pill.dosage_form ? `Form: ${pill.dosage_form}` : null,
    isControlled ? `⚠️ ${pill.dea_schedule_name}` : null,
    'Source: NIH Pillbox Database',
  ].filter(Boolean).join(' · ');

  const { data: similarPills } = await supabase
    .from('pills')
    .select('id, medicine_name, spl_strength, splimprint, has_image, spp')
    .ilike('enabled', 'true')
    .ilike('medicine_name', `%${pill.medicine_name}%`)
    .neq('id', pill.id)
    .limit(3);

  return {
    objectType: pill.dosage_form?.toLowerCase().includes('capsule') ? 'capsule'
      : pill.dosage_form?.toLowerCase().includes('tablet') ? 'tablet'
      : 'pill',
    drugName,
    genericName,
    brandName: null,
    confidence,
    copyableName: genericName || cleanMedicineName,
    source: 'nihpillbox',
    sourceLabel: 'NIH Pillbox Database',
    additionalInfo: details,
    isControlled: !!isControlled,
    controlledNote: pill.dea_schedule_name,
    ndc: pill.ndc9,
    rxcui: pill.rxcui,
    imprintFound: imprintDisplay,
    similarPills: (similarPills || []).map(p => ({
      ...p,
      medicine_name: p.medicine_name?.replace(/;/g, '').trim().replace(/\b\w/g, (c: string) => c.toUpperCase()),
    })),
    boundingBox: { position: 'center', width: 0.5, height: 0.3 },
  };
}

async function analyzeWithVision(
  imageBase64: string,
  mediaType: string,
  apiKey: string
): Promise<any> {
  const visionPrompt = `You are helping identify a pill by its physical characteristics only. Do NOT try to identify the drug name.

Look at this image and return ONLY these physical attributes:

SHAPE — pick exactly one from this list:
ROUND, OVAL, CAPSULE, TABLET, RECTANGLE, SQUARE, TRIANGLE, DIAMOND, PENTAGON (5 SIDED), HEXAGON (6 SIDED), OCTAGON (8 SIDED), DOUBLE CIRCLE, SEMI-CIRCLE, TRAPEZOID, CLOVER, TEAR, BULLET, FREEFORM

COLOR — describe all colors you see on the pill (e.g. 'white', 'red and blue', 'yellow')

FORM — is it a tablet (solid, one piece) or capsule (two-piece shell)?

IMPRINT — read any text or numbers printed on the pill. Read each side separately. If two-sided report as SIDE1;SIDE2. If unclear report exactly what you can make out, even partial characters.

Return ONLY this JSON:
{
  "objectType": "pill" | "tablet" | "capsule" | "bottle" | "foreign_medication" | "unrecognizable",
  "shape": "exact shape from list above",
  "colors": ["color1", "color2"],
  "form": "tablet" | "capsule",
  "imprintSide1": "text on side 1 or null",
  "imprintSide2": "text on side 2 or null",
  "imprintRaw": "full imprint string e.g. TY;500",
  "confidence": "high" | "medium" | "low",
  "additionalInfo": "describe everything visible",
  "isForeign": false,
  "boundingBox": { "position": "center", "width": 0.4, "height": 0.4 }
}`;

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const visionResult = await model.generateContent({
    contents: [{
      role: "user",
      parts: [
        { inlineData: { mimeType: mediaType, data: imageBase64 } },
        { text: visionPrompt },
      ],
    }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 600 },
  });
  const raw = visionResult.response.text();

  console.log('[identify-pill] Vision raw:', raw.slice(0, 300));

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

function validateDbResultAgainstVision(dbResult: any, visualDescription: string): boolean {
  if (!visualDescription) return true;
  const desc = visualDescription.toLowerCase();
  const info = (dbResult.additionalInfo || '').toLowerCase();
  const colorWords = ['white', 'red', 'blue', 'yellow', 'green', 'orange', 'pink', 'purple', 'brown', 'gray', 'grey', 'black', 'capsule', 'tablet', 'oval', 'round'];
  const dbColors = colorWords.filter(w => info.includes(w));
  if (dbColors.length === 0) return true;
  const matches = dbColors.filter(w => desc.includes(w));
  return matches.length > 0;
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

  if (visionRaw.objectType === 'capsule' || visionRaw.objectType === 'pill') {
    clues.push('Physical appearance must match identified drug — if identified drug does not match described color/shape, return confidence: low')
  }

  if (clues.length === 0) return visionRaw

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite-preview-06-17",
    systemInstruction: `You are a pharmaceutical expert with complete knowledge of:
- US brand and generic medications
- Pill imprint codes and their drugs
- Foreign medications and their US equivalents
- Distinctive pill appearances by color/shape

Your job: given clues about a medication, identify the actual drug name.

Rules:
- Imprint codes like L484 = Acetaminophen 500mg
- Imprint codes like IP 190 = Naproxen 500mg
- TEVA followed by numbers = identify by TEVA imprint database
- If foreign text, translate AND identify US equivalent
- Return the GENERIC name as copyableName, not brand
- NEVER return imprint codes or foreign text as the drug name
- If you cannot identify with confidence, say so

STRICT RULES:
- If you are not at least 80% confident, return confidence: "low" and drugName: null
- NEVER guess a drug name from color alone
- Imprint codes are the ONLY reliable visual identifier for pills — always look for them
- A red/blue capsule with no text = confidence: "low", not Tylenol PM
- Foreign text must be fully translated before returning a drug name
- TEVA codes: TEVA 3109 = Amoxicillin, TEVA 5728 = Atorvastatin, etc — only identify if you are certain of the mapping
- If additionalInfo mentions a brand name clearly visible on packaging (Motrin, Tylenol, Advil, etc), that IS high confidence
- Return drugName: null if unsure — it is better to say unknown than to be wrong`,
  });
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: `Identify this medication from these clues:

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
}` }] }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 400 },
  });
  const raw = result.response.text();

  console.log('[identify-pill] ID from clues:', raw.slice(0, 300))

  try {
    const identified = JSON.parse(raw)
    const merged = {
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

    if (merged.imprintFound) {
      const cleanedImprint = (merged.imprintFound as string)
        .replace(/[^A-Z0-9]/gi, '')
        .trim();
      if (cleanedImprint.length >= 2) {
        const dbResult = await lookupPillboxDatabase(cleanedImprint, undefined, undefined);
        if (dbResult && validateDbResultAgainstVision(dbResult, visionRaw.additionalInfo)) {
          return {
            ...dbResult,
            boundingBox: merged.boundingBox,
            additionalInfo: merged.additionalInfo + ' · ' + (dbResult.additionalInfo || ''),
          };
        }
      }
    }

    return merged
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
