"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "~/lib/supabase/client";
import {
  CASE_STUDIES,
  type CaseStudy,
  type DragDropQuestion,
  type MCQQuestion,
  type WrittenQuestion,
} from "~/lib/case-studies";
import { cn } from "~/lib/utils";

// ─── Animation styles ─────────────────────────────────────────────────────────

const ANIM_CSS = `
@keyframes cs-flow-down {
  0%   { transform: translateY(0px);   opacity: 0; }
  6%   { opacity: 1; }
  88%  { opacity: 1; }
  100% { transform: translateY(180px); opacity: 0; }
}
@keyframes cs-flow-stop {
  0%   { transform: translateY(0px);  opacity: 0; }
  6%   { opacity: 1; }
  42%  { opacity: 1; transform: translateY(75px); }
  56%  { opacity: 0; transform: translateY(82px); }
  100% { opacity: 0; transform: translateY(82px); }
}
@keyframes cs-pulse-red {
  0%, 100% { opacity: 0.7; r: 7; }
  50%       { opacity: 1;   r: 10; }
}
@keyframes cs-pulse-teal {
  0%, 100% { opacity: 0.6; r: 6; }
  50%       { opacity: 1;   r: 9; }
}
@keyframes cs-fade-in {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
`;

// ─── Patient profile card ─────────────────────────────────────────────────────

function PatientProfileCard({
  cs,
  collapseOnMount,
}: {
  cs: CaseStudy;
  collapseOnMount: boolean;
}) {
  const [expanded, setExpanded] = useState(!collapseOnMount);

  return (
    <div className="rounded-xl border border-yellow-800/50 bg-yellow-950/10 p-5">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between"
      >
        <span className="text-[10px] font-semibold uppercase tracking-wider text-yellow-400/80">
          Patient
        </span>
        <span className="text-xs text-muted-foreground">
          {expanded ? "▲ hide" : "▼ show"}
        </span>
      </button>

      {expanded && (
        <div
          className="mt-3 flex flex-col gap-3"
          style={{ animation: "cs-fade-in 0.2s ease forwards" }}
        >
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="font-semibold text-foreground">{cs.patientName}</span>
            <span className="text-muted-foreground">{cs.patientAge} years old</span>
            <span className="text-muted-foreground">{cs.patientSex}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground/80">Conditions: </span>
            {cs.patientConditions}
          </p>
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground/80">Medications: </span>
            {cs.patientMedications}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {cs.patientScenario}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Section: Background ──────────────────────────────────────────────────────

function MetabolismDiagram() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <style>{ANIM_CSS}</style>
      <svg viewBox="0 0 320 220" xmlns="http://www.w3.org/2000/svg" className="w-full">
        {/* Zones */}
        <rect x="0" y="0" width="320" height="68" fill="rgba(59,130,246,0.05)" />
        <rect x="0" y="68" width="320" height="72" fill="rgba(20,184,166,0.07)" />
        <rect x="0" y="140" width="320" height="80" fill="rgba(239,68,68,0.04)" />

        {/* Borders */}
        <line x1="0" y1="68" x2="320" y2="68" stroke="rgba(20,184,166,0.35)" strokeWidth="1" strokeDasharray="5,4" />
        <line x1="0" y1="140" x2="320" y2="140" stroke="rgba(239,68,68,0.25)" strokeWidth="1" strokeDasharray="5,4" />

        {/* Zone labels */}
        <text x="10" y="14" fill="#94a3b8" fontSize="8" fontFamily="sans-serif">GUT LUMEN</text>
        <text x="10" y="82" fill="#5eead4" fontSize="8" fontFamily="sans-serif">INTESTINAL WALL</text>
        <text x="10" y="154" fill="#94a3b8" fontSize="8" fontFamily="sans-serif">BLOODSTREAM</text>

        {/* CYP3A4 hexagons */}
        {[58, 128, 198, 268].map((cx, i) => (
          <g key={i} transform={`translate(${cx}, 104)`}>
            <polygon
              points="0,-16 14,-8 14,8 0,16 -14,8 -14,-8"
              fill="rgba(34,197,94,0.15)"
              stroke="rgb(34,197,94)"
              strokeWidth="1.5"
            />
            <text x="0" y="3" textAnchor="middle" fill="rgb(74,222,128)" fontSize="6.5" fontWeight="bold">CYP3A4</text>
          </g>
        ))}

        {/* Passing drug molecules (blue — survive) */}
        {[38, 158, 288].map((cx, i) => (
          <circle
            key={`pass-${i}`}
            cx={cx}
            cy={34}
            r={7}
            fill="#60a5fa"
            opacity={0}
            style={{
              animation: `cs-flow-down ${2.6 + i * 0.35}s ease-in infinite`,
              animationDelay: `${i * 0.85}s`,
            }}
          />
        ))}

        {/* Metabolized molecules (grey — stopped in wall) */}
        {[93, 233].map((cx, i) => (
          <circle
            key={`meta-${i}`}
            cx={cx}
            cy={34}
            r={7}
            fill="#6b7280"
            opacity={0}
            style={{
              animation: `cs-flow-stop ${2.6 + i * 0.4}s ease-in infinite`,
              animationDelay: `${0.5 + i * 1.2}s`,
            }}
          />
        ))}

        {/* Legend */}
        <circle cx="18" cy="208" r="5" fill="#60a5fa" />
        <text x="28" y="212" fill="#94a3b8" fontSize="8">Active drug (reaches blood)</text>
        <circle cx="168" cy="208" r="5" fill="#6b7280" />
        <text x="178" y="212" fill="#94a3b8" fontSize="8">Metabolized (inactivated)</text>
      </svg>
    </div>
  );
}

function BackgroundSection() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">What is Drug Metabolism?</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Every drug you take needs to be broken down by your body — otherwise it would
          accumulate to toxic levels. This process is called{" "}
          <span className="font-medium text-foreground">drug metabolism</span>, and most
          of it happens in two places: the intestinal wall as the drug is being absorbed,
          and the liver after absorption.
        </p>
      </div>

      <MetabolismDiagram />

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">The CYP450 Enzyme Family</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          CYP3A4 is part of a large family of enzymes called cytochrome P450 enzymes.
          CYP3A4 alone is responsible for metabolizing approximately{" "}
          <span className="font-medium text-foreground">50% of all prescription drugs</span>.
          It acts like a processing gate — drugs that pass through it are chemically
          modified, usually into inactive forms that can be excreted by the kidneys.
        </p>
      </div>
    </div>
  );
}

// ─── Section: Enzyme ─────────────────────────────────────────────────────────

