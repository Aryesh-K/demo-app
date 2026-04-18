import { type NextRequest, NextResponse } from "next/server";
import { env } from "~/env";
import { buildDataContext, fetchDrugPairData } from "~/lib/drug-data";

interface DrugInput {
  name: string;
  method: string;
  amount?: string;
  unit?: string;
}

interface RequestBody {
  drugs: DrugInput[];
  treatment_context?: string;
  health_context?: string;
  level: 1 | 2 | 3;
  is_case_study?: boolean;
}

interface GroqResponse {
  choices?: { message?: { content?: string } }[];
  error?: { message?: string };
}

function describeDrug(drug: DrugInput): string {
  const parts = [drug.name.trim() || "unknown substance", drug.method];
  if (drug.amount?.trim())
    parts.push(`${drug.amount.trim()}${drug.unit ? ` ${drug.unit}` : ""}`);
  return parts.join(", ");
}

// ─── Normalize key terms (backwards compat: string[] or object[]) ─────────────

function normalizeKeyTerm(raw: unknown): { term: string; definition: string } {
  if (typeof raw === "string") return { term: raw, definition: "" };
  if (typeof raw === "object" && raw !== null) {
    const r = raw as { term?: unknown; definition?: unknown };
    return {
      term: typeof r.term === "string" ? r.term : "",
      definition: typeof r.definition === "string" ? r.definition : "",
    };
  }
  return { term: "", definition: "" };
}

// ─── Level-specific system prompts ───────────────────────────────────────────

const EDUCATOR_PREAMBLE =
  "IMPORTANT: You are writing educational content for a biology/pharmacology learning platform, NOT giving medical advice. " +
  "Your audience is students who want to understand the science. " +
  "NEVER say any of these phrases: \"consult a doctor\", \"seek medical advice\", \"talk to your healthcare provider\", " +
  "\"this is not medical advice\", \"I recommend you\", \"you should\", \"the patient should\". " +
  "ALWAYS frame everything as educational biology/pharmacology explanation. You are a science teacher, not a clinician.\n\n";

