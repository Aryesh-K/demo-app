"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { cn } from "~/lib/utils";

// ─── Constants ───────────────────────────────────────────────────────────────

const UNITS = ["mg", "mcg", "g", "mL", "tablets", "capsules"] as const;
type Unit = (typeof UNITS)[number];

const APPLICATION_METHODS = [
  "Oral (swallowed)",
  "Medicated topical (prescription or OTC drug)",
  "Cosmetic/skincare (serum, moisturizer, non-medicated)",
  "Inhaled",
  "Injected",
  "Eye/Ear drops",
  "Other",
] as const;
type ApplicationMethod = (typeof APPLICATION_METHODS)[number];

type Risk = "high" | "moderate" | "low";
type Phase = "idle" | "animating" | "loading" | "results" | "error" | "premium";

// ─── API types ────────────────────────────────────────────────────────────────

interface ApiResult {
  risk_level: Risk;
  interaction_type: "safety" | "efficacy" | "both";
  classification: string;
  simple_explanation: string;
  intermediate_explanation: string;
  simple_key_terms?: string[];
  intermediate_key_terms?: string[];
}

// ─── Risk config ──────────────────────────────────────────────────────────────

type RiskConfig = {
  bg: string;
  border: string;
  text: string;
  label: string;
  emoji: string;
};

const RISK_CONFIG: Record<Risk, RiskConfig> = {
  high: {
    bg: "bg-red-950/40",
    border: "border-red-800",
    text: "text-red-300",
    label: "HIGH RISK",
    emoji: "⚠️",
  },
  moderate: {
    bg: "bg-amber-950/40",
    border: "border-amber-800",
    text: "text-amber-300",
    label: "MODERATE RISK",
    emoji: "⚡",
  },
  low: {
    bg: "bg-green-950/40",
    border: "border-green-800",
    text: "text-green-300",
    label: "LOW RISK",
    emoji: "✅",
  },
};

// ─── Classification config ────────────────────────────────────────────────────

const CLASSIFICATION_EMOJI: Record<string, string> = {
  "CYP450 Metabolism": "⚗️",
  "Serotonin Syndrome": "🧠",
  "CNS Depression": "💤",
  "Additive Toxicity": "⚠️",
  "Receptor Competition": "🔬",
  "Chemical Degradation": "🧪",
  "Absorption Interference": "🚫",
  "Duplicate Ingredients": "💊",
  Other: "🔍",
};

const SELECT_CLS =
  "h-9 w-full cursor-pointer rounded-md border border-input bg-transparent px-2 py-1 text-sm text-foreground shadow-xs outline-none focus:border-ring dark:bg-input/30";

// ─── Premium detection ───────────────────────────────────────────────────────

const PREMIUM_KEYWORDS = [
  "supplement",
  "vitamin",
  "mineral",
  "herbal",
  "herb",
  "fish oil",
  "omega",
  "probiotic",
  "melatonin",
  "zinc",
  "magnesium",
  "turmeric",
  "ginger",
  "echinacea",
  "ginseng",
  "serum",
  "moisturizer",
  "retinol",
  "collagen",
  "niacinamide",
  "hyaluronic",
  "peptide",
  "antioxidant",
  "essential oil",
];

function isPremium(drugName: string, method: ApplicationMethod): boolean {
  if (method === "Cosmetic/skincare (serum, moisturizer, non-medicated)")
    return true;
  const name = drugName.toLowerCase();
  return PREMIUM_KEYWORDS.some((kw) => name.includes(kw));
}

// ─── Molecule animation ───────────────────────────────────────────────────────

