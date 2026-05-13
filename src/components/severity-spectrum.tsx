"use client";

interface SeveritySpectrumProps {
  riskLevel: "high" | "moderate" | "low";
  interactionType?: "safety" | "efficacy" | "both";
  showIneffective?: boolean;
}

export function SeveritySpectrum({
  riskLevel,
  interactionType,
  showIneffective,
}: SeveritySpectrumProps) {
  const isIneffective = showIneffective || interactionType === "efficacy";

  const position = isIneffective
    ? null
    : riskLevel === "high"
      ? 92
      : riskLevel === "moderate"
        ? 52
        : 12;

  const riskLabel = isIneffective
    ? "INEFFECTIVE"
    : riskLevel === "high"
      ? "HIGH RISK"
      : riskLevel === "moderate"
        ? "MODERATE RISK"
        : "LOW RISK";

  const riskEmoji = isIneffective
    ? "🚫"
    : riskLevel === "high"
      ? "⚠️"
      : riskLevel === "moderate"
        ? "⚡"
        : "✅";

  const riskColor = isIneffective
    ? "#9333ea"
    : riskLevel === "high"
      ? "#ef4444"
      : riskLevel === "moderate"
        ? "#f59e0b"
        : "#22c55e";

  const riskDescription = isIneffective
    ? "One substance reduces or eliminates the effectiveness of the other"
    : riskLevel === "high"
      ? "Serious risk — this combination may cause significant harm"
      : riskLevel === "moderate"
        ? "Use caution — meaningful side effects or reduced effectiveness possible"
        : "Minimal interaction — generally safe to combine";

  return (
    <div style={{ marginBottom: "16px" }}>
      {/* Risk label row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "12px",
        }}
      >
        <span style={{ fontSize: "20px" }}>{riskEmoji}</span>
        <span
          style={{
            fontSize: "16px",
            fontWeight: 700,
            color: riskColor,
            letterSpacing: "0.5px",
          }}
        >
          {riskLabel}
        </span>
      </div>

      {/* Spectrum bar — only for non-efficacy interactions */}
      {!isIneffective && (
        <div style={{ position: "relative", marginBottom: "10px" }}>
          {/* Gradient track */}
          <div
            style={{
              height: "8px",
              borderRadius: "4px",
              background:
                "linear-gradient(to right, #22c55e, #f59e0b, #ef4444)",
              position: "relative",
              boxShadow: "0 0 8px rgba(0,0,0,0.3)",
            }}
          >
            {/* Marker dot */}
            <div
              style={{
                position: "absolute",
                left: `${position}%`,
                top: "50%",
                transform: "translate(-50%, -50%)",
                width: "16px",
                height: "16px",
                borderRadius: "50%",
                background: riskColor,
                border: "2px solid white",
                boxShadow: `0 0 8px ${riskColor}`,
                transition: "left 0.6s ease-out",
              }}
            />
          </div>

          {/* Labels below spectrum */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "6px",
            }}
          >
            <span
              style={{ fontSize: "10px", color: "#22c55e", fontWeight: 600 }}
            >
              LOW
            </span>
            <span
              style={{ fontSize: "10px", color: "#f59e0b", fontWeight: 600 }}
            >
              MODERATE
            </span>
            <span
              style={{ fontSize: "10px", color: "#ef4444", fontWeight: 600 }}
            >
              HIGH
            </span>
          </div>
        </div>
      )}

      {/* Ineffective bar — purple gradient */}
      {isIneffective && (
        <div
          style={{
            height: "8px",
            borderRadius: "4px",
            background:
              "linear-gradient(to right, rgba(147,51,234,0.3), #9333ea)",
            marginBottom: "16px",
          }}
        />
      )}

      {/* Description */}
      <p
        style={{
          fontSize: "13px",
          color: "rgba(255,255,255,0.5)",
          margin: 0,
          fontStyle: "italic",
        }}
      >
        {riskDescription}
      </p>
    </div>
  );
}
