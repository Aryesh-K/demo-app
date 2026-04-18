"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { isPrescriptionDrug } from "~/lib/prescribed-detection";
import { cn } from "~/lib/utils";

// ─── Constants ───────────────────────────────────────────────────────────────

const UNITS = ["mg", "mcg", "g", "mL", "tablets", "capsules"] as const;
type Unit = (typeof UNITS)[number];

const APPLICATION_METHODS = [
  "Oral (swallowed)",
  "Medicated topical (prescription or OTC drug)",
  "Cosmetic/skincare (serum, moisturizer, non-medicated)",
  "Supplement/vitamin/herbal",
  "Inhaled",
  "Injected",
  "Eye/Ear drops",
  "Other",
] as const;
type ApplicationMethod = (typeof APPLICATION_METHODS)[number];

type Risk = "high" | "moderate" | "low";
type Phase = "idle" | "animating" | "results" | "error";

const SELECT_CLS =
  "h-9 w-full cursor-pointer rounded-md border border-input bg-transparent px-2 py-1 text-sm text-foreground shadow-xs outline-none focus:border-ring dark:bg-input/30";

const TEXTAREA_CLS =
  "min-h-[80px] w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground shadow-xs outline-none focus:border-ring dark:bg-input/30 placeholder:text-muted-foreground";

// ─── Drug entry type ──────────────────────────────────────────────────────────

interface DrugEntry {
  id: string;
  name: string;
  method: ApplicationMethod;
  amount: string;
  unit: Unit;
}

// ─── Health profile types ─────────────────────────────────────────────────────

type HealthFieldKey = "age" | "conditions" | "medications" | "allergies";

interface HealthField {
  value: string;
  included: boolean;
}

type HealthProfile = Record<HealthFieldKey, HealthField>;

const INITIAL_HEALTH_PROFILE: HealthProfile = {
  age: { value: "", included: true },
  conditions: { value: "", included: true },
  medications: { value: "", included: true },
  allergies: { value: "", included: true },
};

// ─── API types ────────────────────────────────────────────────────────────────

interface Combination {
  drug_a: string;
  drug_b: string;
  risk_level: Risk;
  interaction_type: "safety" | "efficacy" | "both";
  classification: string;
  simple_explanation: string;
  real_world_context: string;
}

