"use client";

import { useEffect, useId, useRef, useState } from "react";
import BodyMap from "~/components/body-map";
import { DrugAutocomplete } from "~/components/drug-autocomplete";
import { isLikelyValidDrug } from "~/lib/drug-suggestions";
import { usePremiumProfile } from "~/hooks/usePremiumProfile";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { createClient } from "~/lib/supabase/client";
import { cn } from "~/lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────

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

type Phase = "idle" | "animating" | "results" | "error";

const SELECT_CLS =
  "h-9 w-full cursor-pointer rounded-md border border-input bg-transparent px-2 py-1 text-sm text-foreground shadow-xs outline-none focus:border-ring dark:bg-input/30";

const TEXTAREA_CLS =
  "min-h-[80px] w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground shadow-xs outline-none focus:border-ring dark:bg-input/30 placeholder:text-muted-foreground";

// ─── Level definitions ────────────────────────────────────────────────────────

interface LevelDef {
  id: 1 | 2 | 3;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
}

const LEVELS: LevelDef[] = [
  {
    id: 1,
    title: "Honors Biology",
    subtitle: "Middle & High School",
    description:
      "Cell basics, organ systems, simple cause and effect. No jargon.",
    icon: "🔬",
  },
  {
    id: 2,
    title: "AP Biology",
    subtitle: "Advanced High School",
    description:
      "Enzyme kinetics, cell signaling, neurotransmitter systems, molecular mechanisms.",
    icon: "🧬",
  },
  {
    id: 3,
    title: "Pre-Med",
    subtitle: "College Level",
    description:
      "Pharmacokinetics, CYP450 system, receptor pharmacology, clinical pathophysiology.",
    icon: "🏥",
  },
];

// ─── Drug entry ───────────────────────────────────────────────────────────────

interface DrugEntry {
  id: string;
  name: string;
  method: ApplicationMethod;
  amount: string;
  unit: Unit;
}

// ─── Case study profile ───────────────────────────────────────────────────────

type HealthFieldKey =
  | "age"
  | "conditions"
  | "medications"
  | "allergies"
  | "extraNotes";

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
  extraNotes: { value: "", included: true },
};

function buildHealthContext(profile: HealthProfile): string {
  const parts: string[] = [];
  if (profile.age.included && profile.age.value.trim())
    parts.push(`Patient age: ${profile.age.value.trim()}`);
  if (profile.conditions.included && profile.conditions.value.trim())
    parts.push(`Patient conditions: ${profile.conditions.value.trim()}`);
  if (profile.medications.included && profile.medications.value.trim())
    parts.push(
      `Patient current medications: ${profile.medications.value.trim()}`,
    );
  if (profile.allergies.included && profile.allergies.value.trim())
    parts.push(`Patient allergies: ${profile.allergies.value.trim()}`);
  if (profile.extraNotes.included && profile.extraNotes.value.trim())
    parts.push(`Extra notes: ${profile.extraNotes.value.trim()}`);
  return parts.join(", ");
}

// ─── Key term ─────────────────────────────────────────────────────────────────

interface KeyTerm {
  term: string;
  definition: string;
}

// ─── API types ────────────────────────────────────────────────────────────────

interface Combination {
  drug_a: string;
  drug_b: string;
  classification: string;
  explanation: string;
  key_terms: (KeyTerm | string)[];
  risk_level?: "high" | "moderate" | "low";
  affected_systems?: { organ: string; reason: string }[];
  steps?: { title: string; caption: string; icon: string }[];
}

interface ApiResult {
  combinations: Combination[];
  overall_summary: string;
}

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

// ─── Text segment helpers — first occurrence only ─────────────────────────────

type Segment =
  | { type: "text"; content: string }
  | { type: "term"; content: string; termIndex: number; termDef: KeyTerm };

