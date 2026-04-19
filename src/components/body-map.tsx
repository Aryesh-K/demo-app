"use client";

import { useState } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

const ORGAN_COORDS: Record<string, readonly [number, number]> = {
  brain:       [100, 45],
  spinal_cord: [100, 180],
  lungs:       [100, 130],
  heart:       [90,  125],
  stomach:     [100, 210],
  liver:       [115, 195],
  kidney:      [85,  220],
  intestines:  [100, 250],
  bloodstream: [130, 160],
  skin:        [160, 200],
};

const ORGAN_LABELS: Record<string, string> = {
  brain:       "Brain",
  spinal_cord: "Spinal Cord",
  lungs:       "Lungs",
  heart:       "Heart",
  stomach:     "Stomach",
  liver:       "Liver",
  kidney:      "Kidney",
  intestines:  "Intestines",
  bloodstream: "Bloodstream",
  skin:        "Skin",
};

const STEP_ICONS: Record<string, string> = {
  pill:    "💊",
  blood:   "🩸",
  brain:   "🧠",
  enzyme:  "⚗️",
  warning: "⚠️",
  check:   "✅",
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface AffectedSystem {
  organ: string;
  reason: string;
}

interface Step {
  title: string;
  caption: string;
  icon: string;
}

interface BodyMapProps {
  affected_systems: AffectedSystem[];
  steps: Step[];
  level: 1 | 2 | 3;
  drugA: string;
  drugB: string;
  riskLevel?: "high" | "moderate" | "low";
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function dotColor(risk?: "high" | "moderate" | "low"): string {
  if (risk === "high") return "#f87171"; // red-400
  if (risk === "low")  return "#2dd4bf"; // teal-400
  return "#fbbf24";                      // amber-400 (moderate / default)
}

// ─── Body silhouette (rendered inside <svg>) ──────────────────────────────────

function BodySilhouette() {
  return (
    <g fill="#1e2939" stroke="#334155" strokeWidth="1.5" strokeLinejoin="round">
      {/* Head */}
      <ellipse cx="100" cy="42" rx="26" ry="30" />
      {/* Neck */}
      <rect x="92" y="69" width="16" height="15" rx="2" />
      {/* Torso — shoulders taper gently inward at waist */}
      <path d="M 55,82 Q 47,86 47,93 L 47,268 Q 47,278 57,282 L 85,286 L 85,296 L 115,296 L 115,286 L 143,282 Q 153,278 153,268 L 153,93 Q 153,86 145,82 Z" />
      {/* Left arm */}
      <path d="M 47,95 L 27,98 L 19,203 L 36,209 L 47,110 Z" />
      {/* Right arm — wide enough that (160,200) falls inside */}
      <path d="M 153,95 L 170,98 L 178,204 L 158,210 L 153,110 Z" />
      {/* Left leg */}
      <path d="M 57,282 L 85,286 L 85,400 L 57,400 Z" />
      {/* Right leg */}
      <path d="M 143,282 L 115,286 L 115,400 L 143,400 Z" />
    </g>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function BodyMap({
  affected_systems,
  steps,
  level: _level,
  drugA,
  drugB,
  riskLevel,
}: BodyMapProps) {
  const [modalOpen,    setModalOpen]    = useState(false);
  const [currentStep,  setCurrentStep]  = useState(0);
  const [hoveredOrgan, setHoveredOrgan] = useState<string | null>(null);

  if (!affected_systems.length || !steps.length) return null;

  const color        = dotColor(riskLevel);
  const validSystems = affected_systems.filter((s) => s.organ in ORGAN_COORDS);
  const totalSteps   = steps.length;

  function openModal() {
    setCurrentStep(0);
    setModalOpen(true);
  }

  // Clamp tooltip left so it never overflows the 200px container
  // (tooltip is 130px wide → max left = 200 - 130 = 70)
  function tooltipLeft(cx: number): number {
    const raw = cx > 100 ? cx - 138 : cx + 16;
    return Math.min(Math.max(0, raw), 70);
  }

  return (
    <>
      {/* Pulse keyframes — transform-box keeps origin at circle center in SVG */}
      <style>{`
        @keyframes organ-pulse {
          0%, 100% { transform: scale(1);   opacity: 1;   }
          50%       { transform: scale(1.5); opacity: 0.5; }
        }
        .organ-pulse-dot {
          animation: organ-pulse 1.5s ease-in-out infinite;
          transform-box: fill-box;
          transform-origin: center;
        }
      `}</style>

      {/* Body map container — matches SVG dimensions exactly */}
      <div className="relative inline-block" style={{ width: 200, height: 400 }}>

        {/* Beta badge */}
        <span className="absolute right-0 top-0 z-10 rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          🧪 Beta
        </span>

        {/* Body SVG */}
        <svg
          viewBox="0 0 200 400"
          width="200"
          height="400"
          style={{ display: "block" }}
          aria-label={`Body map showing organs affected by ${drugA} + ${drugB}`}
        >
          <BodySilhouette />

          {validSystems.map((system) => {
            const coords = ORGAN_COORDS[system.organ];
            if (!coords) return null;
            const [cx, cy] = coords;
            return (
              <g key={system.organ}>
                {/* Outer pulse ring */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={9}
                  fill="none"
                  stroke={color}
                  strokeWidth={1.5}
                  opacity={0.35}
                  className="organ-pulse-dot"
                  style={{ pointerEvents: "none" }}
                />
                {/* Core dot */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={5.5}
                  fill={color}
                  className="organ-pulse-dot"
                  style={{ cursor: "pointer" }}
                  onMouseEnter={() => setHoveredOrgan(system.organ)}
                  onMouseLeave={() => setHoveredOrgan(null)}
                  onClick={(e) => { e.stopPropagation(); openModal(); }}
                />
              </g>
            );
          })}
        </svg>

        {/* Hover tooltip — absolutely positioned outside SVG to avoid clipping */}
        {hoveredOrgan && (() => {
          const system = validSystems.find((s) => s.organ === hoveredOrgan);
          const coords = ORGAN_COORDS[hoveredOrgan];
          if (!system || !coords) return null;
          const [cx, cy] = coords;
          return (
            <div
              style={{
                position: "absolute",
                left: tooltipLeft(cx),
                top: Math.max(4, cy - 12),
                width: 130,
                zIndex: 40,
                pointerEvents: "none",
                background: "#0f172a",
                border: "1px solid #334155",
                borderRadius: 8,
                padding: "6px 8px",
                boxShadow: "0 4px 16px rgba(0,0,0,0.6)",
              }}
            >
              <p style={{ fontSize: 11, fontWeight: 600, color, marginBottom: 2, lineHeight: 1.3 }}>
                {ORGAN_LABELS[hoveredOrgan] ?? hoveredOrgan}
              </p>
              <p style={{ fontSize: 10, color: "#94a3b8", lineHeight: 1.45, margin: 0 }}>
                {system.reason}
              </p>
            </div>
          );
        })()}
      </div>

      {/* Steps modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.78)", backdropFilter: "blur(3px)" }}
          onClick={() => setModalOpen(false)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl border-2 border-teal-700 bg-slate-900 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
              aria-label="Close modal"
            >
              ✕
            </button>

            {/* Title */}
            <h3 className="mb-5 pr-8 text-base font-bold text-white">
              How {drugA} + {drugB} interact
            </h3>

            {totalSteps > 0 ? (
              <>
                {/* Step display */}
                <div className="flex min-h-[160px] flex-col items-center gap-3 text-center">
                  <span className="text-5xl leading-none" aria-hidden="true">
                    {STEP_ICONS[steps[currentStep]!.icon] ?? "💊"}
                  </span>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-teal-400/70">
                    Step {currentStep + 1} of {totalSteps}
                  </p>
                  <p className="font-semibold leading-snug text-white">
                    {steps[currentStep]!.title}
                  </p>
                  <p className="text-sm leading-relaxed text-slate-400">
                    {steps[currentStep]!.caption}
                  </p>
                </div>

                {/* Navigation + progress bar */}
                <div className="mt-5 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
                    disabled={currentStep === 0}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-700 text-slate-400 transition-colors hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label="Previous step"
                  >
                    ←
                  </button>

                  {/* Progress pips */}
                  <div className="flex flex-1 items-center gap-1.5">
                    {steps.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setCurrentStep(i)}
                        aria-label={`Go to step ${i + 1}`}
                        style={{
                          flex: 1,
                          height: 6,
                          borderRadius: 3,
                          border: "none",
                          padding: 0,
                          cursor: "pointer",
                          background: i === currentStep ? "#2dd4bf" : "#1e3a4a",
                          transition: "background 0.2s ease",
                        }}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setCurrentStep((s) => Math.min(totalSteps - 1, s + 1))}
                    disabled={currentStep === totalSteps - 1}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-700 text-slate-400 transition-colors hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label="Next step"
                  >
                    →
                  </button>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-400">No interaction steps available.</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