function EnzymeSection({ isPremium }: { isPremium: boolean }) {
  const [showEnzymeInfo, setShowEnzymeInfo] = useState(false);
  const [showBioavailDef, setShowBioavailDef] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showEnzymeInfo) return;
    function handler(e: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setShowEnzymeInfo(false);
      }
    }
    const t = setTimeout(() => document.addEventListener("mousedown", handler), 100);
    return () => { clearTimeout(t); document.removeEventListener("mousedown", handler); };
  }, [showEnzymeInfo]);

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-lg font-bold">CYP3A4: The Body's Drug Processor</h2>

      {/* Interactive enzyme diagram */}
      <div className="relative rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-center gap-8">
          {/* Drug molecule */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-blue-500 bg-blue-950/40">
              <span className="text-xs font-bold text-blue-300">Simvastatin</span>
            </div>
            <span className="text-[10px] text-muted-foreground">Drug</span>
          </div>

          {/* Arrow */}
          <svg width="60" height="24" viewBox="0 0 60 24">
            <line x1="0" y1="12" x2="50" y2="12" stroke="rgba(100,116,139,0.6)" strokeWidth="2" />
            <polygon points="50,6 60,12 50,18" fill="rgba(100,116,139,0.6)" />
          </svg>

          {/* CYP3A4 hexagon */}
          <div className="relative flex flex-col items-center gap-2">
            <button
              ref={popupRef as React.RefObject<HTMLButtonElement>}
              type="button"
              onClick={() => setShowEnzymeInfo(true)}
              className="relative flex h-20 w-20 items-center justify-center transition-all hover:scale-105"
              title="Click to learn about CYP3A4"
            >
              <svg viewBox="0 0 80 80" className="absolute inset-0 h-full w-full">
                <polygon
                  points="40,4 72,22 72,58 40,76 8,58 8,22"
                  fill="rgba(34,197,94,0.15)"
                  stroke="rgb(34,197,94)"
                  strokeWidth="2"
                />
                <polygon
                  points="40,4 72,22 72,58 40,76 8,58 8,22"
                  fill="none"
                  stroke="rgba(34,197,94,0.3)"
                  strokeWidth="6"
                  opacity="0.5"
                />
              </svg>
              <span className="relative text-xs font-bold text-green-400">CYP3A4</span>
            </button>

            {showEnzymeInfo && (
              <div
                ref={popupRef}
                className="absolute left-1/2 top-full z-50 mt-2 w-64 -translate-x-1/2 rounded-xl border border-green-800 bg-card p-4 shadow-xl"
                style={{ animation: "cs-fade-in 0.15s ease forwards" }}
              >
                <p className="mb-1.5 text-xs font-bold text-green-400">CYP3A4</p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  An enzyme embedded in intestinal wall cells and liver cells. When a drug
                  passes through CYP3A4, the enzyme chemically modifies it — usually
                  breaking it down into an inactive form that can be eliminated. Without
                  this step, drugs would accumulate to dangerous levels.
                </p>
                <button
                  type="button"
                  onClick={() => setShowEnzymeInfo(false)}
                  className="mt-2 text-[10px] text-muted-foreground hover:text-foreground"
                >
                  Close ✕
                </button>
              </div>
            )}

            <span className="text-[10px] text-muted-foreground">Click to learn more</span>
          </div>

          {/* Arrow */}
          <svg width="60" height="24" viewBox="0 0 60 24">
            <line x1="0" y1="12" x2="50" y2="12" stroke="rgba(100,116,139,0.6)" strokeWidth="2" />
            <polygon points="50,6 60,12 50,18" fill="rgba(100,116,139,0.6)" />
          </svg>

          {/* Metabolized form */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-slate-600 bg-slate-800/40">
              <span className="text-xs font-bold text-slate-400">Inactive Metabolite</span>
            </div>
            <span className="text-[10px] text-muted-foreground">Excreted</span>
          </div>
        </div>
      </div>

      {/* Bioavailability comparison */}
      <div className="grid grid-cols-2 gap-4">
        {/* Without grapefruit */}
        <div className="flex flex-col gap-3 rounded-xl border border-teal-800/50 bg-teal-950/10 p-4">
          <p className="text-xs font-semibold text-teal-300">Without Grapefruit</p>
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Drug absorbed</span>
              <span className="font-mono font-bold text-teal-400">~15%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-muted">
              <div className="h-full w-[15%] rounded-full bg-teal-500" />
            </div>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            CYP3A4 metabolizes most of the dose before it reaches circulation.
          </p>
        </div>

        {/* With grapefruit */}
        {isPremium ? (
          <div className="flex flex-col gap-3 rounded-xl border border-red-800/50 bg-red-950/10 p-4">
            <p className="text-xs font-semibold text-red-400">With Grapefruit</p>
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Drug absorbed</span>
                <span className="font-mono font-bold text-red-400">up to 260% of normal</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-full rounded-full bg-red-600" />
              </div>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              With CYP3A4 inhibited, far more drug bypasses first-pass metabolism.
            </p>
          </div>
        ) : (
          <div className="relative flex flex-col gap-3 overflow-hidden rounded-xl border border-border bg-card p-4">
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/80 backdrop-blur-sm">
              <span className="text-2xl">🔒</span>
              <Link
                href="/account"
                className="text-xs font-medium text-teal-400 hover:text-teal-300"
              >
                Unlock with Premium →
              </Link>
            </div>
            <p className="text-xs font-semibold text-red-400 opacity-30">With Grapefruit</p>
            <div className="h-3 rounded-full bg-muted opacity-30" />
            <p className="text-xs text-muted-foreground opacity-30">Premium content</p>
          </div>
        )}
      </div>

      {/* Bioavailability tooltip */}
      <p className="text-xs text-muted-foreground">
        What is{" "}
        <button
          type="button"
          onClick={() => setShowBioavailDef((v) => !v)}
          className="text-teal-400 underline decoration-teal-400 underline-offset-2 hover:text-teal-300"
        >
          bioavailability
        </button>
        ?
        {showBioavailDef && (
          <span className="ml-2 inline-block rounded-lg border border-teal-800 bg-card px-2.5 py-1.5 text-xs text-muted-foreground">
            The fraction of a drug dose that reaches systemic circulation unchanged. A drug
            with 15% bioavailability means only 15% of the dose enters the bloodstream — the
            rest is metabolized before it can act.
            <button
              type="button"
              onClick={() => setShowBioavailDef(false)}
              className="ml-2 text-muted-foreground/60 hover:text-foreground"
            >
              ✕
            </button>
          </span>
        )}
      </p>
    </div>
  );
}

// ─── Section: Inhibitor ───────────────────────────────────────────────────────

