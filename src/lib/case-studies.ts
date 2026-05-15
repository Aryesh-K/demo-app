export interface CaseStudySection {
  id: string;
  title: string;
  type: "content" | "interactive" | "quiz";
}

export interface MCQQuestion {
  id: string;
  type: "mcq";
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  points: number;
}

export interface DragDropQuestion {
  id: string;
  type: "dragdrop";
  instruction: string;
  items: string[];
  correctOrder: number[];
  explanation: string;
  points: number;
}

export interface WrittenQuestion {
  id: string;
  type: "written";
  question: string;
  gradingCriteria: string;
  points: number;
}

export type Question = MCQQuestion | DragDropQuestion | WrittenQuestion;

export interface CaseStudy {
  id: string;
  title: string;
  subtitle: string;
  patientName: string;
  patientAge: number;
  patientSex: string;
  patientConditions: string;
  patientMedications: string;
  patientScenario: string;
  learningObjectives: string[];
  targetLevel: string;
  estimatedMinutes: number;
  historyEraId: string | null;
  historyEraTitle: string | null;
  sections: CaseStudySection[];
  questions: Question[];
}

export const CASE_STUDIES: CaseStudy[] = [
  {
    id: "grapefruit-paradox",
    title: "The Grapefruit Paradox",
    subtitle:
      "Why a single glass of juice can send a medication dangerously off course",
    patientName: "Margaret",
    patientAge: 67,
    patientSex: "Female",
    patientConditions: "Hypercholesterolemia, mild hypertension",
    patientMedications: "Simvastatin 40mg daily, Lisinopril 10mg daily",
    patientScenario:
      "Margaret, 67, takes simvastatin daily for high cholesterol. One morning she drinks a large glass of grapefruit juice with breakfast — something she has done occasionally for years without thinking about it. Three days later she visits her doctor complaining of severe muscle pain, weakness, and dark-colored urine. Her doctor orders lab work and finds markedly elevated creatine kinase levels. What happened?",
    learningObjectives: [
      "Understand how CYP3A4 enzymes metabolize drugs in the intestinal wall",
      "Explain mechanism-based (suicide) enzyme inhibition",
      "Identify which drug classes are most affected by grapefruit",
      "Apply drug interaction knowledge to analyze a real patient scenario",
      "Distinguish between intestinal and hepatic drug metabolism",
    ],
    targetLevel: "AP Biology / Pre-Med Intro",
    estimatedMinutes: 25,
    historyEraId: "era-6",
    historyEraTitle: "The Grapefruit Discovery (1991)",
    sections: [
      { id: "background", title: "Background", type: "content" },
      { id: "enzyme", title: "The Enzyme", type: "interactive" },
      { id: "inhibitor", title: "The Inhibitor", type: "interactive" },
      { id: "patient", title: "Margaret's Case", type: "interactive" },
      { id: "which-drugs", title: "Which Drugs?", type: "interactive" },
      { id: "quiz", title: "Review & Quiz", type: "quiz" },
    ],
    questions: [
      {
        id: "mcq-1",
        type: "mcq",
        question:
          "Where in the body does grapefruit primarily inhibit CYP3A4?",
        options: [
          "The liver",
          "The intestinal wall",
          "The kidneys",
          "The bloodstream",
        ],
        correctIndex: 1,
        explanation:
          "Grapefruit furanocoumarins primarily inhibit CYP3A4 in the intestinal wall (enterocytes), not the liver. This is why grapefruit affects first-pass metabolism — it allows more drug to be absorbed before it even reaches the liver.",
        points: 2,
      },
      {
        id: "mcq-2",
        type: "mcq",
        question:
          "Why is grapefruit's inhibition of CYP3A4 particularly long-lasting?",
        options: [
          "Grapefruit stays in the stomach for a long time",
          "Furanocoumarins are stored in fat tissue",
          "The inhibition is mechanism-based — the enzyme is permanently inactivated until new enzyme is synthesized",
          "Grapefruit juice increases drug receptor sensitivity",
        ],
        correctIndex: 2,
        explanation:
          "Grapefruit causes mechanism-based (suicide) inhibition — the furanocoumarins are metabolized by CYP3A4 into reactive intermediates that permanently inactivate the enzyme. New enzyme must be synthesized before normal metabolism resumes, which takes 24–72 hours.",
        points: 2,
      },
      {
        id: "mcq-3",
        type: "mcq",
        question:
          "Margaret's severe muscle pain and elevated creatine kinase are symptoms of which condition?",
        options: [
          "Hepatotoxicity",
          "Rhabdomyolysis / myopathy",
          "Renal failure",
          "Serotonin syndrome",
        ],
        correctIndex: 1,
        explanation:
          "Elevated creatine kinase (CK) combined with muscle pain and weakness indicates myopathy or rhabdomyolysis — muscle cell breakdown caused by toxic statin levels. When simvastatin cannot be metabolized normally, it accumulates to dangerously high concentrations in muscle tissue.",
        points: 2,
      },
      {
        id: "dragdrop-1",
        type: "dragdrop",
        instruction:
          "Put these steps in the correct order to explain what happened to Margaret:",
        items: [
          "Furanocoumarins permanently inactivate intestinal CYP3A4",
          "Margaret drinks grapefruit juice with her simvastatin",
          "Simvastatin accumulates to toxic levels in muscle tissue",
          "More simvastatin is absorbed into the bloodstream than normal",
          "Grapefruit furanocoumarins reach the intestinal wall",
        ],
        correctOrder: [1, 4, 0, 3, 2],
        explanation:
          "The correct sequence: Margaret drinks grapefruit juice → furanocoumarins reach intestinal wall → they permanently inactivate CYP3A4 → more simvastatin bypasses first-pass metabolism → toxic levels accumulate in muscle tissue.",
        points: 3,
      },
      {
        id: "written-1",
        type: "written",
        question:
          "In your own words, explain to Margaret why she cannot drink grapefruit juice while taking simvastatin. Your explanation should include what CYP3A4 does normally, what grapefruit does to it, and why this caused her muscle pain. Write as if explaining to a patient who has no science background.",
        gradingCriteria:
          "Award points based on: (1) correct explanation that CYP3A4 normally breaks down the medication, (2) correct explanation that grapefruit disables this enzyme, (3) correct explanation that more medication reaches the body than intended, (4) correct connection between high drug levels and muscle damage, (5) clarity and patient-appropriate language. Score 1–5.",
        points: 5,
      },
    ],
  },
  {
    id: "cellular-respiration",
    title: "The Poisoned Cell",
    subtitle: "How cyanide stops the most fundamental process keeping you alive",
    patientName: "James",
    patientAge: 34,
    patientSex: "Male",
    patientConditions: "None — previously healthy",
    patientMedications: "None",
    patientScenario:
      "James, 34, is a factory worker who collapsed on the job after exposure to an industrial chemical. Paramedics find him unresponsive with rapid breathing, bright red skin, and a faint smell of almonds. His blood oxygen reads normal on the pulse oximeter — yet his cells are suffocating. How is this possible?",
    learningObjectives: [
      "Trace the steps of cellular respiration from glycolysis through the electron transport chain",
      "Explain the role of ATP as cellular energy currency",
      "Understand how the electron transport chain creates a proton gradient",
      "Explain how cyanide disrupts Complex IV and why oxygen levels appear normal",
      "Connect molecular-level disruption to whole-body symptoms",
    ],
    targetLevel: "Honors Biology / AP Biology",
    estimatedMinutes: 30,
    historyEraId: null,
    historyEraTitle: null,
    sections: [
      { id: "background", title: "Background", type: "content" },
      { id: "glycolysis", title: "Glycolysis", type: "interactive" },
      { id: "krebs", title: "Krebs Cycle", type: "interactive" },
      { id: "etc", title: "Electron Transport Chain", type: "interactive" },
      { id: "poison", title: "The Poison", type: "interactive" },
      { id: "quiz", title: "Review & Quiz", type: "quiz" },
    ],
    questions: [
      {
        id: "cr-mcq-1",
        type: "mcq",
        question: "Where in the cell does glycolysis occur?",
        options: [
          "Inside the mitochondria",
          "In the cytoplasm",
          "On the inner mitochondrial membrane",
          "In the nucleus",
        ],
        correctIndex: 1,
        explanation:
          "Glycolysis occurs in the cytoplasm and does not require oxygen. It is the only stage of cellular respiration that happens outside the mitochondria, which is why it can occur under both aerobic and anaerobic conditions.",
        points: 2,
      },
      {
        id: "cr-mcq-2",
        type: "mcq",
        question: "What is the final electron acceptor at the end of the electron transport chain?",
        options: [
          "Carbon dioxide (CO₂)",
          "NADH",
          "Oxygen (O₂)",
          "ATP",
        ],
        correctIndex: 2,
        explanation:
          "Oxygen is the final electron acceptor at Complex IV. It accepts electrons and combines with hydrogen ions to form water. This is why we breathe oxygen — not primarily to carry it in our blood, but to accept electrons at the end of the ETC.",
        points: 2,
      },
      {
        id: "cr-mcq-3",
        type: "mcq",
        question: "Why does James's pulse oximeter show normal blood oxygen despite his cells dying?",
        options: [
          "The pulse oximeter is malfunctioning",
          "Cyanide destroys oxygen in the bloodstream",
          "Cyanide blocks the ETC so cells cannot USE oxygen — it remains in the blood unused",
          "James's lungs are absorbing extra oxygen to compensate",
        ],
        correctIndex: 2,
        explanation:
          "Cyanide blocks Complex IV, meaning cells cannot accept and use oxygen even though it is present. The blood remains fully oxygenated — hemoglobin carries oxygen normally — but the cells cannot consume it. The pulse oximeter measures oxygen in blood, not oxygen use by cells, so it reads normal.",
        points: 2,
      },
      {
        id: "cr-mcq-4",
        type: "mcq",
        question: "Which protein complex in the electron transport chain does cyanide directly block?",
        options: [
          "Complex I",
          "Complex II",
          "Complex III",
          "Complex IV (Cytochrome c oxidase)",
        ],
        correctIndex: 3,
        explanation:
          "Cyanide binds with extremely high affinity to Complex IV, also called cytochrome c oxidase. By blocking the final step of electron transfer to oxygen, cyanide causes the entire chain to back up and halt, collapsing the proton gradient and stopping ATP synthesis.",
        points: 2,
      },
      {
        id: "cr-dragdrop-1",
        type: "dragdrop",
        instruction: "Put these stages of cellular respiration in the correct order:",
        items: [
          "ATP synthase uses the proton gradient to produce ATP",
          "Glucose is split into pyruvate in the cytoplasm",
          "NADH and FADH₂ donate electrons to the ETC",
          "Pyruvate enters the mitochondria and is processed by the Krebs cycle",
          "Electrons flow through Complexes I–IV, pumping H⁺ ions",
        ],
        correctOrder: [1, 3, 2, 4, 0],
        explanation:
          "Correct order: Glycolysis (glucose → pyruvate in cytoplasm) → Krebs cycle (pyruvate processed in mitochondria, producing NADH/FADH₂) → NADH/FADH₂ donate electrons to the ETC → electrons flow through complexes, pumping H⁺ → ATP synthase uses the gradient to produce ATP.",
        points: 3,
      },
      {
        id: "cr-written-1",
        type: "written",
        question:
          "Explain to a classmate why James's pulse oximeter shows normal oxygen levels but his cells are still dying. Your explanation should include what cyanide does to the electron transport chain, why this stops ATP production, and why blood oxygen appears normal. Write clearly enough that a classmate who missed class could understand.",
        gradingCriteria:
          "Award points based on: (1) correct identification that cyanide blocks Complex IV specifically, (2) correct explanation that oxygen cannot be used by cells even though it is present in blood, (3) correct connection between ETC blockage and ATP synthesis failure, (4) correct explanation of why pulse oximeter reads normal (measures blood O2 not cellular O2 use), (5) clarity and accuracy of overall explanation. Score 1-5.",
        points: 5,
      },
    ],
  },
  {
    id: "serotonin-storm",
    title: "The Serotonin Storm",
    subtitle:
      "How two medications combined to create a life-threatening neurological emergency",
    patientName: "Linda",
    patientAge: 52,
    patientSex: "Female",
    patientConditions: "Treatment-resistant depression, chronic lower back pain",
    patientMedications: "Phenelzine 45mg daily (MAOI antidepressant)",
    patientScenario:
      "Linda, 52, has been taking phenelzine for treatment-resistant depression for three years. While traveling, she runs out of her medication and visits an urgent care clinic. The doctor, unaware of her phenelzine, prescribes tramadol for back pain she mentions in passing. Within two hours Linda is in the emergency room — trembling uncontrollably, drenched in sweat, heart racing at 160 BPM, temperature 104°F, muscles rigid. The triage nurse notes her pupils are dilated and she is visibly agitated and confused. What happened?",
    learningObjectives: [
      "Explain how monoamine oxidase normally breaks down serotonin in the synapse",
      "Understand how MAOIs work and why they require a 2-week washout period",
      "Identify the three mechanisms that can raise synaptic serotonin levels",
      "Explain why tramadol is serotonergic beyond just being an opioid",
      "Connect excess 5-HT1A and 5-HT2A receptor stimulation to the clinical triad of serotonin syndrome",
      "Recognize which drug combinations carry the highest risk",
    ],
    targetLevel: "AP Biology / Pre-Med",
    estimatedMinutes: 30,
    historyEraId: "era-8",
    historyEraTitle: "Serotonin Syndrome (1991)",
    sections: [
      { id: "background", title: "Background", type: "content" },
      { id: "maoi", title: "The MAOI", type: "interactive" },
      { id: "trigger", title: "The Trigger", type: "interactive" },
      { id: "storm", title: "The Storm", type: "interactive" },
      { id: "spectrum", title: "The Spectrum", type: "interactive" },
      { id: "quiz", title: "Review & Quiz", type: "quiz" },
    ],
    questions: [
      {
        id: "ss-mcq-1",
        type: "mcq",
        question: "What enzyme does phenelzine inhibit?",
        options: [
          "CYP3A4 (cytochrome P450)",
          "Monoamine oxidase (MAO)",
          "Acetylcholinesterase",
          "COMT (catechol-O-methyltransferase)",
        ],
        correctIndex: 1,
        explanation:
          "Phenelzine is a monoamine oxidase inhibitor (MAOI). It irreversibly blocks MAO-A, the enzyme responsible for breaking down serotonin, norepinephrine, and dopamine in the synapse and gut. Without MAO, these neurotransmitters accumulate to dangerous levels.",
        points: 2,
      },
      {
        id: "ss-mcq-2",
        type: "mcq",
        question:
          "Besides being a weak opioid, what serotonergic mechanism does tramadol have?",
        options: [
          "It stimulates serotonin receptors directly",
          "It blocks the serotonin transporter (SERT), preventing serotonin reuptake",
          "It increases serotonin synthesis in the raphe nuclei",
          "It inhibits MAO-B specifically",
        ],
        correctIndex: 1,
        explanation:
          "Tramadol blocks SERT — the serotonin reuptake transporter — in addition to its weak mu-opioid agonism. This means serotonin released into the synapse cannot be cleared. Combined with an MAOI that prevents serotonin breakdown, the result is catastrophic serotonin accumulation.",
        points: 2,
      },
      {
        id: "ss-mcq-3",
        type: "mcq",
        question:
          "Which component of the serotonin syndrome triad is most immediately life-threatening?",
        options: [
          "Altered mental status",
          "Autonomic instability",
          "Hyperthermia from neuromuscular rigidity",
          "Hyperreflexia",
        ],
        correctIndex: 2,
        explanation:
          "Hyperthermia is the primary killer in severe serotonin syndrome. Muscle rigidity causes continuous involuntary contraction generating massive heat. Core temperatures above 106°F (41°C) cause direct protein denaturation, brain damage, rhabdomyolysis, and multi-organ failure. Aggressive cooling is the most critical intervention.",
        points: 2,
      },
      {
        id: "ss-mcq-4",
        type: "mcq",
        question:
          "Why does phenelzine require a 2-week washout period before starting another serotonergic drug?",
        options: [
          "Phenelzine takes 2 weeks to be fully absorbed",
          "MAO is irreversibly inhibited — new enzyme must be synthesized, which takes 2 weeks",
          "Serotonin levels take 2 weeks to normalize after stopping phenelzine",
          "The 2-week period allows CYP450 enzymes to clear phenelzine metabolites",
        ],
        correctIndex: 1,
        explanation:
          "Phenelzine causes irreversible inhibition of MAO — it permanently destroys the enzyme. The only way to restore MAO activity is to synthesize new enzyme from scratch, which takes approximately 2 weeks. During this window, the patient remains at risk for serotonin syndrome even after stopping the drug.",
        points: 2,
      },
      {
        id: "ss-dragdrop-1",
        type: "dragdrop",
        instruction:
          "Match each drug combination to its serotonin syndrome risk level by ordering them from HIGHEST to LOWEST risk:",
        items: [
          "SSRI + Dextromethorphan (cough medicine)",
          "SSRI + MAOI",
          "SSRI + Triptan (e.g. sumatriptan)",
          "MAOI + Tramadol",
          "SSRI + Tramadol",
        ],
        correctOrder: [1, 3, 4, 0, 2],
        explanation:
          "Correct order highest to lowest: SSRI + MAOI (extreme — two major mechanisms combined), MAOI + Tramadol (extreme — as demonstrated by Linda's case), SSRI + Tramadol (high — reuptake blockade doubled), SSRI + Dextromethorphan (moderate — DXM weakly blocks SERT), SSRI + Triptan (low/rare — triptans are 5-HT1B/1D agonists with minimal serotonin syndrome risk despite common flagging).",
        points: 3,
      },
      {
        id: "ss-written-1",
        type: "written",
        question:
          "You are an ER physician treating Linda. Explain to the medical student with you what caused this reaction, why tramadol was the trigger, and what makes the MAOI + tramadol combination so much more dangerous than either drug alone. Write as you would actually speak to a medical student at the bedside.",
        gradingCriteria:
          "Award points based on: (1) correct explanation that phenelzine blocks MAO preventing serotonin breakdown, (2) correct identification of tramadol's dual mechanism as both opioid and SERT inhibitor, (3) correct explanation of why the combination is synergistic — serotonin cannot be broken down AND cannot be cleared from the synapse, (4) connection to clinical symptoms via 5-HT1A and 5-HT2A overstimulation, (5) clarity and appropriate clinical teaching tone. Score 1-5.",
        points: 5,
      },
    ],
  },
];
