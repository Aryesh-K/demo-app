"use client";

import { useEffect, useState } from "react";

export function ScrollIndicator() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    function handleScroll() {
      setVisible(window.scrollY <= 100);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className="pointer-events-none absolute bottom-8 left-0 right-0 flex flex-col items-center gap-1.5"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 0.4s ease" }}
      aria-hidden="true"
    >
      <span className="text-xs text-muted-foreground/60">
        Scroll to explore
      </span>
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5 text-muted-foreground/50"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={{ animation: "bounce-gentle 1.5s ease-in-out infinite" }}
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </div>
  );
}
