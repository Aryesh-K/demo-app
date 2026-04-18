import { type NextRequest, NextResponse } from "next/server";

interface DrugInput {
  name: string;
  method: string;
  amount?: string;
  unit?: string;
}

interface CaseStudyData {
  age?: string;
  conditions?: string;
  medications?: string;
  allergies?: string;
  extraNotes?: string;
}

interface RequestBody {
  drugs: DrugInput[];
  level: 1 | 2 | 3;
  goal?: string;
  isCaseStudy?: boolean;
  caseStudyData?: CaseStudyData;
}

interface GroqResponse {
  choices?: { message?: { content?: string } }[];
  error?: { message?: string };
}

// ─── Unknown drug detection ───────────────────────────────────────────────────

const UNKNOWN_DRUG_PHRASES = [
  "not a medication",
  "not a drug",
  "not a real",
  "unknown substance",
  "cannot identify",
  "no such drug",
];

function findBadDrug(text: string, candidates: string[]): string | null {
  const lower = text.toLowerCase();
  if (!UNKNOWN_DRUG_PHRASES.some((p) => lower.includes(p))) return null;
  for (const phrase of UNKNOWN_DRUG_PHRASES) {
    const idx = lower.indexOf(phrase);
    if (idx === -1) continue;
    const win = lower.slice(Math.max(0, idx - 120), idx + 120);
    for (const c of candidates) {
      if (c.trim() && win.includes(c.toLowerCase().trim())) return c;
    }
  }
  return candidates.filter((c) => c.trim()).join(" or ") || "one of the entered substances";
}

// ─── Forbidden phrases injected into every system prompt ─────────────────────

const FORBIDDEN_PHRASES =
  "NEVER use these phrases: 'consult your doctor', 'see a doctor', 'seek medical attention', " +
  "'talk to a healthcare provider', 'it is important to', 'it is essential to', " +
  "'you should', 'patients should', 'avoid this combination'. " +
  "You are a teacher not a doctor.";

// ─── Level-specific system prompts ───────────────────────────────────────────

