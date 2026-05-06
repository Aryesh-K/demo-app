"use client";
import { useEffect, useRef, useState } from "react";

const STATS = [
  { target: 85, suffix: "+", label: "Drugs & Supplements" },
  { target: 3, suffix: "", label: "Explanation Levels" },
  { target: 4, suffix: "", label: "Checker Modes" },
];

function useCountUp(target: number, duration = 1200) {
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
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: "40px", fontWeight: 700, color: "#1D9E75", lineHeight: 1 }}>
        {count}{suffix}
      </div>
      <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "6px", letterSpacing: "0.05em", textTransform: "uppercase" }}>
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
    <div ref={ref} style={{ display: "flex", gap: "48px", justifyContent: "center", flexWrap: "wrap" }}>
      {visible && STATS.map((s) => <StatItem key={s.label} {...s} />)}
    </div>
  );
}
