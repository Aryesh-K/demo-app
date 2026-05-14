"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "~/lib/utils";

const FACTS = [
  {
    fact: "Thalidomide, prescribed in the 1950s for morning sickness, caused severe birth defects in over 10,000 babies — directly leading to modern drug safety testing laws.",
    source: "FDA Drug Safety History",
  },
  {
    fact: "Grapefruit juice can dangerously increase the potency of over 85 medications by blocking the CYP3A4 enzyme in your intestines that normally breaks them down.",
    source: "Canadian Medical Association Journal",
  },
  {
    fact: "Aspirin was discovered to interact with blood thinners in the 1950s — a finding that now prevents millions of strokes and heart attacks annually.",
    source: "American Heart Association",
  },
  {
    fact: "Acetaminophen overdose is the leading cause of acute liver failure in the United States, often from unknowingly combining multiple products containing it.",
    source: "National Institutes of Health",
  },
  {
    fact: "St. John's Wort, a common herbal supplement, can reduce the effectiveness of birth control, HIV medications, and organ transplant drugs by accelerating their breakdown in the liver.",
    source: "National Center for Complementary and Integrative Health",
  },
  {
    fact: "The first recorded drug interaction was documented in 1768 when physicians noticed that combining certain plant extracts caused unexpected and dangerous effects.",
    source: "Journal of Clinical Pharmacology",
  },
  {
    fact: "Nearly 125,000 Americans die annually from medication non-adherence and adverse drug interactions — more than diabetes or influenza.",
    source: "Annals of Internal Medicine",
  },
  {
    fact: "MAO inhibitors, once a common antidepressant, can cause a fatal hypertensive crisis when combined with aged cheese, wine, or common cold medicines.",
    source: "British Journal of Clinical Pharmacology",
  },
  {
    fact: "CYP3A4 metabolizes ~50% of all prescription drugs — a favorite MCAT topic that shows up across pharmacokinetics, drug interactions, and clinical biochemistry. 💊",
    source: "National Institutes of Health",
  },
  {
    fact: "Pharmacokinetics and drug interactions appear on every MCAT exam — studying them in real clinical context helps you retain mechanisms, not just memorize facts. 🧬",
    source: "Association of American Medical Colleges",
  },
];

const COUNT = FACTS.length;

export function DidYouKnow() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const indexRef = useRef(0);
  const pausedRef = useRef(false);

  const goTo = useCallback((next: number) => {
    setVisible(false);
    setTimeout(() => {
      indexRef.current = next;
      setIndex(next);
      setVisible(true);
    }, 220);
  }, []);

  const advance = useCallback(() => {
    if (pausedRef.current) return;
    goTo((indexRef.current + 1) % COUNT);
  }, [goTo]);

  useEffect(() => {
    const id = setInterval(advance, 12000);
    return () => clearInterval(id);
  }, [advance]);

  const current = FACTS[index];

  return (
    <section
      aria-label="Did You Know facts"
      onMouseEnter={() => {
        pausedRef.current = true;
      }}
      onMouseLeave={() => {
        pausedRef.current = false;
      }}
      className="mx-auto w-full max-w-[700px] px-4 py-10"
    >
      <div className="rounded-2xl border border-teal-800/50 bg-slate-900/60 px-8 py-7">
        {/* Label */}
        <p className="mb-5 text-center text-xs font-semibold uppercase tracking-widest text-teal-400">
          Did You Know? 💊
        </p>

        {/* Fact content with fade */}
        <div
          className="flex min-h-[112px] flex-col items-center justify-center gap-3"
          style={{
            opacity: visible ? 1 : 0,
            transition: "opacity 0.22s ease",
          }}
        >
          <p className="text-center text-2xl font-medium leading-relaxed text-white">
            {current.fact}
          </p>
          <p className="text-sm text-slate-500">— {current.source}</p>
        </div>

        {/* Dots — position indicator only, auto-rotation only */}
        <div className="mt-6 flex items-center justify-center gap-3">
          {FACTS.map((f, i) => (
            <div
              key={f.source}
              className={cn(
                "rounded-full transition-all duration-300",
                i === index ? "h-3 w-5 bg-teal-400" : "size-3 bg-slate-600",
              )}
            />
          ))}
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">
          Want to learn more? →{" "}
          <Link
            href="/history"
            className="text-teal-400 underline-offset-2 hover:text-teal-300 hover:underline"
          >
            Explore the History of Drug Interactions
          </Link>
        </p>
      </div>
    </section>
  );
}
