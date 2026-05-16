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
@keyframes cr-spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
@keyframes cr-flow-right {
  0%   { transform: translateX(0px); opacity: 0; }
  8%   { opacity: 1; }
  88%  { opacity: 1; }
  100% { transform: translateX(340px); opacity: 0; }
}
@keyframes cr-pump-up {
  0%   { transform: translateY(0px); opacity: 0; }
  8%   { opacity: 1; }
  88%  { opacity: 1; }
  100% { transform: translateY(-32px); opacity: 0; }
}
@keyframes ss-float {
  0%   { transform: translateY(0px); opacity: 0; }
  10%  { opacity: 1; }
  85%  { opacity: 1; }
  100% { transform: translateY(50px); opacity: 0; }
}
@keyframes ss-pulse-r {
  0%, 100% { opacity: 0.5; }
  50%       { opacity: 1; }
}
@keyframes ss-fade-stage {
  from { opacity: 0; transform: translateY(4px); }
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
    <div className="overflow-hidden rounded-xl border border-border bg-card" style={{ width: "100%", overflowX: "hidden" }}>
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
          <div ref={popupRef} className="relative flex flex-col items-center gap-2">
            <button
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
      <div className="overflow-hidden rounded-xl border border-border bg-card p-4" style={{ width: "100%", overflowX: "hidden" }}>
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
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5" style={{ width: "100%", overflowX: "hidden" }}>
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

// ─── CR Section: Background ───────────────────────────────────────────────────

function CRBackgroundSection() {
  return (
    <div className="flex flex-col gap-6" style={{ animation: "cs-fade-in 0.3s ease forwards" }}>
      <h2 className="text-2xl font-bold">What is Cellular Respiration?</h2>
      <p className="leading-relaxed text-muted-foreground">
        Every movement you make, every thought you have, every heartbeat — all powered by a
        molecule called <strong className="text-foreground">ATP</strong> (adenosine
        triphosphate). Your cells produce ATP by breaking down glucose through a process called
        cellular respiration. Without a continuous supply of ATP, cells begin to die within
        seconds.
      </p>
      {/* Mitochondria SVG */}
      <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-5" style={{ width: "100%", overflowX: "hidden" }}>
        <svg width="100%" viewBox="0 0 340 140">
          <ellipse cx="170" cy="68" rx="130" ry="50" fill="rgba(30,41,59,0.9)" stroke="rgb(100,116,139)" strokeWidth="2"/>
          <path d="M58,68 Q74,48 90,68 Q106,88 122,68 Q138,48 154,68 Q170,88 186,68 Q202,48 218,68 Q234,88 250,68 Q262,53 270,68"
                fill="none" stroke="rgba(20,184,166,0.75)" strokeWidth="2.5"/>
          <path d="M58,68 Q74,88 90,68 Q106,48 122,68 Q138,88 154,68 Q170,48 186,68 Q202,88 218,68 Q234,48 250,68 Q262,83 270,68"
                fill="none" stroke="rgba(20,184,166,0.4)" strokeWidth="1.5" strokeDasharray="4,3"/>
          <text x="170" y="122" textAnchor="middle" fontSize="11" fill="rgb(148,163,184)">Mitochondria — ATP factory of the cell</text>
          <rect x="12" y="56" width="32" height="22" rx="5" fill="rgba(234,179,8,0.75)"/>
          <text x="28" y="70" textAnchor="middle" fontSize="8" fill="white" fontWeight="bold">Glucose</text>
          <text x="47" y="70" fontSize="13" fill="rgba(148,163,184,0.7)">→</text>
          <text x="291" y="70" fontSize="13" fill="rgba(148,163,184,0.7)">→</text>
          <rect x="302" y="56" width="30" height="22" rx="11" fill="rgba(59,130,246,0.75)" style={{ animation: "cs-pulse-teal 2s ease-in-out infinite" }}/>
          <text x="317" y="70" textAnchor="middle" fontSize="9" fill="white" fontWeight="bold">ATP</text>
        </svg>
        <p className="text-xs text-muted-foreground">Glucose enters → ATP energy exits</p>
      </div>
      <p className="leading-relaxed text-muted-foreground">
        Cellular respiration has three main stages:{" "}
        <strong className="text-foreground">Glycolysis</strong> (in the cytoplasm),
        the <strong className="text-foreground">Krebs Cycle</strong> (in the mitochondrial
        matrix), and the <strong className="text-foreground">Electron Transport Chain</strong>{" "}
        (on the inner mitochondrial membrane). Each stage feeds into the next.
      </p>
      {/* Stage overview row */}
      <div className="flex items-stretch gap-2">
        {[
          { n: "1", name: "Glycolysis", loc: "Cytoplasm", out: "2 ATP", bdr: "border-yellow-700", bg: "bg-yellow-950/20", txt: "text-yellow-300" },
          { n: "2", name: "Krebs Cycle", loc: "Mitochondrial matrix", out: "NADH · FADH₂", bdr: "border-orange-700", bg: "bg-orange-950/20", txt: "text-orange-300" },
          { n: "3", name: "ETC + ATP Synthase", loc: "Inner membrane", out: "~32 ATP", bdr: "border-teal-700", bg: "bg-teal-950/20", txt: "text-teal-300" },
        ].map((s) => (
          <div key={s.n} className={`flex flex-1 flex-col gap-1 rounded-xl border p-3 ${s.bdr} ${s.bg}`}>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${s.txt}`}>Stage {s.n}</span>
            <span className="text-sm font-semibold text-foreground">{s.name}</span>
            <span className="text-[11px] text-muted-foreground">{s.loc}</span>
            <span className={`mt-auto pt-2 text-xs font-medium ${s.txt}`}>{s.out}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── CR Section: Glycolysis ────────────────────────────────────────────────────

function CRGlycolysisSection() {
  return (
    <div className="flex flex-col gap-6" style={{ animation: "cs-fade-in 0.3s ease forwards" }}>
      <h2 className="text-2xl font-bold">Glycolysis: Splitting Glucose</h2>
      <p className="leading-relaxed text-muted-foreground">
        Glycolysis happens in the cytoplasm — no mitochondria needed. A glucose molecule
        (6 carbons) is split into two pyruvate molecules (3 carbons each). The process has
        three phases:
      </p>
      {/* Phase cards */}
      <div className="flex flex-col gap-3">
        {[
          { icon: "🔋", phase: "Phase 1", title: "Energy Investment", body: "2 ATP are spent to activate glucose. Think of it as starting a fire — you need a spark first.", bdr: "border-red-800", bg: "bg-red-950/20", txt: "text-red-300" },
          { icon: "⚡", phase: "Phase 2", title: "Cleavage", body: "The 6-carbon glucose molecule splits into two 3-carbon pyruvate molecules.", bdr: "border-yellow-700", bg: "bg-yellow-950/20", txt: "text-yellow-300" },
          { icon: "✅", phase: "Phase 3", title: "Energy Payoff", body: "4 ATP and 2 NADH are produced. Net gain: 2 ATP, 2 NADH, and 2 pyruvate molecules.", bdr: "border-green-700", bg: "bg-green-950/20", txt: "text-green-300" },
        ].map((p) => (
          <div key={p.phase} className={`flex items-start gap-3 rounded-xl border p-4 ${p.bdr} ${p.bg}`}>
            <span className="mt-0.5 text-xl">{p.icon}</span>
            <div>
              <p className={`font-semibold ${p.txt}`}>{p.phase}: {p.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{p.body}</p>
            </div>
          </div>
        ))}
      </div>
      {/* Net gain */}
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="mb-3 text-sm font-semibold text-foreground">Net Gain from Glycolysis (per glucose)</p>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-muted p-3">
            <p className="text-xl font-bold text-red-400">−2</p>
            <p className="mt-1 text-xs text-muted-foreground">ATP invested</p>
          </div>
          <div className="rounded-lg bg-muted p-3">
            <p className="text-xl font-bold text-green-400">+4</p>
            <p className="mt-1 text-xs text-muted-foreground">ATP produced</p>
          </div>
          <div className="rounded-lg border border-teal-700 bg-teal-950/20 p-3">
            <p className="text-xl font-bold text-teal-400">+2</p>
            <p className="mt-1 text-xs text-muted-foreground">Net ATP</p>
          </div>
        </div>
        <div className="mt-2 rounded-lg bg-muted p-3 text-center text-sm text-muted-foreground">
          Also produces:{" "}
          <span className="font-medium text-yellow-300">2 NADH</span> (→ ETC later) and{" "}
          <span className="font-medium text-orange-300">2 Pyruvate</span> (→ Krebs Cycle)
        </div>
      </div>
      {/* Key fact */}
      <div className="rounded-xl border border-blue-800 bg-blue-950/20 p-4">
        <p className="text-sm font-semibold text-blue-300">🔑 Glycolysis Does Not Require Oxygen</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Glycolysis is the only stage that can occur without oxygen. This is the basis of
          anaerobic respiration — during intense exercise, cells produce lactate from pyruvate
          when oxygen runs short. It is far less efficient: just 2 ATP versus the ~36 ATP
          from full aerobic respiration.
        </p>
      </div>
    </div>
  );
}

// ─── CR Section: Krebs Cycle ──────────────────────────────────────────────────

function CRKrebsSection() {
  return (
    <div className="flex flex-col gap-6" style={{ animation: "cs-fade-in 0.3s ease forwards" }}>
      <h2 className="text-2xl font-bold">The Krebs Cycle: Harvesting Electrons</h2>
      <p className="leading-relaxed text-muted-foreground">
        Each pyruvate from glycolysis enters the mitochondria and is converted to a 2-carbon
        molecule called <strong className="text-foreground">Acetyl-CoA</strong>, releasing one
        CO₂. Acetyl-CoA then enters the Krebs cycle — a circular series of reactions that
        extracts electrons and loads them onto carrier molecules (NADH, FADH₂) to power the ETC.
      </p>
      {/* Cycle SVG */}
      <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-5" style={{ width: "100%", overflowX: "hidden" }}>
        <svg width="100%" viewBox="0 0 310 295">
          {/* Cycle ring */}
          <circle cx="155" cy="148" r="74" fill="none" stroke="rgba(20,184,166,0.35)" strokeWidth="2" strokeDasharray="6,4"/>
          {/* Center */}
          <ellipse cx="155" cy="148" rx="40" ry="26" fill="rgba(20,184,166,0.12)" stroke="rgba(20,184,166,0.5)" strokeWidth="1.5"/>
          <text x="155" y="144" textAnchor="middle" fontSize="10" fill="rgb(94,234,212)" fontWeight="bold">Krebs</text>
          <text x="155" y="156" textAnchor="middle" fontSize="10" fill="rgb(94,234,212)" fontWeight="bold">Cycle</text>
          {/* Orbiting molecule */}
          <g style={{ transformOrigin: "155px 148px", animation: "cr-spin 6s linear infinite" }}>
            <circle cx="155" cy="74" r="8" fill="rgba(234,179,8,0.9)" stroke="rgba(234,179,8,0.4)" strokeWidth="1.5"/>
          </g>
          {/* Acetyl-CoA input */}
          <path d="M155,6 L155,66" stroke="rgba(234,179,8,0.55)" strokeWidth="1.5" strokeDasharray="3,2"/>
          <polygon points="150,64 160,64 155,74" fill="rgba(234,179,8,0.65)"/>
          <text x="155" y="5" textAnchor="middle" fontSize="10" fill="rgba(234,179,8,0.9)" fontWeight="bold">Acetyl-CoA</text>
          {/* CO₂ exits — left */}
          <path d="M90,112 L52,92" stroke="rgba(148,163,184,0.45)" strokeWidth="1.5" strokeDasharray="3,2"/>
          <text x="8" y="89" textAnchor="middle" fontSize="10" fill="rgba(148,163,184,0.85)">CO₂ ×2</text>
          {/* NADH exits — right */}
          <path d="M224,130 L268,112" stroke="rgba(234,179,8,0.5)" strokeWidth="1.5" strokeDasharray="3,2"/>
          <text x="302" y="109" textAnchor="start" fontSize="10" fill="rgba(234,179,8,0.9)">NADH ×3</text>
          {/* FADH₂ exits — bottom right */}
          <path d="M218,178 L258,202" stroke="rgba(251,146,60,0.5)" strokeWidth="1.5" strokeDasharray="3,2"/>
          <text x="280" y="222" textAnchor="start" fontSize="10" fill="rgba(251,146,60,0.9)">FADH₂ ×1</text>
          {/* ATP exits — bottom */}
          <path d="M155,222 L155,258" stroke="rgba(96,165,250,0.5)" strokeWidth="1.5" strokeDasharray="3,2"/>
          <text x="155" y="285" textAnchor="middle" fontSize="10" fill="rgba(96,165,250,0.9)">ATP ×1</text>
        </svg>
        <p className="text-xs text-muted-foreground">Per turn of the cycle — runs twice per glucose molecule</p>
      </div>
      {/* Output tally */}
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="mb-3 text-sm font-semibold text-foreground">Total outputs per glucose (2 full turns)</p>
        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            { val: "6", label: "CO₂ released", color: "text-slate-400" },
            { val: "6", label: "NADH produced", color: "text-yellow-300" },
            { val: "2", label: "FADH₂ produced", color: "text-orange-300" },
            { val: "2", label: "ATP produced", color: "text-blue-300" },
          ].map((o) => (
            <div key={o.label} className="rounded-lg bg-muted p-2">
              <p className={`text-xl font-bold ${o.color}`}>{o.val}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">{o.label}</p>
            </div>
          ))}
        </div>
      </div>
      {/* Key insight */}
      <div className="rounded-xl border border-yellow-800 bg-yellow-950/20 p-4">
        <p className="text-sm font-semibold text-yellow-300">💡 The Krebs Cycle&apos;s Real Job</p>
        <p className="mt-1 text-sm text-muted-foreground">
          The Krebs cycle produces very little ATP directly. Its real job is loading up NADH
          and FADH₂ — electron carriers that will deliver their energy to the ETC, where most
          of the cell&apos;s ATP is made. Think of NADH and FADH₂ as rechargeable batteries
          being charged here to be spent in the next stage.
        </p>
      </div>
    </div>
  );
}

// ─── CR Section: Electron Transport Chain ─────────────────────────────────────

function CRETCSection() {
  return (
    <div className="flex flex-col gap-6" style={{ animation: "cs-fade-in 0.3s ease forwards" }}>
      <h2 className="text-2xl font-bold">The Electron Transport Chain: The ATP Factory</h2>
      <p className="leading-relaxed text-muted-foreground">
        This is where approximately 90% of cellular ATP is made. The inner mitochondrial
        membrane is studded with four protein complexes (I–IV) and ATP synthase. NADH and
        FADH₂ donate their electrons here — those electrons release energy as they flow
        through the complexes, pumping H⁺ ions that drive ATP synthesis.
      </p>
      {/* ETC SVG */}
      <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-4" style={{ width: "100%", overflowX: "hidden" }}>
        <svg width="100%" viewBox="0 0 700 280" style={{ maxHeight: 300 }}>
          {/* Zone labels */}
          <text x="350" y="13" textAnchor="middle" fontSize="9" fill="rgba(251,146,60,0.7)">Intermembrane Space — High H⁺ concentration</text>
          <text x="350" y="272" textAnchor="middle" fontSize="9" fill="rgba(148,163,184,0.6)">Matrix — Low H⁺ concentration</text>
          {/* Membrane band */}
          <rect x="10" y="115" width="680" height="28" rx="3" fill="rgba(30,41,59,0.95)" stroke="rgba(100,116,139,0.45)" strokeWidth="1.5"/>
          {/* Complex I */}
          <rect x="30" y="40" width="80" height="75" rx="5" fill="rgba(20,184,166,0.15)" stroke="rgba(20,184,166,0.65)" strokeWidth="1.5"/>
          <text x="70" y="73" textAnchor="middle" fontSize="9" fill="rgb(94,234,212)" fontWeight="bold">I</text>
          <text x="70" y="156" textAnchor="middle" fontSize="9" fill="rgb(94,234,212)" fontWeight="bold">Complex I</text>
          <text x="70" y="170" textAnchor="middle" fontSize="8" fill="rgba(234,179,8,0.8)">NADH in</text>
          {/* Complex II */}
          <rect x="145" y="60" width="80" height="55" rx="5" fill="rgba(20,184,166,0.12)" stroke="rgba(20,184,166,0.5)" strokeWidth="1.5"/>
          <text x="185" y="90" textAnchor="middle" fontSize="9" fill="rgb(94,234,212)" fontWeight="bold">II</text>
          <text x="185" y="156" textAnchor="middle" fontSize="9" fill="rgb(94,234,212)" fontWeight="bold">Complex II</text>
          <text x="185" y="170" textAnchor="middle" fontSize="8" fill="rgba(251,146,60,0.8)">FADH₂ in</text>
          {/* Complex III */}
          <rect x="265" y="45" width="80" height="70" rx="5" fill="rgba(20,184,166,0.15)" stroke="rgba(20,184,166,0.65)" strokeWidth="1.5"/>
          <text x="305" y="83" textAnchor="middle" fontSize="9" fill="rgb(94,234,212)" fontWeight="bold">III</text>
          <text x="305" y="156" textAnchor="middle" fontSize="9" fill="rgb(94,234,212)" fontWeight="bold">Complex III</text>
          {/* Complex IV */}
          <rect x="390" y="30" width="80" height="85" rx="5" fill="rgba(20,184,166,0.15)" stroke="rgba(20,184,166,0.65)" strokeWidth="1.5"/>
          <text x="430" y="72" textAnchor="middle" fontSize="9" fill="rgb(94,234,212)" fontWeight="bold">IV</text>
          <text x="430" y="86" textAnchor="middle" fontSize="7" fill="rgba(94,234,212,0.7)">+O₂→H₂O</text>
          <text x="430" y="156" textAnchor="middle" fontSize="9" fill="rgb(94,234,212)" fontWeight="bold">Complex IV</text>
          <text x="430" y="170" textAnchor="middle" fontSize="8" fill="rgba(148,163,184,0.7)">O₂ in</text>
          {/* ATP Synthase — stalk + cap */}
          <rect x="545" y="115" width="60" height="40" rx="4" fill="rgba(59,130,246,0.15)" stroke="rgba(96,165,250,0.6)" strokeWidth="1.5"/>
          <ellipse cx="575" cy="100" rx="36" ry="18" fill="rgba(59,130,246,0.15)" stroke="rgba(96,165,250,0.55)" strokeWidth="1.5"/>
          <text x="575" y="97" textAnchor="middle" fontSize="8" fill="rgb(147,197,253)">ATP</text>
          <text x="575" y="109" textAnchor="middle" fontSize="8" fill="rgb(147,197,253)">Synthase</text>
          <text x="575" y="170" textAnchor="middle" fontSize="8" fill="rgba(96,165,250,0.8)">ATP out</text>
          {/* Electron flow — animated dots */}
          {[0, 1, 2].map((i) => (
            <g key={i} style={{ animation: `cr-flow-right 2.8s ease-in-out ${i * 0.9}s infinite` }}>
              <circle cx="38" cy="77" r="5" fill="rgba(234,179,8,0.9)"/>
            </g>
          ))}
          {/* H⁺ pumping indicators */}
          {[70, 305, 430].map((x, i) => (
            <g key={x} style={{ animation: `cr-pump-up 2.2s ease-in-out ${i * 0.5}s infinite` }}>
              <circle cx={x} cy="114" r="5" fill="rgba(251,146,60,0.85)"/>
              <text x={x} y="112" textAnchor="middle" fontSize="6" fill="white">H⁺</text>
            </g>
          ))}
          {/* Accumulated H⁺ and chemiosmosis arrow */}
          <text x="230" y="35" textAnchor="middle" fontSize="9" fill="rgba(251,146,60,0.65)">H⁺  H⁺  H⁺  H⁺  H⁺</text>
          <path d="M575,115 L575,88" stroke="rgba(251,146,60,0.5)" strokeWidth="1.5" strokeDasharray="3,2"/>
          <polygon points="570,86 580,86 575,76" fill="rgba(251,146,60,0.55)"/>
          <text x="575" y="68" textAnchor="middle" fontSize="8" fill="rgba(251,146,60,0.75)">H⁺ flows back</text>
          <text x="575" y="220" textAnchor="middle" fontSize="8" fill="rgba(96,165,250,0.75)">→ ~32 ATP</text>
        </svg>
        <p className="text-xs text-muted-foreground">Electrons (yellow) flow right → H⁺ (orange) pumps up → returns through ATP synthase → ATP</p>
      </div>
      {/* Chemiosmosis explanation */}
      <div className="rounded-xl border border-orange-800 bg-orange-950/20 p-4">
        <p className="text-sm font-semibold text-orange-300">⚡ The Proton Gradient (Chemiosmosis)</p>
        <p className="mt-1 text-sm text-muted-foreground">
          As electrons flow through the complexes, H⁺ ions are pumped from the matrix into
          the intermembrane space, building a concentration gradient — like water behind a
          dam. When H⁺ flows back through ATP synthase, the energy spins its rotor and
          drives ATP production. This is called <strong className="text-foreground">chemiosmosis</strong>.
        </p>
      </div>
      {/* Output */}
      <div className="rounded-xl border border-teal-800 bg-teal-950/20 p-4">
        <p className="mb-3 text-sm font-semibold text-teal-300">ETC output per glucose</p>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { val: "~32", label: "ATP produced", color: "text-teal-400" },
            { val: "H₂O", label: "Water byproduct", color: "text-blue-400" },
            { val: "NAD⁺", label: "Recycled to Krebs", color: "text-yellow-400" },
          ].map((o) => (
            <div key={o.label} className="rounded-lg bg-card p-3">
              <p className={`text-xl font-bold ${o.color}`}>{o.val}</p>
              <p className="mt-1 text-xs text-muted-foreground">{o.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── CR Section: Poison ───────────────────────────────────────────────────────

function CRPoisonSection() {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 2000);
    const t2 = setTimeout(() => setStage(2), 4500);
    const t3 = setTimeout(() => setStage(3), 7000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  function restart() {
    setStage(0);
    setTimeout(() => setStage(1), 2000);
    setTimeout(() => setStage(2), 4500);
    setTimeout(() => setStage(3), 7000);
  }

  const stageLabel = stage === 0
    ? "Normal ETC operation"
    : stage === 1
      ? "Cyanide binds Complex IV — electron flow stops"
      : stage === 2
        ? "Cascade failure: ETC backs up, H⁺ gradient collapses"
        : "ATP synthesis: 0 — cells begin dying; O₂ remains unused";

  return (
    <div className="flex flex-col gap-6" style={{ animation: "cs-fade-in 0.3s ease forwards" }}>
      <h2 className="text-2xl font-bold">Cyanide: The Perfect Killer</h2>
      <p className="leading-relaxed text-muted-foreground">
        Cyanide (CN⁻) is one of the most acutely toxic substances known. A lethal dose is
        measured in milligrams. Its mechanism is devastatingly precise — it targets the most
        critical step in cellular respiration and shuts down ATP production entirely.
      </p>

      {/* Animated ETC with cyanide */}
      <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-4" style={{ width: "100%", overflowX: "hidden" }}>
        <div className="flex w-full items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground">
            Stage {Math.min(stage + 1, 4)} of 4: {stageLabel}
          </p>
          <button
            type="button"
            onClick={restart}
            className="text-[10px] text-teal-400 transition-colors hover:text-teal-300"
          >
            ↺ Replay
          </button>
        </div>
        <svg width="100%" viewBox="0 0 420 180">
          {/* Membrane */}
          <rect x="10" y="80" width="400" height="24" rx="3" fill="rgba(30,41,59,0.95)" stroke="rgba(100,116,139,0.4)" strokeWidth="1.5"/>
          {/* Complex I */}
          <rect x="18" y="22" width="55" height="58" rx="4"
                fill={stage >= 2 ? "rgba(239,68,68,0.2)" : "rgba(20,184,166,0.15)"}
                stroke={stage >= 2 ? "rgb(239,68,68)" : "rgba(20,184,166,0.6)"}
                strokeWidth="1.5" style={{ transition: "all 0.8s ease" }}/>
          <text x="45" y="46" textAnchor="middle" fontSize="8" fill={stage >= 2 ? "rgb(252,165,165)" : "rgb(94,234,212)"} fontWeight="bold">Complex I</text>
          {stage >= 2 && <text x="45" y="62" textAnchor="middle" fontSize="13">❌</text>}
          {/* Complex II */}
          <rect x="96" y="38" width="44" height="42" rx="4"
                fill="rgba(20,184,166,0.12)" stroke="rgba(20,184,166,0.45)" strokeWidth="1.5"/>
          <text x="118" y="62" textAnchor="middle" fontSize="8" fill="rgb(94,234,212)" fontWeight="bold">II</text>
          {/* Complex III */}
          <rect x="164" y="26" width="55" height="54" rx="4"
                fill={stage >= 2 ? "rgba(239,68,68,0.15)" : "rgba(20,184,166,0.15)"}
                stroke={stage >= 2 ? "rgba(239,68,68,0.7)" : "rgba(20,184,166,0.6)"}
                strokeWidth="1.5" style={{ transition: "all 0.8s ease" }}/>
          <text x="191" y="50" textAnchor="middle" fontSize="8" fill={stage >= 2 ? "rgb(252,165,165)" : "rgb(94,234,212)"} fontWeight="bold">Complex III</text>
          {stage >= 2 && <text x="191" y="66" textAnchor="middle" fontSize="12">⚠️</text>}
          {/* Complex IV — main target */}
          <rect x="244" y="14" width="64" height="66" rx="4"
                fill={stage >= 1 ? "rgba(239,68,68,0.25)" : "rgba(20,184,166,0.15)"}
                stroke={stage >= 1 ? "rgb(239,68,68)" : "rgba(20,184,166,0.6)"}
                strokeWidth={stage >= 1 ? 2.5 : 1.5} style={{ transition: "all 0.8s ease" }}/>
          <text x="276" y="38" textAnchor="middle" fontSize="8" fill={stage >= 1 ? "rgb(252,165,165)" : "rgb(94,234,212)"} fontWeight="bold">Complex IV</text>
          {stage === 0 && <text x="276" y="52" textAnchor="middle" fontSize="7" fill="rgba(94,234,212,0.7)">+O₂ → H₂O</text>}
          {stage >= 1 && <text x="276" y="68" textAnchor="middle" fontSize="15">🚫</text>}
          {/* ATP Synthase */}
          <rect x="334" y="38" width="44" height="42" rx="4"
                fill={stage >= 2 ? "rgba(100,116,139,0.12)" : "rgba(59,130,246,0.15)"}
                stroke={stage >= 2 ? "rgba(100,116,139,0.35)" : "rgba(96,165,250,0.6)"}
                strokeWidth="1.5" style={{ transition: "all 0.8s ease" }}/>
          <ellipse cx="356" cy="30" rx="24" ry="12"
                   fill={stage >= 2 ? "rgba(100,116,139,0.1)" : "rgba(59,130,246,0.15)"}
                   stroke={stage >= 2 ? "rgba(100,116,139,0.3)" : "rgba(96,165,250,0.5)"}
                   strokeWidth="1.5" style={{ transition: "all 0.8s ease" }}/>
          <text x="356" y="27" textAnchor="middle" fontSize="8" fill={stage >= 2 ? "rgba(148,163,184,0.4)" : "rgb(147,197,253)"}>ATP syn.</text>
          {stage >= 2 && <text x="356" y="66" textAnchor="middle" fontSize="7" fill="rgba(148,163,184,0.5)">STOPPED</text>}
          {/* ATP output indicator */}
          <text x="356" y="148" textAnchor="middle" fontSize="10" fontWeight="bold"
                fill={stage >= 2 ? "rgb(248,113,113)" : "rgb(94,234,212)"} style={{ transition: "color 0.8s ease" }}>
            {stage >= 2 ? "ATP = 0" : "ATP ↑"}
          </text>
          {/* Cyanide molecule */}
          {stage >= 1 && (
            <g style={{ animation: "cs-fade-in 0.5s ease forwards" }}>
              <rect x="256" y="0" width="40" height="18" rx="9" fill="rgba(239,68,68,0.9)"/>
              <text x="276" y="12" textAnchor="middle" fontSize="9" fill="white" fontWeight="bold">CN⁻</text>
            </g>
          )}
          {/* O₂ paradox — stage 3 */}
          {stage >= 3 && (
            <g style={{ animation: "cs-fade-in 0.5s ease forwards" }}>
              <text x="394" y="50" textAnchor="middle" fontSize="9" fill="rgba(148,163,184,0.8)">O₂</text>
              <text x="394" y="62" textAnchor="middle" fontSize="8" fill="rgba(148,163,184,0.55)">in blood</text>
              <text x="394" y="74" textAnchor="middle" fontSize="8" fill="rgba(148,163,184,0.55)">unused ✗</text>
            </g>
          )}
        </svg>
      </div>

      {/* Oxygen paradox */}
      <div className="rounded-xl border border-red-800 bg-red-950/20 p-4">
        <p className="text-sm font-semibold text-red-300">🩸 The Oxygen Paradox</p>
        <p className="mt-1 text-sm text-muted-foreground">
          With Complex IV blocked, cells cannot accept oxygen even though it is still being
          delivered. Hemoglobin carries oxygen normally — it never offloads it because cells
          refuse it. The blood stays <strong className="text-foreground">bright red</strong>{" "}
          throughout the body. The pulse oximeter measures oxygenated hemoglobin and reads
          normal — while the patient dies of cellular asphyxiation.
        </p>
      </div>

      {/* Symptom boxes */}
      <div className="flex flex-col gap-3">
        {[
          {
            icon: "❤️", label: "Bright Red Skin",
            body: "Blood normally turns dark red after delivering oxygen. With cyanide, cells cannot accept oxygen — hemoglobin stays bright red throughout the body, giving skin an unusually pink or cherry-red appearance.",
            cls: "border-red-800 bg-red-950/15 text-red-300",
          },
          {
            icon: "💨", label: "Rapid Breathing",
            body: "The brain detects zero ATP production and sends an emergency signal to breathe faster. More oxygen floods the blood — but it still cannot be used at the cellular level, so the crisis deepens.",
            cls: "border-blue-800 bg-blue-950/15 text-blue-300",
          },
          {
            icon: "🌰", label: "Almond Smell",
            body: "Hydrogen cyanide (HCN) has a characteristic bitter almond odor. Notably, about 40% of people cannot detect it due to a genetic variation in olfactory receptor OR5AN1.",
            cls: "border-yellow-700 bg-yellow-950/15 text-yellow-300",
          },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border p-4 ${s.cls}`}>
            <p className="font-semibold">{s.icon} {s.label}</p>
            <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
          </div>
        ))}
      </div>

      {/* Treatment */}
      <div className="rounded-xl border border-teal-700 bg-teal-950/20 p-4">
        <p className="text-sm font-semibold text-teal-300">💊 Treatment: Hydroxocobalamin</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Hydroxocobalamin (vitamin B12a) is the first-line antidote. It binds cyanide
          directly in the bloodstream, forming cyanocobalamin which is safely excreted by the
          kidneys. It must be administered within minutes. First responders to industrial
          accidents and smoke inhalation events carry it for exactly this scenario.
        </p>
      </div>
    </div>
  );
}

