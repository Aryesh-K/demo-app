"use client";

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
  "Topical (applied to skin)",
  "Inhaled",
  "Injected",
  "Eye/Ear drops",
  "Other",
] as const;
type ApplicationMethod = (typeof APPLICATION_METHODS)[number];

type Risk = "high" | "moderate" | "low";
type Phase = "idle" | "animating" | "loading" | "results" | "error";

// ─── API types ────────────────────────────────────────────────────────────────

interface ApiResult {
  risk_level: Risk;
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
    bg: "bg-red-100 dark:bg-red-950/40",
    border: "border-red-300 dark:border-red-800",
    text: "text-red-700 dark:text-red-300",
    label: "HIGH RISK",
    emoji: "⚠️",
  },
  moderate: {
    bg: "bg-amber-100 dark:bg-amber-950/40",
    border: "border-amber-300 dark:border-amber-800",
    text: "text-amber-700 dark:text-amber-300",
    label: "MODERATE RISK",
    emoji: "⚡",
  },
  low: {
    bg: "bg-green-100 dark:bg-green-950/40",
    border: "border-green-300 dark:border-green-800",
    text: "text-green-700 dark:text-green-300",
    label: "LOW RISK",
    emoji: "✅",
  },
};

const SELECT_CLS =
  "h-9 w-full cursor-pointer rounded-md border border-input bg-transparent px-2 py-1 text-sm text-foreground shadow-xs outline-none focus:border-ring dark:bg-input/30";

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
      {/* Drug name */}
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

  return (
    <div className="flex flex-col gap-5 rounded-xl border bg-card p-6 shadow-sm">
      {/* Risk badge */}
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CheckFree() {
  const [drugA, setDrugA] = useState("");
  const [drugB, setDrugB] = useState("");
  const [methodA, setMethodA] = useState<ApplicationMethod>("Oral (swallowed)");
  const [methodB, setMethodB] = useState<ApplicationMethod>("Oral (swallowed)");
  const [amountA, setAmountA] = useState("");
  const [amountB, setAmountB] = useState("");
  const [unitA, setUnitA] = useState<Unit>("mg");
  const [unitB, setUnitB] = useState<Unit>("mg");
  const [treatmentContext, setTreatmentContext] = useState("");

  const [phase, setPhase] = useState<Phase>("idle");
  const [apiResult, setApiResult] = useState<ApiResult | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Refs to coordinate animation completion with async API response
  const animDoneRef = useRef(false);
  const apiResultRef = useRef<ApiResult | null>(null);
  const apiErrorRef = useRef<string | null>(null);

  function handleSubmit() {
    setPhase("animating");
    setApiResult(null);
    setApiError(null);
    animDoneRef.current = false;
    apiResultRef.current = null;
    apiErrorRef.current = null;

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
      }),
    })
      .then((r) => {
        if (!r.ok) throw new Error("API error");
        return r.json() as Promise<ApiResult>;
      })
      .then((data) => {
        apiResultRef.current = data;
        if (animDoneRef.current) {
          setApiResult(data);
          setPhase("results");
        }
      })
      .catch(() => {
        apiErrorRef.current =
          "Failed to analyze the interaction. Please try again.";
        if (animDoneRef.current) {
          setApiError(apiErrorRef.current);
          setPhase("error");
        }
      });
  }

  const handleAnimationComplete = useCallback(() => {
    animDoneRef.current = true;
    if (apiResultRef.current) {
      setApiResult(apiResultRef.current);
      setPhase("results");
    } else if (apiErrorRef.current) {
      setApiError(apiErrorRef.current);
      setPhase("error");
    } else {
      // API still in-flight — show loading until it resolves
      setPhase("loading");
    }
  }, []);

  return (
    <main className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-[700px] flex-col gap-8 px-6 py-12">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Check Drug Interactions
        </h1>
        <p className="text-muted-foreground">
          Enter two substances to check for interactions
        </p>
      </div>

      {/* Drug inputs */}
      <div className="grid grid-cols-2 gap-6">
        <DrugInputGroup
          label="Drug A"
          placeholder="e.g. fluoxetine"
          value={drugA}
          onChange={setDrugA}
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
          onChange={setDrugB}
          method={methodB}
          onMethodChange={setMethodB}
          amount={amountB}
          onAmountChange={setAmountB}
          unit={unitB}
          onUnitChange={setUnitB}
        />
      </div>

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
      </div>

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        disabled={phase === "animating" || phase === "loading"}
        className="w-full bg-blue-900 text-white hover:bg-blue-800 disabled:opacity-50"
        size="lg"
      >
        Check Interaction →
      </Button>

      {/* Molecule animation */}
      {phase === "animating" && (
        <MoleculeAnimation onComplete={handleAnimationComplete} />
      )}

      {/* Loading — animation done but API still in-flight */}
      {phase === "loading" && (
        <div className="flex flex-col items-center gap-3 py-8 text-muted-foreground">
          <div className="size-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <p className="text-sm">Analyzing interaction…</p>
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
        <Results
          result={apiResult}
          drugA={drugA}
          drugB={drugB}
          amountA={amountA}
          amountB={amountB}
          unitA={unitA}
          unitB={unitB}
        />
      )}
    </main>
  );
}