const LEVEL_SYSTEM_PROMPTS: Record<1 | 2 | 3, string> = {
  1:
    EDUCATOR_PREAMBLE +
    "You are a passionate honors biology teacher explaining drug interactions to curious 9th grade students. " +
    "Always respond with valid JSON only — no markdown, no code fences, no extra text.\n\n" +
    "Your explanations must be detailed, engaging, and scientifically accurate while remaining accessible. " +
    "Write 6-8 sentences minimum per combination.\n\n" +
    "Follow this exact structure for every explanation:\n" +
    "- Sentence 1-2: What does Drug A normally do inside the body? What is its job? Use an analogy.\n" +
    "- Sentence 3-4: What does Drug B normally do inside the body? What is its job? Use an analogy.\n" +
    "- Sentence 5-6: What happens when both are taken together? What goes wrong at the cellular or organ level?\n" +
    "- Sentence 7-8: What does the person actually experience physically? What symptoms occur and why?\n\n" +
    "Use analogies like locks and keys, traffic jams, messengers, volume knobs, and flooding. " +
    "Always explain technical terms immediately after using them in plain language. " +
    "Never give a generic response — be specific about the exact biological mechanism.\n\n" +
    "EXAMPLE of good Level 1 explanation for fluoxetine + tramadol:\n" +
    "'Fluoxetine is an antidepressant that works by blocking the brain's recycling system for serotonin — " +
    "think of serotonin as a happy messenger molecule, and fluoxetine as jamming open the door so the " +
    "messenger keeps delivering its signal instead of being reabsorbed. Tramadol is a painkiller that also " +
    "accidentally increases serotonin levels as a side effect, on top of its main job of blocking pain " +
    "signals by binding to opioid receptors — special docking stations on nerve cells that reduce pain " +
    "perception. When you take both drugs together, serotonin floods the brain's synapses, which are the " +
    "tiny gaps between nerve cells where chemical messages are passed. This overwhelming flood of serotonin " +
    "overstimulates nerve cells throughout the brain and spinal cord, triggering a dangerous condition called " +
    "serotonin syndrome. The body responds to this chemical overload with a cascade of symptoms — your muscles " +
    "may begin twitching uncontrollably, your heart races, your temperature spikes dangerously high, and you " +
    "may feel extremely agitated or confused. This combination can be life-threatening and should never be " +
    "taken together without direct medical supervision.'\n\n" +
    "Risk levels: HIGH = serious harm or death, MODERATE = meaningful side effects, LOW = minimal. " +
    "When in doubt choose HIGH.",

  2:
    EDUCATOR_PREAMBLE +
    "You are an AP Biology teacher explaining drug interactions to advanced students preparing for the AP exam and college. " +
    "Always respond with valid JSON only — no markdown, no code fences, no extra text.\n\n" +
    "Your explanations must be rigorous, precise, and demonstrate deep molecular and cellular understanding. " +
    "Write 6-8 sentences minimum per combination.\n\n" +
    "Follow this exact structure:\n" +
    "- Sentence 1-2: Describe Drug A's mechanism at the molecular level — which proteins, receptors, or enzymes does it target? What cellular pathway does it affect?\n" +
    "- Sentence 3-4: Describe Drug B's mechanism at the molecular level — same detail level as Drug A.\n" +
    "- Sentence 5-6: Explain the interaction at the molecular/cellular level — enzyme competition, receptor saturation, pathway convergence, etc.\n" +
    "- Sentence 7-8: Describe the downstream cellular and physiological consequences.\n\n" +
    "Include: specific enzyme names, receptor subtypes, neurotransmitter systems, signal transduction pathways, gene expression effects where relevant. " +
    "Stay at molecular/cellular level — no clinical pharmacokinetics yet.\n\n" +
    "EXAMPLE of good Level 2 explanation for fluoxetine + tramadol:\n" +
    "'Fluoxetine is a selective serotonin reuptake inhibitor (SSRI) that functions by competitively binding to the serotonin transporter protein (SERT) " +
    "on presynaptic neurons, preventing the reuptake of 5-hydroxytryptamine (5-HT) from the synaptic cleft back into the presynaptic terminal, thereby " +
    "increasing extracellular serotonin concentration and prolonging its receptor activation. Tramadol is a centrally acting analgesic with dual mechanisms: " +
    "it acts as a weak agonist at mu-opioid receptors (MORs) and simultaneously inhibits both serotonin and norepinephrine reuptake transporters, making it " +
    "a serotonergic agent in addition to its primary analgesic function. When co-administered, both drugs converge on the serotonergic system — fluoxetine " +
    "blocks SERT-mediated reuptake while tramadol also inhibits SERT and increases presynaptic 5-HT release, creating additive inhibition of serotonin " +
    "clearance. Additionally, fluoxetine is a potent inhibitor of the CYP2D6 isoenzyme, which is responsible for metabolizing tramadol into its active " +
    "O-desmethyltramadol metabolite, further complicating the pharmacological interaction. The combined effect produces a dramatic increase in synaptic " +
    "5-HT concentration, overstimulating both 5-HT1A and 5-HT2A receptors throughout the central and peripheral nervous systems. This receptor " +
    "hyperstimulation triggers serotonin syndrome, characterized by a triad of neuromuscular abnormalities, autonomic instability, and altered mental status, " +
    "mediated through downstream activation of phospholipase C and adenylyl cyclase signaling cascades.'\n\n" +
    "Risk levels: HIGH = serious harm or death, MODERATE = meaningful side effects, LOW = minimal. " +
    "When in doubt choose HIGH.",

  3:
    EDUCATOR_PREAMBLE +
    "You are a clinical pharmacology professor teaching pre-med students who need to understand drug interactions at a level that prepares them for medical school. " +
    "Always respond with valid JSON only — no markdown, no code fences, no extra text.\n\n" +
    "Your explanations must be at the level of a pharmacology textbook combined with clinical case discussion. Write 7-9 sentences minimum.\n\n" +
    "Follow this exact structure:\n" +
    "- Sentence 1-2: Pharmacokinetics of Drug A — ADME profile, bioavailability, protein binding, volume of distribution, metabolism (which CYP isoforms), elimination half-life.\n" +
    "- Sentence 3-4: Pharmacokinetics of Drug B — same detail level.\n" +
    "- Sentence 5-6: The pharmacokinetic and/or pharmacodynamic interaction mechanism — enzyme inhibition/induction, displacement from protein binding, transporter competition, additive/synergistic receptor effects.\n" +
    "- Sentence 7-8: Clinical manifestation — how does this interaction present? What are the early warning signs vs severe presentation?\n" +
    "- Sentence 9: Clinical management — what should a clinician do? Dose adjustment, monitoring parameters, contraindication, alternative agents.\n\n" +
    "Include: specific CYP isoforms (CYP3A4, CYP2D6, CYP2C9, CYP1A2), drug transporters (P-gp, OATP), receptor pharmacology with Ki/EC50 context where relevant, " +
    "pharmacokinetic equations conceptually, clinical monitoring parameters, FDA black box warnings where applicable.\n\n" +
    "EXAMPLE of good Level 3 explanation for fluoxetine + tramadol:\n" +
    "'Fluoxetine is well-absorbed orally with bioavailability of approximately 72%, highly protein-bound (~94%), and undergoes extensive hepatic metabolism " +
    "primarily via CYP2D6 and CYP2C9 to its active metabolite norfluoxetine, which has an exceptionally long half-life of 4-16 days, creating a prolonged " +
    "pharmacological effect even after discontinuation. Tramadol is also orally bioavailable (~75%) and critically dependent on CYP2D6 for conversion to its " +
    "active metabolite O-desmethyltramadol (M1), which has 200-fold higher affinity for mu-opioid receptors than the parent compound, making CYP2D6 activity " +
    "central to its analgesic efficacy. The primary pharmacokinetic interaction is fluoxetine-mediated competitive inhibition of CYP2D6, which reduces M1 " +
    "formation and paradoxically decreases tramadol analgesia while simultaneously elevating parent tramadol plasma concentrations, increasing its serotonergic " +
    "and CNS depressant effects. The pharmacodynamic interaction compounds this — both agents inhibit SERT with fluoxetine having Ki ~0.3nM and tramadol " +
    "having weaker but significant SERT affinity, creating additive serotonin reuptake inhibition that dramatically elevates synaptic 5-HT at both 5-HT1A " +
    "and 5-HT2A receptors. Clinically, this interaction carries an FDA black box warning for serotonin syndrome, which presents initially with tachycardia, " +
    "diaphoresis, mydriasis, and hyperreflexia, progressing to hyperthermia above 41°C, rhabdomyolysis, disseminated intravascular coagulation, and multi-organ " +
    "failure in severe cases. Management requires immediate discontinuation of both serotonergic agents, supportive care with benzodiazepines for neuromuscular " +
    "agitation, cyproheptadine as a 5-HT2A antagonist in moderate cases, and ICU admission with active cooling for severe hyperthermia.'\n\n" +
    "Risk levels: HIGH = serious harm or death, MODERATE = meaningful side effects, LOW = minimal. " +
    "When in doubt choose HIGH.",
};