// ─── Serotonin Storm: Background ─────────────────────────────────────────────

function SSBackgroundSection() {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-bold">Serotonin: The Messenger Gone Wrong</h2>
      <p className="text-sm leading-relaxed text-muted-foreground">
        Serotonin (5-hydroxytryptamine, 5-HT) is a neurotransmitter produced mainly in the
        raphe nuclei of the brainstem and the gastrointestinal tract. It regulates mood, sleep,
        appetite, and pain processing. Like all neurotransmitters, its effects depend entirely on
        precise concentration — too little causes depression, too much causes something far more
        dangerous.
      </p>

      {/* Synapse SVG */}
      <div className="rounded-xl border border-border bg-card p-4" style={{ width: "100%", overflowX: "hidden" }}>
        <svg viewBox="0 0 500 240" width="100%" style={{ maxHeight: 260 }}>
          {/* Presynaptic terminal */}
          <rect x="10" y="30" width="150" height="90" rx="10" fill="rgba(99,102,241,0.15)" stroke="rgba(99,102,241,0.4)" strokeWidth="1.5" />
          <text x="85" y="48" textAnchor="middle" fill="rgba(165,180,252,0.8)" fontSize="11" fontWeight="bold">PRESYNAPTIC</text>
          {/* Vesicles */}
          <circle cx="40" cy="80" r="12" fill="rgba(234,179,8,0.3)" stroke="rgba(234,179,8,0.6)" strokeWidth="1" />
          <circle cx="70" cy="74" r="12" fill="rgba(234,179,8,0.3)" stroke="rgba(234,179,8,0.6)" strokeWidth="1" />
          <circle cx="100" cy="82" r="12" fill="rgba(234,179,8,0.3)" stroke="rgba(234,179,8,0.6)" strokeWidth="1" />
          <text x="70" y="104" textAnchor="middle" fill="rgba(234,179,8,0.7)" fontSize="9">5-HT vesicles</text>
          {/* MAO */}
          <text x="138" y="65" textAnchor="middle" fill="rgba(74,222,128,0.8)" fontSize="9" fontWeight="bold">MAO</text>
          <text x="138" y="77" textAnchor="middle" fill="rgba(74,222,128,0.6)" fontSize="8">breakdown</text>

          {/* Synapse gap */}
          <rect x="165" y="20" width="170" height="100" rx="4" fill="rgba(20,184,166,0.05)" stroke="rgba(20,184,166,0.2)" strokeWidth="1" strokeDasharray="3,3" />
          {/* SYNAPSE label ABOVE the gap */}
          <text x="250" y="15" textAnchor="middle" fill="rgba(94,234,212,0.7)" fontSize="10" fontWeight="bold">SYNAPSE GAP</text>
          {/* SERT */}
          <text x="168" y="90" textAnchor="middle" fill="rgba(96,165,250,0.8)" fontSize="9" fontWeight="bold">SERT</text>
          <text x="168" y="102" textAnchor="middle" fill="rgba(96,165,250,0.6)" fontSize="8">reuptake</text>
          {/* Floating serotonin */}
          <circle cx="210" cy="60" r="7" fill="rgba(234,179,8,0.7)" style={{ animation: "ss-float 2.8s ease-in-out infinite" }} />
          <circle cx="250" cy="75" r="7" fill="rgba(234,179,8,0.7)" style={{ animation: "ss-float 2.8s ease-in-out 0.9s infinite" }} />
          <circle cx="295" cy="58" r="7" fill="rgba(234,179,8,0.7)" style={{ animation: "ss-float 2.8s ease-in-out 1.8s infinite" }} />

          {/* Postsynaptic */}
          <rect x="340" y="30" width="150" height="90" rx="10" fill="rgba(20,184,166,0.1)" stroke="rgba(20,184,166,0.3)" strokeWidth="1.5" />
          <text x="415" y="48" textAnchor="middle" fill="rgba(94,234,212,0.8)" fontSize="11" fontWeight="bold">POSTSYNAPTIC</text>
          {/* Receptors */}
          <path d="M350,85 Q360,68 370,85" stroke="rgba(94,234,212,0.7)" strokeWidth="2" fill="none" />
          <path d="M375,85 Q385,68 395,85" stroke="rgba(94,234,212,0.7)" strokeWidth="2" fill="none" />
          <path d="M400,85 Q410,68 420,85" stroke="rgba(94,234,212,0.7)" strokeWidth="2" fill="none" />
          <text x="385" y="102" textAnchor="middle" fill="rgba(94,234,212,0.6)" fontSize="9">5-HT receptors</text>
          <text x="445" y="72" textAnchor="middle" fill="rgba(74,222,128,0.8)" fontSize="9">signal ✓</text>

          {/* Caption */}
          <text x="250" y="150" textAnchor="middle" fill="rgba(148,163,184,0.7)" fontSize="9">
            Normal signaling: released → binds receptors → cleared by SERT and MAO
          </text>
          <circle cx="205" cy="170" r="5" fill="rgba(234,179,8,0.7)" />
          <text x="215" y="174" fill="rgba(234,179,8,0.6)" fontSize="9">serotonin molecules</text>
        </svg>
      </div>

      {/* 3 mechanism boxes */}
      <h3 className="text-sm font-semibold text-foreground">Three Ways Serotonin Can Accumulate</h3>
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            icon: "🔴",
            title: "Block MAO (MAOIs)",
            body: "MAO inhibitors like phenelzine prevent serotonin breakdown inside the presynaptic terminal.",
          },
          {
            icon: "🔴",
            title: "Block SERT (SSRIs, tramadol)",
            body: "Reuptake blockers prevent serotonin from being cleared from the synapse after release.",
          },
          {
            icon: "⬆️",
            title: "Increase Release (MDMA, some opioids)",
            body: "Some drugs force excess serotonin release from vesicles, flooding the synapse.",
          },
        ].map((m) => (
          <div key={m.title} className="rounded-xl border border-border bg-card p-4">
            <p className="font-semibold text-sm">{m.icon} {m.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">{m.body}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-amber-800/50 bg-amber-950/10 p-4">
        <p className="text-sm font-semibold text-amber-300">💡 Key Insight</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Serotonin syndrome occurs when multiple mechanisms combine. One mechanism alone rarely
          causes a crisis — it is the combination that creates the storm.
        </p>
      </div>
    </div>
  );
}

// ─── Serotonin Storm: MAOI ────────────────────────────────────────────────────

function SSMAOISection() {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 2000);
    const t2 = setTimeout(() => setStage(2), 4500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const [openTerm, setOpenTerm] = useState<string | null>(null);

  const terms: Record<string, string> = {
    "monoamine oxidase": "An enzyme found in nerve terminals, the liver, and the gut wall. It breaks down monoamine neurotransmitters — serotonin, norepinephrine, and dopamine — after they have completed their signaling function.",
    "irreversible inhibition": "A type of enzyme inhibition where the inhibitor forms a permanent covalent bond with the enzyme's active site. Unlike competitive inhibitors which can be displaced, irreversible inhibitors permanently destroy enzyme function.",
    "washout period": "The time required after stopping a drug before it is safe to start another. For MAOIs like phenelzine, this is ~14 days because the enzyme must be synthesized from scratch.",
    "tyramine": "An amino acid found in aged cheeses, cured meats, and fermented foods. Normally broken down by MAO in the gut. When MAO is inhibited by phenelzine, dietary tyramine floods into circulation causing a hypertensive crisis — known as the 'cheese effect.'",
  };

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-bold">Phenelzine: Disabling the Cleanup Crew</h2>
      <p className="text-sm leading-relaxed text-muted-foreground">
        Monoamine oxidase (MAO) is an enzyme found in nerve terminals and the gut wall. Its job
        is to break down monoamine neurotransmitters — serotonin, norepinephrine, and dopamine —
        after they have done their job. Phenelzine permanently disables it.
      </p>

      {/* Stage animation */}
      <div className="rounded-xl border border-border bg-card p-5" style={{ width: "100%", overflowX: "hidden" }}>
        <svg viewBox="0 0 360 140" className="w-full" style={{ maxHeight: 160 }}>
          {/* Stage labels */}
          <text x="60" y="14" textAnchor="middle" fill="rgba(148,163,184,0.7)" fontSize="8" fontWeight="bold">
            {stage === 0 ? "NORMAL FUNCTION" : stage === 1 ? "PHENELZINE ARRIVES" : "ACCUMULATION"}
          </text>

          {/* Stage 0 & 1: MAO enzyme active (green) or being attacked */}
          <g style={{ opacity: stage < 2 ? 1 : 0.3, transition: "opacity 0.8s" }}>
            {/* MAO hexagon */}
            <polygon
              points="60,50 80,40 100,50 100,70 80,80 60,70"
              fill={stage === 0 ? "rgba(74,222,128,0.25)" : stage === 1 ? "rgba(251,191,36,0.25)" : "rgba(239,68,68,0.15)"}
              stroke={stage === 0 ? "rgba(74,222,128,0.7)" : stage === 1 ? "rgba(251,191,36,0.7)" : "rgba(239,68,68,0.5)"}
              strokeWidth="1.5"
              style={{ transition: "fill 0.8s, stroke 0.8s" }}
            />
            <text x="80" y="62" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="8" fontWeight="bold">MAO</text>
            {/* Serotonin being broken down */}
            {stage === 0 && (
              <>
                <circle cx="130" cy="55" r="6" fill="rgba(234,179,8,0.7)" style={{ animation: "ss-pulse-r 1.5s ease-in-out infinite" }} />
                <text x="146" y="44" fill="rgba(234,179,8,0.6)" fontSize="7">5-HT</text>
                <line x1="115" y1="58" x2="105" y2="62" stroke="rgba(234,179,8,0.4)" strokeWidth="1.5" strokeDasharray="2,2" />
                <text x="160" y="72" fill="rgba(74,222,128,0.7)" fontSize="7">→ broken down ✓</text>
              </>
            )}
          </g>

          {/* Phenelzine molecule approaching (stage 1) */}
          {stage >= 1 && (
            <g style={{ animation: "ss-fade-stage 0.5s ease forwards" }}>
              <circle cx="150" cy="40" r="9" fill="rgba(249,115,22,0.3)" stroke="rgba(249,115,22,0.7)" strokeWidth="1.5" />
              <text x="150" y="43" textAnchor="middle" fill="rgba(249,115,22,0.9)" fontSize="7" fontWeight="bold">Ph</text>
              <text x="150" y="28" textAnchor="middle" fill="rgba(249,115,22,0.7)" fontSize="7">Phenelzine</text>
              {stage === 1 && <line x1="141" y1="44" x2="103" y2="57" stroke="rgba(249,115,22,0.5)" strokeWidth="1" strokeDasharray="2,2" />}
            </g>
          )}

          {/* Stage 2: MAO destroyed, accumulation */}
          {stage >= 2 && (
            <g style={{ animation: "ss-fade-stage 0.5s ease forwards" }}>
              <polygon points="60,50 80,40 100,50 100,70 80,80 60,70" fill="rgba(239,68,68,0.15)" stroke="rgba(239,68,68,0.5)" strokeWidth="1.5" />
              <text x="80" y="57" textAnchor="middle" fill="rgba(239,68,68,0.8)" fontSize="8" fontWeight="bold">MAO</text>
              <text x="80" y="68" textAnchor="middle" fill="rgba(239,68,68,0.8)" fontSize="9">✕</text>
              <text x="80" y="92" textAnchor="middle" fill="rgba(239,68,68,0.6)" fontSize="7">Permanently inactivated</text>
              {/* Accumulating serotonin */}
              {[
                { cx: 160, cy: 50, delay: "0s" },
                { cx: 185, cy: 62, delay: "0.3s" },
                { cx: 175, cy: 40, delay: "0.6s" },
                { cx: 200, cy: 53, delay: "0.9s" },
                { cx: 215, cy: 45, delay: "1.2s" },
              ].map((d, i) => (
                <circle
                  key={i} cx={d.cx} cy={d.cy} r="7"
                  fill="rgba(234,179,8,0.5)" stroke="rgba(234,179,8,0.8)" strokeWidth="1"
                  style={{ animation: `ss-fade-stage 0.4s ease ${d.delay} forwards`, opacity: 0 }}
                />
              ))}
              <text x="190" y="85" textAnchor="middle" fill="rgba(234,179,8,0.8)" fontSize="7">Serotonin accumulates ↑↑</text>
            </g>
          )}
        </svg>

        <div className="mt-2 flex justify-center gap-6">
          {["Normal", "Inhibited", "Accumulation"].map((label, i) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className={cn(
                "h-2 w-2 rounded-full",
                stage === i ? "bg-teal-400" : "bg-muted",
              )} />
              <span className="text-[10px] text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Fact boxes */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-red-800/50 bg-red-950/10 p-4">
          <p className="text-sm font-semibold text-red-300">⛔ Irreversible Inhibition</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Unlike competitive inhibitors that can be displaced, phenelzine forms a permanent
            covalent bond with MAO. The enzyme is destroyed — not just blocked. New MAO must be
            synthesized from scratch.
          </p>
        </div>
        <div className="rounded-xl border border-amber-800/50 bg-amber-950/10 p-4">
          <p className="text-sm font-semibold text-amber-300">⏳ The 2-Week Rule</p>
          <p className="mt-1 text-sm text-muted-foreground">
            MAO regeneration takes approximately 14 days. Phenelzine's effects persist for
            2 weeks after the last dose. Many dangerous reactions occur when patients or
            doctors forget this window.
          </p>
        </div>
      </div>

      {/* Clickable terms */}
      <div className="flex flex-wrap gap-2">
        {Object.keys(terms).map((term) => (
          <div key={term} className="relative">
            <button
              type="button"
              onClick={() => setOpenTerm(openTerm === term ? null : term)}
              className="rounded-full border border-teal-700 bg-teal-950/20 px-3 py-1 text-xs text-teal-300 transition-colors hover:bg-teal-950/40"
            >
              {term} ▾
            </button>
            {openTerm === term && (
              <div
                className="absolute bottom-full left-0 z-10 mb-2 w-64 rounded-xl border border-teal-800 bg-card p-3 shadow-lg"
                style={{ animation: "cs-fade-in 0.15s ease forwards" }}
              >
                <p className="text-xs leading-relaxed text-muted-foreground">{terms[term]}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Serotonin Storm: Trigger ─────────────────────────────────────────────────

function SSTriggerSection() {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-bold">Tramadol: More Than Just a Painkiller</h2>
      <p className="text-sm leading-relaxed text-muted-foreground">
        Tramadol is commonly prescribed as a mild-to-moderate opioid painkiller. What many
        prescribers — and Linda's urgent care doctor — don't realize is that tramadol has a second
        pharmacological action completely unrelated to pain relief.
      </p>

      {/* Dual mechanism diagram */}
      <div className="rounded-xl border border-border bg-card p-5" style={{ width: "100%", overflowX: "hidden" }}>
        <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tramadol's Dual Mechanism</p>
        <svg viewBox="0 0 380 160" className="w-full" style={{ maxHeight: 170 }}>
          {/* Central tramadol */}
          <circle cx="190" cy="80" r="22" fill="rgba(168,85,247,0.2)" stroke="rgba(168,85,247,0.6)" strokeWidth="1.5" />
          <text x="190" y="77" textAnchor="middle" fill="rgba(216,180,254,0.9)" fontSize="9" fontWeight="bold">Tramadol</text>
          <text x="190" y="88" textAnchor="middle" fill="rgba(216,180,254,0.7)" fontSize="7">💊</text>

          {/* Left: opioid receptor */}
          <line x1="168" y1="80" x2="118" y2="80" stroke="rgba(96,165,250,0.4)" strokeWidth="1.5" strokeDasharray="3,2" />
          <rect x="30" y="46" width="88" height="68" rx="8" fill="rgba(59,130,246,0.1)" stroke="rgba(96,165,250,0.4)" strokeWidth="1.5" />
          <text x="74" y="65" textAnchor="middle" fill="rgba(96,165,250,0.8)" fontSize="8" fontWeight="bold">μ-Opioid</text>
          <text x="74" y="75" textAnchor="middle" fill="rgba(96,165,250,0.8)" fontSize="8" fontWeight="bold">Receptor</text>
          <text x="74" y="90" textAnchor="middle" fill="rgba(74,222,128,0.7)" fontSize="7">Pain relief</text>
          <text x="74" y="100" textAnchor="middle" fill="rgba(148,163,184,0.6)" fontSize="6">(weak agonism)</text>

          {/* Right: SERT */}
          <line x1="212" y1="80" x2="262" y2="80" stroke="rgba(249,115,22,0.4)" strokeWidth="1.5" strokeDasharray="3,2" />
          <rect x="262" y="46" width="88" height="68" rx="8" fill="rgba(249,115,22,0.1)" stroke="rgba(249,115,22,0.4)" strokeWidth="1.5" />
          <text x="306" y="65" textAnchor="middle" fill="rgba(253,186,116,0.8)" fontSize="8" fontWeight="bold">SERT</text>
          <text x="306" y="75" textAnchor="middle" fill="rgba(253,186,116,0.8)" fontSize="8" fontWeight="bold">Transporter</text>
          <text x="306" y="90" textAnchor="middle" fill="rgba(239,68,68,0.7)" fontSize="7">Blocks reuptake</text>
          <text x="306" y="100" textAnchor="middle" fill="rgba(148,163,184,0.6)" fontSize="6">(serotonergic)</text>

          <text x="190" y="140" textAnchor="middle" fill="rgba(148,163,184,0.6)" fontSize="7">Two completely independent mechanisms</text>
        </svg>

        <div className="mt-3 rounded-lg border border-amber-800/40 bg-amber-950/10 px-4 py-3">
          <p className="text-xs text-amber-300">
            ⚠️ Most opioid interaction checkers only flag tramadol for opioid interactions.
            Its serotonergic action is frequently overlooked — which is exactly what happened to Linda.
          </p>
        </div>
      </div>

      {/* Venn diagram */}
      <div className="rounded-xl border border-red-800/40 bg-card p-5">
        <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Why the Combination Is Catastrophic</p>
        <div className="flex items-stretch gap-0">
          <div className="flex flex-1 flex-col gap-2 rounded-l-xl border border-indigo-700 bg-indigo-950/20 px-4 py-5">
            <p className="text-sm font-semibold text-indigo-300">Phenelzine (MAOI)</p>
            <p className="text-xs text-muted-foreground">Serotonin cannot be broken down by MAO</p>
          </div>
          <div className="flex w-24 shrink-0 flex-col items-center justify-center rounded-none border-y border-red-700 bg-red-950/30 px-2 py-5 text-center">
            <p className="text-[10px] font-bold text-red-300">RESULT</p>
            <p className="mt-1 text-[10px] text-red-400 leading-tight">Serotonin accumulates with no escape route</p>
            <p className="mt-2 text-[10px] font-semibold text-red-300">→ Storm</p>
          </div>
          <div className="flex flex-1 flex-col gap-2 rounded-r-xl border border-orange-700 bg-orange-950/20 px-4 py-5">
            <p className="text-sm font-semibold text-orange-300">Tramadol (SERT inhibitor)</p>
            <p className="text-xs text-muted-foreground">Serotonin cannot be cleared by reuptake</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Serotonin Storm: The Storm ───────────────────────────────────────────────

function SSStormSection() {
  const [expanded, setExpanded] = useState<number | null>(0);
  const [activeBodyDot, setActiveBodyDot] = useState<string | null>(null);

  const triad = [
    {
      icon: "🦵",
      title: "Neuromuscular Abnormalities",
      body: "Excess 5-HT2A stimulation in the spinal cord causes hyperreflexia (exaggerated reflexes), clonus (rhythmic muscle contractions), muscle rigidity, and tremor.",
      symptoms: ["Clonus", "Hyperreflexia", "Myoclonus", "Tremor", "Rigidity"],
      why: "Muscle rigidity is the primary driver of hyperthermia — continuous contraction generates heat",
      color: "border-amber-700 bg-amber-950/10",
      titleColor: "text-amber-300",
    },
    {
      icon: "🌡️",
      title: "Autonomic Instability",
      body: "The autonomic nervous system is thrown into overdrive. 5-HT1A receptors in the hypothalamus drive temperature dysregulation. Sympathetic activation causes cardiovascular crisis.",
      symptoms: ["Tachycardia", "Hyperthermia", "Diaphoresis (sweating)", "Hypertension", "Dilated pupils"],
      why: "Temperatures above 41°C (106°F) cause irreversible protein denaturation and brain damage",
      color: "border-red-700 bg-red-950/10",
      titleColor: "text-red-300",
    },
    {
      icon: "🧠",
      title: "Altered Mental Status",
      body: "Cortical 5-HT2A overstimulation causes agitation, anxiety, and confusion. In severe cases, patients may be delirious or unresponsive.",
      symptoms: ["Agitation", "Confusion", "Restlessness", "Disorientation"],
      why: "Mental status changes combined with neuromuscular findings distinguish serotonin syndrome from other hyperthermic emergencies",
      color: "border-purple-700 bg-purple-950/10",
      titleColor: "text-purple-300",
    },
  ];

  const bodyDots: { id: string; cx: number; cy: number; color: string; label: string; desc: string }[] = [
    { id: "brain", cx: 90, cy: 22, color: "#a78bfa", label: "Brain", desc: "Altered mental status — agitation, confusion, 5-HT2A overstimulation" },
    { id: "heart", cx: 83, cy: 72, color: "#f87171", label: "Heart", desc: "Tachycardia — 160 BPM in Linda's case. Sympathetic overdrive." },
    { id: "spine", cx: 96, cy: 95, color: "#fbbf24", label: "Spine/Cord", desc: "Hyperreflexia and clonus — 5-HT2A stimulation in spinal cord interneurons" },
    { id: "legs", cx: 88, cy: 155, color: "#fbbf24", label: "Legs/Muscles", desc: "Muscle rigidity and clonus — continuous contraction generates dangerous heat" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-bold">What Happens When Serotonin Floods the Brain</h2>
      <p className="text-sm leading-relaxed text-muted-foreground">
        Serotonin syndrome is not an allergic reaction — it is a direct pharmacological
        consequence of excess serotonin stimulating 5-HT1A and 5-HT2A receptors throughout
        the central and peripheral nervous system.
      </p>

      {/* Clinical triad expandable cards */}
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">The Clinical Triad</p>
        {triad.map((card, i) => (
          <div key={card.title} className={cn("rounded-xl border p-4", card.color)}>
            <button
              type="button"
              onClick={() => setExpanded(expanded === i ? null : i)}
              className="flex w-full items-center justify-between"
            >
              <span className={cn("text-sm font-semibold", card.titleColor)}>
                {card.icon} {card.title}
              </span>
              <span className="text-xs text-muted-foreground">{expanded === i ? "▲" : "▼"}</span>
            </button>
            {expanded === i && (
              <div className="mt-3 flex flex-col gap-2" style={{ animation: "cs-fade-in 0.2s ease forwards" }}>
                <p className="text-sm text-muted-foreground">{card.body}</p>
                <div className="flex flex-wrap gap-1">
                  {card.symptoms.map((s) => (
                    <span key={s} className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                      {s}
                    </span>
                  ))}
                </div>
                <p className="text-xs font-medium text-foreground/70">⚠️ Why it matters: {card.why}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Body diagram + thermometer */}
      <div className="flex flex-wrap gap-4 items-start">
        {/* Body diagram */}
        <div className="rounded-xl border border-border bg-card p-4" style={{ width: "100%", overflowX: "hidden" }}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Click a dot to explore</p>
          <div className="relative flex justify-center">
            <svg viewBox="0 0 180 220" width="100%" style={{ maxHeight: 380, maxWidth: 200 }}>
              {/* Head */}
              <circle cx="90" cy="22" r="20" fill="none" stroke="rgba(148,163,184,0.3)" strokeWidth="1.5" />
              {/* Torso */}
              <rect x="70" y="44" width="40" height="60" rx="6" fill="none" stroke="rgba(148,163,184,0.3)" strokeWidth="1.5" />
              {/* Arms */}
              <line x1="70" y1="50" x2="48" y2="100" stroke="rgba(148,163,184,0.3)" strokeWidth="1.5" />
              <line x1="110" y1="50" x2="132" y2="100" stroke="rgba(148,163,184,0.3)" strokeWidth="1.5" />
              {/* Legs */}
              <line x1="80" y1="104" x2="72" y2="175" stroke="rgba(148,163,184,0.3)" strokeWidth="1.5" />
              <line x1="100" y1="104" x2="108" y2="175" stroke="rgba(148,163,184,0.3)" strokeWidth="1.5" />
              {/* Body heat glow */}
              <ellipse cx="90" cy="85" rx="50" ry="80" fill="rgba(239,68,68,0.04)" />
              {/* Clickable dots - larger r=10 */}
              {bodyDots.map((dot) => (
                <circle
                  key={dot.id}
                  cx={dot.cx} cy={dot.cy} r="10"
                  fill={`${dot.color}55`} stroke={dot.color} strokeWidth="1.5"
                  style={{ cursor: "pointer", animation: "ss-pulse-r 1.8s ease-in-out infinite" }}
                  onClick={() => setActiveBodyDot(activeBodyDot === dot.id ? null : dot.id)}
                />
              ))}
            </svg>
          </div>
          {activeBodyDot && (
            <div className="mt-2 rounded-lg border border-border bg-muted/40 px-3 py-2" style={{ animation: "cs-fade-in 0.2s ease forwards" }}>
              <p className="text-xs font-semibold text-foreground">
                {bodyDots.find((d) => d.id === activeBodyDot)?.label}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {bodyDots.find((d) => d.id === activeBodyDot)?.desc}
              </p>
            </div>
          )}
        </div>

        {/* Thermometer */}
        <div className="rounded-xl border border-border bg-card p-4 flex-1" style={{ minWidth: 200 }}>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Temperature Danger Zones</p>
          <div className="flex items-start gap-4">
            <svg viewBox="0 0 40 280" style={{ width: 36, height: 280, flexShrink: 0 }}>
              {/* Bar background */}
              <rect x="14" y="10" width="12" height="220" rx="6" fill="rgba(30,41,59,0.8)" stroke="rgba(148,163,184,0.2)" strokeWidth="1" />
              {/* Color zones from bottom to top */}
              <rect x="16" y="192" width="8" height="36" rx="2" fill="rgba(74,222,128,0.7)" />
              <rect x="16" y="152" width="8" height="40" rx="2" fill="rgba(234,179,8,0.7)" />
              <rect x="16" y="112" width="8" height="40" rx="2" fill="rgba(249,115,22,0.7)" />
              <rect x="16" y="12" width="8" height="100" rx="2" fill="rgba(239,68,68,0.8)" />
              {/* Bulb */}
              <circle cx="20" cy="238" r="12" fill="rgba(239,68,68,0.8)" />
              {/* Linda marker dot on right side */}
              <circle cx="34" cy="135" r="6" fill="rgba(251,191,36,1)" stroke="white" strokeWidth="1" />
            </svg>
            <div className="flex flex-col gap-5 flex-1">
              {[
                { label: "Critical >41°C / 106°F", sub: "Brain damage risk", color: "text-red-400" },
                { label: "Severe 40–41°C", sub: "📍 Linda's case (104°F / 40°C)", color: "text-orange-400" },
                { label: "Moderate 39–40°C", sub: "Urgent intervention", color: "text-amber-400" },
                { label: "Normal 37°C / 98.6°F", sub: "Baseline", color: "text-green-400" },
              ].map((z) => (
                <div key={z.label} className="flex flex-col">
                  <span className={cn("text-[11px] font-semibold", z.color)}>{z.label}</span>
                  <span className="text-[10px] text-muted-foreground">{z.sub}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Serotonin Storm: Spectrum ────────────────────────────────────────────────

function SSSpectrumSection() {
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const severities = [
    {
      label: "MILD",
      bg: "border-green-700 bg-green-950/10",
      textColor: "text-green-300",
      symptoms: "Shivering, diarrhea, mild agitation, tachycardia",
      onset: "Hours after drug change",
      treatment: "Stop offending drug, supportive care",
      example: "SSRI dose increase",
    },
    {
      label: "MODERATE",
      bg: "border-amber-700 bg-amber-950/10",
      textColor: "text-amber-300",
      symptoms: "Hyperreflexia, diaphoresis, mydriasis, intermittent tremor, agitation, tachycardia",
      onset: "Rapid after combination",
      treatment: "Cyproheptadine (5-HT antagonist) + benzodiazepines",
      example: "SSRI + tramadol",
    },
    {
      label: "SEVERE",
      bg: "border-red-700 bg-red-950/10",
      textColor: "text-red-300",
      symptoms: "Muscle rigidity, temperature >41°C, rhabdomyolysis, metabolic acidosis, seizures",
      onset: "Rapid, escalates quickly",
      treatment: "ICU, aggressive cooling, IV cyproheptadine, intubation",
      example: "MAOI + SSRI or MAOI + tramadol (Linda's case)",
    },
  ];

  const riskRows = [
    { combo: "MAOI + SSRI", risk: "🔴 EXTREME", mech: "MAO blocked + SERT blocked" },
    { combo: "MAOI + Tramadol", risk: "🔴 EXTREME", mech: "MAO blocked + SERT blocked", linda: true },
    { combo: "MAOI + Meperidine", risk: "🔴 EXTREME", mech: "MAO blocked + serotonin release" },
    { combo: "SSRI + Tramadol", risk: "🟠 HIGH", mech: "Double SERT blockade" },
    { combo: "SSRI + Linezolid", risk: "🟠 HIGH", mech: "Antibiotic with MAOI properties" },
    { combo: "SSRI + Dextromethorphan", risk: "🟡 MODERATE", mech: "SERT + weak sigma receptor" },
    { combo: "SSRI + Lithium", risk: "🟡 MODERATE", mech: "Indirect serotonin enhancement" },
    { combo: "SSRI + Triptan", risk: "🟢 LOW/RARE", mech: "Minimal — different receptor subtypes" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-bold">Not All Serotonin Syndrome Is Equal</h2>
      <p className="text-sm leading-relaxed text-muted-foreground">
        Serotonin syndrome exists on a spectrum from mild to fatal. The severity depends on how
        much serotonin accumulates and which receptor subtypes are most activated.
      </p>

      {/* Severity cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        {severities.map((s) => (
          <div key={s.label} className={cn("relative rounded-xl border p-4", s.bg)}>
            <p className={cn("text-sm font-bold", s.textColor)}>{s.label}</p>
            <div className="mt-2 flex flex-col gap-1.5 text-xs text-muted-foreground">
              <p><span className="font-medium text-foreground/70">Symptoms:</span> {s.symptoms}</p>
              <p><span className="font-medium text-foreground/70">Onset:</span> {s.onset}</p>
              <p><span className="font-medium text-foreground/70">Treatment:</span> {s.treatment}</p>
              <p><span className="font-medium text-foreground/70">Example:</span> {s.example}</p>
            </div>
            {s.label === "SEVERE" && (
              <span className="mt-2 inline-block rounded-full border border-yellow-600 bg-yellow-950/30 px-2 py-0.5 text-[10px] font-semibold text-yellow-300">
                📍 Linda's case
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Risk table */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Drug Combination Risk Table</p>
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="grid grid-cols-[2fr_1fr_2fr] border-b border-border bg-muted px-4 py-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Combination</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Risk</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Mechanism</span>
          </div>
          {riskRows.map((row, i) => (
            <button
              key={row.combo}
              type="button"
              onClick={() => setExpandedRow(expandedRow === i ? null : i)}
              className={cn(
                "grid w-full grid-cols-[2fr_1fr_2fr] px-4 py-2.5 text-left transition-colors hover:bg-muted/50",
                i < riskRows.length - 1 && "border-b border-border/50",
                row.linda && "bg-amber-950/10",
              )}
            >
              <span className="text-xs text-foreground">
                {row.combo}
                {row.linda && <span className="ml-1.5 text-[9px] text-yellow-400">📍 Linda</span>}
              </span>
              <span className="text-xs">{row.risk}</span>
              <span className="text-xs text-muted-foreground">{row.mech}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Treatment fact box */}
      <div className="rounded-xl border border-teal-800 bg-teal-950/10 p-4">
        <p className="text-sm font-semibold text-teal-300">💊 Treatment</p>
        <p className="mt-1 text-sm text-muted-foreground">
          The antidote is cyproheptadine — a histamine blocker that also antagonizes 5-HT2A
          receptors. Combined with aggressive cooling for hyperthermia, benzodiazepines for
          muscle rigidity, and IV fluids, most patients recover fully if treated promptly.
        </p>
      </div>

      {/* History link */}
      <div className="rounded-xl border border-yellow-700 bg-yellow-950/10 p-4">
        <p className="text-sm font-semibold text-yellow-300">📖 Read the History</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Serotonin syndrome was first systematically described by Dr. Harvey Sternbach in 1991.
          Read the full historical account of how this interaction was discovered.
        </p>
        <Link
          href="/history"
          className="mt-3 inline-block rounded-lg border border-yellow-700 bg-yellow-950/30 px-4 py-2 text-xs font-semibold text-yellow-300 transition-colors hover:bg-yellow-950/50"
        >
          View Era 8 on the History Page →
        </Link>
      </div>
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

      {cs.id === "cellular-respiration" && (
        <div className="w-full max-w-lg rounded-xl border border-teal-800 bg-teal-950/20 p-4 text-left">
          <p className="text-sm font-semibold text-teal-300">💊 Toxicology Connection</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Cyanide illustrates why understanding cellular metabolism is essential to
            pharmacology. Many drug toxicities — from acetaminophen overdose to carbon
            monoxide poisoning — work by disrupting the same ATP-producing machinery you
            just studied.
          </p>
        </div>
      )}
      {cs.id === "serotonin-storm" && (
        <div className="w-full max-w-lg rounded-xl border border-amber-800 bg-amber-950/20 p-4 text-left">
          <p className="text-sm font-semibold text-amber-300">💊 Clinical Takeaway</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Always check a patient's complete medication list before prescribing — including
            medications they may have stopped recently. Phenelzine's effects persist for
            2 weeks after the last dose. Linda's case is a reminder that the most dangerous
            drug interactions are often the ones nobody thought to check.
          </p>
        </div>
      )}

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
  const csFound = CASE_STUDIES.find((c) => c.id === id);

  if (!csFound) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "18px" }}>
        Case study not found.
      </div>
    );
  }

  const cs: CaseStudy = csFound;

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
      if (q.type === "written") {
        const g = writtenGrading[q.id];
        if (g && !g.loading) total += g.score ?? 0;
      } else {
        if (!submitted[q.id]) continue;
        if (q.type === "mcq") {
          const mq = q as MCQQuestion;
          if (answers[q.id] === mq.correctIndex) total += mq.points;
        } else if (q.type === "dragdrop") {
          const dq = q as DragDropQuestion;
          const correct = dragOrder.every((itemIdx, pos) => dq.correctOrder[pos] === itemIdx);
          if (correct) total += dq.points;
        }
      }
    }
    setScore(total);
  }, [cs, answers, submitted, dragOrder, writtenGrading]);

  // Mark section as completed when navigating away
  function handleSectionChange(i: number) {
    setCompletedSections((prev) => new Set([...prev, activeSection]));
    setActiveSection(i);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    if (!cs) return;
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

        {cs.id === "grapefruit-paradox" && section?.id === "background" && <BackgroundSection />}
        {section?.id === "enzyme" && <EnzymeSection isPremium={isPremium} />}
        {section?.id === "inhibitor" && <InhibitorSection />}
        {section?.id === "patient" && <PatientSection />}
        {section?.id === "which-drugs" && <WhichDrugsSection isPremium={isPremium} />}
        {cs.id === "cellular-respiration" && section?.id === "background" && <CRBackgroundSection />}
        {cs.id === "cellular-respiration" && section?.id === "glycolysis" && <CRGlycolysisSection />}
        {cs.id === "cellular-respiration" && section?.id === "krebs" && <CRKrebsSection />}
        {cs.id === "cellular-respiration" && section?.id === "etc" && <CRETCSection />}
        {cs.id === "cellular-respiration" && section?.id === "poison" && <CRPoisonSection />}
        {cs.id === "serotonin-storm" && section?.id === "background" && <SSBackgroundSection />}
        {cs.id === "serotonin-storm" && section?.id === "maoi" && <SSMAOISection />}
        {cs.id === "serotonin-storm" && section?.id === "trigger" && <SSTriggerSection />}
        {cs.id === "serotonin-storm" && section?.id === "storm" && <SSStormSection />}
        {cs.id === "serotonin-storm" && section?.id === "spectrum" && <SSSpectrumSection />}
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