function buildSegments(text: string, terms: KeyTerm[]): Segment[] {
  if (!terms.length) return [{ type: "text", content: text }];

  // Attach original index, sort longest-first to avoid partial matches
  const indexed = terms.map((t, i) => ({ ...t, originalIndex: i }));
  const sorted = [...indexed].sort((a, b) => b.term.length - a.term.length);

  const pattern = sorted
    .map(
      (t) => `${t.term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:ed|es|ing|s)?`,
    )
    .join("|");

  const parts = text.split(new RegExp(`(${pattern})`, "gi"));
  const segments: Segment[] = [];
  const highlighted = new Set<number>(); // track already-highlighted term indices

  for (const part of parts) {
    if (!part) continue;
    const lp = part.toLowerCase();
    const matched = sorted.find((t) => {
      const lt = t.term.toLowerCase();
      return (
        lp === lt ||
        lp === `${lt}s` ||
        lp === `${lt}es` ||
        lp === `${lt}ed` ||
        lp === `${lt}ing`
      );
    });

    if (matched && !highlighted.has(matched.originalIndex)) {
      highlighted.add(matched.originalIndex);
      segments.push({
        type: "term",
        content: part,
        termIndex: matched.originalIndex,
        termDef: matched,
      });
    } else {
      segments.push({ type: "text", content: part });
    }
  }

  return segments;
}

// ─── Term chip ────────────────────────────────────────────────────────────────

function TermChip({
  displayText,
  term,
  definition,
  isOpen,
  onToggle,
  variant = "pill",
  isAdded,
  onAdd,
}: {
  displayText: string;
  term: string;
  definition: string;
  isOpen: boolean;
  onToggle: (e: React.MouseEvent) => void;
  variant?: "inline" | "pill";
  isAdded: boolean;
  onAdd: () => void;
}) {
  const popupRef = useRef<HTMLDivElement>(null);

  // Close popup on outside mousedown, delayed to avoid immediate close on open
  // biome-ignore lint/react-hooks/exhaustive-deps: onToggle identity is irrelevant here
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onToggle(e as unknown as React.MouseEvent);
      }
    };
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handler);
    }, 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handler);
    };
  }, [isOpen]);

  return (
    <span className="relative inline" style={{ zIndex: isOpen ? 51 : "auto" }}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle(e);
        }}
        className={
          variant === "pill"
            ? cn(
                "rounded-full border border-teal-800 bg-teal-950/40 px-2.5 py-0.5 text-xs text-teal-300 transition-colors hover:bg-teal-900/40",
                isOpen && "border-teal-500 bg-teal-900/60",
              )
            : "cursor-pointer text-teal-400 underline decoration-teal-400 underline-offset-2 hover:text-teal-300"
        }
      >
        {displayText}
      </button>

      {isOpen && (
        <div
          ref={popupRef}
          className="absolute left-0 top-[calc(100%+6px)] z-50 w-64 rounded-xl border border-teal-800 bg-card p-3 shadow-xl"
          style={{ animation: "fade-in 0.2s ease forwards" }}
          role="dialog"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <span className="flex items-start justify-between gap-1.5">
            <span className="text-xs font-bold text-teal-300">{term}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggle(e);
              }}
              className="shrink-0 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              ✕
            </button>
          </span>
          <span className="mt-1.5 block text-xs leading-relaxed text-muted-foreground">
            {definition || "No definition available."}
          </span>
          {definition && (
            <div className="mt-2.5 border-t border-border pt-2.5">
              {isAdded ? (
                <p className="text-[11px] text-muted-foreground">
                  ✓ Already in your deck
                </p>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAdd();
                  }}
                  className="text-[11px] text-teal-400 transition-colors hover:text-teal-300"
                >
                  ➕ Add to MCAT Deck
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </span>
  );
}

