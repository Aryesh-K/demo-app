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

// ─── Main component ───────────────────────────────────────────────────────────

export default function BodyMap({
  affected_systems,
  steps,
  level: _level,
  drugA,
  drugB,
  riskLevel,
}: BodyMapProps) {
  const [currentStep,  setCurrentStep]  = useState(0);
  const [hoveredOrgan, setHoveredOrgan] = useState<string | null>(null);

  if (!affected_systems.length || !steps.length) return null;

  const color        = dotColor(riskLevel);
  const validSystems = affected_systems.filter((s) => s.organ in ORGAN_COORDS);
  const totalSteps   = steps.length;

  function handleHover(organ: string | null) {
    if (organ !== hoveredOrgan) setCurrentStep(0);
    setHoveredOrgan(organ);
  }

  const hoveredSystem = hoveredOrgan
    ? (validSystems.find((s) => s.organ === hoveredOrgan) ?? null)
    : null;

  return (
    <>
      {/* Keyframes */}
      <style>{`
        @keyframes organ-pulse {
          0%, 100% { transform: scale(1);   opacity: 1;   }
          50%       { transform: scale(1.5); opacity: 0.5; }
        }
        .organ-pulse-dot {
          animation: organ-pulse 1.5s ease-in-out infinite;
        }
        @keyframes panel-slide-in {
          from { opacity: 0; transform: translateX(8px); }
          to   { opacity: 1; transform: translateX(0);   }
        }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "fit-content" }}>
        {/* Beta badge — top left */}
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
          {/* Left column: body image + dots */}
          <div style={{ position: "relative", width: 200, height: 400, flexShrink: 0 }}>
            {/* Anatomical body image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/1/19/Human_body_silhouette.svg"
              width={200}
              height={400}
              alt=""
              aria-hidden="true"
              style={{
                display: "block",
                width: 200,
                height: 400,
                filter: "invert(40%) sepia(20%) saturate(500%) hue-rotate(180deg) brightness(0.8)",
                userSelect: "none",
              }}
            />

            {/* Pulsing dots overlaid absolutely */}
            {validSystems.map((system) => {
              const coords = ORGAN_COORDS[system.organ];
              if (!coords) return null;
              const [cx, cy] = coords;
              const isHovered = hoveredOrgan === system.organ;
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
                  onMouseEnter={() => handleHover(system.organ)}
                  onMouseLeave={() => handleHover(null)}
                >
                  {/* Outer pulse ring */}
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
                  {/* Core dot */}
                  <div
                    className="organ-pulse-dot"
                    style={{
                      position: "absolute",
                      width: 11,
                      height: 11,
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      borderRadius: "50%",
                      background: color,
                      boxShadow: isHovered ? `0 0 0 3px ${color}55` : "none",
                      transition: "box-shadow 0.2s ease",
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Right column: info panel */}
          <div
            style={{
              width: 220,
              height: 400,
              flexShrink: 0,
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
                Hover over a pulsing dot to see details
              </p>
            ) : (
              <div
                key={hoveredOrgan}
                style={{
                  animation: "panel-slide-in 0.25s ease forwards",
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                {/* Organ name */}
                <p style={{ fontSize: 14, fontWeight: 700, color: "#2dd4bf", margin: 0, lineHeight: 1.3 }}>
                  {ORGAN_LABELS[hoveredOrgan!] ?? hoveredOrgan}
                </p>

                {/* Reason */}
                <p style={{ fontSize: 12, color: "#94a3b8", margin: 0, lineHeight: 1.5 }}>
                  {hoveredSystem.reason}
                </p>

                {/* Teal divider */}
                <div style={{ height: 1, background: "#134e4a", width: "100%" }} />

                {/* Inline steps slideshow */}
                {totalSteps > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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
                    <p style={{ fontSize: 11, color: "#64748b", margin: 0, lineHeight: 1.55 }}>
                      {steps[currentStep]!.caption}
                    </p>

                    {/* Navigation row */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                      <button
                        type="button"
                        onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
                        disabled={currentStep === 0}
                        aria-label="Previous step"
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          border: "1px solid #1e3a4a",
                          background: "transparent",
                          color: "#64748b",
                          cursor: currentStep === 0 ? "not-allowed" : "pointer",
                          opacity: currentStep === 0 ? 0.3 : 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 14,
                          flexShrink: 0,
                          transition: "opacity 0.15s ease",
                        }}
                      >
                        ←
                      </button>

                      {/* Progress dots */}
                      <div style={{ display: "flex", flex: 1, gap: 4, alignItems: "center" }}>
                        {steps.map((_, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setCurrentStep(i)}
                            aria-label={`Go to step ${i + 1}`}
                            style={{
                              flex: 1,
                              height: 5,
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
                        aria-label="Next step"
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          border: "1px solid #1e3a4a",
                          background: "transparent",
                          color: "#64748b",
                          cursor: currentStep === totalSteps - 1 ? "not-allowed" : "pointer",
                          opacity: currentStep === totalSteps - 1 ? 0.3 : 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 14,
                          flexShrink: 0,
                          transition: "opacity 0.15s ease",
                        }}
                      >
                        →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
