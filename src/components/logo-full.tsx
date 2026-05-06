import { LogoIcon } from "~/components/logo-icon";

export function LogoFull() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
      <div style={{ position: "relative", display: "inline-block" }}>
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "200px",
            height: "200px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(29,158,117,0.15) 0%, transparent 70%)",
            zIndex: 0,
            pointerEvents: "none",
          }}
        />
        <div style={{ position: "relative", zIndex: 1 }}>
          <LogoIcon size={140} />
        </div>
      </div>
      <div style={{ textAlign: "center" }}>
        <span style={{ fontSize: "64px", fontWeight: 700, color: "#1D9E75", letterSpacing: "-1px" }}>Toxi</span>
        <span style={{ fontSize: "64px", fontWeight: 700, color: "#f8fafc", letterSpacing: "-1px" }}>Clear</span>
        <span style={{ fontSize: "64px", fontWeight: 700, color: "#EF9F27", letterSpacing: "-1px" }}> AI</span>
      </div>
      <div
        style={{
          border: "1px solid rgba(239,159,39,0.6)",
          borderRadius: "999px",
          padding: "6px 24px",
          background: "rgba(239,159,39,0.08)",
          animation: "badge-pulse 3s ease-in-out infinite",
        }}
      >
        <span style={{ fontSize: "12px", fontWeight: 600, color: "#EF9F27", letterSpacing: "2px" }}>
          FOR STUDENTS + PATIENTS
        </span>
      </div>
    </div>
  );
}