const LEVEL_SYSTEM_PROMPTS: Record<1 | 2 | 3, string> = {
  1: `You are an enthusiastic honors biology teacher explaining drug interactions to 9th grade students.
${FORBIDDEN_PHRASES}

Write like a textbook chapter, not a warning label.
Use analogies. Be specific. Minimum 7 sentences per combination. Follow this structure EXACTLY:
Sentences 1-2: What Drug A does in the body and why. Use an analogy. Name the organ or system involved.
Sentences 3-4: What Drug B does in the body and why. Use an analogy. Name the organ or system involved.
Sentences 5-6: What happens biologically when both are taken together. What system gets overwhelmed?
Sentences 7+: What physical effects result and why they happen at the cellular or organ level.

Good example for fluoxetine + tramadol:
"Fluoxetine works by blocking special protein channels called serotonin transporters on the surface of neurons — think of these transporters as vacuum cleaners that normally suck up serotonin after it delivers its message, and fluoxetine jams them so serotonin keeps flooding the synapse. Serotonin is a neurotransmitter, a chemical messenger that travels between brain cells and plays a key role in regulating mood, sleep, and appetite. Tramadol works differently as a painkiller — it binds to opioid receptors on neurons in the spinal cord and brain, which are like off switches for pain signals, reducing how strongly your nervous system responds to pain. However, tramadol also accidentally inhibits serotonin reuptake as a secondary effect, meaning it acts like a weaker version of fluoxetine on top of its painkilling job. When both drugs are taken together, the serotonin transporters are blocked from two directions simultaneously, causing serotonin to accumulate to dangerously high levels in the synapses between neurons throughout the brain and spinal cord. This overwhelming surplus of serotonin overstimulates multiple receptor types across the nervous system, triggering a cascade of abnormal signals that the body cannot regulate. The result is serotonin syndrome — neurons fire erratically, muscles twitch and spasm, body temperature rises because the hypothalamus loses its ability to regulate heat, and the heart races as the autonomic nervous system goes into overdrive."

Always respond with valid JSON only.`,

  2: `You are an AP Biology teacher explaining drug interactions to advanced 11th and 12th grade students.
${FORBIDDEN_PHRASES}

Write like an AP Biology textbook. Minimum 7 sentences.
Use correct molecular biology terminology.
Reference specific proteins, enzymes, receptors, and pathways by their proper names.
Structure EXACTLY:
Sentences 1-2: Drug A mechanism at molecular level. Which protein does it target? Which pathway? Which neurotransmitter or enzyme system?
Sentences 3-4: Drug B mechanism at molecular level. Same depth as Drug A.
Sentences 5-6: The molecular interaction between the two drugs. Enzyme competition? Receptor saturation? Pathway convergence? Be specific.
Sentences 7+: Downstream cellular and physiological consequences of the interaction.

Good example for fluoxetine + tramadol:
"Fluoxetine is a selective serotonin reuptake inhibitor that achieves its effect through high-affinity competitive binding to the serotonin transporter protein SERT, encoded by the SLC6A4 gene, which is embedded in the presynaptic membrane of serotonergic neurons throughout the limbic system and prefrontal cortex. By occupying SERT's substrate binding site, fluoxetine prevents the sodium-dependent cotransport of 5-hydroxytryptamine back into the presynaptic terminal, dramatically increasing the concentration and dwell-time of serotonin in the synaptic cleft. Tramadol exerts its analgesic effect primarily through agonism at mu-opioid receptors, which are Gi-protein coupled receptors that inhibit adenylyl cyclase, reduce cAMP levels, and hyperpolarize neurons by opening potassium channels and closing voltage-gated calcium channels, thereby reducing neurotransmitter release from pain-transmitting neurons. As a secondary mechanism, tramadol also inhibits SERT with moderate affinity, making it a dual-action serotonergic and opioidergic agent. When fluoxetine and tramadol are co-administered, their combined inhibition of SERT produces supraadditive blockade of serotonin reuptake, as both drugs compete for the same transporter simultaneously while also increasing presynaptic 5-HT release through distinct mechanisms. Furthermore, fluoxetine's potent inhibition of the CYP2D6 cytochrome P450 isoenzyme impairs tramadol's hepatic metabolism to its active O-desmethyl metabolite, altering the pharmacokinetic profile and further elevating tramadol's serotonergic contribution. The resulting excess synaptic serotonin overstimulates 5-HT1A receptors in the raphe nuclei and 5-HT2A receptors in the cortex and spinal cord, triggering the clinical syndrome through disruption of the descending serotonergic modulatory pathways."

Always respond with valid JSON only.`,

  3: `You are a clinical pharmacology professor teaching pre-med students preparing for medical school.
${FORBIDDEN_PHRASES}

Write like a pharmacology textbook combined with clinical case discussion. Minimum 8 sentences.
Structure EXACTLY:
Sentences 1-2: Full ADME pharmacokinetic profile of Drug A. Bioavailability, protein binding, CYP metabolism (specific isoforms), half-life, active metabolites.
Sentences 3-4: Full ADME pharmacokinetic profile of Drug B. Same depth.
Sentences 5-6: The pharmacokinetic AND pharmacodynamic interaction mechanism. Enzyme inhibition/induction? Protein binding displacement? Additive receptor effects? Transporter competition? Be precise with isoform names and binding affinities.
Sentences 7-8: Clinical presentation. Early signs vs severe manifestation. Specific vital sign changes, lab findings, physical exam findings.
Sentence 9: Clinical management approach. Dose adjustments, monitoring parameters, alternative agents, reversal strategies.

Good example for fluoxetine + tramadol:
"Fluoxetine demonstrates oral bioavailability of approximately 72% with extensive first-pass metabolism, is highly protein-bound (~94% primarily to albumin and alpha-1-acid glycoprotein), and undergoes hepatic biotransformation via CYP2D6 and CYP2C9 to its pharmacologically active N-demethylated metabolite norfluoxetine, which itself has a half-life of 4-16 days — a clinically significant consideration given that CYP2D6 inhibition persists for weeks after fluoxetine discontinuation. Tramadol exhibits 75% oral bioavailability, moderate protein binding (~20%), and is critically dependent on CYP2D6-mediated O-demethylation to produce its primary active metabolite M1 (O-desmethyltramadol), which demonstrates 200-fold greater mu-opioid receptor affinity than the parent compound, with CYP3A4 contributing to an alternative N-demethylation pathway producing the less active M2 metabolite. The principal pharmacokinetic interaction involves fluoxetine's potent competitive inhibition of CYP2D6 (Ki approximately 0.17 μM), which substantially reduces M1 formation, paradoxically diminishing opioid analgesia while simultaneously accumulating parent tramadol — which retains significant SERT and NERT inhibitory activity — at elevated plasma concentrations. The pharmacodynamic interaction is equally significant: fluoxetine's high-affinity SERT blockade (Ki ~0.3 nM) combined with tramadol's weaker but additive SERT inhibition produces synergistic elevation of synaptic 5-hydroxytryptamine, with additional contribution from tramadol's facilitation of presynaptic 5-HT release independent of reuptake blockade. Clinical presentation of the resulting serotonin toxicity follows the Hunter Criteria triad: neuromuscular findings including clonus (spontaneous, inducible, and ocular), hyperreflexia, and myoclonus; autonomic instability with tachycardia, diaphoresis, mydriasis, and labile blood pressure; and altered mental status ranging from agitation to delirium. Severe cases progress to hyperthermia exceeding 41°C — the primary driver of mortality — along with rhabdomyolysis, acute kidney injury, metabolic acidosis, and disseminated intravascular coagulation. Management involves immediate cessation of all serotonergic agents, IV benzodiazepines for neuromuscular hyperactivity and agitation, cyproheptadine 12mg loading dose as a 5-HT2A antagonist for moderate cases, and aggressive evaporative cooling with ICU monitoring for severe hyperthermia."

Always respond with valid JSON only.`,
};