// ─── Molecule animation — loops until unmounted ───────────────────────────────

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
      style={{
        opacity: fading ? 0 : 1,
        transition: "opacity 0.3s ease",
      }}
    >
      <div className="flex items-center justify-center gap-5">
        <div
          className="size-11 rounded-full bg-yellow-600/75"
          style={{
            opacity: sliding ? 1 : 0,
            transform: sliding ? "translateX(0)" : "translateX(-52px)",
            transition:
              "opacity 0.5s ease-out, transform 0.5s ease-out, box-shadow 0.3s ease",
            boxShadow: pulsing ? "0 0 28px 10px rgba(202,138,4,0.4)" : "none",
          }}
        />
        <div
          className="h-[3px] rounded-full bg-yellow-400"
          style={{
            width: "2.25rem",
            opacity: bonded ? 1 : 0,
            transition: "opacity 0.25s ease",
          }}
        />
        <div
          className="size-11 rounded-full bg-amber-500/75"
          style={{
            opacity: sliding ? 1 : 0,
            transform: sliding ? "translateX(0)" : "translateX(52px)",
            transition:
              "opacity 0.5s ease-out, transform 0.5s ease-out, box-shadow 0.3s ease",
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
  mode: "free" | "premium" | "premium-learn";
  recentSearches: string[];
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
  mode,
  recentSearches,
}: DrugCardProps) {
  const uid = useId();
  const drugId = `${uid}-name`;
  const methodId = `${uid}-method`;

  return (
    <div className="relative flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
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

      <div className="flex flex-col gap-1">
        <Label
          htmlFor={drugId}
          className="text-xs font-normal text-muted-foreground"
        >
          Drug / Chemical Name
        </Label>
        <p className="text-xs text-muted-foreground/60">
          Enter a medication, OTC product, alcohol, or chemical substance (e.g.
          cyanide, sulfur dioxide, ethanol, ammonia)
        </p>
      </div>
      <DrugAutocomplete
        value={drug.name}
        onChange={onNameChange}
        placeholder="e.g. ibuprofen"
        mode={mode}
        recentSearches={recentSearches}
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

// ─── Case study panel ─────────────────────────────────────────────────────────

const CASE_STUDY_FIELD_DEFS: Array<{
  key: HealthFieldKey;
  label: string;
  placeholder: string;
  type: "input" | "textarea";
  inputMode?: "numeric" | "text";
  rows?: number;
}> = [
  {
    key: "age",
    label: "Patient Age",
    placeholder: "e.g. 34",
    type: "input",
    inputMode: "numeric",
  },
  {
    key: "conditions",
    label: "Patient Conditions",
    placeholder: "e.g. diabetes, hypertension, asthma",
    type: "textarea",
  },
  {
    key: "medications",
    label: "Patient Current Medications",
    placeholder: "e.g. metformin 500mg, lisinopril",
    type: "textarea",
  },
  {
    key: "allergies",
    label: "Patient Allergies",
    placeholder: "e.g. penicillin, sulfa drugs",
    type: "input",
  },
  {
    key: "extraNotes",
    label: "Extra Notes (optional)",
    placeholder:
      "e.g. athletic, works night shifts, sleeps very little, recent surgery, high stress",
    type: "textarea",
    rows: 3,
  },
];

function CaseStudyPanel({
  profile,
  onChange,
}: {
  profile: HealthProfile;
  onChange: (key: HealthFieldKey, patch: Partial<HealthField>) => void;
}) {
  function clearAll() {
    for (const { key } of CASE_STUDY_FIELD_DEFS)
      onChange(key, { value: "", included: true });
  }

  return (
    <div className="sticky top-6 flex flex-col gap-4 rounded-xl border border-yellow-800/50 bg-yellow-950/20 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-yellow-300">
          Patient Profile
        </h2>
        <button
          type="button"
          onClick={clearAll}
          className="text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          Clear All
        </button>
      </div>
      <p className="text-xs text-muted-foreground">
        Toggle fields on to include them in the analysis.
      </p>
      <p className="rounded-md border border-green-800/40 bg-green-950/20 px-3 py-2 text-xs text-green-400/80">
        ✓ Prescription medications in your patient profile are fully supported
        by Premium.
      </p>

      {CASE_STUDY_FIELD_DEFS.map(
        ({ key, label, placeholder, type, inputMode, rows }) => {
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
                    onToggle={() =>
                      onChange(key, { included: !field.included })
                    }
                  />
                </div>
              </div>
              {type === "textarea" ? (
                <textarea
                  value={field.value}
                  onChange={(e) => onChange(key, { value: e.target.value })}
                  placeholder={placeholder}
                  rows={rows ?? 2}
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
        },
      )}
    </div>
  );
}

// ─── Results ──────────────────────────────────────────────────────────────────

function Results({ result, level, addedTerms, onAddTerm }: { result: ApiResult; level: 1 | 2 | 3; addedTerms: Set<string>; onAddTerm: (term: string, definition: string) => void }) {
  // Track which term chip is open by its [comboIndex, termIndex] encoded as a string
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [showLow, setShowLow] = useState(false);

  // biome-ignore lint/style/noNonNullAssertion: level is always a valid LEVELS id (1 | 2 | 3)
  const levelDef = LEVELS.find((l) => l.id === level)!;

  const lowCombos = result.combinations.filter((c) => c.risk_level === "low");
  const nonLowCombos = result.combinations.filter(
    (c) => c.risk_level !== "low",
  );
  const allLow = nonLowCombos.length === 0 && lowCombos.length > 0;


  return (
    <div className="flex flex-col gap-6">
      {/* Level indicator */}
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-700 bg-teal-950/30 px-3 py-1 text-xs font-medium text-teal-300">
          {levelDef.icon} {levelDef.title}
        </span>
      </div>

      {/* Surface Summary */}
      {result.overall_summary && (
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-teal-400/70">
            Surface Summary
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {result.overall_summary}
          </p>
        </div>
      )}

      {/* Combinations */}
      {result.combinations.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-teal-400/70">
              Interaction Breakdown
            </h2>
            {!allLow && lowCombos.length > 0 && (
              <button
                type="button"
                onClick={() => setShowLow((v) => !v)}
                className="shrink-0 rounded-md border-2 border-border px-6 py-3 text-sm text-muted-foreground transition-colors hover:border-muted-foreground hover:bg-muted/40 hover:text-foreground"
              >
                <span className="flex items-center gap-2">
                  {showLow
                    ? "Hide low-risk interactions"
                    : `Show low-risk interactions (${lowCombos.length})`}
                  <span aria-hidden="true">{showLow ? "▲" : "▼"}</span>
                </span>
              </button>
            )}
          </div>

          {result.combinations.map((combo, comboIdx) => {
            const isLow = combo.risk_level === "low";
            if (!allLow && isLow && !showLow) return null;
            const comboKey = `${comboIdx}`;
            const classEmoji =
              CLASSIFICATION_EMOJI[combo.classification] ?? "🔍";

            // Normalize terms to KeyTerm objects
            const normalizedTerms: KeyTerm[] = combo.key_terms.map((t) =>
              typeof t === "string" ? { term: t, definition: "" } : t,
            );

            // Determine if we have rich object terms (with definitions)
            const hasDefinitions =
              normalizedTerms.length > 0 &&
              normalizedTerms.some((t) => t.definition.length > 0);

            // Build segments — first occurrence of each term highlighted
            const segments = hasDefinitions
              ? buildSegments(combo.explanation, normalizedTerms)
              : [{ type: "text" as const, content: combo.explanation }];

            // Terms not already highlighted in text → show as pills
            const highlightedIndices = new Set(
              segments
                .filter(
                  (s): s is Extract<typeof s, { type: "term" }> =>
                    s.type === "term",
                )
                .map((s) => s.termIndex),
            );
            const pillTerms = hasDefinitions
              ? normalizedTerms.filter((_, i) => !highlightedIndices.has(i))
              : normalizedTerms;

            return (
              <div
                key={comboKey}
                className={cn(
                  "flex flex-col gap-3 rounded-xl border bg-card p-5",
                  !allLow && isLow
                    ? "border-border/50 opacity-60"
                    : "border-border",
                )}
                style={
                  !allLow && isLow && showLow
                    ? { animation: "fade-in 0.3s ease forwards" }
                    : undefined
                }
              >
                {/* Drug pair header */}
                <span className="text-sm font-semibold">
                  {combo.drug_a}{" "}
                  <span className="text-muted-foreground">+</span>{" "}
                  {combo.drug_b}
                </span>

                {/* Classification badge */}
                <div className="flex flex-wrap gap-2">
                  <span className="flex items-center gap-1.5 rounded-full border border-teal-800 bg-teal-950/40 px-3 py-1 text-xs font-medium text-teal-300">
                    <span aria-hidden="true">{classEmoji}</span>
                    {combo.classification}
                  </span>
                </div>

                {/* Explanation — with first-occurrence term highlighting */}
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {segments.map((seg) => {
                    if (seg.type === "text") return seg.content;
                    const chipKey = `${comboKey}-${seg.termIndex}`;
                    return (
                      <TermChip
                        key={chipKey}
                        displayText={seg.content}
                        term={seg.termDef.term}
                        definition={seg.termDef.definition}
                        isOpen={openKey === chipKey}
                        onToggle={(e) => {
                          e.stopPropagation();
                          setOpenKey(openKey === chipKey ? null : chipKey);
                        }}
                        variant="inline"
                        isAdded={addedTerms.has(seg.termDef.term)}
                        onAdd={() => onAddTerm(seg.termDef.term, seg.termDef.definition)}
                      />
                    );
                  })}
                </p>

                {/* Body map */}
                <BodyMap
                  affected_systems={combo.affected_systems ?? []}
                  steps={combo.steps ?? []}
                  level={level}
                  drugA={combo.drug_a}
                  drugB={combo.drug_b}
                  riskLevel={combo.risk_level}
                />

                {/* Key term pills — terms not already highlighted in text */}
                {pillTerms.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {pillTerms.map((termObj) => {
                      if (!hasDefinitions || !termObj.definition) {
                        return (
                          <span
                            key={termObj.term}
                            className="rounded-full border border-teal-800 bg-teal-950/40 px-2.5 py-0.5 text-xs text-teal-300"
                          >
                            {termObj.term}
                          </span>
                        );
                      }
                      // Find the actual term index in normalizedTerms
                      const actualIdx = normalizedTerms.indexOf(termObj);
                      const pillKey = `${comboKey}-pill-${actualIdx}`;
                      return (
                        <TermChip
                          key={pillKey}
                          displayText={termObj.term}
                          term={termObj.term}
                          definition={termObj.definition}
                          isOpen={openKey === pillKey}
                          onToggle={(e) => {
                            e.stopPropagation();
                            setOpenKey(openKey === pillKey ? null : pillKey);
                          }}
                          variant="pill"
                          isAdded={addedTerms.has(termObj.term)}
                          onAdd={() => onAddTerm(termObj.term, termObj.definition)}
                        />
                      );
                    })}
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
        advice.
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LearnPremium() {
  const [selectedLevel, setSelectedLevel] = useState<1 | 2 | 3 | null>(null);
  const [isCaseStudy, setIsCaseStudy] = useState(false);
  const [drugs, setDrugs] = useState<DrugEntry[]>([
    { id: "drug-1", name: "", method: "Oral (swallowed)", amount: "", unit: "mg" },
    { id: "drug-2", name: "", method: "Oral (swallowed)", amount: "", unit: "mg" },
  ]);
  const drugCounter = useRef(3);
  const { profile: savedProfile } = usePremiumProfile();
  const [personalNotes, setPersonalNotes] = useState("");
  const [treatmentContext, setTreatmentContext] = useState("");
  const [focusArea, setFocusArea] = useState("");
  const [drugNotes, setDrugNotes] = useState("");
  const [caseStudyProfile, setCaseStudyProfile] = useState<HealthProfile>(
    INITIAL_HEALTH_PROFILE,
  );
  const [phase, setPhase] = useState<Phase>("idle");
  const [animFading, setAnimFading] = useState(false);
  const [apiResult, setApiResult] = useState<ApiResult | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [_submittedCount, setSubmittedCount] = useState(0);
  const [submittedLevel, setSubmittedLevel] = useState<1 | 2 | 3 | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [addedTerms, setAddedTerms] = useState<Set<string>>(new Set());
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase
        .from("user_flashcards")
        .select("term")
        .eq("user_id", user.id);
      if (data) setAddedTerms(new Set(data.map((r: { term: string }) => r.term)));
    });
  }, []);

  async function handleAddToFlashcards(term: string, definition: string) {
    console.log("[MCAT] handleAddToFlashcards called", { term, definition });
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log("[MCAT] no user, aborting");
      return;
    }
    const { error } = await supabase.from("user_flashcards").insert({
      user_id: user.id,
      term,
      definition,
      source: "analysis",
    });
    if (error) {
      console.log("[MCAT] insert error", error);
      return;
    }
    console.log("[MCAT] inserted successfully");
    setAddedTerms((prev) => new Set([...prev, term]));
  }

  useEffect(() => {
    if (savedProfile?.notes) setPersonalNotes(savedProfile.notes);
  }, [savedProfile]);

  function updateDrug(id: string, patch: Partial<Omit<DrugEntry, "id">>) {
    setDrugs((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  }

  function updateCaseStudyField(
    key: HealthFieldKey,
    patch: Partial<HealthField>,
  ) {
    setCaseStudyProfile((prev) => ({
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
    if (!selectedLevel) {
      setValidationError("Please select a curriculum level before analyzing.");
      return;
    }

    const filledDrugs = drugs.filter((d) => d.name.trim().length > 0);
    if (filledDrugs.length === 0) {
      setValidationError("Please enter at least one substance to analyze.");
      return;
    }
    const invalidDrugs = drugs
      .map((d) => d.name)
      .filter((name) => name.trim().length > 0)
      .filter((name) => !isLikelyValidDrug(name));
    if (invalidDrugs.length > 0) {
      setValidationError(
        `The following don't look like recognized substances: "${invalidDrugs.join('", "')}". Please check your spelling or select from the suggestions list.`,
      );
      return;
    }

    setValidationError(null);
    setPhase("animating");
    setAnimFading(false);
    setApiResult(null);
    setApiError(null);
    setSubmittedCount(drugs.length);
    setSubmittedLevel(selectedLevel);
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);

    const healthContext = isCaseStudy
      ? buildHealthContext(caseStudyProfile)
      : "";
    const drugsPayload = drugs.map(({ name, method, amount, unit }) => ({
      name,
      method,
      amount,
      unit,
    }));

    fetch("/api/arn-interaction-premium", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        drugs: drugsPayload,
        treatment_context: isCaseStudy ? treatmentContext : "",
        health_context: healthContext,
        level: selectedLevel,
        is_case_study: isCaseStudy,
        personal_notes: personalNotes,
        drug_notes: isCaseStudy ? undefined : drugNotes,
        focus_area: focusArea.trim() || undefined,
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
              "Failed to analyze the interactions. Please try again.",
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
        setRecentSearches((prev) => {
          const names = drugs.map((d) => d.name).filter(Boolean);
          return [...names, ...prev.filter((s) => !names.includes(s))].slice(0, 5);
        });
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
              "Failed to analyze the interactions. Please try again.",
            );
            setPhase("error");
          }
        }, 300);
      });
  }

  function handleNewAnalysis() {
    setSelectedLevel(null);
    setIsCaseStudy(false);
    setDrugs([
      {
        id: "drug-1",
        name: "",
        method: "Oral (swallowed)",
        amount: "",
        unit: "mg",
      },
    ]);
    drugCounter.current = 2;
    setTreatmentContext("");
    setFocusArea("");
    setDrugNotes("");
    setCaseStudyProfile(INITIAL_HEALTH_PROFILE);
    setPhase("idle");
    setAnimFading(false);
    setApiResult(null);
    setApiError(null);
    setValidationError(null);
    setSubmittedLevel(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const getDrugLabel = (index: number) =>
    `Drug ${String.fromCharCode(65 + index)}`;

  const selectedLevelDef = LEVELS.find((l) => l.id === selectedLevel);

  return (
    <main className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-[750px] flex-col gap-8 px-6 py-12">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <span className="w-fit rounded-full border border-teal-700 bg-teal-950/30 px-3 py-1 text-xs font-medium text-teal-200">
          👑 Premium Learning
        </span>
        <h1 className="text-3xl font-bold tracking-tight">
          Premium Learning Mode
        </h1>
        <p className="text-muted-foreground">
          Deep-dive into the biology of drug interactions at your level
        </p>
      </div>

      {/* Step 1: Level selector */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <hr className="flex-1 border-border" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Step 1 — Choose Your Level
          </span>
          <hr className="flex-1 border-border" />
        </div>

        {/* Large cards — before level selected */}
        {!selectedLevel && (
          <div
            className="grid grid-cols-3 gap-4"
            style={{ animation: "fade-in 0.3s ease forwards" }}
          >
            {LEVELS.map((level) => (
              <button
                key={level.id}
                type="button"
                onClick={() => {
                  setSelectedLevel(level.id);
                  if (validationError) setValidationError(null);
                }}
                className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 text-left transition-all hover:border-teal-600 hover:bg-teal-950/10"
              >
                <span className="text-3xl">{level.icon}</span>
                <div className="flex flex-col gap-0.5">
                  <p className="text-xs font-semibold text-muted-foreground">
                    Level {level.id}
                  </p>
                  <p className="font-semibold">{level.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {level.subtitle}
                  </p>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {level.description}
                </p>
              </button>
            ))}
          </div>
        )}

        {/* Compact cards — after level selected */}
        {selectedLevel && (
          <div
            className="flex flex-wrap gap-2"
            style={{ animation: "fade-in 0.2s ease forwards" }}
          >
            {LEVELS.map((level) => (
              <button
                key={level.id}
                type="button"
                onClick={() => {
                  if (phase === "idle") setSelectedLevel(level.id);
                }}
                disabled={phase !== "idle"}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-2 transition-all disabled:cursor-not-allowed disabled:opacity-60",
                  selectedLevel === level.id
                    ? "border-teal-600 bg-teal-950/40 text-teal-300"
                    : "border-border bg-card text-muted-foreground hover:border-teal-800 hover:text-foreground",
                )}
              >
                <span className="text-base">{level.icon}</span>
                <div className="text-left">
                  <div className="text-xs font-semibold">{level.title}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {level.subtitle}
                  </div>
                </div>
                {selectedLevel === level.id && (
                  <span className="ml-0.5 text-xs text-teal-400">✓</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Step 2: Drug input form */}
      {selectedLevel && phase === "idle" && (
        <div
          className="flex flex-col gap-6"
          style={{ animation: "fade-in 0.4s ease forwards" }}
        >
          <div className="flex items-center gap-3">
            <hr className="flex-1 border-border" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Step 2 — Enter Your Substances
            </span>
            <hr className="flex-1 border-border" />
          </div>

          {/* Case study toggle */}
          <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">
                Enable Case Study Mode
              </span>
              <span className="text-xs text-muted-foreground">
                Add a patient profile to contextualize the analysis
              </span>
            </div>
            <Toggle
              on={isCaseStudy}
              onToggle={() => setIsCaseStudy((v) => !v)}
            />
          </div>

          {/* Drug inputs + optional case study panel */}
          <div
            className={cn(
              isCaseStudy
                ? "grid grid-cols-[2fr_1fr] items-start gap-6"
                : "flex flex-col gap-4",
            )}
          >
            {/* Left / main column */}
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
                    removable={index >= 1}
                    onNameChange={(v) => {
                      updateDrug(drug.id, { name: v });
                      if (validationError) setValidationError(null);
                    }}
                    onMethodChange={(m) => updateDrug(drug.id, { method: m })}
                    onAmountChange={(v) => updateDrug(drug.id, { amount: v })}
                    onUnitChange={(u) => updateDrug(drug.id, { unit: u })}
                    onRemove={() => removeDrug(drug.id)}
                    mode="premium-learn"
                    recentSearches={recentSearches}
                  />
                </div>
              ))}

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

              {/* Optional context section */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <hr className="flex-1 border-border" />
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Optional Context
                  </span>
                  <hr className="flex-1 border-border" />
                </div>

                {/* Goal / concern — shown in case study mode only */}
                {isCaseStudy && (
                  <>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="treatment-context">
                        What is the patient&apos;s goal or concern? (optional)
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        This helps tailor the educational analysis
                      </p>
                    </div>
                    <Input
                      id="treatment-context"
                      value={treatmentContext}
                      onChange={(e) => setTreatmentContext(e.target.value)}
                      placeholder="e.g. managing the patient's chronic pain, treating patient's anxiety"
                    />
                  </>
                )}

                {/* Organ / biochemical focus — always shown */}
                <div className="flex flex-col gap-1">
                  <Label htmlFor="focus-area">
                    Organ or Biochemical Focus (optional)
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    The explanation will emphasize these systems or processes
                    more heavily
                  </p>
                </div>
                <textarea
                  id="focus-area"
                  value={focusArea}
                  onChange={(e) => setFocusArea(e.target.value)}
                  placeholder="e.g. emphasize the impact on the heart, explain cellular respiration involvement, focus on liver metabolism, highlight the role of mitochondria"
                  rows={2}
                  className={TEXTAREA_CLS}
                />
              </div>

              {/* Drug Notes — only shown when not in case study mode */}
              {!isCaseStudy && (
                <>
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="drug-notes">Drug Notes</Label>
                    <p className="text-xs text-muted-foreground">
                      Add timing or scheduling details specific to this
                      analysis only
                    </p>
                  </div>
                  <textarea
                    id="drug-notes"
                    value={drugNotes}
                    onChange={(e) => setDrugNotes(e.target.value)}
                    placeholder="Timing, intervals, and scheduling details specific to this check. e.g. Drug A taken at 8am, Drug B at 2pm, all with food"
                    rows={3}
                    className={TEXTAREA_CLS}
                  />
                </>
              )}

              {/* Validation error */}
              {validationError && (
                <div className="rounded-xl border border-red-800 bg-red-950/40 p-4 text-sm text-red-300">
                  {validationError}
                </div>
              )}

              <Button
                onClick={handleSubmit}
                className="w-full bg-yellow-700 text-white hover:bg-yellow-600 disabled:opacity-50"
                size="lg"
              >
                {`Analyze at ${selectedLevelDef?.title ?? "Selected Level"} →`}
              </Button>
            </div>

            {/* Right column: case study panel */}
            {isCaseStudy && (
              <CaseStudyPanel
                profile={caseStudyProfile}
                onChange={updateCaseStudyField}
              />
            )}
          </div>
        </div>
      )}

      {/* Molecule animation — loops until API responds */}
      <div ref={resultsRef}>
      {phase === "animating" && <MoleculeAnimation fading={animFading} />}

      {/* Error */}
      {phase === "error" && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {apiError ?? "Something went wrong. Please try again."}
        </div>
      )}

      {/* Results */}
      {phase === "results" && apiResult && submittedLevel && (
        <>
          <Results result={apiResult} level={submittedLevel} addedTerms={addedTerms} onAddTerm={handleAddToFlashcards} />
          <Button
            type="button"
            onClick={handleNewAnalysis}
            variant="outline"
            size="lg"
            className="w-full border-teal-700 text-teal-300 hover:bg-teal-950/40 hover:text-teal-200"
          >
            Start New Analysis
          </Button>
        </>
      )}
      </div>
    </main>
  );
}
