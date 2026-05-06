"use client";
import { useEffect, useState } from "react";

export function RotatePrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const check = () => {
      const isMobile = window.innerWidth < 768;
      const isPortrait = window.innerHeight > window.innerWidth;
      setShowPrompt(isMobile && isPortrait);
    };
    check();
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
    };
  }, []);

  if (!showPrompt) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#050d1a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "24px",
        padding: "32px",
      }}
    >
      <svg
        width="64"
        height="64"
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="20"
          y="8"
          width="28"
          height="48"
          rx="4"
          stroke="#1D9E75"
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M 44 20 L 56 20 M 56 20 L 52 16 M 56 20 L 52 24"
          stroke="#EF9F27"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect
          x="8"
          y="20"
          width="48"
          height="28"
          rx="4"
          stroke="#1D9E75"
          strokeWidth="2"
          fill="none"
          opacity="0.3"
        />
      </svg>
      <div style={{ textAlign: "center" }}>
        <p
          style={{
            color: "#f8fafc",
            fontSize: "20px",
            fontWeight: 700,
            margin: "0 0 8px",
          }}
        >
          Please rotate your device
        </p>
        <p
          style={{
            color: "#94a3b8",
            fontSize: "14px",
            margin: 0,
            lineHeight: 1.6,
          }}
        >
          ToxiClear AI is best experienced in landscape mode. Please rotate your
          phone horizontally to continue.
        </p>
      </div>
      <div
        style={{
          border: "1px solid rgba(29,158,117,0.4)",
          borderRadius: "999px",
          padding: "8px 20px",
          background: "rgba(29,158,117,0.08)",
        }}
      >
        <span
          style={{
            color: "#1D9E75",
            fontSize: "12px",
            fontWeight: 600,
            letterSpacing: "1px",
          }}
        >
          ROTATE TO LANDSCAPE
        </span>
      </div>
    </div>
  );
}
