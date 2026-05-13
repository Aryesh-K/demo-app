"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "~/lib/supabase/client";
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

// ─── Study card ───────────────────────────────────────────────────────────────

function StudyCard({
  card,
  index,
  total,
  mastered,
  onGotIt,
  onReviewAgain,
}: {
  card: Flashcard | UserFlashcard;
  index: number;
  total: number;
  mastered: number;
  onGotIt: () => void;
  onReviewAgain: () => void;
}) {
  const [flipped, setFlipped] = useState(false);

  function handleFlip() {
    setFlipped((v) => !v);
  }

  function handleGotIt() {
    setFlipped(false);
    onGotIt();
  }

  function handleReview() {
    setFlipped(false);
    onReviewAgain();
  }

  const remaining = total - index - 1;

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Progress */}
      <div className="w-full max-w-[500px]">
        <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
          <span>Card {index + 1} of {total}</span>
          <span>{mastered} mastered · {remaining} remaining</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-teal-500 transition-all duration-300"
            style={{ width: `${((index + 1) / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Card with 3D flip */}
      <div
        style={{ perspective: "1000px", width: "100%", maxWidth: "500px" }}
      >
        <div
          style={{
            transformStyle: "preserve-3d",
            transition: "transform 0.4s ease",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
            position: "relative",
            minHeight: "220px",
          }}
        >
          {/* Front */}
          <div
            style={{ backfaceVisibility: "hidden" }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card p-8 text-center"
          >
            <p className="text-xl font-bold text-foreground">{"term" in card ? card.term : ""}</p>
            <p className="text-xs text-muted-foreground">Tap to reveal definition</p>
            <button
              type="button"
              onClick={handleFlip}
              className="mt-2 rounded-lg border border-border px-5 py-2 text-sm text-muted-foreground transition-colors hover:border-teal-700 hover:text-teal-300"
            >
              Reveal →
            </button>
          </div>

          {/* Back */}
          <div
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
            className="absolute inset-0 flex flex-col gap-4 rounded-2xl border border-teal-800 bg-card p-8"
          >
            <p className="text-[10px] font-semibold uppercase tracking-widest text-teal-400/70">
              Definition
            </p>
            <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
              {card.definition}
            </p>
            <div className="flex gap-3">
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FlashcardsPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  // Tab
  const [tab, setTab] = useState<Tab>("all");

  // All-cards tab
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [search, setSearch] = useState("");

  // My cards tab
  const [myCards, setMyCards] = useState<UserFlashcard[]>([]);
  const [myCardsLoading, setMyCardsLoading] = useState(false);

  // Study session state
  const [studyCategoryFilter, setStudyCategoryFilter] = useState<CategoryFilter>("all");
  const [cardSetFilter, setCardSetFilter] = useState<CardSetFilter>("all");
  const [shuffle, setShuffle] = useState(true);
  const [studyStarted, setStudyStarted] = useState(false);
  const [studyDeck, setStudyDeck] = useState<(Flashcard | UserFlashcard)[]>([]);
  const [studyIndex, setStudyIndex] = useState(0);
  const [masteredCount, setMasteredCount] = useState(0);
  const [studyComplete, setStudyComplete] = useState(false);

  // Auth check
  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/signup?message=Please create a free account to access Flashcards.");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_premium")
        .eq("id", user.id)
        .single();
      if (!profile?.is_premium) {
        router.push("/account");
        return;
      }
      setReady(true);
    })();
  }, [router]);

  // Load my cards
  useEffect(() => {
    if (!ready || tab !== "mine") return;
    setMyCardsLoading(true);
    const supabase = createClient();
    supabase
      .from("user_flashcards")
      .select("id, term, definition, category, source")
      .eq("source", "analysis")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setMyCards((data as UserFlashcard[]) ?? []);
        setMyCardsLoading(false);
      });
  }, [ready, tab]);

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

  // Build study deck
  function startStudy() {
    let base: (Flashcard | UserFlashcard)[] = [];

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

    setStudyDeck(base);
    setStudyIndex(0);
    setMasteredCount(0);
    setStudyComplete(false);
    setStudyStarted(true);
  }

  function advanceStudy(mastered: boolean) {
    if (mastered) setMasteredCount((n) => n + 1);
    if (studyIndex + 1 >= studyDeck.length) {
      setStudyComplete(true);
    } else {
      setStudyIndex((i) => i + 1);
    }
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

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
          {/* Filters */}
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
          {/* Search */}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by term…"
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-ring dark:bg-input/30"
          />
          {/* Grid */}
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
                  {masteredCount} of {studyDeck.length} cards mastered
                </p>
              </div>
              <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-teal-500"
                  style={{ width: `${(masteredCount / studyDeck.length) * 100}%` }}
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
          ) : (
            /* Active study */
            <StudyCard
              card={studyDeck[studyIndex]!}
              index={studyIndex}
              total={studyDeck.length}
              mastered={masteredCount}
              onGotIt={() => advanceStudy(true)}
              onReviewAgain={() => advanceStudy(false)}
            />
          )}
        </div>
      )}
    </main>
  );
}
