"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { cn } from "~/lib/utils";

// ─── Constants ───────────────────────────────────────────────────────────────

const UNITS = ["mg", "mcg", "g", "mL", "tablets", "capsules"] as const;
type Unit = (typeof UNITS)[number];
type Risk = "high" | "moderate" | "low";

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_RESULT: { risk: Risk; explanation: string } = {
  risk: "high",
  explanation:
    "Fluoxetine is an antidepressant that raises serotonin levels in your brain. " +
    "Dextromethorphan (DXM) — found in many over-the-counter cough medicines — also " +
    "affects serotonin. Taking them together can trigger serotonin syndrome: a dangerous " +
    "build-up of serotonin that causes agitation, confusion, a racing heartbeat, high blood " +
    "pressure, and muscle stiffness. In serious cases it can cause seizures. This combination " +
    "should be avoided. If you need both medications, speak with your doctor right away.",
};

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

// ─── Molecule animation ───────────────────────────────────────────────────────

function MoleculeAnimation({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState(0);
  // phase 0 = initial (hidden), 1 = sliding in, 2 = bond visible, 3 = pulsing

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 30), // next frame → start slide
      setTimeout(() => setPhase(2), 650), // bond line appears
      setTimeout(() => setPhase(3), 900), // glow pulse
      setTimeout(onComplete, 1500), // done
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  const sliding = phase >= 1;
  const bonded = phase >= 2;
  const pulsing = phase >= 3;

  return (
    <div className="flex items-center justify-center gap-5 py-8">
      {/* Blue molecule */}
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
      {/* Bond line */}
      <div
        className="h-[3px] rounded-full bg-blue-400"
        style={{
          width: "2.25rem",
          opacity: bonded ? 1 : 0,
          transition: "opacity 0.25s ease",
        }}
      />
      {/* Green molecule */}
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
  amount,
  onAmountChange,
  unit,
  onUnitChange,
}: DrugGroupProps) {
  const uid = useId();
  const drugId = `${uid}-drug`;

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
  drugA: string;
  drugB: string;
  amountA: string;
  amountB: string;
  unitA: Unit;
  unitB: Unit;
}

function Results({
  drugA,
  drugB,
  amountA,
  amountB,
  unitA,
  unitB,
}: ResultsProps) {
  const { risk, explanation } = MOCK_RESULT;
  const cfg = RISK_CONFIG[risk];
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
          {explanation}
        </p>
      </div>

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

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function CheckFree() {
  const [drugA, setDrugA] = useState("");
  const [drugB, setDrugB] = useState("");
  const [amountA, setAmountA] = useState("");
  const [amountB, setAmountB] = useState("");
  const [unitA, setUnitA] = useState<Unit>("mg");
  const [unitB, setUnitB] = useState<Unit>("mg");
  const [phase, setPhase] = useState<"idle" | "animating" | "results">("idle");

  const handleAnimationComplete = useCallback(() => setPhase("results"), []);

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
          amount={amountB}
          onAmountChange={setAmountB}
          unit={unitB}
          onUnitChange={setUnitB}
        />
      </div>

      {/* Submit */}
      <Button
        onClick={() => setPhase("animating")}
        disabled={phase === "animating"}
        className="w-full bg-blue-900 text-white hover:bg-blue-800 disabled:opacity-50"
        size="lg"
      >
        Check Interaction →
      </Button>

      {/* Molecule animation */}
      {phase === "animating" && (
        <MoleculeAnimation onComplete={handleAnimationComplete} />
      )}

      {/* Results */}
      {phase === "results" && (
        <Results
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
