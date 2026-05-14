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
];
