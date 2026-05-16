"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "~/lib/supabase/client";
import { usePremiumGuard } from "~/hooks/usePremiumGuard";
import { MCAT_FLASHCARDS, type Flashcard } from "~/lib/mcat-flashcards";
import { cn } from "~/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserFlashcard {
  id: number;
  term: string;
  definition: string;
  category: string | null;
  source: string;
}

type StudyCard = Flashcard | UserFlashcard;

type Tab = "all" | "mine" | "study";
type CategoryFilter = "all" | "pharmacokinetics" | "pharmacodynamics" | "interactions";
type CardSetFilter = "all" | "mine";

// ─── Category badge ───────────────────────────────────────────────────────────

function CategoryBadge({ category }: { category: string }) {
  const cfg =
    category === "pharmacokinetics"
      ? { label: "Pharmacokinetics", cls: "border-teal-800 bg-teal-950/40 text-teal-300" }
      : category === "pharmacodynamics"
        ? { label: "Pharmacodynamics", cls: "border-yellow-800 bg-yellow-950/40 text-yellow-300" }
        : { label: "Interactions", cls: "border-purple-800 bg-purple-950/40 text-purple-300" };

  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        cfg.cls,
      )}
    >
      {cfg.label}
    </span>
  );
}

// ─── Browse card ──────────────────────────────────────────────────────────────

function BrowseCard({
  term,
  definition,
  category,
  onDelete,
}: {
  term: string;
  definition: string;
  category: string;
  onDelete?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setExpanded((v) => !v)}
      className="flex w-full flex-col gap-2 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-muted-foreground/50"
    >
      <div className="flex items-start justify-between gap-2">
        <CategoryBadge category={category} />
        {onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            aria-label="Remove card"
            className="shrink-0 text-xs text-muted-foreground transition-colors hover:text-red-400"
          >
            ✕
          </button>
        )}
      </div>
      <p className="text-sm font-semibold text-foreground">{term}</p>
      <p className="text-xs leading-relaxed text-muted-foreground">
        {expanded ? definition : `${definition.slice(0, 60)}${definition.length > 60 ? "…" : ""}`}
      </p>
      {!expanded && definition.length > 60 && (
        <p className="text-xs text-teal-400">Tap to expand</p>
      )}
    </button>
  );
}

// ─── Flip card ────────────────────────────────────────────────────────────────