const LEVEL_NAMES: Record<1 | 2 | 3, string> = {
  1: "Honors Biology",
  2: "AP Biology",
  3: "Pre-Med",
};

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GROQ_API_KEY is not configured" },
      { status: 500 },
    );
  }

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  const { drugs, level, goal, isCaseStudy, caseStudyData } = body;

  if (!Array.isArray(drugs) || drugs.length < 2) {
    return NextResponse.json(
      { error: "At least 2 drugs required" },
      { status: 400 },
    );
  }

  const validLevel: 1 | 2 | 3 =
    level === 1 || level === 2 || level === 3 ? level : 2;

  const levelName = LEVEL_NAMES[validLevel];

  const drugLines = drugs
    .map(
      (d, i) =>
        `${i + 1}. ${d.name} - ${d.method}${d.amount ? ` - ${d.amount}${d.unit ?? ""}` : ""}`,
    )
    .join("\n");

  const goalLine =
    goal && !isCaseStudy ? `\nEducational context: ${goal}\n` : "";

  let caseStudyBlock = "";
  if (isCaseStudy && caseStudyData) {
    const lines = [
      "CASE STUDY PATIENT PROFILE:",
      caseStudyData.age ? `Age: ${caseStudyData.age}` : "",
      caseStudyData.conditions
        ? `Conditions: ${caseStudyData.conditions}`
        : "",
      caseStudyData.medications
        ? `Medications: ${caseStudyData.medications}`
        : "",
      caseStudyData.allergies
        ? `Allergies: ${caseStudyData.allergies}`
        : "",
      caseStudyData.extraNotes
        ? `Additional notes: ${caseStudyData.extraNotes}`
        : "",
      "Reference this patient profile in your explanation using 'the patient' not 'you'",
    ].filter(Boolean);
    caseStudyBlock = "\n" + lines.join("\n") + "\n";
  }

  const userPrompt =
    `You are teaching a ${levelName} class.\n` +
    `DO NOT give medical advice. DO NOT tell anyone to see a doctor. Write like a teacher/professor.\n\n` +
    `Substances to analyze:\n${drugLines}\n` +
    goalLine +
    caseStudyBlock +
    `\nReturn ONLY this JSON, no other text:\n` +
    `{\n` +
    `  "combinations": [\n` +
    `    {\n` +
    `      "drug_a": "name",\n` +
    `      "drug_b": "name",\n` +
    `      "classification": "CYP450 Metabolism | Serotonin Syndrome | CNS Depression | Additive Toxicity | Receptor Competition | Chemical Degradation | Absorption Interference | Duplicate Ingredients | Other",\n` +
    `      "explanation": "MINIMUM 7 sentences. Follow the structure from your system prompt exactly. Reference the example explanation as your quality benchmark. NO medical advice.",\n` +
    `      "key_terms": [\n` +
    `        { "term": "word", "definition": "explanation calibrated to ${levelName} level" }\n` +
    `      ]\n` +
    `    }\n` +
    `  ],\n` +
    `  "overall_summary": "2-3 sentences summarizing the most important biological finding at ${levelName} level. No medical advice."\n` +
    `}`;

  let apiResponse: Response;
  try {
    apiResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: LEVEL_SYSTEM_PROMPTS[validLevel] },
            { role: "user", content: userPrompt },
          ],
        }),
      },
    );
  } catch (err) {
    console.error("[learn-interaction-premium] Network error:", err);
    return NextResponse.json(
      { error: "Network error reaching Groq" },
      { status: 502 },
    );
  }

  const responseText = await apiResponse.text();
  console.log(
    "[learn-interaction-premium] Groq status:",
    apiResponse.status,
    "body length:",
    responseText.length,
  );

  if (!apiResponse.ok) {
    return NextResponse.json(
      { error: `Groq returned ${apiResponse.status}: ${responseText}` },
      { status: 502 },
    );
  }

  let data: GroqResponse;
  try {
    data = JSON.parse(responseText) as GroqResponse;
  } catch {
    return NextResponse.json(
      { error: "Unparseable response from Groq" },
      { status: 502 },
    );
  }

  if (data.error) {
    return NextResponse.json(
      { error: data.error.message ?? "Groq API error" },
      { status: 502 },
    );
  }

  const content = data.choices?.[0]?.message?.content ?? "";
  console.log(
    "[learn-interaction-premium] Model content preview:",
    content.slice(0, 200),
  );

  try {
    const cleaned = content
      .replace(/^```json?\s*/i, "")
      .replace(/```\s*$/, "")
      .trim();

    type ParsedCombination = {
      drug_a: string;
      drug_b: string;
      classification: string;
      explanation: string;
      key_terms: unknown[];
    };

    type ParsedResult = {
      combinations: ParsedCombination[];
      overall_summary: string;
    };

    let result: ParsedResult;
    try {
      result = JSON.parse(cleaned) as ParsedResult;
    } catch {
      console.warn(
        "[learn-interaction-premium] JSON.parse failed, attempting regex fallback",
      );

      const summaryMatch = cleaned.match(
        /"overall_summary"\s*:\s*"([\s\S]+?)(?=",\s*"|"\s*})/,
      );

      let combs: ParsedCombination[] = [];
      const combsMatch = cleaned.match(
        /"combinations"\s*:\s*(\[[\s\S]+?\])(?=\s*[,}])/,
      );
      if (combsMatch) {
        try {
          combs = JSON.parse(combsMatch[1]) as ParsedCombination[];
        } catch {
          /* leave empty */
        }
      }

      if (!summaryMatch && combs.length === 0) {
        throw new Error("Could not extract fields from model response");
      }

      result = {
        combinations: combs,
        overall_summary: summaryMatch ? summaryMatch[1] : "",
      };
    }

    const combinations = (
      Array.isArray(result.combinations) ? result.combinations : []
    ).map((c) => {
      const rawTerms = Array.isArray(c.key_terms) ? c.key_terms : [];
      const key_terms = rawTerms
        .map((raw: unknown) => {
          if (typeof raw === "string") return { term: raw, definition: "" };
          if (typeof raw === "object" && raw !== null) {
            const r = raw as { term?: unknown; definition?: unknown };
            return {
              term: typeof r.term === "string" ? r.term : "",
              definition:
                typeof r.definition === "string" ? r.definition : "",
            };
          }
          return { term: "", definition: "" };
        })
        .filter((t) => t.term.length > 0);

      return {
        drug_a: c.drug_a ?? "",
        drug_b: c.drug_b ?? "",
        classification: c.classification ?? "Other",
        explanation: c.explanation ?? "",
        key_terms,
      };
    });

    const checkText = [
      result.overall_summary ?? "",
      ...combinations.map((c) => c.explanation),
    ].join(" ");
    const badDrug = findBadDrug(checkText, drugs.map((d) => d.name));
    if (badDrug) {
      return NextResponse.json(
        {
          error: "unrecognized_drug",
          message: `We couldn't identify '${badDrug}' as a known medication or substance. Please check the spelling or try the generic name (e.g. 'acetaminophen' instead of 'Tylenol').`,
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      combinations,
      overall_summary: result.overall_summary ?? "",
    });
  } catch (err) {
    console.error(
      "[learn-interaction-premium] Failed to parse:",
      err,
      "raw content:",
      content,
    );
    return NextResponse.json(
      { error: "Failed to parse model response" },
      { status: 500 },
    );
  }
}
