import { LogoIcon } from "~/components/logo-icon";

export function LogoFull() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
      <LogoIcon size={120} />
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
        }}
      >
        <span style={{ fontSize: "12px", fontWeight: 600, color: "#EF9F27", letterSpacing: "2px" }}>
          FOR STUDENTS + PATIENTS
        </span>
      </div>
    </div>
  );
}