function MoleculeAnimation({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 30),
      setTimeout(() => setPhase(2), 650),
      setTimeout(() => setPhase(3), 900),
      setTimeout(onComplete, 1500),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  const sliding = phase >= 1;
  const bonded = phase >= 2;
  const pulsing = phase >= 3;

  return (
    <div className="flex items-center justify-center gap-5 py-8">
      <div
        className="size-11 rounded-full bg-teal-600/75"
        style={{
          opacity: sliding ? 1 : 0,
          transform: sliding ? "translateX(0)" : "translateX(-52px)",
          transition:
            "opacity 0.5s ease-out, transform 0.5s ease-out, box-shadow 0.3s ease",
          boxShadow: pulsing ? "0 0 28px 10px rgba(20,184,166,0.4)" : "none",
        }}
      />
      <div
        className="h-[3px] rounded-full bg-teal-400"
        style={{
          width: "2.25rem",
          opacity: bonded ? 1 : 0,
          transition: "opacity 0.25s ease",
        }}
      />
      <div
        className="size-11 rounded-full bg-cyan-500/75"
        style={{
          opacity: sliding ? 1 : 0,
          transform: sliding ? "translateX(0)" : "translateX(52px)",
          transition:
            "opacity 0.5s ease-out, transform 0.5s ease-out, box-shadow 0.3s ease",
          boxShadow: pulsing ? "0 0 28px 10px rgba(6,182,212,0.4)" : "none",
        }}
      />
    </div>
  );
}

// ─── Drug input group ─────────────────────────────────────────────────────────

interface DrugGroupProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  method: ApplicationMethod;
  onMethodChange: (m: ApplicationMethod) => void;
  amount: string;
  onAmountChange: (v: string) => void;
  unit: Unit;
  onUnitChange: (u: Unit) => void;
}

