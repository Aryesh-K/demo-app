"use client";

interface ConfidenceScoreProps {
  score: number;
  databasesFound: {
    fda: boolean;
    dailyMed: boolean;
    pharmGKB: boolean;
    rxNorm: boolean;
  };
}

export function ConfidenceScore({
  score,
  databasesFound,
}: ConfidenceScoreProps) {
  const color =
    score >= 90 ? "#1D9E75" : score >= 70 ? "#f59e0b" : "#ef4444";

  const label =
    score >= 90
      ? "High Confidence"
      : score >= 70
        ? "Moderate Confidence"
        : "Low Confidence";

  const description =
    score >= 90
      ? "Well-documented in multiple medical databases"
      : score >= 70
        ? "Recognized interaction with some variation across sources"
        : "Based primarily on AI reasoning — verify with a professional";

  const dbList = [
    databasesFound.fda && "FDA",
    databasesFound.dailyMed && "DailyMed",
    databasesFound.pharmGKB && "PharmGKB",
    databasesFound.rxNorm && "RxNorm",
  ].filter(Boolean);

  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "8px",
        padding: "12px 16px",
        marginTop: "16px",
        background: "rgba(255,255,255,0.02)",
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "8px",
        }}
      >
        <span
          style={{
            fontSize: "11px",
            color: "rgba(255,255,255,0.4)",
            textTransform: "uppercase",
            letterSpacing: "1px",
          }}
        >
          Analysis Confidence
        </span>
        <span style={{ fontSize: "13px", fontWeight: 600, color }}>
          {score}% — {label}
        </span>
      </div>

      {/* Progress bar */}
      <div
        style={{
          height: "4px",
          background: "rgba(255,255,255,0.08)",
          borderRadius: "2px",
          overflow: "hidden",
          marginBottom: "8px",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${score}%`,
            background: color,
            borderRadius: "2px",
            transition: "width 0.8s ease-out",
          }}
        />
      </div>

      {/* Description */}
      <p
        style={{
          fontSize: "12px",
          color: "rgba(255,255,255,0.4)",
          margin: "0 0 6px",
        }}
      >
        {description}
      </p>

      {/* Database badges */}
      {dbList.length > 0 && (
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          <span
            style={{
              fontSize: "10px",
              color: "rgba(255,255,255,0.3)",
              marginRight: "4px",
            }}
          >
            Verified by:
          </span>
          {dbList.map((db) => (
            <span
              key={db as string}
              style={{
                fontSize: "10px",
                padding: "2px 8px",
                borderRadius: "999px",
                border: "1px solid rgba(29,158,117,0.3)",
                color: "#1D9E75",
                background: "rgba(29,158,117,0.05)",
              }}
            >
              {db}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