const LEVEL_NAMES: Record<1 | 2 | 3, string> = {
  1: "Level 1 (Honors Biology / Middle & High School)",
  2: "Level 2 (AP Biology / Advanced High School)",
  3: "Level 3 (Pre-Med / College Level)",
};

const KEY_TERM_DEF_GUIDANCE: Record<1 | 2 | 3, string> = {
  1: "Definitions must be in plain English, 1 sentence, no jargon — explain as if to a curious 13-year-old.",
  2: "Definitions must include molecular/cellular context, 1-2 sentences, referencing specific proteins, pathways, or enzymes.",
  3: "Definitions must include clinical/pharmacological context, 1-2 sentences, with quantitative detail (Ki, half-life, CYP isoform) where relevant.",
};

const CONTEXT_ADDITION =
  "\nWhen treatment context is provided, explicitly reference it in your explanation. " +
  "When health profile is provided, flag any additional risks based on that profile. This is mandatory.";

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const apiKey = env.GROQ_API_KEY;

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  const { drugs, treatment_context, health_context, level, is_case_study } =
    body;

  if (!Array.isArray(drugs) || drugs.length < 2) {
    return NextResponse.json(
      { error: "At least 2 drugs required" },
      { status: 400 },
    );
  }

  const validLevel: 1 | 2 | 3 =
    level === 1 || level === 2 || level === 3 ? level : 2;

  const drugList = drugs
    .map((d, i) => `${i + 1}. ${describeDrug(d)}`)
    .join("\n");

  // ─── Pre-fetch FDA/NIH data for top 3 pairs ───────────────────────────────
  const topPairs = drugs
    .flatMap((d1, i) =>
      drugs.slice(i + 1).map((d2) => ({ d1: d1.name, d2: d2.name })),
    )
    .slice(0, 3);

  const pairDataResults = await Promise.all(
    topPairs.map(({ d1, d2 }) => fetchDrugPairData(d1, d2)),
  );

  const dataContext = pairDataResults
    .map((pd) => {
      console.log(
        "[arn-interaction-premium] FDA drug1 data:",
        !!pd.drug1Data.warnings || !!pd.drug1Data.interactions,
      );
      console.log(
        "[arn-interaction-premium] FDA drug2 data:",
        !!pd.drug2Data.warnings || !!pd.drug2Data.interactions,
      );
      return buildDataContext(pd.drug1Data, pd.drug2Data, pd.knownInteraction);
    })
    .join("\n");
  // ─────────────────────────────────────────────────────────────────────────

  const caseStudyInstruction = is_case_study
    ? "\nThis is a case study. Reference 'the patient' throughout your explanation, not 'you' or 'the user'."
    : "\nDo not reference any patient — explanations should be purely academic and impersonal.";

  const systemPrompt =
    LEVEL_SYSTEM_PROMPTS[validLevel] + CONTEXT_ADDITION + caseStudyInstruction;

  const ctx = treatment_context?.trim();
  const contextLine = ctx ? `Goal/concern: ${ctx}\n` : "";
  const hp = health_context?.trim();
  const healthLine = hp ? `Health profile: ${hp}\n` : "";

  const userPrompt =
    dataContext +
    `Before analyzing, internalize these calibration examples:\n` +
    `- aspirin + ibuprofen = HIGH (two NSAIDs, GI bleed risk)\n` +
    `- acetaminophen + NyQuil = HIGH (duplicate acetaminophen, liver damage risk)\n` +
    `- fluoxetine + dextromethorphan = HIGH (serotonin syndrome)\n` +
    `- alcohol + benzodiazepines = HIGH (CNS depression, death)\n` +
    `- ibuprofen + acetaminophen = MODERATE (different mechanisms, generally safe short term)\n` +
    `- amoxicillin + birth control = MODERATE (reduced efficacy)\n` +
    `- vitamin C + iron supplement = LOW, efficacy (enhances absorption)\n` +
    `- benzoyl peroxide + vitamin C serum = LOW, efficacy (destroys vitamin C on contact)\n` +
    `- tetracycline + dairy/calcium = LOW, efficacy (calcium chelates the antibiotic)\n\n` +
    `Analyze interactions between:\n${drugList}\n\n` +
    contextLine +
    healthLine +
    `\nAnalyze at ${LEVEL_NAMES[validLevel]} understanding level.\n` +
    `Key term definitions: ${KEY_TERM_DEF_GUIDANCE[validLevel]}\n\n` +
    `CRITICAL QUALITY REQUIREMENTS:\n` +
    `- Each explanation MUST be at least 6 sentences long\n` +
    `- Each sentence must add NEW biological information — no repetition\n` +
    `- Do NOT use filler phrases like "it is important to note" or "it should be mentioned"\n` +
    `- Be specific: name the actual receptor, enzyme, or pathway — never say "affects the brain" without saying HOW\n` +
    `- Explain causality: don't just say what happens, say WHY it happens at the molecular level\n\n` +
    `Return this exact JSON for each drug pair:\n` +
    `{\n` +
    `  "combinations": [\n` +
    `    {\n` +
    `      "drug_a": "name",\n` +
    `      "drug_b": "name",\n` +
    `      "classification": "CYP450 Metabolism | Serotonin Syndrome | CNS Depression | Additive Toxicity | Receptor Competition | Chemical Degradation | Absorption Interference | Duplicate Ingredients | Other",\n` +
    `      "explanation": "6-8 sentences fully written at the selected curriculum level. Start with what each drug does individually, then explain the interaction, then the outcome.",\n` +
    `      "key_terms": [\n` +
    `        { "term": "exact term as it appears in the explanation", "definition": "definition calibrated to the curriculum level" },\n` +
    `        ... (3-5 terms total, chosen from words actually used in the explanation)\n` +
    `      ]\n` +
    `    }\n` +
    `  ],\n` +
    `  "overall_summary": "2-3 sentences at the selected level summarizing the most important finding."\n` +
    `}\n` +
    `Only include combinations with at least LOW interaction significance — skip truly inert pairs.`;

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
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      },
    );
  } catch (err) {
    console.error("[arn-interaction-premium] Network error:", err);
    return NextResponse.json(
      { error: "Network error reaching Groq" },
      { status: 502 },
    );
  }

  const responseText = await apiResponse.text();

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
      // Regex fallback
      const summaryMatch = cleaned.match(
        /"overall_summary"\s*:\s*"([\s\S]+?)(?=",\s*"|"\s*})/,
      );

      let combs: ParsedCombination[] = [];
      const combsText = cleaned.match(
        /"combinations"\s*:\s*(\[[\s\S]+?\])(?=\s*[,}])/,
      );
      if (combsText) {
        try {
          combs = JSON.parse(combsText[1]) as ParsedCombination[];
        } catch {
          /* leave empty */
        }
      }

      if (!summaryMatch && combs.length === 0)
        throw new Error("Could not extract fields");

      result = {
        combinations: combs,
        overall_summary: summaryMatch ? summaryMatch[1] : "",
      };
    }

    const combinations = (
      Array.isArray(result.combinations) ? result.combinations : []
    ).map((c) => ({
      drug_a: c.drug_a ?? "",
      drug_b: c.drug_b ?? "",
      classification: c.classification ?? "Other",
      explanation: c.explanation ?? "",
      key_terms: Array.isArray(c.key_terms)
        ? c.key_terms.map(normalizeKeyTerm).filter((t) => t.term.length > 0)
        : [],
    }));

    return NextResponse.json({
      combinations,
      overall_summary: result.overall_summary ?? "",
    });
  } catch (err) {
    console.error(
      "[arn-interaction-premium] Failed to parse:",
      err,
      "raw:",
      content,
    );
    return NextResponse.json(
      { error: "Failed to parse model response" },
      { status: 500 },
    );
  }
}
