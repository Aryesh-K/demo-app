"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { DrugAutocomplete } from "~/components/drug-autocomplete";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { isPrescriptionDrug } from "~/lib/prescribed-detection";
import { createClient } from "~/lib/supabase/client";
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
type Phase = "idle" | "animating" | "results" | "error" | "premium";

// ─── API types ────────────────────────────────────────────────────────────────

interface ApiResult {
  risk_level: Risk;
  interaction_type: "safety" | "efficacy" | "both";
  mechanism: string;
  simple_explanation: string;
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

const SELECT_CLS =
  "h-9 w-full cursor-pointer rounded-md border border-input bg-transparent px-2 py-1 text-sm text-foreground shadow-xs outline-none focus:border-ring dark:bg-input/30";

// ─── Molecule animation ───────────────────────────────────────────────────────

function MoleculeAnimation({ fading }: { fading: boolean }) {
  const [animPhase, setAnimPhase] = useState(0);
  const stateRef = useRef({
    cancelled: false,
    timers: [] as ReturnType<typeof setTimeout>[],
  });

  useEffect(() => {
    const s = stateRef.current;
    s.cancelled = false;

    function runCycle() {
      if (s.cancelled) return;
      s.timers.forEach(clearTimeout);
      s.timers = [];
      setAnimPhase(0);
      s.timers.push(
        setTimeout(() => {
          if (!s.cancelled) setAnimPhase(1);
        }, 50),
        setTimeout(() => {
          if (!s.cancelled) setAnimPhase(2);
        }, 600),
        setTimeout(() => {
          if (!s.cancelled) setAnimPhase(3);
        }, 850),
        setTimeout(() => runCycle(), 2200),
      );
    }

    runCycle();
    return () => {
      s.cancelled = true;
      s.timers.forEach(clearTimeout);
    };
  }, []);

  const sliding = animPhase >= 1;
  const bonded = animPhase >= 2;
  const pulsing = animPhase >= 3;

  return (
    <div
      className="flex flex-col items-center gap-4 py-8"
      style={{ opacity: fading ? 0 : 1, transition: "opacity 0.3s ease" }}
    >
      <div className="flex items-center justify-center gap-5">
        <div
          className="size-11 rounded-full bg-blue-600/75"
          style={{
            opacity: sliding ? 1 : 0,
            transform: sliding ? "translateX(0)" : "translateX(-52px)",
            transition:
              "opacity 0.5s ease-out, transform 0.5s ease-out, box-shadow 0.3s ease",
            boxShadow: pulsing ? "0 0 28px 10px rgba(37,99,235,0.4)" : "none",
          }}
        />
        <div
          className="h-[3px] rounded-full bg-blue-400"
          style={{
            width: "2.25rem",
            opacity: bonded ? 1 : 0,
            transition: "opacity 0.25s ease",
          }}
        />
        <div
          className="size-11 rounded-full bg-green-500/75"
          style={{
            opacity: sliding ? 1 : 0,
            transform: sliding ? "translateX(0)" : "translateX(52px)",
            transition:
              "opacity 0.5s ease-out, transform 0.5s ease-out, box-shadow 0.3s ease",
            boxShadow: pulsing ? "0 0 28px 10px rgba(34,197,94,0.4)" : "none",
          }}
        />
      </div>
      <p className="animate-pulse text-sm text-muted-foreground">
        Analyzing interaction…
      </p>
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
  mode: "free" | "premium" | "premium-learn";
  recentSearches: string[];
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
  mode,
  recentSearches,
}: DrugGroupProps) {
  const uid = useId();
  const drugId = `${uid}-drug`;
  const methodId = `${uid}-method`;

  return (
    <div className="flex flex-col gap-3">
      {/* Drug name */}
      <div className="flex flex-col gap-1">
        <Label htmlFor={drugId}>{label}</Label>
        <p className="text-xs text-muted-foreground">
          Enter brand name (e.g. Tylenol) or generic name (e.g. acetaminophen)
        </p>
      </div>
      <DrugAutocomplete
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        mode={mode}
        recentSearches={recentSearches}
      />

      {/* Application method */}
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

      {/* Amount + units */}
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

interface ResultsProps {
  result: ApiResult;
  drugA: string;
  drugB: string;
  amountA: string;
  amountB: string;
  unitA: Unit;
  unitB: Unit;
}

function Results({
  result,
  drugA,
  drugB,
  amountA,
  amountB,
  unitA,
  unitB,
}: ResultsProps) {
  const cfg = RISK_CONFIG[result.risk_level];
  const nameA = drugA.trim() || "Drug A";
  const nameB = drugB.trim() || "Drug B";
  const hasAmounts = Boolean(amountA || amountB);
  const degradationKeywords = [
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

  const mentionsDegradation = degradationKeywords.some(
    (keyword) =>
      result.simple_explanation.toLowerCase().includes(keyword) ||
      result.mechanism.toLowerCase().includes(keyword),
  );

  const showIneffective =
    (result.interaction_type === "efficacy" || mentionsDegradation) &&
    result.risk_level === "low";

  return (
    <div className="flex flex-col gap-5 rounded-xl border bg-card p-6 shadow-sm">
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

      {/* What's happening */}
      <div className="flex flex-col gap-2">
        <h2 className="font-semibold">What&apos;s happening</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {result.simple_explanation}
        </p>
      </div>

      {/* Mechanism */}
      {result.mechanism && (
        <div className="flex flex-col gap-2 rounded-md bg-muted px-4 py-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Mechanism
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {result.mechanism}
          </p>
        </div>
      )}

      {/* Amounts note */}
      {hasAmounts && (
        <p className="rounded-md bg-muted px-4 py-3 text-sm text-muted-foreground">
          Based on the amounts you entered:{" "}
          <span className="font-medium text-foreground">
            {amountA ? `${amountA} ${unitA} of ${nameA}` : nameA}
          </span>{" "}
          and{" "}
          <span className="font-medium text-foreground">
            {amountB ? `${amountB} ${unitB} of ${nameB}` : nameB}
          </span>
        </p>
      )}

      {/* Disclaimer */}
      <p className="border-t pt-4 text-xs text-muted-foreground">
        This information is for educational purposes only and is not medical
        advice. Always consult a healthcare professional.
      </p>
    </div>
  );
}

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

// ─── Page ─────────────────────────────────────────────────────────────────────

function isLikelyValidDrug(name: string): boolean {
  const t = name.trim();
  return t.length >= 2 && /[a-zA-Z]/.test(t);
}

export default function CheckFree() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push(
          "/signup?message=Please create a free account to access this feature.",
        );
      } else {
        setAuthChecked(true);
      }
    });
  }, [router]);

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
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const resultsRef = useRef<HTMLDivElement>(null);

  const [phase, setPhase] = useState<Phase>("idle");
  const [apiResult, setApiResult] = useState<ApiResult | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [premiumReason, setPremiumReason] = useState<
    "prescription" | "supplement" | null
  >(null);
  const [animFading, setAnimFading] = useState(false);

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
    setPremiumReason(null);
    setPhase("idle");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleSubmit() {
    const trimA = drugA.trim();
    const trimB = drugB.trim();
    if (!trimA || !trimB) {
      setValidationError(
        "Please enter both Drug A and Drug B before checking.",
      );
      return;
    }
    const invalidDrugs = [trimA, trimB].filter(
      (name) => !isLikelyValidDrug(name),
    );
    if (invalidDrugs.length > 0) {
      setValidationError(
        `The following don't look like recognized substances: "${invalidDrugs.join('", "')}". Please check your spelling or select from the suggestions list.`,
      );
      return;
    }
    setValidationError(null);

    if (isPrescriptionDrug(trimA) || isPrescriptionDrug(trimB)) {
      setPremiumReason("prescription");
      setPhase("premium");
      return;
    }
    if (isPremium(drugA, methodA) || isPremium(drugB, methodB)) {
      setPremiumReason("supplement");
      setPhase("premium");
      return;
    }

    setPhase("animating");
    setAnimFading(false);
    setApiResult(null);
    setApiError(null);
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);

    fetch("/api/check-interaction", {
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
          const errData = (await r.json().catch(() => ({}))) as {
            error?: string;
            message?: string;
          };
          const err = new Error(
            errData.message ??
              "Failed to analyze the interaction. Please try again.",
          );
          if (errData.error === "unrecognized_drug") {
            (err as Error & { isValidation?: boolean }).isValidation = true;
          }
          throw err;
        }
        const data = (await r.json()) as ApiResult & {
          error?: string;
          unrecognized_drugs?: string[];
        };
        if (data.error === "unrecognized") {
          const names =
            data.unrecognized_drugs?.join('", "') ?? "the entered substance";
          const err = new Error(
            `We couldn't recognize "${names}" as a known substance. Please check your spelling or choose from the suggestions list.`,
          );
          (err as Error & { isValidation?: boolean }).isValidation = true;
          throw err;
        }
        return data as ApiResult;
      })
      .then((data) => {
        setRecentSearches((prev) =>
          [drugA, drugB, ...prev.filter((s) => s !== drugA && s !== drugB)].slice(0, 5),
        );
        setAnimFading(true);
        setTimeout(() => {
          setAnimFading(false);
          setApiResult(data);
          setPhase("results");
        }, 300);
      })
      .catch((err: unknown) => {
        const isValidation =
          err instanceof Error &&
          (err as Error & { isValidation?: boolean }).isValidation;
        setAnimFading(true);
        setTimeout(() => {
          setAnimFading(false);
          if (isValidation && err instanceof Error) {
            setValidationError(err.message);
            setPhase("idle");
          } else {
            setApiError(
              err instanceof Error && err.message
                ? err.message
                : "Failed to analyze the interaction. Please try again.",
            );
            setPhase("error");
          }
        }, 300);
      });
  }

  if (!authChecked)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-slate-400">Loading...</p>
      </div>
    );

  return (
    <main className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-[700px] flex-col gap-8 px-6 py-12">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Check Drug Interactions
        </h1>
        <p className="text-muted-foreground">
          Enter two drugs, OTC medications, or alcohol to check for
          interactions. Supplements and cosmetic products require Premium.
        </p>
      </div>

      {/* Free tier info banner */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-800/50 bg-amber-950/20 px-4 py-3">
        <span
          className="mt-0.5 shrink-0 text-sm text-amber-400"
          aria-hidden="true"
        >
          ℹ
        </span>
        <p className="text-sm text-amber-300/80">
          Free tier supports OTC medications and alcohol only. Prescription
          medications require Premium.
        </p>
      </div>

      {/* Drug inputs */}
      <div className="grid grid-cols-2 gap-6">
        <DrugInputGroup
          label="Drug A"
          placeholder="e.g. ibuprofen"
          value={drugA}
          onChange={(v) => {
            setDrugA(v);
            if (validationError) setValidationError(null);
            if (isPrescriptionDrug(v.trim())) {
              setPremiumReason("prescription");
              setPhase("premium");
            }
          }}
          method={methodA}
          onMethodChange={setMethodA}
          amount={amountA}
          onAmountChange={setAmountA}
          unit={unitA}
          onUnitChange={setUnitA}
          mode="free"
          recentSearches={recentSearches}
        />
        <DrugInputGroup
          label="Drug B"
          placeholder="e.g. alcohol"
          value={drugB}
          onChange={(v) => {
            setDrugB(v);
            if (validationError) setValidationError(null);
            if (isPrescriptionDrug(v.trim())) {
              setPremiumReason("prescription");
              setPhase("premium");
            }
          }}
          method={methodB}
          onMethodChange={setMethodB}
          amount={amountB}
          onAmountChange={setAmountB}
          unit={unitB}
          onUnitChange={setUnitB}
          mode="free"
          recentSearches={recentSearches}
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
        disabled={phase === "animating"}
        className="w-full bg-blue-900 text-white hover:bg-blue-800 disabled:opacity-50"
        size="lg"
      >
        Check Interaction →
      </Button>

      <div ref={resultsRef}>
      {/* Molecule animation — loops until API responds */}
      {phase === "animating" && <MoleculeAnimation fading={animFading} />}

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
          {premiumReason === "prescription" ? (
            <p className="max-w-sm text-sm leading-relaxed text-purple-300/80">
              Prescription medications require a Premium subscription. Upgrade
              to access full pharmacokinetic analysis, CYP450 enzyme
              interactions, drug classification details, and personalized health
              context.
            </p>
          ) : (
            <p className="max-w-sm text-sm leading-relaxed text-purple-300/80">
              Interactions involving supplements, vitamins, or cosmetic products
              require a premium subscription. Upgrade to unlock full analysis
              including supplement interactions, skincare compatibility, and
              personalized recommendations.
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            Sign up or log in using the button in the top right to unlock
            premium features.
          </p>
          <p className="text-xs text-muted-foreground">
            Free tier supports OTC medications and alcohol only.
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
      {phase === "results" && apiResult && (
        <>
          <Results
            result={apiResult}
            drugA={drugA}
            drugB={drugB}
            amountA={amountA}
            amountB={amountB}
            unitA={unitA}
            unitB={unitB}
          />
          <Button
            type="button"
            onClick={handleNewCheck}
            variant="outline"
            size="lg"
            className="mt-4 w-full border-blue-700 text-blue-300 hover:bg-blue-950/40 hover:text-blue-200"
          >
            Start New Check
          </Button>
        </>
      )}
      </div>
    </main>
  );
}