function DrugInputGroup({
  label,
  placeholder,
  value,
  onChange,
  method,
  onMethodChange,
  amount,
  onAmountChange,
  unit,
  onUnitChange,
}: DrugGroupProps) {
  const uid = useId();
  const drugId = `${uid}-drug`;
  const methodId = `${uid}-method`;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <Label htmlFor={drugId}>{label}</Label>
        <p className="text-xs text-muted-foreground">
          Enter brand name (e.g. Tylenol) or generic name (e.g. acetaminophen)
        </p>
      </div>
      <Input
        id={drugId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      <div className="flex flex-col gap-1">
        <Label
          htmlFor={methodId}
          className="text-xs font-normal text-muted-foreground"
        >
          How is it used?
        </Label>
        <select
          id={methodId}
          value={method}
          onChange={(e) => onMethodChange(e.target.value as ApplicationMethod)}
          className={SELECT_CLS}
        >
          {APPLICATION_METHODS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <Input
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            placeholder="Amount (optional)"
            inputMode="decimal"
            aria-label={`${label} amount`}
          />
        </div>
        {amount && (
          <select
            value={unit}
            onChange={(e) => onUnitChange(e.target.value as Unit)}
            aria-label={`${label} unit`}
            style={{ animation: "fade-in 0.2s ease forwards" }}
            className="h-9 shrink-0 cursor-pointer rounded-md border border-input bg-transparent px-2 py-1 text-sm text-foreground shadow-xs outline-none focus:border-ring dark:bg-input/30"
          >
            {UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}

// ─── Results ──────────────────────────────────────────────────────────────────

const DEGRADATION_KEYWORDS = [
  "degrades",
  "destroys",
  "oxidizes",
  "neutralizes",
  "breaks down",
  "renders",
  "ineffective",
  "inactivates",
  "destabilizes",
  "reduces the stability",
];

function Results({ result }: { result: ApiResult }) {
  const [activeTab, setActiveTab] = useState<"simple" | "intermediate">(
    "simple",
  );
  const cfg = RISK_CONFIG[result.risk_level];

  const mentionsDegradation = DEGRADATION_KEYWORDS.some(
    (kw) =>
      result.simple_explanation.toLowerCase().includes(kw) ||
      result.intermediate_explanation.toLowerCase().includes(kw),
  );
  const showIneffective =
    (result.interaction_type === "efficacy" || mentionsDegradation) &&
    result.risk_level === "low";

  const classEmoji = CLASSIFICATION_EMOJI[result.classification] ?? "🔍";
  const simpleTerms = result.simple_key_terms ?? [];
  const intermediateTerms = result.intermediate_key_terms ?? [];
  const currentTerms = activeTab === "simple" ? simpleTerms : intermediateTerms;

  return (
    <div className="flex flex-col gap-5 rounded-xl border bg-card p-6 shadow-sm">
      {/* Classification badge */}
      <div className="flex items-center gap-2 rounded-lg border border-teal-800 bg-teal-950/40 px-4 py-2.5">
        <span className="text-lg leading-none" aria-hidden="true">
          {classEmoji}
        </span>
        <span className="text-sm font-semibold text-teal-300">
          {result.classification}
        </span>
      </div>

      {/* Risk / Ineffective badge */}
      {showIneffective ? (
        <div className="flex items-center gap-3 rounded-lg border border-purple-800 bg-purple-950/40 px-4 py-3">
          <span className="text-2xl leading-none" aria-hidden="true">
            🚫
          </span>
          <span className="text-sm font-bold tracking-widest text-purple-300">
            INEFFECTIVE
          </span>
        </div>
      ) : (
        <div
          className={cn(
            "flex items-center gap-3 rounded-lg border px-4 py-3",
            cfg.bg,
            cfg.border,
          )}
        >
          <span className="text-2xl leading-none" aria-hidden="true">
            {cfg.emoji}
          </span>
          <span className={cn("text-sm font-bold tracking-widest", cfg.text)}>
            {cfg.label}
          </span>
        </div>
      )}

      {/* Explanation tabs */}
      <div className="flex flex-col gap-3">
        <div className="flex border-b border-border">
          <button
            type="button"
            onClick={() => setActiveTab("simple")}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors",
              activeTab === "simple"
                ? "-mb-px border-b-2 border-teal-400 text-teal-300"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Simple Biology
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("intermediate")}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors",
              activeTab === "intermediate"
                ? "-mb-px border-b-2 border-teal-400 text-teal-300"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Intermediate A&amp;P Deep Dive
          </button>
        </div>
        <p
          key={activeTab}
          className="text-sm leading-relaxed text-muted-foreground"
          style={{ animation: "fade-in 0.2s ease forwards" }}
        >
          {activeTab === "simple"
            ? result.simple_explanation
            : result.intermediate_explanation}
        </p>
      </div>

      {/* Key terms */}
      {currentTerms.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Key Terms
          </h3>
          <div key={activeTab} className="flex flex-wrap gap-2">
            {currentTerms.map((term) => (
              <span
                key={term}
                className="rounded-full border border-teal-800 px-3 py-1 text-xs text-teal-300"
                style={{ animation: "fade-in 0.2s ease forwards" }}
              >
                {term}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <p className="border-t pt-4 text-xs text-muted-foreground">
        This information is for educational purposes only and is not medical
        advice. Always consult a healthcare professional.
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LearnFree() {
  const [drugA, setDrugA] = useState("");
  const [drugB, setDrugB] = useState("");
  const [methodA, setMethodA] = useState<ApplicationMethod>("Oral (swallowed)");
  const [methodB, setMethodB] = useState<ApplicationMethod>("Oral (swallowed)");
  const [amountA, setAmountA] = useState("");
  const [amountB, setAmountB] = useState("");
  const [unitA, setUnitA] = useState<Unit>("mg");
  const [unitB, setUnitB] = useState<Unit>("mg");
  const [treatmentContext, setTreatmentContext] = useState("");
  const [notes, setNotes] = useState("");

  const [phase, setPhase] = useState<Phase>("idle");
  const [apiResult, setApiResult] = useState<ApiResult | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const animDoneRef = useRef(false);
  const apiResultRef = useRef<ApiResult | null>(null);
  const apiErrorRef = useRef<string | null>(null);
  const apiValidationErrorRef = useRef<string | null>(null);

  function handleNewCheck() {
    setDrugA("");
    setDrugB("");
    setMethodA("Oral (swallowed)");
    setMethodB("Oral (swallowed)");
    setAmountA("");
    setAmountB("");
    setUnitA("mg");
    setUnitB("mg");
    setTreatmentContext("");
    setNotes("");
    setApiResult(null);
    setApiError(null);
    setValidationError(null);
    setPhase("idle");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleSubmit() {
    const trimA = drugA.trim();
    const trimB = drugB.trim();
    if (!trimA || !trimB) {
      setValidationError("Please enter both Drug A and Drug B before checking.");
      return;
    }
    if (trimA.length < 2) {
      setValidationError(`Drug name '${trimA}' doesn't look right. Please enter a valid medication, OTC product, or substance name (e.g. ibuprofen, NyQuil, alcohol).`);
      return;
    }
    if (trimB.length < 2) {
      setValidationError(`Drug name '${trimB}' doesn't look right. Please enter a valid medication, OTC product, or substance name (e.g. ibuprofen, NyQuil, alcohol).`);
      return;
    }
    setValidationError(null);

    if (isPremium(drugA, methodA) || isPremium(drugB, methodB)) {
      setPhase("premium");
      return;
    }

    setPhase("animating");
    setApiResult(null);
    setApiError(null);
    animDoneRef.current = false;
    apiResultRef.current = null;
    apiErrorRef.current = null;
    apiValidationErrorRef.current = null;

    fetch("/api/learn-interaction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        drug1: drugA,
        method1: methodA,
        amount1: amountA,
        unit1: unitA,
        drug2: drugB,
        method2: methodB,
        amount2: amountB,
        unit2: unitB,
        treatment_context: treatmentContext,
        notes,
      }),
    })
      .then(async (r) => {
        if (!r.ok) {
          const errData = await r.json().catch(() => ({})) as { error?: string; message?: string };
          const err = new Error(errData.message ?? "Failed to analyze the interaction. Please try again.");
          if (errData.error === "unrecognized_drug") {
            (err as Error & { isValidation?: boolean }).isValidation = true;
          }
          throw err;
        }
        return r.json() as Promise<ApiResult>;
      })
      .then((data) => {
        apiResultRef.current = data;
        if (animDoneRef.current) {
          setApiResult(data);
          setPhase("results");
        }
      })
      .catch((err: unknown) => {
        if (err instanceof Error && (err as Error & { isValidation?: boolean }).isValidation) {
          apiValidationErrorRef.current = err.message;
          if (animDoneRef.current) {
            setValidationError(err.message);
            setPhase("idle");
          }
        } else {
          apiErrorRef.current = "Failed to analyze the interaction. Please try again.";
          if (animDoneRef.current) {
            setApiError(apiErrorRef.current);
            setPhase("error");
          }
        }
      });
  }

  const handleAnimationComplete = useCallback(() => {
    animDoneRef.current = true;
    if (apiResultRef.current) {
      setApiResult(apiResultRef.current);
      setPhase("results");
    } else if (apiValidationErrorRef.current) {
      setValidationError(apiValidationErrorRef.current);
      setPhase("idle");
    } else if (apiErrorRef.current) {
      setApiError(apiErrorRef.current);
      setPhase("error");
    } else {
      setPhase("loading");
    }
  }, []);

  return (
    <main className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-[700px] flex-col gap-8 px-6 py-12">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <span className="w-fit rounded-full border border-teal-800 bg-teal-950/40 px-3 py-1 text-xs font-medium text-teal-300">
          🎓 Education Mode
        </span>
        <h1 className="text-3xl font-bold tracking-tight">
          Learn Drug Interactions
        </h1>
        <p className="text-muted-foreground">
          Understand the biology behind how substances interact in your body
        </p>
      </div>

      {/* Drug inputs */}
      <div className="grid grid-cols-2 gap-6">
        <DrugInputGroup
          label="Drug A"
          placeholder="e.g. fluoxetine"
          value={drugA}
          onChange={(v) => { setDrugA(v); if (validationError) setValidationError(null); }}
          method={methodA}
          onMethodChange={setMethodA}
          amount={amountA}
          onAmountChange={setAmountA}
          unit={unitA}
          onUnitChange={setUnitA}
        />
        <DrugInputGroup
          label="Drug B"
          placeholder="e.g. dextromethorphan"
          value={drugB}
          onChange={(v) => { setDrugB(v); if (validationError) setValidationError(null); }}
          method={methodB}
          onMethodChange={setMethodB}
          amount={amountB}
          onAmountChange={setAmountB}
          unit={unitB}
          onUnitChange={setUnitB}
        />
      </div>

      {/* Notice */}
      <p className="text-xs text-muted-foreground">
        Note: At least one of the substances above must be a prescription or OTC
        medication. If you are checking a medication against two other OTCs,
        please upgrade to Premium.
      </p>

      {/* Optional context */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <hr className="flex-1 border-border" />
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Optional Context
          </span>
          <hr className="flex-1 border-border" />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="treatment-context">
            What are you trying to treat? (optional)
          </Label>
          <p className="text-xs text-muted-foreground">
            This helps us give you more relevant information
          </p>
        </div>
        <Input
          id="treatment-context"
          value={treatmentContext}
          onChange={(e) => setTreatmentContext(e.target.value)}
          placeholder="e.g. anxiety, chronic pain, allergies, high blood pressure"
        />

        <div className="flex flex-col gap-1">
          <Label htmlFor="notes">Notes</Label>
          <p className="text-xs text-muted-foreground">
            Add any timing or scheduling details that might be relevant
          </p>
        </div>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. I take Drug A in the morning and Drug B at night, about 8 hours apart"
          rows={3}
          className="min-h-[80px] w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground shadow-xs outline-none focus:border-ring dark:bg-input/30 placeholder:text-muted-foreground"
        />
      </div>

      {/* Validation error */}
      {validationError && (
        <div className="rounded-xl border border-red-800 bg-red-950/40 p-4 text-sm text-red-300">
          {validationError}
        </div>
      )}

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        disabled={phase === "animating" || phase === "loading"}
        className="w-full bg-teal-700 text-white hover:bg-teal-600 disabled:opacity-50"
        size="lg"
      >
        Analyze Interaction →
      </Button>

      {/* Molecule animation */}
      {phase === "animating" && (
        <MoleculeAnimation onComplete={handleAnimationComplete} />
      )}

      {/* Loading */}
      {phase === "loading" && (
        <div className="flex flex-col items-center gap-3 py-8 text-muted-foreground">
          <div className="size-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <p className="text-sm">Analyzing interaction…</p>
        </div>
      )}

      {/* Premium upgrade wall */}
      {phase === "premium" && (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-purple-800 bg-gradient-to-b from-purple-950/60 to-violet-950/40 p-8 text-center shadow-sm">
          <span
            className="text-5xl"
            aria-hidden="true"
            style={{
              display: "inline-block",
              animation: "spin-slow 3s linear infinite",
            }}
          >
            👑
          </span>
          <h2 className="text-xl font-bold text-purple-200">Premium Feature</h2>
          <p className="max-w-sm text-sm leading-relaxed text-purple-300/80">
            Interactions involving supplements, vitamins, or cosmetic products
            require a premium subscription. Upgrade to unlock full analysis
            including supplement interactions, skincare compatibility, and
            personalized recommendations.
          </p>
          <Button
            className="bg-purple-700 text-white hover:bg-purple-600"
            size="lg"
          >
            Upgrade to Premium →
          </Button>
          <p className="text-xs text-muted-foreground">
            Free tier includes prescription and OTC drug interactions only.
          </p>
        </div>
      )}

      {/* Error */}
      {phase === "error" && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {apiError ?? "Something went wrong. Please try again."}
        </div>
      )}

      {/* Results */}
      {phase === "results" && apiResult && <Results result={apiResult} />}

      {/* Premium upsell */}
      {phase === "results" && apiResult && (
        <div className="rounded-xl bg-gradient-to-r from-yellow-700 to-amber-600 p-[1px]">
          <div className="flex flex-col gap-4 rounded-[11px] bg-background p-6">
            <div className="flex items-start gap-3">
              <span className="text-2xl leading-none">👑</span>
              <div className="flex flex-col gap-1">
                <p className="font-semibold">Want more from ToxiClear AI?</p>
              </div>
            </div>
            <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
              <li>🔬 Interactive pathway diagrams</li>
              <li>📚 Curriculum-aligned explanations for AP Bio and Pre-Med</li>
              <li>💊 Supplement and cosmetic interactions</li>
              <li>🏥 Personalized analysis using your health profile</li>
            </ul>
            <Button
              asChild
              className="w-fit bg-yellow-700 text-white hover:bg-yellow-600"
              size="lg"
            >
              <Link href="/signup">Get Premium →</Link>
            </Button>
            <p className="text-xs text-muted-foreground">
              Upgrade anytime. Cancel anytime.
            </p>
          </div>
        </div>
      )}

      {/* Start New Analysis */}
      {phase === "results" && apiResult && (
        <Button
          type="button"
          onClick={handleNewCheck}
          variant="outline"
          size="lg"
          className="mt-4 w-full border-teal-700 text-teal-300 hover:bg-teal-950/40 hover:text-teal-200"
        >
          Start New Analysis
        </Button>
      )}
    </main>
  );
}