function FlipCard({
  card,
  masteredCount,
  toReviewCount,
  totalCount,
  onGotIt,
  onReviewAgain,
}: {
  card: StudyCard;
  masteredCount: number;
  toReviewCount: number;
  totalCount: number;
  onGotIt: () => void;
  onReviewAgain: () => void;
}) {
  const [flipped, setFlipped] = useState(false);

  // Reset flip state when card changes
  useEffect(() => {
    setFlipped(false);
  }, [card]);

  function handleGotIt() {
    setFlipped(false);
    onGotIt();
  }

  function handleReview() {
    setFlipped(false);
    onReviewAgain();
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "24px",
        width: "100%",
      }}
    >
      {/* Progress */}
      <div className="w-full max-w-[500px]">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="font-medium text-teal-400">
            Mastered: {masteredCount}
          </span>
          <span className="text-amber-400">
            To review: {toReviewCount}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-teal-500 transition-all duration-300"
            style={{ width: totalCount > 0 ? `${(masteredCount / totalCount) * 100}%` : "0%" }}
          />
        </div>
      </div>

      {/* 3D flip card — fixed height, buttons outside */}
      <div style={{ perspective: "1000px", width: "100%", maxWidth: "500px" }}>
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: card flip is supplementary to the Reveal button */}
        <div
          onClick={() => !flipped && setFlipped(true)}
          style={{
            transformStyle: "preserve-3d",
            transition: "transform 0.4s ease",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
            position: "relative",
            minHeight: "280px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            cursor: flipped ? "default" : "pointer",
          }}
        >
          {/* Front */}
          <div
            style={{ backfaceVisibility: "hidden" }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card p-8 text-center"
          >
            <p className="text-xl font-bold text-foreground">{card.term}</p>
            <p className="text-xs text-muted-foreground">Tap card or click Reveal to see definition</p>
          </div>

          {/* Back */}
          <div
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
            className="absolute inset-0 flex flex-col gap-3 rounded-2xl border border-teal-800 bg-card p-8"
          >
            <p className="text-[10px] font-semibold uppercase tracking-widest text-teal-400/70">
              Definition
            </p>
            <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
              {card.definition}
            </p>
          </div>
        </div>
      </div>

      {/* Action buttons — always outside the flip container */}
      <div
        style={{
          marginTop: "16px",
          display: "flex",
          gap: "12px",
          width: "100%",
          maxWidth: "500px",
        }}
      >
        {!flipped ? (
          <button
            type="button"
            onClick={() => setFlipped(true)}
            className="w-full rounded-lg border border-border py-2.5 text-sm text-muted-foreground transition-colors hover:border-teal-700 hover:text-teal-300"
          >
            Reveal →
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={handleGotIt}
              className="flex-1 rounded-lg bg-teal-700 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-600"
            >
              Got it ✓
            </button>
            <button
              type="button"
              onClick={handleReview}
              className="flex-1 rounded-lg border border-border py-2.5 text-sm text-muted-foreground transition-colors hover:border-muted-foreground hover:text-foreground"
            >
              Review Again
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FlashcardsPage() {
  const { isLoading, isPremium } = usePremiumGuard();

  // Tab
  const [tab, setTab] = useState<Tab>("all");

  // All-cards tab
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [search, setSearch] = useState("");

  // My cards tab
  const [myCards, setMyCards] = useState<UserFlashcard[]>([]);
  const [myCardsLoading, setMyCardsLoading] = useState(true);

  // Study session config
  const [studyCategoryFilter, setStudyCategoryFilter] = useState<CategoryFilter>("all");
  const [cardSetFilter, setCardSetFilter] = useState<CardSetFilter>("all");
  const [shuffle, setShuffle] = useState(true);
  const [studyStarted, setStudyStarted] = useState(false);

  // Study session runtime state
  const [remaining, setRemaining] = useState<StudyCard[]>([]);
  const [reviewAgain, setReviewAgain] = useState<StudyCard[]>([]);
  const [mastered, setMastered] = useState<StudyCard[]>([]);
  const [studyComplete, setStudyComplete] = useState(false);
  const [secondPassMsg, setSecondPassMsg] = useState(false);

  const totalCount = remaining.length + reviewAgain.length + mastered.length;

  // Load my cards on mount
  useEffect(() => {
    const loadUserCards = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMyCardsLoading(false);
        return;
      }
      const { data } = await supabase
        .from("user_flashcards")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (data) {
        setMyCards(data as UserFlashcard[]);
      }
      setMyCardsLoading(false);
    };
    loadUserCards();
  }, []);

  async function deleteMyCard(id: number) {
    const supabase = createClient();
    await supabase.from("user_flashcards").delete().eq("id", id);
    setMyCards((prev) => prev.filter((c) => c.id !== id));
  }

  // Filtered all-cards
  const filteredAll = useMemo(() => {
    return MCAT_FLASHCARDS.filter((c) => {
      if (categoryFilter !== "all" && c.category !== categoryFilter) return false;
      if (search && !c.term.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [categoryFilter, search]);

  // Build and start study deck
  function startStudy() {
    let base: StudyCard[] = [];

    if (cardSetFilter === "all") {
      let mcat: Flashcard[] = MCAT_FLASHCARDS;
      if (studyCategoryFilter !== "all")
        mcat = mcat.filter((c) => c.category === studyCategoryFilter);
      base = [...mcat, ...myCards];
    } else {
      base = [...myCards];
    }

    if (shuffle) {
      base = [...base].sort(() => Math.random() - 0.5);
    }

    setRemaining(base);
    setReviewAgain([]);
    setMastered([]);
    setStudyComplete(false);
    setSecondPassMsg(false);
    setStudyStarted(true);
  }

  function handleGotIt() {
    const [current, ...rest] = remaining;
    const newMastered = [...mastered, current!];
    setMastered(newMastered);
    setRemaining(rest);

    if (rest.length === 0) {
      if (reviewAgain.length === 0) {
        setStudyComplete(true);
      } else {
        triggerSecondPass(reviewAgain);
      }
    }
  }

  function handleReviewAgain() {
    const [current, ...rest] = remaining;
    const newReviewAgain = [...reviewAgain, current!];
    setReviewAgain(newReviewAgain);
    setRemaining(rest);

    if (rest.length === 0) {
      triggerSecondPass(newReviewAgain);
    }
  }

  function triggerSecondPass(cards: StudyCard[]) {
    setSecondPassMsg(true);
    setTimeout(() => {
      setSecondPassMsg(false);
      const shuffled = [...cards].sort(() => Math.random() - 0.5);
      setRemaining(shuffled);
      setReviewAgain([]);
    }, 1500);
  }

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "#050d1a", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.4)", fontSize: "14px" }}>
        Checking access...
      </div>
    );
  }

  if (!isPremium) return null;

  return (
    <main className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-4xl flex-col gap-8 px-6 py-12">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <span className="w-fit rounded-full border border-yellow-700 bg-yellow-950/40 px-3 py-1 text-xs font-medium text-yellow-300">
          👑 Premium
        </span>
        <h1 className="text-3xl font-bold tracking-tight">
          MCAT Pharmacology Flashcards
        </h1>
        <p className="text-muted-foreground">
          Master pharmacokinetics, pharmacodynamics, and drug interactions
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {(
          [
            { id: "all", label: `All Cards (100)` },
            { id: "mine", label: `My Added Cards (${myCards.length})` },
            { id: "study", label: "Study Session" },
          ] as { id: Tab; label: string }[]
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTab(t.id);
              setStudyStarted(false);
            }}
            className={cn(
              "px-5 py-2.5 text-sm font-medium transition-colors",
              tab === t.id
                ? "-mb-px border-b-2 border-teal-400 text-teal-300"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab 1: All Cards ── */}
      {tab === "all" && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap gap-2">
            {(
              [
                { id: "all", label: "All" },
                { id: "pharmacokinetics", label: "Pharmacokinetics" },
                { id: "pharmacodynamics", label: "Pharmacodynamics" },
                { id: "interactions", label: "Interactions" },
              ] as { id: CategoryFilter; label: string }[]
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setCategoryFilter(f.id)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  categoryFilter === f.id
                    ? "border-teal-600 bg-teal-950/40 text-teal-300"
                    : "border-border text-muted-foreground hover:border-muted-foreground hover:text-foreground",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by term…"
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-ring dark:bg-input/30"
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAll.map((card) => (
              <BrowseCard
                key={card.id}
                term={card.term}
                definition={card.definition}
                category={card.category}
              />
            ))}
          </div>
          {filteredAll.length === 0 && (
            <p className="text-center text-sm text-muted-foreground">No cards match your search.</p>
          )}
        </div>
      )}

      {/* ── Tab 2: My Added Cards ── */}
      {tab === "mine" && (
        <div className="flex flex-col gap-5">
          {myCardsLoading ? (
            <p className="text-sm text-muted-foreground">Loading your cards…</p>
          ) : myCards.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <p className="text-sm text-muted-foreground">
                Click highlighted terms in Learn Mode Premium analyses to add cards here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {myCards.map((card) => (
                <BrowseCard
                  key={card.id}
                  term={card.term}
                  definition={card.definition}
                  category={card.category ?? "interactions"}
                  onDelete={() => deleteMyCard(card.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab 3: Study Session ── */}
      {tab === "study" && (
        <div className="flex flex-col gap-6">
          {!studyStarted ? (
            /* Setup panel */
            <div className="flex flex-col gap-5 rounded-xl border border-border bg-card p-6">
              <h2 className="text-sm font-semibold">Session Options</h2>

              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-medium text-muted-foreground">Topic filter</p>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      { id: "all", label: "All topics" },
                      { id: "pharmacokinetics", label: "Pharmacokinetics only" },
                      { id: "pharmacodynamics", label: "Pharmacodynamics only" },
                      { id: "interactions", label: "Interactions only" },
                    ] as { id: CategoryFilter; label: string }[]
                  ).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setStudyCategoryFilter(f.id)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                        studyCategoryFilter === f.id
                          ? "border-teal-600 bg-teal-950/40 text-teal-300"
                          : "border-border text-muted-foreground hover:border-muted-foreground",
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-medium text-muted-foreground">Card set</p>
                <div className="flex gap-2">
                  {(
                    [
                      { id: "all", label: "All cards" },
                      { id: "mine", label: "My added cards only" },
                    ] as { id: CardSetFilter; label: string }[]
                  ).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setCardSetFilter(f.id)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                        cardSetFilter === f.id
                          ? "border-teal-600 bg-teal-950/40 text-teal-300"
                          : "border-border text-muted-foreground hover:border-muted-foreground",
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={shuffle}
                  onChange={(e) => setShuffle(e.target.checked)}
                  className="h-4 w-4 accent-teal-500"
                />
                <span className="text-sm text-muted-foreground">Shuffle cards</span>
              </label>

              <button
                type="button"
                onClick={startStudy}
                className="w-full rounded-lg bg-teal-700 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal-600"
              >
                Start Study Session →
              </button>
            </div>
          ) : studyComplete ? (
            /* Completion screen */
            <div className="flex flex-col items-center gap-6 rounded-xl border border-teal-800 bg-teal-950/20 p-10 text-center">
              <span className="text-5xl">🎉</span>
              <div className="flex flex-col gap-2">
                <h2 className="text-xl font-bold">Session Complete!</h2>
                <p className="text-muted-foreground">
                  {mastered.length} of {totalCount} cards mastered
                </p>
              </div>
              <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-teal-500"
                  style={{ width: totalCount > 0 ? `${(mastered.length / totalCount) * 100}%` : "0%" }}
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={startStudy}
                  className="rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-600"
                >
                  Study Again
                </button>
                <button
                  type="button"
                  onClick={() => setStudyStarted(false)}
                  className="rounded-lg border border-border px-5 py-2.5 text-sm text-muted-foreground transition-colors hover:border-muted-foreground hover:text-foreground"
                >
                  Change Options
                </button>
              </div>
            </div>
          ) : secondPassMsg ? (
            /* Second-pass transition message */
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <span className="text-3xl">🔄</span>
              <p className="text-sm text-muted-foreground">
                Nice work on the first pass! Now reviewing {reviewAgain.length} card{reviewAgain.length !== 1 ? "s" : ""} you marked for review…
              </p>
            </div>
          ) : remaining.length > 0 ? (
            /* Active study */
            <FlipCard
              card={remaining[0]!}
              masteredCount={mastered.length}
              toReviewCount={remaining.length + reviewAgain.length}
              totalCount={totalCount}
              onGotIt={handleGotIt}
              onReviewAgain={handleReviewAgain}
            />
          ) : null}
        </div>
      )}
    </main>
  );
}
