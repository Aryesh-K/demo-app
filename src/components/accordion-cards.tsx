"use client";

import Link from "next/link";
import { useState } from "react";

// ─── Card definitions ─────────────────────────────────────────────────────────

interface CardDef {
  id: number;
  icon: string;
  title: string;
  side: "left" | "right";
  bobClass: string;
}

const CARDS: CardDef[] = [
  { id: 0, icon: "🧬", title: "What is ToxiClear AI?", side: "left",  bobClass: "card-bob-1" },
  { id: 1, icon: "⚗️", title: "How It Works",           side: "left",  bobClass: "card-bob-2" },
  { id: 2, icon: "💊", title: "Why ToxiClear AI?",      side: "right", bobClass: "card-bob-3" },
  { id: 3, icon: "👑", title: "What is Premium?",       side: "right", bobClass: "card-bob-4" },
];

// ─── Per-card content ─────────────────────────────────────────────────────────

function CardContent({ id }: { id: number }) {
  if (id === 0) {
    return (
      <div className="flex flex-col gap-2 text-sm leading-relaxed text-slate-400">
        <p>
          ToxiClear AI is a drug interaction checker powered by real FDA data,
          NIH databases, and advanced AI. It has two modes:
        </p>
        <ul className="flex flex-col gap-1.5 pl-0.5">
          <li className="flex gap-2">
            <span className="mt-px shrink-0 text-teal-500">▸</span>
            <span>
              <span className="font-semibold text-slate-300">Check Mode</span>{" "}
              — instantly see if your medications are safe to combine, with a
              plain-English explanation of the risks
            </span>
          </li>
          <li className="flex gap-2">
            <span className="mt-px shrink-0 text-teal-500">▸</span>
            <span>
              <span className="font-semibold text-slate-300">Learn Mode</span>{" "}
              — understand the biology behind why interactions happen, with
              explanations tailored to your knowledge level
            </span>
          </li>
        </ul>
        <p>
          Free tier covers OTC medications and alcohol. Premium unlocks
          prescription drugs, supplements, personalized health profiles, and
          curriculum-aligned educational content.
        </p>
      </div>
    );
  }

  if (id === 1) {
    return (
      <div className="flex flex-col gap-2 text-sm leading-relaxed text-slate-400">
        <p>Every interaction analysis pulls from three trusted sources:</p>
        <ul className="flex flex-col gap-1.5 pl-0.5">
          <li className="flex gap-2">
            <span className="mt-px shrink-0 text-teal-500">▸</span>
            <span>
              <span className="font-semibold text-slate-300">OpenFDA</span> —
              official FDA drug label warnings and interaction data
            </span>
          </li>
          <li className="flex gap-2">
            <span className="mt-px shrink-0 text-teal-500">▸</span>
            <span>
              <span className="font-semibold text-slate-300">RxNorm</span> —
              NIH's standardized drug naming database that maps brand and
              generic names to ensure accurate matching
            </span>
          </li>
          <li className="flex gap-2">
            <span className="mt-px shrink-0 text-teal-500">▸</span>
            <span>
              <span className="font-semibold text-slate-300">
                Groq AI (Llama 3.3 70B)
              </span>{" "}
              — one of the most advanced language models available, used to
              synthesize database findings into clear, level-appropriate
              explanations
            </span>
          </li>
        </ul>
        <p>
          Your inputs — drug names, amounts, application method, and optional
          context — are all factored into every analysis. Nothing is stored
          without your permission.
        </p>
      </div>
    );
  }

  if (id === 2) {
    return (
      <div className="flex flex-col gap-2 text-sm leading-relaxed text-slate-400">
        <p>
          Most drug interaction checkers give you a one-line warning.
          ToxiClear AI goes further:
        </p>
        <ul className="flex flex-col gap-1.5 pl-0.5">
          <li className="flex gap-2">
            <span className="mt-px shrink-0 text-teal-500">▸</span>
            <span>
              Plain-English explanations written at{" "}
              <em className="text-slate-300">your</em> level — not medical
              jargon that requires a degree to understand
            </span>
          </li>
          <li className="flex gap-2">
            <span className="mt-px shrink-0 text-teal-500">▸</span>
            <span>
              Biology education built in — Learn Mode explains the actual
              science behind why interactions happen
            </span>
          </li>
          <li className="flex gap-2">
            <span className="mt-px shrink-0 text-teal-500">▸</span>
            <span>
              Application method matters — topical vs oral vs inhaled can
              completely change an interaction, and we account for that
            </span>
          </li>
          <li className="flex gap-2">
            <span className="mt-px shrink-0 text-teal-500">▸</span>
            <span>
              Amount-aware — entering dosages lets us give more precise context
            </span>
          </li>
          <li className="flex gap-2">
            <span className="mt-px shrink-0 text-teal-500">▸</span>
            <span>
              Multi-drug analysis — check up to 5 substances at once in Premium
            </span>
          </li>
        </ul>
      </div>
    );
  }

  if (id === 3) {
    return (
      <div className="flex flex-col gap-2 text-sm leading-relaxed text-slate-400">
        <p>
          For a one-time payment of $15, unlock everything ToxiClear AI has to
          offer — forever. No subscriptions, no monthly fees.
        </p>
        <p className="font-semibold text-slate-300">Premium includes:</p>
        <ul className="flex flex-col gap-1 pl-0.5">
          {[
            "Prescription drug interactions",
            "Up to 5 drugs analyzed simultaneously",
            "Supplement and cosmetic product interactions",
            "Saved health profile with your medications and conditions",
            "Curriculum-aligned learning modes for honors biology, AP Biology, and pre-med students",
            "Case study mode for educators and students",
            "Immersive body map visualizations for every interaction",
            "Clickable term definitions calibrated to your level",
          ].map((item) => (
            <li key={item} className="flex gap-2">
              <span className="mt-px shrink-0 text-teal-500">▸</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p>One payment. Lifetime access.</p>
        <Link
          href="/signup"
          className="mt-1 inline-flex items-center justify-center rounded-lg bg-yellow-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-yellow-600"
        >
          Get Premium →
        </Link>
      </div>
    );
  }

  return null;
}

// ─── Single accordion card ────────────────────────────────────────────────────

function AccordionCard({
  card,
  openCard,
  onToggle,
}: {
  card: CardDef;
  openCard: number | null;
  onToggle: (id: number) => void;
}) {
  const isOpen = openCard === card.id;

  return (
    <div
      className={`info-card flex flex-col rounded-xl ${card.bobClass}${isOpen ? " card-bob-paused" : ""}`}
    >
      {/* Banner — always visible */}
      <button
        type="button"
        onClick={() => onToggle(card.id)}
        aria-expanded={isOpen}
        className="info-card-banner flex w-full items-center gap-2.5 px-4 py-4 text-left"
        style={{ borderRadius: isOpen ? "12px 12px 0 0" : "12px" }}
      >
        <span className="text-xl" aria-hidden="true">{card.icon}</span>
        <span className="flex-1 text-base font-medium text-slate-200">{card.title}</span>
        <span
          aria-hidden="true"
          className="text-[10px] text-slate-400 transition-transform duration-300"
          style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          ▼
        </span>
      </button>

      {/* Collapsible content */}
      <div
        style={{
          maxHeight: isOpen ? "45vh" : 0,
          overflowY: isOpen ? "auto" : "hidden",
          transition: "max-height 0.4s ease",
        }}
      >
        <div className="p-4" style={{ borderTop: "1px solid #4a9ebb" }}>
          <CardContent id={card.id} />
        </div>
      </div>
    </div>
  );
}

// ─── Exported layout component ────────────────────────────────────────────────

export function AccordionCards({ children }: { children: React.ReactNode }) {
  const [openCard, setOpenCard] = useState<number | null>(null);

  function toggle(id: number) {
    setOpenCard((prev) => (prev === id ? null : id));
  }

  const leftCards  = CARDS.filter((c) => c.side === "left");
  const rightCards = CARDS.filter((c) => c.side === "right");

  return (
      <div className="mx-auto flex w-full max-w-6xl flex-col md:flex-row md:items-start md:gap-4">

        {/* Left column — cards stack naturally from top */}
        <div className="hidden w-72 flex-shrink-0 flex-col justify-start gap-4 p-5 md:flex">
          {leftCards.map((card) => (
            <AccordionCard key={card.id} card={card} openCard={openCard} onToggle={toggle} />
          ))}
        </div>

        {/* Center column — hero content */}
        <div className="flex min-h-screen min-w-[500px] flex-1 flex-col items-center justify-center gap-6 px-8 py-[120px] text-center md:min-h-0">
          {children}
        </div>

        {/* Right column — cards stack naturally from top */}
        <div className="hidden w-72 flex-shrink-0 flex-col justify-start gap-4 p-5 md:flex">
          {rightCards.map((card) => (
            <AccordionCard key={card.id} card={card} openCard={openCard} onToggle={toggle} />
          ))}
        </div>

        {/* Mobile cards — 2×2 grid below center */}
        <div className="grid grid-cols-2 gap-3 p-4 md:hidden">
          {CARDS.map((card) => (
            <AccordionCard key={card.id} card={card} openCard={openCard} onToggle={toggle} />
          ))}
        </div>

      </div>
  );
}
