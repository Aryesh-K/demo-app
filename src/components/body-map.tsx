"use client";

import { useState } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

const ORGAN_COORDS: Record<string, readonly [number, number]> = {
  brain:       [100,  30],
  spinal_cord: [100, 165],
  lungs:       [ 85, 130],
  heart:       [ 80, 118],
  stomach:     [105, 195],
  liver:       [118, 182],
  kidney:      [ 82, 205],
  intestines:  [100, 235],
  bloodstream: [140, 150],
  skin:        [155, 190],
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

// ─── Body silhouette SVG (viewBox 0 0 200 420) ───────────────────────────────
// Torso widens slightly at midsection so bloodstream (140,150) and skin
// (155,190) fall inside the body outline.

function BodySilhouette() {
  return (
    <g fill="#1e3a5f" stroke="#4a9ebb" strokeWidth="1.5" strokeLinejoin="round">
      {/* Head */}
      <ellipse cx="100" cy="32" rx="22" ry="27" />
      {/* Neck */}
      <rect x="91" y="57" width="18" height="14" rx="2" />
      {/* Torso — kinks outward at y=200 to include arm-adjacent dots */}
      <path d="M 50,70 L 150,70 L 158,200 L 152,280 L 118,284 Q 100,292 82,284 L 48,280 L 42,200 Z" />
      {/* Left arm */}
      <path d="M 49,82 L 24,90 L 16,255 L 36,262 Z" />
      {/* Right arm */}
      <path d="M 151,82 L 176,90 L 184,255 L 164,262 Z" />
      {/* Left leg */}
      <path d="M 48,280 L 82,284 L 79,420 L 45,420 Z" />
      {/* Right leg */}
      <path d="M 152,280 L 118,284 L 121,420 L 155,420 Z" />
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
  // hover → drives top section only
  const [hoveredOrgan, setHoveredOrgan] = useState<string | null>(null);
  // click → drives bottom section only; defaults to first valid organ
  const [clickedOrgan, setClickedOrgan] = useState<string | null>(
    () => affected_systems.find((s) => s.organ in ORGAN_COORDS)?.organ ?? null,
  );
  const [currentStep, setCurrentStep] = useState(0);

  if (!affected_systems.length || !steps.length) return null;

  const color        = dotColor(riskLevel);
  const validSystems = affected_systems.filter((s) => s.organ in ORGAN_COORDS);
  const totalSteps   = steps.length;

  const hoveredSystem = hoveredOrgan
    ? (validSystems.find((s) => s.organ === hoveredOrgan) ?? null)
    : null;

  return (
    <>
      <style>{`
        @keyframes organ-pulse {
          0%, 100% { transform: scale(1);   opacity: 1;   }
          50%       { transform: scale(1.5); opacity: 0.5; }
        }
        .organ-pulse-dot {
          animation: organ-pulse 1.5s ease-in-out infinite;
        }
        @keyframes bm-slide-in {
          from { opacity: 0; transform: translateX(8px); }
          to   { opacity: 1; transform: translateX(0);   }
        }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "fit-content" }}>

        {/* Beta badge — top left, above body */}
        <span
          style={{
            alignSelf: "flex-start",
            borderRadius: 9999,
            border: "1px solid #334155",
            background: "#0f172a",
            padding: "2px 8px",
            fontSize: 10,
            fontWeight: 500,
            color: "#64748b",
          }}
        >
          🧪 Beta
        </span>

        {/* Two-column row */}
        <div
          style={{ display: "flex", flexDirection: "row", gap: 20, alignItems: "flex-start" }}
          aria-label={`Body map showing organs affected by ${drugA} + ${drugB}`}
        >

          {/* ── Left column: SVG body + dots ── */}
          <div style={{ position: "relative", width: 200, height: 420, flexShrink: 0 }}>
            <svg
              viewBox="0 0 200 420"
              width="200"
              height="420"
              style={{ display: "block" }}
              aria-hidden="true"
            >
              <BodySilhouette />
            </svg>

            {validSystems.map((system) => {
              const coords = ORGAN_COORDS[system.organ];
              if (!coords) return null;
              const [cx, cy] = coords;
              const isHovered = hoveredOrgan === system.organ;
              const isClicked = clickedOrgan === system.organ;
              return (
                <div
                  key={system.organ}
                  style={{
                    position: "absolute",
                    left: cx,
                    top: cy,
                    width: 18,
                    height: 18,
                    transform: "translate(-50%, -50%)",
                    cursor: "pointer",
                  }}
                  onMouseEnter={() => setHoveredOrgan(system.organ)}
                  onMouseLeave={() => setHoveredOrgan(null)}
                  onClick={() => {
                    setClickedOrgan(system.organ);
                    setCurrentStep(0);
                  }}
                >
                  {/* Outer pulse ring — fills 18×18, scales from its own center */}
                  <div
                    className="organ-pulse-dot"
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: "50%",
                      border: `1.5px solid ${color}`,
                      opacity: 0.35,
                      pointerEvents: "none",
                    }}
                  />
                  {/* Core dot — (18−11)/2 = 3.5 px offset → centered in 18×18 */}
                  <div
                    className="organ-pulse-dot"
                    style={{
                      position: "absolute",
                      width: 11,
                      height: 11,
                      top: 3.5,
                      left: 3.5,
                      borderRadius: "50%",
                      background: color,
                      boxShadow: (isHovered || isClicked) ? `0 0 0 3px ${color}55` : "none",
                      transition: "box-shadow 0.2s ease",
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* ── Right column: two-section info panel ── */}
          <div
            style={{
              width: 220,
              height: 420,
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >

            {/* TOP SECTION (~40 %) — organ + reason, driven by hover */}
            <div
              style={{
                height: 168,
                display: "flex",
                flexDirection: "column",
                justifyContent: hoveredSystem ? "flex-start" : "center",
                alignItems: hoveredSystem ? "flex-start" : "center",
                overflow: "hidden",
              }}
            >
              {!hoveredSystem ? (
                <p
                  style={{
                    fontSize: 12,
                    color: "#475569",
                    textAlign: "center",
                    lineHeight: 1.5,
                    padding: "0 12px",
                    margin: 0,
                  }}
                >
                  Hover over a dot to learn which organ is affected
                </p>
              ) : (
                <div
                  key={hoveredOrgan}
                  style={{
                    animation: "bm-slide-in 0.25s ease forwards",
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#2dd4bf", margin: 0, lineHeight: 1.3 }}>
                    {ORGAN_LABELS[hoveredOrgan!] ?? hoveredOrgan}
                  </p>
                  <p style={{ fontSize: 12, color: "#94a3b8", margin: 0, lineHeight: 1.5 }}>
                    {hoveredSystem.reason}
                  </p>
                </div>
              )}
            </div>

            {/* Teal divider */}
            <div style={{ height: 1, background: "#134e4a", width: "100%", flexShrink: 0 }} />

            {/* BOTTOM SECTION (~60 %) — steps slideshow, always visible, driven by click */}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 8,
                paddingTop: 12,
                overflow: "hidden",
              }}
            >
              {totalSteps > 0 && (
                <>
                  {/* Step counter */}
                  <p
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: "#2dd4bf",
                      opacity: 0.7,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      margin: 0,
                    }}
                  >
                    Step {currentStep + 1} of {totalSteps}
                  </p>

                  {/* Icon + title */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 28, lineHeight: 1 }} aria-hidden="true">
                      {STEP_ICONS[steps[currentStep]!.icon] ?? "💊"}
                    </span>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9", margin: 0, lineHeight: 1.4 }}>
                      {steps[currentStep]!.title}
                    </p>
                  </div>

                  {/* Caption */}
                  <p style={{ fontSize: 11, color: "#64748b", margin: 0, lineHeight: 1.55, flex: 1, overflow: "hidden" }}>
                    {steps[currentStep]!.caption}
                  </p>

                  {/* Navigation row */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
                      disabled={currentStep === 0}
                      aria-label="Previous step"
                      style={{
                        width: 28, height: 28, borderRadius: "50%",
                        border: "1px solid #1e3a4a", background: "transparent",
                        color: "#64748b",
                        cursor: currentStep === 0 ? "not-allowed" : "pointer",
                        opacity: currentStep === 0 ? 0.3 : 1,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 14, flexShrink: 0,
                        transition: "opacity 0.15s ease",
                      }}
                    >
                      ←
                    </button>

                    {/* Progress pips */}
                    <div style={{ display: "flex", flex: 1, gap: 4, alignItems: "center" }}>
                      {steps.map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setCurrentStep(i)}
                          aria-label={`Go to step ${i + 1}`}
                          style={{
                            flex: 1, height: 5, borderRadius: 3,
                            border: "none", padding: 0, cursor: "pointer",
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
                      aria-label="Next step"
                      style={{
                        width: 28, height: 28, borderRadius: "50%",
                        border: "1px solid #1e3a4a", background: "transparent",
                        color: "#64748b",
                        cursor: currentStep === totalSteps - 1 ? "not-allowed" : "pointer",
                        opacity: currentStep === totalSteps - 1 ? 0.3 : 1,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 14, flexShrink: 0,
                        transition: "opacity 0.15s ease",
                      }}
                    >
                      →
                    </button>
                  </div>
                </>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
