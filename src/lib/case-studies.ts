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
];