function InhibitorSection() {
  const [animStage, setAnimStage] = useState(0);

  useEffect(() => {
    setAnimStage(0);
    const t1 = setTimeout(() => setAnimStage(1), 2000);
    const t2 = setTimeout(() => setAnimStage(2), 4000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  function restart() {
    setAnimStage(0);
    setTimeout(() => setAnimStage(1), 2000);
    setTimeout(() => setAnimStage(2), 4000);
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-lg font-bold">How Grapefruit Hijacks the Enzyme</h2>

      <p className="text-sm leading-relaxed text-muted-foreground">
        Grapefruit contains compounds called{" "}
        <span className="font-medium text-foreground">furanocoumarins</span> — specifically
        bergamottin and 6′,7′-dihydroxybergamottin. These are not harmful on their own. But
        when they reach the intestinal wall, something unusual happens.
      </p>

      {/* Animated inhibition SVG */}
      <div className="overflow-hidden rounded-xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground">
            Stage {animStage + 1} of 3:{" "}
            {animStage === 0
              ? "Normal enzyme activity"
              : animStage === 1
                ? "Furanocoumarin approaches"
                : "Enzyme permanently inactivated"}
          </p>
          <button
            type="button"
            onClick={restart}
            className="text-[10px] text-teal-400 transition-colors hover:text-teal-300"
          >
            ↺ Replay
          </button>
        </div>

        <svg viewBox="0 0 320 160" xmlns="http://www.w3.org/2000/svg" className="w-full">
          {/* Background gradient for wall */}
          <rect x="0" y="60" width="320" height="60" fill="rgba(20,184,166,0.07)" />

          {/* CYP3A4 hexagon — changes color by stage */}
          <g transform="translate(160, 90)">
            <polygon
              points="0,-28 24,-14 24,14 0,28 -24,14 -24,-14"
              fill={
                animStage === 0
                  ? "rgba(34,197,94,0.2)"
                  : animStage === 1
                    ? "rgba(251,146,60,0.2)"
                    : "rgba(239,68,68,0.15)"
              }
              stroke={
                animStage === 0
                  ? "rgb(34,197,94)"
                  : animStage === 1
                    ? "rgb(251,146,60)"
                    : "rgb(239,68,68)"
              }
              strokeWidth="2"
              style={{ transition: "all 0.8s ease" }}
            />
            {animStage === 2 && (
              <text x="0" y="5" textAnchor="middle" fill="rgb(239,68,68)" fontSize="18">✕</text>
            )}
            {animStage !== 2 && (
              <text x="0" y="4" textAnchor="middle" fill={animStage === 0 ? "rgb(74,222,128)" : "rgb(253,186,116)"} fontSize="7" fontWeight="bold">
                CYP3A4
              </text>
            )}
          </g>

          {/* Stage 0: drug molecules flowing normally */}
          {animStage === 0 && [60, 100, 260, 300].map((cx, i) => (
            <circle
              key={`s0-${i}`}
              cx={cx}
              cy={38}
              r={6}
              fill="#60a5fa"
              opacity={0}
              style={{
                animation: `cs-flow-down 2.2s ease-in infinite`,
                animationDelay: `${i * 0.55}s`,
              }}
            />
          ))}

          {/* Stage 1: furanocoumarin molecule descending */}
          {animStage >= 1 && (
            <circle
              cx={160}
              cy={animStage === 1 ? 50 : 90}
              r={9}
              fill={animStage === 1 ? "rgba(251,146,60,0.9)" : "rgba(239,68,68,0.6)"}
              style={{ transition: "all 1s ease" }}
            />
          )}
          {animStage === 1 && (
            <text x="160" y="38" textAnchor="middle" fill="#fb923c" fontSize="7">
              Furanocoumarin
            </text>
          )}

          {/* Stage 1+: drug molecules now pass through unmetabolized */}
          {animStage >= 1 && [60, 260].map((cx, i) => (
            <circle
              key={`s1-${i}`}
              cx={cx}
              cy={38}
              r={6}
              fill="#60a5fa"
              opacity={0}
              style={{
                animation: `cs-flow-down 2.2s ease-in infinite`,
                animationDelay: `${i * 0.7}s`,
              }}
            />
          ))}

          {/* Stage 2: label */}
          {animStage === 2 && (
            <text x="160" y="140" textAnchor="middle" fill="rgb(239,68,68)" fontSize="8">
              Enzyme permanently inactivated — new enzyme must be synthesized
            </text>
          )}
        </svg>
      </div>

      {/* Fact boxes */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-orange-800/50 bg-orange-950/10 p-4">
          <p className="mb-2 text-xs font-bold text-orange-300">Suicide Inhibition</p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Unlike most drug interactions where an inhibitor temporarily blocks an enzyme,
            grapefruit causes <span className="font-medium text-foreground">mechanism-based inhibition</span> — the
            enzyme metabolizes the furanocoumarin into a reactive form that permanently destroys
            it. The enzyme cannot recover.
          </p>
        </div>
        <div className="rounded-xl border border-red-800/50 bg-red-950/10 p-4">
          <p className="mb-2 text-xs font-bold text-red-300">Duration</p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            A single glass of grapefruit juice can suppress intestinal CYP3A4 for{" "}
            <span className="font-medium text-foreground">24 to 72 hours</span>. The effect
            outlasts the juice itself — Margaret's morning glass affected her simvastatin
            metabolism for potentially three days.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Section: Patient timeline ────────────────────────────────────────────────

const TIMELINE_STEPS = [
  {
    time: "7:00 AM",
    icon: "🍊",
    headline: "Margaret drinks a large glass of grapefruit juice with her simvastatin tablet",
    detail:
      "The grapefruit juice contains bergamottin and 6′,7′-dihydroxybergamottin — furanocoumarins that are harmless in normal contexts but interact with intestinal enzymes. She takes her 40mg simvastatin at the same time.",
  },
  {
    time: "7:15 AM",
    icon: "⚗️",
    headline: "Furanocoumarins reach the intestinal wall and begin inactivating CYP3A4",
    detail:
      "As the grapefruit components pass through the intestinal epithelium, CYP3A4 enzymes attempt to metabolize them. Instead, the furanocoumarins are converted into reactive intermediates that covalently bind to and permanently inactivate the enzyme — a mechanism-based (suicide) inhibition.",
  },
  {
    time: "7:30 AM",
    icon: "💊",
    headline: "Simvastatin is absorbed — but CYP3A4 is now largely disabled. Up to 3× the normal amount enters the bloodstream",
    detail:
      "Normally, ~85% of simvastatin is metabolized during first-pass absorption. With CYP3A4 inactivated, this metabolic gate is open — far more intact, active simvastatin crosses into systemic circulation than the body was designed to handle.",
  },
  {
    time: "Days 1–3",
    icon: "🔴",
    headline: "Simvastatin accumulates in muscle tissue at toxic concentrations",
    detail:
      "Statins inhibit HMG-CoA reductase — an enzyme essential for cholesterol synthesis. At normal doses, this effect is confined to the liver. At toxic levels, simvastatin inhibits the same enzyme in skeletal muscle cells, disrupting their energy metabolism and causing cell membrane damage. Creatine kinase leaks from damaged muscle cells into the blood.",
  },
  {
    time: "Day 3",
    icon: "🏥",
    headline: "Margaret visits her doctor with severe muscle pain, weakness, and dark urine — signs of rhabdomyolysis",
    detail:
      "Rhabdomyolysis is the rapid breakdown of skeletal muscle. The dark urine (myoglobinuria) occurs because myoglobin from destroyed muscle cells passes through the kidneys. Markedly elevated creatine kinase (CK) in the blood confirms extensive muscle damage. If untreated, myoglobin in the kidneys can cause acute renal failure.",
  },
];

const BODY_DOTS = [
  {
    id: "intestine",
    cx: 160,
    cy: 135,
    label: "Intestinal wall — where CYP3A4 inhibition occurred",
    color: "orange",
  },
  {
    id: "thigh",
    cx: 142,
    cy: 225,
    label: "Thigh muscles — primary site of simvastatin-induced myopathy",
    color: "red",
  },
  {
    id: "arm",
    cx: 110,
    cy: 170,
    label: "Arm muscles — also affected by toxic statin accumulation",
    color: "red",
  },
];

function PatientSection() {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [activeDot, setActiveDot] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-lg font-bold">Margaret's Timeline</h2>

      {/* Timeline */}
      <div className="flex flex-col gap-0">
        {TIMELINE_STEPS.map((step, i) => (
          <div key={i} className="flex gap-4">
            {/* Timeline line */}
            <div className="flex flex-col items-center">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-card text-base">
                {step.icon}
              </div>
              {i < TIMELINE_STEPS.length - 1 && (
                <div className="w-px flex-1 bg-border" style={{ minHeight: "20px" }} />
              )}
            </div>

            {/* Content */}
            <div className="pb-6">
              <button
                type="button"
                onClick={() => setExpanded(expanded === i ? null : i)}
                className="flex flex-col gap-0.5 text-left"
              >
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {step.time}
                </span>
                <p className="text-sm font-medium text-foreground hover:text-teal-300 transition-colors">
                  {step.headline}
                </p>
              </button>
              {expanded === i && (
                <p
                  className="mt-2 text-xs leading-relaxed text-muted-foreground"
                  style={{ animation: "cs-fade-in 0.2s ease forwards" }}
                >
                  {step.detail}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Body diagram */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
        <p className="text-xs font-semibold text-muted-foreground">
          Click a highlighted area to see what happened there
        </p>
        <div className="flex gap-6">
          <svg viewBox="0 0 320 300" xmlns="http://www.w3.org/2000/svg" className="w-48 shrink-0">
            {/* Simple body outline */}
            {/* Head */}
            <ellipse cx="160" cy="42" rx="28" ry="32" fill="none" stroke="rgba(148,163,184,0.5)" strokeWidth="1.5" />
            {/* Torso */}
            <rect x="124" y="74" width="72" height="90" rx="10" fill="none" stroke="rgba(148,163,184,0.5)" strokeWidth="1.5" />
            {/* Left arm */}
            <rect x="94" y="78" width="28" height="76" rx="12" fill="none" stroke="rgba(148,163,184,0.5)" strokeWidth="1.5" />
            {/* Right arm */}
            <rect x="198" y="78" width="28" height="76" rx="12" fill="none" stroke="rgba(148,163,184,0.5)" strokeWidth="1.5" />
            {/* Left leg */}
            <rect x="124" y="164" width="30" height="90" rx="12" fill="none" stroke="rgba(148,163,184,0.5)" strokeWidth="1.5" />
            {/* Right leg */}
            <rect x="166" y="164" width="30" height="90" rx="12" fill="none" stroke="rgba(148,163,184,0.5)" strokeWidth="1.5" />

            {/* Clickable pulsing dots */}
            {BODY_DOTS.map((dot) => (
              <g key={dot.id} onClick={() => setActiveDot(activeDot === dot.id ? null : dot.id)} style={{ cursor: "pointer" }}>
                <circle
                  cx={dot.cx}
                  cy={dot.cy}
                  r={10}
                  fill={dot.color === "orange" ? "rgba(251,146,60,0.15)" : "rgba(239,68,68,0.15)"}
                  stroke={dot.color === "orange" ? "rgb(251,146,60)" : "rgb(239,68,68)"}
                  strokeWidth="1.5"
                  style={{
                    animation: dot.color === "orange"
                      ? "cs-pulse-teal 1.5s ease-in-out infinite"
                      : "cs-pulse-red 1.5s ease-in-out infinite",
                    animationDelay: dot.id === "arm" ? "0.5s" : "0s",
                  }}
                />
                <circle cx={dot.cx} cy={dot.cy} r={4} fill={dot.color === "orange" ? "rgb(251,146,60)" : "rgb(239,68,68)"} />
              </g>
            ))}
          </svg>

          {/* Dot explanation */}
          <div className="flex-1">
            {activeDot ? (
              <div
                className="rounded-xl border border-border bg-background p-3"
                style={{ animation: "cs-fade-in 0.15s ease forwards" }}
              >
                <p className="text-xs font-semibold text-foreground">
                  {BODY_DOTS.find((d) => d.id === activeDot)?.label}
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Select a dot on the diagram to see what happened at that location.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Section: Which drugs ─────────────────────────────────────────────────────

const DRUG_SORT_DATA: { name: string; category: string; affected: boolean; reason: string }[] = [
  { name: "Simvastatin", category: "Statin", affected: true, reason: "CYP3A4 substrate with low bioavailability — major interaction." },
  { name: "Lovastatin", category: "Statin", affected: true, reason: "CYP3A4 substrate; avoid grapefruit entirely." },
  { name: "Felodipine", category: "Calcium channel blocker", affected: true, reason: "The original drug in the 1991 grapefruit discovery study." },
  { name: "Cyclosporine", category: "Immunosuppressant", affected: true, reason: "CYP3A4 substrate with narrow therapeutic window — dangerous interaction." },
  { name: "Buspirone", category: "Anxiolytic", affected: true, reason: "CYP3A4 substrate; grapefruit significantly increases exposure." },
  { name: "Pravastatin", category: "Statin", affected: false, reason: "Not metabolized by CYP3A4 — safe to take with grapefruit." },
  { name: "Rosuvastatin", category: "Statin", affected: false, reason: "Not significantly metabolized by CYP3A4." },
  { name: "Aspirin", category: "NSAID / Antiplatelet", affected: false, reason: "Not a CYP3A4 substrate — no interaction." },
  { name: "Metformin", category: "Antidiabetic", affected: false, reason: "Renally excreted, not CYP3A4 substrate." },
  { name: "Lisinopril", category: "ACE inhibitor", affected: false, reason: "Not CYP3A4 substrate — Margaret's lisinopril was unaffected." },
];

function WhichDrugsSection({ isPremium }: { isPremium: boolean }) {
  const [placements, setPlacements] = useState<Record<string, "affected" | "not-affected" | "unsorted">>(() =>
    Object.fromEntries(DRUG_SORT_DATA.map((d) => [d.name, "unsorted"])),
  );
  const [dragOver, setDragOver] = useState<"affected" | "not-affected" | null>(null);
  const [checked, setChecked] = useState(false);
  const [dragging, setDragging] = useState<string | null>(null);

  const unsorted = DRUG_SORT_DATA.filter((d) => placements[d.name] === "unsorted");
  const inAffected = DRUG_SORT_DATA.filter((d) => placements[d.name] === "affected");
  const inNotAffected = DRUG_SORT_DATA.filter((d) => placements[d.name] === "not-affected");

  function handleDrop(zone: "affected" | "not-affected") {
    if (!dragging) return;
    setPlacements((prev) => ({ ...prev, [dragging]: zone }));
    setDragging(null);
    setDragOver(null);
    setChecked(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-lg font-bold">Which Drugs Are Affected?</h2>
      <p className="text-sm leading-relaxed text-muted-foreground">
        Not all drugs are equally affected by grapefruit. Only drugs that are{" "}
        <span className="font-medium text-foreground">CYP3A4 substrates</span> AND have low
        bioavailability show clinically meaningful interactions. Drag each drug into the
        correct column.
      </p>

      {/* Unsorted pile */}
      {unsorted.length > 0 && (
        <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-card p-4">
          <p className="w-full text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Unsorted — drag to a column below
          </p>
          {unsorted.map((drug) => (
            <div
              key={drug.name}
              draggable
              onDragStart={() => setDragging(drug.name)}
              onDragEnd={() => setDragging(null)}
              className="cursor-grab rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-muted-foreground active:cursor-grabbing"
            >
              {drug.name}
              <span className="ml-1.5 text-[10px] text-muted-foreground">({drug.category})</span>
            </div>
          ))}
        </div>
      )}

      {/* Drop zones */}
      <div className="grid grid-cols-2 gap-4">
        {(["affected", "not-affected"] as const).map((zone) => {
          const isAff = zone === "affected";
          const items = isAff ? inAffected : inNotAffected;
          return (
            <div
              key={zone}
              onDragOver={(e) => { e.preventDefault(); setDragOver(zone); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={() => handleDrop(zone)}
              className={cn(
                "min-h-[120px] rounded-xl border-2 p-3 transition-colors",
                dragOver === zone
                  ? isAff
                    ? "border-red-500 bg-red-950/20"
                    : "border-green-500 bg-green-950/20"
                  : isAff
                    ? "border-red-800/50 bg-red-950/10"
                    : "border-green-800/50 bg-green-950/10",
              )}
            >
              <p className={cn("mb-2 text-xs font-semibold", isAff ? "text-red-400" : "text-green-400")}>
                {isAff ? "⚠️ Affected by Grapefruit" : "✓ Not Significantly Affected"}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {items.map((drug) => {
                  const isCorrect = drug.affected === isAff;
                  return (
                    <div
                      key={drug.name}
                      draggable
                      onDragStart={() => setDragging(drug.name)}
                      onDragEnd={() => setDragging(null)}
                      className={cn(
                        "cursor-grab rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors active:cursor-grabbing",
                        checked
                          ? isCorrect
                            ? "border-green-600 bg-green-950/30 text-green-300"
                            : "border-red-600 bg-red-950/30 text-red-300"
                          : "border-border bg-background text-foreground hover:border-muted-foreground",
                      )}
                      title={checked ? drug.reason : undefined}
                    >
                      {checked && (isCorrect ? "✓ " : "✗ ")}
                      {drug.name}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Check button */}
      {isPremium ? (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setChecked(true)}
            disabled={unsorted.length > 0}
            className="w-fit rounded-lg border border-teal-700 px-5 py-2 text-sm font-medium text-teal-300 transition-colors hover:bg-teal-950/40 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {unsorted.length > 0 ? `Sort all ${unsorted.length} remaining drugs first` : "Check My Answers"}
          </button>
          {checked && (
            <p className="text-xs text-muted-foreground" style={{ animation: "cs-fade-in 0.2s ease forwards" }}>
              Hover over any card to see the explanation.
            </p>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
          <span className="text-xl">🔒</span>
          <div>
            <p className="text-sm font-medium">Check answers requires Premium</p>
            <Link href="/account" className="text-xs text-teal-400 hover:text-teal-300">
              Upgrade to unlock →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Quiz: MCQ ────────────────────────────────────────────────────────────────

function MCQComponent({
  q,
  selectedIndex,
  onSelect,
  onSubmit,
  isSubmitted,
}: {
  q: MCQQuestion;
  selectedIndex: number | null;
  onSelect: (i: number) => void;
  onSubmit: () => void;
  isSubmitted: boolean;
}) {
  const isCorrect = selectedIndex === q.correctIndex;

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[15px] font-medium leading-snug text-foreground">{q.question}</p>
        <span className="shrink-0 rounded-full border border-yellow-700 bg-yellow-950/30 px-2 py-0.5 text-[10px] font-semibold text-yellow-300">
          {q.points} pts
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {q.options.map((opt, i) => {
          let cls =
            "w-full rounded-lg border px-4 py-2.5 text-left text-sm transition-colors ";
          if (!isSubmitted) {
            cls +=
              selectedIndex === i
                ? "border-teal-600 bg-teal-950/40 text-teal-200"
                : "border-border bg-background text-foreground hover:border-muted-foreground";
          } else {
            if (i === q.correctIndex) {
              cls += "border-green-600 bg-green-950/30 text-green-300";
            } else if (i === selectedIndex && !isCorrect) {
              cls += "border-red-600 bg-red-950/30 text-red-300";
            } else {
              cls += "border-border bg-background text-muted-foreground";
            }
          }
          return (
            <button
              key={i}
              type="button"
              onClick={() => !isSubmitted && onSelect(i)}
              disabled={isSubmitted}
              className={cls}
            >
              {isSubmitted && i === q.correctIndex && "✓ "}
              {isSubmitted && i === selectedIndex && !isCorrect && "✗ "}
              {opt}
            </button>
          );
        })}
      </div>

      {!isSubmitted && (
        <button
          type="button"
          onClick={onSubmit}
          disabled={selectedIndex === null}
          className="w-fit rounded-lg bg-teal-700 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Submit Answer
        </button>
      )}

      {isSubmitted && (
        <div
          className={cn(
            "rounded-xl border p-4",
            isCorrect ? "border-green-800/50 bg-green-950/20" : "border-red-800/50 bg-red-950/20",
          )}
          style={{ animation: "cs-fade-in 0.2s ease forwards" }}
        >
          {isCorrect && (
            <p className="mb-1 text-xs font-bold text-green-400">
              +{q.points} pts — Correct!
            </p>
          )}
          <p className="text-xs leading-relaxed text-muted-foreground">{q.explanation}</p>
        </div>
      )}
    </div>
  );
}

// ─── Quiz: Sequence drag-drop ─────────────────────────────────────────────────

function SequenceDragDrop({
  q,
  order,
  onReorder,
  onSubmit,
  isSubmitted,
}: {
  q: DragDropQuestion;
  order: number[];
  onReorder: (newOrder: number[]) => void;
  onSubmit: () => void;
  isSubmitted: boolean;
}) {
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  function handleDrop(targetIdx: number) {
    if (draggingIdx === null || draggingIdx === targetIdx) return;
    const next = [...order];
    const [moved] = next.splice(draggingIdx, 1);
    next.splice(targetIdx, 0, moved!);
    onReorder(next);
    setDraggingIdx(null);
    setDragOverIdx(null);
  }

  const isCorrect =
    isSubmitted && order.every((itemIdx, pos) => q.correctOrder[pos] === itemIdx);

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[15px] font-medium leading-snug text-foreground">
          {q.instruction}
        </p>
        <span className="shrink-0 rounded-full border border-yellow-700 bg-yellow-950/30 px-2 py-0.5 text-[10px] font-semibold text-yellow-300">
          {q.points} pts
        </span>
      </div>

      <p className="text-xs text-muted-foreground">
        {isSubmitted ? "Results shown below" : "Drag the cards to reorder them, then click Check Order."}
      </p>

      <div className="flex flex-col gap-2">
        {order.map((itemIdx, pos) => {
          const text = q.items[itemIdx]!;
          const isPos = isSubmitted && q.correctOrder[pos] === itemIdx;
          const isNeg = isSubmitted && q.correctOrder[pos] !== itemIdx;
          return (
            <div
              key={itemIdx}
              draggable={!isSubmitted}
              onDragStart={() => setDraggingIdx(pos)}
              onDragEnd={() => { setDraggingIdx(null); setDragOverIdx(null); }}
              onDragOver={(e) => { e.preventDefault(); setDragOverIdx(pos); }}
              onDragLeave={() => setDragOverIdx(null)}
              onDrop={() => handleDrop(pos)}
              className={cn(
                "flex items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors",
                isSubmitted
                  ? isPos
                    ? "border-green-600 bg-green-950/20 text-green-300"
                    : "border-red-600 bg-red-950/20 text-red-300"
                  : draggingIdx === pos
                    ? "border-teal-600 bg-teal-950/30 opacity-50"
                    : dragOverIdx === pos
                      ? "border-teal-500 bg-teal-950/20"
                      : "cursor-grab border-border bg-background text-foreground hover:border-muted-foreground active:cursor-grabbing",
              )}
            >
              <span className="shrink-0 text-xs font-mono text-muted-foreground">
                {pos + 1}.
              </span>
              {isSubmitted && (isPos ? "✓ " : "✗ ")}
              {text}
            </div>
          );
        })}
      </div>

      {!isSubmitted && (
        <button
          type="button"
          onClick={onSubmit}
          className="w-fit rounded-lg bg-teal-700 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-600"
        >
          Check Order
        </button>
      )}

      {isSubmitted && (
        <div
          className={cn(
            "rounded-xl border p-4",
            isCorrect ? "border-green-800/50 bg-green-950/20" : "border-border bg-background",
          )}
          style={{ animation: "cs-fade-in 0.2s ease forwards" }}
        >
          {isCorrect && (
            <p className="mb-1 text-xs font-bold text-green-400">+{q.points} pts — Correct order!</p>
          )}
          <p className="text-xs leading-relaxed text-muted-foreground">{q.explanation}</p>
        </div>
      )}
    </div>
  );
}

// ─── Quiz: Written response ───────────────────────────────────────────────────

function WrittenResponseComponent({
  q,
  grading,
  onSubmit,
}: {
  q: WrittenQuestion;
  grading: { score: number; feedback: string; strengths: string[]; improvements: string[]; loading: boolean } | null;
  onSubmit: (response: string) => void;
}) {
  const [text, setText] = useState("");
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[15px] font-medium leading-snug text-foreground">{q.question}</p>
        <span className="shrink-0 rounded-full border border-yellow-700 bg-yellow-950/30 px-2 py-0.5 text-[10px] font-semibold text-yellow-300">
          {q.points} pts
        </span>
      </div>

      {!grading ? (
        <>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            placeholder="Write your explanation here..."
            className="w-full resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-teal-600"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {wordCount} / 300 words recommended
            </p>
            <button
              type="button"
              onClick={() => onSubmit(text)}
              disabled={text.trim().length < 10}
              className="rounded-lg bg-teal-700 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Submit for AI Grading →
            </button>
          </div>
        </>
      ) : grading.loading ? (
        <div className="flex flex-col items-center gap-3 py-8">
          <p className="animate-pulse text-sm text-muted-foreground">
            Grading your response…
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3" style={{ animation: "cs-fade-in 0.3s ease forwards" }}>
          {/* Score */}
          <div className="flex items-center gap-3 rounded-xl border border-yellow-800/50 bg-yellow-950/20 px-4 py-3">
            <span className="text-2xl font-bold text-yellow-300">
              {grading.score} / {q.points}
            </span>
            <div className="h-8 w-px bg-border" />
            <p className="text-sm text-muted-foreground">{grading.feedback}</p>
          </div>

          {/* Strengths */}
          {grading.strengths.length > 0 && (
            <div className="rounded-xl border border-green-800/40 bg-green-950/10 p-4">
              <p className="mb-2 text-xs font-bold text-green-400">Strengths</p>
              <ul className="flex flex-col gap-1">
                {grading.strengths.map((s, i) => (
                  <li key={i} className="text-xs text-muted-foreground">
                    ✓ {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Improvements */}
          {grading.improvements.length > 0 && (
            <div className="rounded-xl border border-border bg-background p-4">
              <p className="mb-2 text-xs font-bold text-muted-foreground">Could improve</p>
              <ul className="flex flex-col gap-1">
                {grading.improvements.map((imp, i) => (
                  <li key={i} className="text-xs text-muted-foreground">
                    • {imp}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Quiz section ─────────────────────────────────────────────────────────────

function QuizSection({
  cs,
  answers,
  submitted,
  dragOrder,
  setDragOrder,
  writtenGrading,
  isPremium,
  onSelect,
  onSubmitMCQ,
  onSubmitDragDrop,
  onSubmitWritten,
}: {
  cs: CaseStudy;
  answers: Record<string, unknown>;
  submitted: Record<string, boolean>;
  dragOrder: number[];
  setDragOrder: (o: number[]) => void;
  writtenGrading: Record<string, { score: number; feedback: string; strengths: string[]; improvements: string[]; loading: boolean }>;
  isPremium: boolean;
  onSelect: (qId: string, idx: number) => void;
  onSubmitMCQ: (qId: string) => void;
  onSubmitDragDrop: (qId: string) => void;
  onSubmitWritten: (qId: string, response: string) => void;
}) {
  const mcqs = cs.questions.filter((q): q is MCQQuestion => q.type === "mcq");
  const ddq = cs.questions.find((q): q is DragDropQuestion => q.type === "dragdrop");
  const written = cs.questions.find((q): q is WrittenQuestion => q.type === "written");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-bold">Review & Quiz</h2>
        <p className="text-sm text-muted-foreground">
          Test your understanding — questions are graded automatically
        </p>
      </div>

      {/* MCQs — first one is free preview */}
      {mcqs.map((q, i) => {
        if (i > 0 && !isPremium) {
          return (
            <div
              key={q.id}
              className="relative overflow-hidden rounded-xl border border-border bg-card p-5"
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/85 backdrop-blur-sm">
                <span className="text-2xl">🔒</span>
                <Link href="/account" className="text-sm font-medium text-teal-400 hover:text-teal-300">
                  Unlock full quiz with Premium →
                </Link>
              </div>
              <p className="text-[15px] font-medium text-foreground opacity-20">{q.question}</p>
              <div className="mt-3 flex flex-col gap-2 opacity-20">
                {q.options.map((opt, oi) => (
                  <div key={oi} className="rounded-lg border border-border px-4 py-2.5 text-sm">
                    {opt}
                  </div>
                ))}
              </div>
            </div>
          );
        }
        return (
          <MCQComponent
            key={q.id}
            q={q}
            selectedIndex={typeof answers[q.id] === "number" ? (answers[q.id] as number) : null}
            onSelect={(idx) => onSelect(q.id, idx)}
            onSubmit={() => onSubmitMCQ(q.id)}
            isSubmitted={!!submitted[q.id]}
          />
        );
      })}

      {/* Drag-drop sequencing */}
      {ddq && (
        isPremium ? (
          <SequenceDragDrop
            q={ddq}
            order={dragOrder}
            onReorder={setDragOrder}
            onSubmit={() => onSubmitDragDrop(ddq.id)}
            isSubmitted={!!submitted[ddq.id]}
          />
        ) : (
          <div className="relative overflow-hidden rounded-xl border border-border bg-card p-5">
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/85 backdrop-blur-sm">
              <span className="text-2xl">🔒</span>
              <Link href="/account" className="text-sm font-medium text-teal-400 hover:text-teal-300">
                Unlock full quiz with Premium →
              </Link>
            </div>
            <p className="text-[15px] font-medium text-foreground opacity-20">{ddq.instruction}</p>
          </div>
        )
      )}

      {/* Written response */}
      {written && (
        isPremium ? (
          <WrittenResponseComponent
            q={written}
            grading={writtenGrading[written.id] ?? null}
            onSubmit={(response) => onSubmitWritten(written.id, response)}
          />
        ) : (
          <div className="relative overflow-hidden rounded-xl border border-border bg-card p-5">
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/85 backdrop-blur-sm">
              <span className="text-2xl">🔒</span>
              <Link href="/account" className="text-sm font-medium text-teal-400 hover:text-teal-300">
                Unlock AI grading with Premium →
              </Link>
            </div>
            <p className="text-[15px] font-medium text-foreground opacity-20">{written.question}</p>
          </div>
        )
      )}
    </div>
  );
}

// ─── Completion screen ────────────────────────────────────────────────────────

function CompletionScreen({
  score,
  maxScore,
  cs,
  questionBreakdown,
}: {
  score: number;
  maxScore: number;
  cs: CaseStudy;
  questionBreakdown: { label: string; earned: number; max: number }[];
}) {
  const pct = maxScore > 0 ? score / maxScore : 0;
  const badge =
    pct >= 0.86
      ? { text: "🏆 Excellent — MCAT Ready", cls: "text-yellow-300" }
      : pct >= 0.71
        ? { text: "⭐ Strong Understanding", cls: "text-teal-300" }
        : pct >= 0.43
          ? { text: "📚 Good Start — Review Recommended", cls: "text-blue-300" }
          : { text: "🔄 Keep Studying", cls: "text-muted-foreground" };

  return (
    <div
      className="flex flex-col items-center gap-8 rounded-2xl border border-teal-800 bg-teal-950/10 p-10 text-center"
      style={{ animation: "cs-fade-in 0.4s ease forwards" }}
    >
      <span className="text-6xl">✅</span>

      <div className="flex flex-col gap-1">
        <h2 className="text-[28px] font-bold text-foreground">Case Study Complete!</h2>
        <p className={cn("text-sm font-semibold", badge.cls)}>{badge.text}</p>
      </div>

      {/* Score card */}
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-xl border border-border bg-card p-5">
        <p className="text-2xl font-bold text-foreground">
          {score} <span className="text-muted-foreground">/ {maxScore} points</span>
        </p>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-teal-500 transition-all duration-500"
            style={{ width: `${pct * 100}%` }}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          {questionBreakdown.map((item) => (
            <div key={item.label} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{item.label}</span>
              <span className={item.earned === item.max ? "text-green-400" : "text-muted-foreground"}>
                {item.earned} / {item.max}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        {cs.historyEraId && (
          <Link
            href="/history"
            className="rounded-lg border border-yellow-700 bg-yellow-950/30 px-5 py-2.5 text-sm font-semibold text-yellow-300 transition-colors hover:bg-yellow-950/50"
          >
            📖 Read the Historical Account →
          </Link>
        )}
        <Link
          href="/case-studies"
          className="rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-600"
        >
          Try Another Case Study →
        </Link>
      </div>
    </div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function Sidebar({
  cs,
  activeSection,
  setActiveSection,
  completedSections,
  score,
  maxScore,
}: {
  cs: CaseStudy;
  activeSection: number;
  setActiveSection: (i: number) => void;
  completedSections: Set<number>;
  score: number;
  maxScore: number;
}) {
  return (
    <div className="flex w-56 shrink-0 flex-col gap-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-teal-400/80">
        {cs.title}
      </p>

      <div className="flex flex-col gap-0.5">
        {cs.sections.map((section, i) => {
          const isActive = activeSection === i;
          const isDone = completedSections.has(i);
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveSection(i)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                isActive
                  ? "border-l-2 border-teal-400 bg-teal-950/30 pl-2.5 font-medium text-foreground"
                  : isDone
                    ? "text-muted-foreground hover:text-foreground"
                    : "text-muted-foreground hover:text-foreground",
              )}
            >
              {isDone && !isActive && (
                <span className="shrink-0 text-xs text-teal-500">✓</span>
              )}
              {section.title}
            </button>
          );
        })}
      </div>

      {/* Score */}
      <div className="rounded-lg border border-yellow-800/40 bg-yellow-950/10 px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-yellow-400/70">
          Score
        </p>
        <p className="mt-0.5 text-sm font-bold text-yellow-300">
          {score} / {maxScore} pts
        </p>
      </div>

      {/* History link */}
      {cs.historyEraId && (
        <Link
          href="/history"
          className="text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          📖 Read the History
        </Link>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CaseStudyPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const cs = CASE_STUDIES.find((c) => c.id === id) as CaseStudy | undefined;

  const [ready, setReady] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  // Quiz state
  const [activeSection, setActiveSection] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});
  const [score, setScore] = useState(0);
  const [showCompletion, setShowCompletion] = useState(false);
  const [dragOrder, setDragOrder] = useState<number[]>([]);
  const [writtenGrading, setWrittenGrading] = useState<Record<string, {
    score: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
    loading: boolean;
  }>>({});
  const [completedSections, setCompletedSections] = useState<Set<number>>(new Set());

  // Auth + premium check
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push("/signup");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_premium")
        .eq("id", user.id)
        .single();
      setIsPremium(profile?.is_premium ?? false);
      setReady(true);
    });
  }, [router]);

  // Initialize drag order from questions
  useEffect(() => {
    if (!cs) return;
    const ddq = cs.questions.find((q): q is DragDropQuestion => q.type === "dragdrop");
    if (ddq) {
      const indices = [...Array(ddq.items.length).keys()];
      setDragOrder([...indices].sort(() => Math.random() - 0.5));
    }
  }, [cs]);

  // Compute score whenever answers or writtenGrading changes
  useEffect(() => {
    if (!cs) return;
    let total = 0;
    for (const q of cs.questions) {
      if (!submitted[q.id]) continue;
      if (q.type === "mcq") {
        const mq = q as MCQQuestion;
        if (answers[q.id] === mq.correctIndex) total += mq.points;
      } else if (q.type === "dragdrop") {
        const dq = q as DragDropQuestion;
        const correct = dragOrder.every((itemIdx, pos) => dq.correctOrder[pos] === itemIdx);
        if (correct) total += dq.points;
      } else if (q.type === "written") {
        total += writtenGrading[q.id]?.score ?? 0;
      }
    }
    setScore(total);
  }, [cs, answers, submitted, dragOrder, writtenGrading]);

  // Mark section as completed when navigating away
  function handleSectionChange(i: number) {
    setCompletedSections((prev) => new Set([...prev, activeSection]));
    setActiveSection(i);
  }

  // Check if all questions submitted
  useEffect(() => {
    if (!cs || !isPremium) return;
    const allDone = cs.questions.every((q) => {
      if (q.type === "written") return !!writtenGrading[q.id] && !writtenGrading[q.id]?.loading;
      return !!submitted[q.id];
    });
    if (allDone && cs.questions.length > 0) setShowCompletion(true);
  }, [cs, submitted, writtenGrading, isPremium]);

  if (!cs) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Case study not found.</p>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  // Compute max score
  const maxScore = cs.questions.reduce((sum, q) => sum + q.points, 0);

  // Breakdown for completion screen
  const questionBreakdown = cs.questions.map((q) => {
    let earned = 0;
    if (q.type === "mcq") {
      const mq = q as MCQQuestion;
      if (submitted[q.id] && answers[q.id] === mq.correctIndex) earned = mq.points;
    } else if (q.type === "dragdrop") {
      const dq = q as DragDropQuestion;
      if (submitted[q.id]) {
        const correct = dragOrder.every((itemIdx, pos) => dq.correctOrder[pos] === itemIdx);
        if (correct) earned = dq.points;
      }
    } else if (q.type === "written") {
      earned = writtenGrading[q.id]?.score ?? 0;
    }
    const label =
      q.type === "mcq"
        ? `MCQ: ${(q as MCQQuestion).question.slice(0, 40)}…`
        : q.type === "dragdrop"
          ? "Sequencing exercise"
          : "Written response";
    return { label, earned, max: q.points };
  });

  // Event handlers
  function handleSelect(qId: string, idx: number) {
    setAnswers((prev) => ({ ...prev, [qId]: idx }));
  }

  function handleSubmitMCQ(qId: string) {
    setSubmitted((prev) => ({ ...prev, [qId]: true }));
  }

  function handleSubmitDragDrop(qId: string) {
    setSubmitted((prev) => ({ ...prev, [qId]: true }));
  }

  async function handleSubmitWritten(qId: string, response: string) {
    const wq = cs.questions.find((q) => q.id === qId) as WrittenQuestion | undefined;
    if (!wq) return;
    setWrittenGrading((prev) => ({
      ...prev,
      [qId]: { score: 0, feedback: "", strengths: [], improvements: [], loading: true },
    }));
    try {
      const res = await fetch("/api/grade-written-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: wq.question,
          gradingCriteria: wq.gradingCriteria,
          studentResponse: response,
        }),
      });
      const data = (await res.json()) as {
        score?: number;
        feedback?: string;
        strengths?: string[];
        improvements?: string[];
        error?: string;
      };
      setWrittenGrading((prev) => ({
        ...prev,
        [qId]: {
          score: data.score ?? 0,
          feedback: data.feedback ?? "Unable to grade. Please try again.",
          strengths: data.strengths ?? [],
          improvements: data.improvements ?? [],
          loading: false,
        },
      }));
    } catch {
      setWrittenGrading((prev) => ({
        ...prev,
        [qId]: {
          score: 0,
          feedback: "Grading failed. Please try again.",
          strengths: [],
          improvements: [],
          loading: false,
        },
      }));
    }
  }

  // Render active section content
  function renderSection() {
    if (showCompletion) {
      return (
        <CompletionScreen
          score={score}
          maxScore={maxScore}
          cs={cs}
          questionBreakdown={questionBreakdown}
        />
      );
    }

    const section = cs.sections[activeSection];
    return (
      <div className="flex flex-col gap-6">
        <PatientProfileCard cs={cs} collapseOnMount={activeSection > 0} />

        {section?.id === "background" && <BackgroundSection />}
        {section?.id === "enzyme" && <EnzymeSection isPremium={isPremium} />}
        {section?.id === "inhibitor" && <InhibitorSection />}
        {section?.id === "patient" && <PatientSection />}
        {section?.id === "which-drugs" && <WhichDrugsSection isPremium={isPremium} />}
        {section?.id === "quiz" && (
          <QuizSection
            cs={cs}
            answers={answers}
            submitted={submitted}
            dragOrder={dragOrder}
            setDragOrder={setDragOrder}
            writtenGrading={writtenGrading}
            isPremium={isPremium}
            onSelect={handleSelect}
            onSubmitMCQ={handleSubmitMCQ}
            onSubmitDragDrop={handleSubmitDragDrop}
            onSubmitWritten={handleSubmitWritten}
          />
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between border-t border-border pt-4">
          <button
            type="button"
            onClick={() => handleSectionChange(Math.max(0, activeSection - 1))}
            disabled={activeSection === 0}
            className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-muted-foreground hover:text-foreground disabled:opacity-30"
          >
            ← Previous
          </button>
          {activeSection < cs.sections.length - 1 && (
            <button
              type="button"
              onClick={() => handleSectionChange(activeSection + 1)}
              className="rounded-lg bg-teal-700 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-600"
            >
              Next: {cs.sections[activeSection + 1]?.title} →
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-5xl flex-col gap-6 px-6 py-12">
      {/* Page header */}
      <div className="flex flex-col gap-1">
        <Link
          href="/case-studies"
          className="mb-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Case Studies
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">{cs.title}</h1>
          <span className="rounded-full border border-yellow-700 bg-yellow-950/30 px-2.5 py-0.5 text-xs font-medium text-yellow-300">
            {cs.targetLevel}
          </span>
          <span className="text-xs text-muted-foreground">⏱ {cs.estimatedMinutes} min</span>
        </div>
        <p className="text-sm text-muted-foreground">{cs.subtitle}</p>
      </div>

      {/* Two-column layout */}
      <div className="flex gap-8">
        {/* Main content */}
        <div className="min-w-0 flex-1">{renderSection()}</div>

        {/* Sidebar */}
        <Sidebar
          cs={cs}
          activeSection={activeSection}
          setActiveSection={handleSectionChange}
          completedSections={completedSections}
          score={score}
          maxScore={maxScore}
        />
      </div>
    </main>
  );
}
