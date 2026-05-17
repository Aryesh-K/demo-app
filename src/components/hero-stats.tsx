"use client";
import { useEffect, useRef, useState } from "react";

const STATS = [
  { target: 10000, suffix: "+", label: "Possible drug combinations checked" },
  { target: 3, suffix: "", label: "Trusted medical databases" },
  { target: 100, suffix: "K+", label: "Potential interactions in our AI model" },
  { target: 3, suffix: "", label: "Curriculum-aligned explanation levels" },
];

function useCountUp(target: number, duration = 1400) {
  const [count, setCount] = useState(0);
  const raf = useRef<number | null>(null);
  const start = useRef<number | null>(null);

  useEffect(() => {
    start.current = null;
    const step = (ts: number) => {
      if (start.current === null) start.current = ts;
      const progress = Math.min((ts - start.current) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target, duration]);

  return count;
}

function StatItem({ target, suffix, label }: (typeof STATS)[number]) {
  const count = useCountUp(target);
  const display = count >= 1000 ? count.toLocaleString() : String(count);
  return (
    <div style={{ textAlign: "center", width: "100%" }}>
      <div style={{ fontSize: "clamp(22px, 6vw, 36px)", fontWeight: 700, color: "#1D9E75", lineHeight: 1, overflow: "hidden" }}>
        {display}{suffix}
      </div>
      <div style={{ fontSize: "clamp(10px, 2.5vw, 12px)", color: "#64748b", marginTop: "6px", lineHeight: 1.4 }}>
        {label}
      </div>
    </div>
  );
}

export function HeroStats() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="mx-auto max-w-3xl"
      style={{ width: "100%", overflowX: "hidden", boxSizing: "border-box", padding: "32px 16px" }}
    >
      <div
        className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full"
        style={{
          background: "rgba(29,158,117,0.05)",
          border: "1px solid rgba(29,158,117,0.2)",
          borderRadius: "16px",
          padding: "24px",
          overflow: "hidden",
          boxSizing: "border-box",
        }}
      >
        {visible && STATS.map((s) => <StatItem key={s.label} {...s} />)}
      </div>
    </div>
  );
}
