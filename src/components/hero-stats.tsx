"use client";
import { useEffect, useRef, useState } from "react";

const STATS = [
  { target: 10000, suffix: "+", label: "Possible drug combinations checked" },
  { target: 3, suffix: "", label: "Trusted medical databases" },
  { target: 100000, suffix: "+", label: "Potential interactions in our AI model" },
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
    <div className="flex flex-col items-center text-center">
      <span style={{ fontSize: "36px", fontWeight: 700, color: "#1D9E75", lineHeight: 1 }}>
        {display}{suffix}
      </span>
      <span className="mt-2 max-w-[130px] text-xs leading-snug text-slate-400">
        {label}
      </span>
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
      className="mx-auto w-full max-w-3xl rounded-xl px-12 py-8"
      style={{ background: "rgba(29,158,117,0.05)", border: "1px solid rgba(29,158,117,0.2)" }}
    >
      <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
        {visible && STATS.map((s) => <StatItem key={s.label} {...s} />)}
      </div>
    </div>
  );
}