interface ApiResult {
  overall_risk: Risk;
  combinations: Combination[];
  overall_summary: string;
  recommendation: string;
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

// ─── Recommendation config ────────────────────────────────────────────────────

type RecConfig = { bg: string; border: string; text: string; emoji: string };

const RECOMMENDATION_CONFIG: Record<string, RecConfig> = {
  "Avoid this combination": {
    bg: "bg-red-950/40",
    border: "border-red-800",
    text: "text-red-300",
    emoji: "🚫",
  },
  "Consult your doctor": {
    bg: "bg-amber-950/40",
    border: "border-amber-800",
    text: "text-amber-300",
    emoji: "👨‍⚕️",
  },
  "Use with caution": {
    bg: "bg-yellow-950/40",
    border: "border-yellow-800",
    text: "text-yellow-300",
    emoji: "⚠️",
  },
  "Generally safe": {
    bg: "bg-green-950/40",
    border: "border-green-800",
    text: "text-green-300",
    emoji: "✅",
  },
};

// ─── Classification emojis ────────────────────────────────────────────────────

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

// ─── Degradation keywords ─────────────────────────────────────────────────────

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

function isCombinationIneffective(combo: Combination): boolean {
  const text =
    `${combo.simple_explanation} ${combo.real_world_context}`.toLowerCase();
  return (
    (combo.interaction_type === "efficacy" ||
      DEGRADATION_KEYWORDS.some((kw) => text.includes(kw))) &&
    combo.risk_level === "low"
  );
}

// ─── Risk sort order ──────────────────────────────────────────────────────────

const RISK_ORDER: Record<Risk, number> = { high: 0, moderate: 1, low: 2 };

// ─── Build health context ─────────────────────────────────────────────────────

function buildHealthContext(profile: HealthProfile): string {
  const parts: string[] = [];
  if (profile.age.included && profile.age.value.trim())
    parts.push(`Age: ${profile.age.value.trim()}`);
  if (profile.conditions.included && profile.conditions.value.trim())
    parts.push(`Conditions: ${profile.conditions.value.trim()}`);
  if (profile.medications.included && profile.medications.value.trim())
    parts.push(`Current medications: ${profile.medications.value.trim()}`);
  if (profile.allergies.included && profile.allergies.value.trim())
    parts.push(`Allergies: ${profile.allergies.value.trim()}`);
  return parts.join(", ");
}

// ─── Molecule animation ───────────────────────────────────────────────────────

function MoleculeAnimation({ fading }: { fading: boolean }) {
  const [animPhase, setAnimPhase] = useState(0);
  const stateRef = useRef({ cancelled: false, timers: [] as ReturnType<typeof setTimeout>[] });

  useEffect(() => {
    const s = stateRef.current;
    s.cancelled = false;

    function runCycle() {
      if (s.cancelled) return;
      s.timers.forEach(clearTimeout);
      s.timers = [];
      setAnimPhase(0);
      s.timers.push(
        setTimeout(() => { if (!s.cancelled) setAnimPhase(1); }, 50),
        setTimeout(() => { if (!s.cancelled) setAnimPhase(2); }, 600),
        setTimeout(() => { if (!s.cancelled) setAnimPhase(3); }, 850),
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
          className="size-11 rounded-full bg-yellow-600/75"
          style={{
            opacity: sliding ? 1 : 0,
            transform: sliding ? "translateX(0)" : "translateX(-52px)",
            transition: "opacity 0.5s ease-out, transform 0.5s ease-out, box-shadow 0.3s ease",
            boxShadow: pulsing ? "0 0 28px 10px rgba(202,138,4,0.4)" : "none",
          }}
        />
        <div
          className="h-[3px] rounded-full bg-yellow-400"
          style={{ width: "2.25rem", opacity: bonded ? 1 : 0, transition: "opacity 0.25s ease" }}
        />
        <div
          className="size-11 rounded-full bg-amber-500/75"
          style={{
            opacity: sliding ? 1 : 0,
            transform: sliding ? "translateX(0)" : "translateX(52px)",
            transition: "opacity 0.5s ease-out, transform 0.5s ease-out, box-shadow 0.3s ease",
            boxShadow: pulsing ? "0 0 28px 10px rgba(245,158,11,0.4)" : "none",
          }}
        />
      </div>
      <p className="animate-pulse text-sm text-muted-foreground">
        Analyzing interactions…
      </p>
    </div>
  );
}

// ─── Drug card ────────────────────────────────────────────────────────────────

interface DrugCardProps {
  drug: DrugEntry;
  label: string;
  removable: boolean;
  onNameChange: (v: string) => void;
  onMethodChange: (m: ApplicationMethod) => void;
  onAmountChange: (v: string) => void;
  onUnitChange: (u: Unit) => void;
  onRemove: () => void;
}

function DrugCard({
  drug,
  label,
  removable,
  onNameChange,
  onMethodChange,
  onAmountChange,
  onUnitChange,
  onRemove,
}: DrugCardProps) {
  const uid = useId();
  const drugId = `${uid}-name`;
  const methodId = `${uid}-method`;

  return (
    <div className="relative flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      {/* Card header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">{label}</span>
        {removable && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${label}`}
            className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            ✕
          </button>
        )}
      </div>

      {/* Drug name */}
      <div className="flex flex-col gap-1">
        <Label
          htmlFor={drugId}
          className="text-xs font-normal text-muted-foreground"
        >
          Drug / substance name
        </Label>
        <p className="text-xs text-muted-foreground/60">
          Brand name (e.g. Tylenol) or generic (e.g. acetaminophen)
        </p>
      </div>
      <Input
        id={drugId}
        value={drug.name}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder="e.g. ibuprofen"
      />
      {isPrescriptionDrug(drug.name.trim()) && (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-green-700 bg-green-950/40 px-2.5 py-0.5 text-xs text-green-300">
          ✓ Prescription drug — covered by Premium
        </span>
      )}

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
          value={drug.method}
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

      {/* Amount + unit */}
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <Input
            value={drug.amount}
            onChange={(e) => onAmountChange(e.target.value)}
            placeholder="Amount (optional)"
            inputMode="decimal"
            aria-label={`${label} amount`}
          />
        </div>
        {drug.amount && (
          <select
            value={drug.unit}
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

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors",
        on ? "bg-yellow-600" : "bg-muted",
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
          on ? "translate-x-4" : "translate-x-0",
        )}
      />
    </button>
  );
}

// ─── Health profile panel ─────────────────────────────────────────────────────

const HEALTH_FIELD_DEFS: Array<{
  key: HealthFieldKey;
  label: string;
  placeholder: string;
  type: "input" | "textarea";
  inputMode?: "numeric" | "text";
}> = [
  {
    key: "age",
    label: "Age",
    placeholder: "e.g. 34",
    type: "input",
    inputMode: "numeric",
  },
  {
    key: "conditions",
    label: "Known conditions",
    placeholder: "e.g. Type 2 diabetes, hypertension",
    type: "textarea",
  },
  {
    key: "medications",
    label: "Current medications",
    placeholder: "e.g. metformin 500mg, lisinopril",
    type: "textarea",
  },
  {
    key: "allergies",
    label: "Allergies",
    placeholder: "e.g. penicillin, sulfa drugs",
    type: "input",
  },
];

function HealthProfilePanel({
  profile,
  onChange,
}: {
  profile: HealthProfile;
  onChange: (key: HealthFieldKey, patch: Partial<HealthField>) => void;
}) {
  function sendAll() {
    for (const { key } of HEALTH_FIELD_DEFS) {
      onChange(key, { included: true });
    }
  }
  function clearAll() {
    for (const { key } of HEALTH_FIELD_DEFS) {
      onChange(key, { value: "", included: true });
    }
  }

  return (
    <div className="sticky top-6 flex flex-col gap-4 rounded-xl border border-yellow-800/50 bg-yellow-950/20 p-4">
      {/* Panel header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-yellow-300">
          Health Profile
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={sendAll}
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Include All
          </button>
          <span className="text-xs text-muted-foreground">·</span>
          <button
            type="button"
            onClick={clearAll}
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Clear All
          </button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Optional — toggle fields on to include them in the AI analysis.
      </p>
      <p className="rounded-md border border-green-800/40 bg-green-950/20 px-3 py-2 text-xs text-green-400/80">
        ✓ Prescription medications in your regimen are fully supported by Premium.
      </p>

      {/* Fields */}
      {HEALTH_FIELD_DEFS.map(({ key, label, placeholder, type, inputMode }) => {
        const field = profile[key];
        return (
          <div key={key} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                {label}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">
                  {field.included ? "On" : "Off"}
                </span>
                <Toggle
                  on={field.included}
                  onToggle={() => onChange(key, { included: !field.included })}
                />
              </div>
            </div>
            {type === "textarea" ? (
              <textarea
                value={field.value}
                onChange={(e) => onChange(key, { value: e.target.value })}
                placeholder={placeholder}
                className={TEXTAREA_CLS}
              />
            ) : (
              <Input
                value={field.value}
                onChange={(e) => onChange(key, { value: e.target.value })}
                placeholder={placeholder}
                inputMode={inputMode}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Results ──────────────────────────────────────────────────────────────────

function Results({ result }: { result: ApiResult }) {
  const [showLow, setShowLow] = useState(false);
  const overallCfg = RISK_CONFIG[result.overall_risk];
  const recCfg =
    RECOMMENDATION_CONFIG[result.recommendation] ??
    RECOMMENDATION_CONFIG["Consult your doctor"];

  const sorted = [...result.combinations].sort(
    (a, b) => RISK_ORDER[a.risk_level] - RISK_ORDER[b.risk_level],
  );

  const nonLowCombos = sorted.filter((c) => c.risk_level !== "low");
  const lowCombos = sorted.filter((c) => c.risk_level === "low");
  const allLow = nonLowCombos.length === 0 && lowCombos.length > 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Overall risk banner */}
      <div
        className={cn(
          "flex flex-col gap-3 rounded-xl border p-5",
          overallCfg.bg,
          overallCfg.border,
        )}
      >
        <div className="flex flex-wrap items-center gap-3">
          {/* Overall risk badge */}
          <div className="flex items-center gap-2">
            <span className="text-2xl leading-none" aria-hidden="true">
              {overallCfg.emoji}
            </span>
            <span
              className={cn(
                "text-sm font-bold tracking-widest",
                overallCfg.text,
              )}
            >
              {overallCfg.label}
            </span>
          </div>

          {/* Recommendation badge */}
          <span
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-semibold",
              recCfg.bg,
              recCfg.border,
              recCfg.text,
            )}
          >
            {recCfg.emoji} {result.recommendation}
          </span>
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground">
          {result.overall_summary}
        </p>
      </div>

      {/* Combinations */}
      {sorted.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Interaction Breakdown
            </h2>
            {!allLow && lowCombos.length > 0 && (
              <button
                type="button"
                onClick={() => setShowLow((v) => !v)}
                className="shrink-0 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-muted-foreground hover:text-foreground"
              >
                {showLow
                  ? "Hide low-risk interactions"
                  : `Show low-risk interactions (${lowCombos.length})`}
              </button>
            )}
          </div>

          {sorted.map((combo) => {
            const isLow = combo.risk_level === "low";
            if (!allLow && isLow && !showLow) return null;
            const cfg = RISK_CONFIG[combo.risk_level];
            const ineffective = isCombinationIneffective(combo);
            const classEmoji =
              CLASSIFICATION_EMOJI[combo.classification] ?? "🔍";
            const comboKey = `${combo.drug_a}-${combo.drug_b}`;

            return (
              <div
                key={comboKey}
                className={cn(
                  "flex flex-col gap-3 rounded-xl border bg-card p-5",
                  !allLow && isLow ? "border-border/50 opacity-60" : "border-border",
                )}
                style={!allLow && isLow && showLow ? { animation: "fade-in 0.3s ease forwards" } : undefined}
              >
                {/* Drug pair + risk dot */}
                <div className="flex items-start gap-2">
                  <div
                    className={cn(
                      "mt-1 h-2.5 w-2.5 shrink-0 rounded-full",
                      combo.risk_level === "high"
                        ? "bg-red-400"
                        : combo.risk_level === "moderate"
                          ? "bg-amber-400"
                          : "bg-green-400",
                    )}
                  />
                  <span className="text-sm font-semibold">
                    {combo.drug_a}{" "}
                    <span className="text-muted-foreground">+</span>{" "}
                    {combo.drug_b}
                  </span>
                </div>

                {/* Classification + risk/ineffective badges */}
                <div className="flex flex-wrap gap-2">
                  <span className="flex items-center gap-1.5 rounded-full border border-teal-800 bg-teal-950/40 px-3 py-1 text-xs font-medium text-teal-300">
                    <span aria-hidden="true">{classEmoji}</span>
                    {combo.classification}
                  </span>

                  {ineffective ? (
                    <span className="flex items-center gap-1.5 rounded-full border border-purple-800 bg-purple-950/40 px-3 py-1 text-xs font-bold text-purple-300">
                      🚫 INEFFECTIVE
                    </span>
                  ) : (
                    <span
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-bold",
                        cfg.bg,
                        cfg.border,
                        cfg.text,
                      )}
                    >
                      {cfg.emoji} {cfg.label}
                    </span>
                  )}
                </div>

                {/* Simple explanation */}
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {combo.simple_explanation}
                </p>

                {/* Real world context */}
                {combo.real_world_context && (
                  <div className="rounded-md bg-muted px-4 py-3">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      What this means for you
                    </p>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {combo.real_world_context}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
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

export default function CheckPremium() {
  const [drugs, setDrugs] = useState<DrugEntry[]>([
    {
      id: "drug-1",
      name: "",
      method: "Oral (swallowed)",
      amount: "",
      unit: "mg",
    },
    {
      id: "drug-2",
      name: "",
      method: "Oral (swallowed)",
      amount: "",
      unit: "mg",
    },
  ]);
  const drugCounter = useRef(3);
  const [treatmentContext, setTreatmentContext] = useState("");
  const [notes, setNotes] = useState("");
  const [healthProfile, setHealthProfile] = useState<HealthProfile>(
    INITIAL_HEALTH_PROFILE,
  );

  const [phase, setPhase] = useState<Phase>("idle");
  const [apiResult, setApiResult] = useState<ApiResult | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [animFading, setAnimFading] = useState(false);

  function updateDrug(id: string, patch: Partial<Omit<DrugEntry, "id">>) {
    setDrugs((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  }

  function updateHealthField(key: HealthFieldKey, patch: Partial<HealthField>) {
    setHealthProfile((prev) => ({
      ...prev,
      [key]: { ...prev[key], ...patch },
    }));
  }

  function addDrug() {
    if (drugs.length >= 5) return;
    const newId = `drug-${drugCounter.current++}`;
    setDrugs((prev) => [
      ...prev,
      {
        id: newId,
        name: "",
        method: "Oral (swallowed)",
        amount: "",
        unit: "mg",
      },
    ]);
  }

  function removeDrug(id: string) {
    setDrugs((prev) => prev.filter((d) => d.id !== id));
  }

  function handleSubmit() {
    const filledDrugs = drugs.filter((d) => d.name.trim().length > 0);
    if (filledDrugs.length < 2) {
      setValidationError("Please add at least 2 substances to analyze interactions. Use the '+ Add Another Drug' button to add more.");
      return;
    }
    for (const d of filledDrugs) {
      if (d.name.trim().length < 2) {
        setValidationError(`Drug name '${d.name.trim()}' doesn't look right. Please enter a valid medication, OTC product, or substance name (e.g. ibuprofen, NyQuil, alcohol).`);
        return;
      }
    }
    setValidationError(null);

    setPhase("animating");
    setAnimFading(false);
    setApiResult(null);
    setApiError(null);

    const healthContext = buildHealthContext(healthProfile);
    const drugsPayload = drugs.map(({ name, method, amount, unit }) => ({ name, method, amount, unit }));

    fetch("/api/check-interaction-premium", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        drugs: drugsPayload,
        treatment_context: treatmentContext,
        health_context: healthContext,
        notes,
      }),
    })
      .then(async (r) => {
        if (!r.ok) {
          const errData = await r.json().catch(() => ({})) as { error?: string; message?: string };
          const err = new Error(errData.message ?? "Failed to analyze the interactions. Please try again.");
          if (errData.error === "unrecognized_drug") {
            (err as Error & { isValidation?: boolean }).isValidation = true;
          }
          throw err;
        }
        return r.json() as Promise<ApiResult>;
      })
      .then((data) => {
        setAnimFading(true);
        setTimeout(() => {
          setAnimFading(false);
          setApiResult(data);
          setPhase("results");
        }, 300);
      })
      .catch((err: unknown) => {
        const isValidation = err instanceof Error && (err as Error & { isValidation?: boolean }).isValidation;
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
                : "Failed to analyze the interactions. Please try again.",
            );
            setPhase("error");
          }
        }, 300);
      });
  }

  function handleNewCheck() {
    setDrugs([
      {
        id: "drug-1",
        name: "",
        method: "Oral (swallowed)",
        amount: "",
        unit: "mg",
      },
      {
        id: "drug-2",
        name: "",
        method: "Oral (swallowed)",
        amount: "",
        unit: "mg",
      },
    ]);
    drugCounter.current = 3;
    setTreatmentContext("");
    setNotes("");
    setPhase("idle");
    setApiResult(null);
    setApiError(null);
    setValidationError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const getDrugLabel = (index: number) =>
    index === 0 ? "Drug A" : index === 1 ? "Drug B" : `Drug ${index + 1}`;

  return (
    <main className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-[960px] flex-col gap-8 px-6 py-12">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <span className="w-fit rounded-full border border-yellow-700 bg-yellow-950/40 px-3 py-1 text-xs font-medium text-yellow-300">
          👑 Premium
        </span>
        <h1 className="text-3xl font-bold tracking-tight">
          Premium Drug Interaction Checker
        </h1>
        <p className="text-muted-foreground">
          Analyze up to 5 substances including supplements and cosmetic products
        </p>
      </div>

      {/* Two-column input area */}
      <div className="grid grid-cols-[2fr_1fr] items-start gap-6">
        {/* Left column: drug cards + optional context + submit */}
        <div className="flex flex-col gap-4">
          {/* Drug cards */}
          {drugs.map((drug, index) => (
            <div
              key={drug.id}
              style={{ animation: "fade-in 0.3s ease forwards" }}
            >
              <DrugCard
                drug={drug}
                label={getDrugLabel(index)}
                removable={index >= 2}
                onNameChange={(v) => { updateDrug(drug.id, { name: v }); if (validationError) setValidationError(null); }}
                onMethodChange={(m) => updateDrug(drug.id, { method: m })}
                onAmountChange={(v) => updateDrug(drug.id, { amount: v })}
                onUnitChange={(u) => updateDrug(drug.id, { unit: u })}
                onRemove={() => removeDrug(drug.id)}
              />
            </div>
          ))}

          {/* Add drug button */}
          {drugs.length < 5 && (
            <Button
              type="button"
              onClick={addDrug}
              variant="outline"
              className="border-teal-700 text-teal-300 hover:bg-teal-950/40 hover:text-teal-200"
            >
              + Add Another Drug
            </Button>
          )}

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
                What is your goal or concern? (optional)
              </Label>
              <p className="text-xs text-muted-foreground">
                This helps us give you more relevant information
              </p>
            </div>
            <Input
              id="treatment-context"
              value={treatmentContext}
              onChange={(e) => setTreatmentContext(e.target.value)}
              placeholder="e.g. managing anxiety, clearing acne, reducing inflammation, improving sleep"
            />
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1">
            <Label htmlFor="notes">Notes</Label>
            <p className="text-xs text-muted-foreground">
              Timing, intervals, and scheduling details for more accurate
              analysis
            </p>
          </div>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Drug A taken at 8am, Drug B at 2pm, Drug C at bedtime — all with food"
            rows={3}
            className={TEXTAREA_CLS}
          />

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
            className="w-full bg-yellow-700 text-white hover:bg-yellow-600 disabled:opacity-50"
            size="lg"
          >
            Analyze All Interactions →
          </Button>
        </div>

        {/* Right column: health profile panel */}
        <HealthProfilePanel
          profile={healthProfile}
          onChange={updateHealthField}
        />
      </div>

      {/* Molecule animation — loops until API responds */}
      {phase === "animating" && (
        <MoleculeAnimation fading={animFading} />
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
          <Results result={apiResult} />
          <Button
            type="button"
            onClick={handleNewCheck}
            variant="outline"
            size="lg"
            className="w-full border-yellow-700 text-yellow-300 hover:bg-yellow-950/40 hover:text-yellow-200"
          >
            Start New Check
          </Button>
        </>
      )}
    </main>
  );
}
