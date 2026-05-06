"use client";

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
  { id: 1, icon: "⚗️", title: "How It Works",          side: "left",  bobClass: "card-bob-2" },
  { id: 2, icon: "💊", title: "Why ToxiClear AI?",     side: "right", bobClass: "card-bob-3" },
  { id: 3, icon: "👑", title: "What is Premium?",      side: "right", bobClass: "card-bob-4" },
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
              <span className="font-semibold text-slate-300">Check Mode</span> —
              instantly see if your medications are safe to combine, with a
              plain-English explanation of the risks
            </span>
          </li>
          <li className="flex gap-2">
            <span className="mt-px shrink-0 text-teal-500">▸</span>
            <span>
              <span className="font-semibold text-slate-300">Learn Mode</span> —
              understand the biology behind why interactions happen, with
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
              NIH&apos;s standardized drug naming database that maps brand and
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
          Most drug interaction checkers give you a one-line warning. ToxiClear
          AI goes further:
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
          For a one-time payment of $9.99, unlock everything ToxiClear AI has to
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
        <p className="mt-1 text-sm text-slate-500">
          Sign up using the button in the top right to get started.
        </p>
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
        <span className="text-xl" aria-hidden="true">
          {card.icon}
        </span>
        <span className="flex-1 text-base font-medium text-slate-200">
          {card.title}
        </span>
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

export function AccordionCards({ children }: { children?: React.ReactNode }) {
  const [openCard, setOpenCard] = useState<number | null>(null);

  function toggle(id: number) {
    setOpenCard((prev) => (prev === id ? null : id));
  }

  const leftCards  = CARDS.filter((c) => c.side === "left");
  const rightCards = CARDS.filter((c) => c.side === "right");

  return (
    <>
      {/* ── Desktop: three-column layout ── */}
      <div
        className="hidden w-full md:flex"
        style={{
          minHeight: "100vh",
          alignItems: "center",
          maxWidth: "80rem",
          margin: "0 auto",
          padding: "0 2rem",
        }}
      >
        {/* Left column */}
        <div
          style={{
            width: "18rem",
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            marginTop: "auto",
            marginBottom: "auto",
          }}
        >
          {leftCards.map((card) => (
            <AccordionCard
              key={card.id}
              card={card}
              openCard={openCard}
              onToggle={toggle}
            />
          ))}
        </div>

        {/* Center column */}
        <div
          style={{
            flex: 1,
            minWidth: "500px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1.5rem",
            padding: "7.5rem 2rem",
            textAlign: "center",
          }}
        >
          {children}
        </div>

        {/* Right column */}
        <div
          style={{
            width: "18rem",
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            marginTop: "auto",
            marginBottom: "auto",
          }}
        >
          {rightCards.map((card) => (
            <AccordionCard
              key={card.id}
              card={card}
              openCard={openCard}
              onToggle={toggle}
            />
          ))}
        </div>
      </div>

      {/* ── Mobile: center content + 2×2 card grid ── */}
      <div className="flex flex-col md:hidden">
        {children && (
          <div className="flex flex-col items-center gap-6 px-8 py-[120px] text-center">
            {children}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3 p-4">
          {CARDS.map((card) => (
            <AccordionCard
              key={card.id}
              card={card}
              openCard={openCard}
              onToggle={toggle}
            />
          ))}
        </div>
      </div>
    </>
  );
}
