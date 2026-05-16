"use client";

import Link from "next/link";
import { usePremiumGuard } from "~/hooks/usePremiumGuard";
import { CASE_STUDIES } from "~/lib/case-studies";

export default function CaseStudiesPage() {
  const { isLoading, isPremium } = usePremiumGuard();

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "#050d1a", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.4)", fontSize: "14px" }}>
        Checking access...
      </div>
    );
  }

  if (!isPremium) return null;

  return (
    <main className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-5xl flex-col gap-10 px-6 py-12">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <span className="w-fit rounded-full border border-teal-700 bg-teal-950/30 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-teal-300">
          🔬 Interactive Learning
        </span>
        <h1 className="text-4xl font-bold tracking-tight">
          Case Study Simulations
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Learn pharmacology through real patient scenarios — the way medical
          students actually study
        </p>
        <span className="w-fit rounded-full border border-yellow-700 bg-yellow-950/30 px-3 py-1 text-xs font-medium text-yellow-300">
          👑 Premium for full access
        </span>
      </div>

      {/* Case study cards */}
      <div className="flex flex-col gap-6">
        {CASE_STUDIES.map((cs) => (
          <div
            key={cs.id}
            className="overflow-hidden rounded-xl border border-border bg-card"
            style={{ borderLeft: "4px solid rgb(20 184 166)" }}
          >
            <div className="flex flex-col gap-4 p-6">
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-bold">{cs.title}</h2>
                <p className="text-sm text-muted-foreground">{cs.subtitle}</p>
              </div>

              <p className="text-sm text-muted-foreground">
                {cs.patientScenario.slice(0, 120)}…
              </p>

              {/* Learning objective pills */}
              <div className="flex flex-wrap gap-2">
                {cs.learningObjectives.slice(0, 3).map((obj) => (
                  <span
                    key={obj}
                    className="rounded-full border border-teal-800 bg-teal-950/30 px-2.5 py-0.5 text-xs text-teal-300"
                  >
                    {obj}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <span className="rounded-full border border-yellow-700 bg-yellow-950/30 px-2.5 py-0.5 text-xs font-medium text-yellow-300">
                  {cs.targetLevel}
                </span>
                <span className="text-xs text-muted-foreground">
                  ⏱ {cs.estimatedMinutes} min
                </span>
                {cs.historyEraTitle && (
                  <Link
                    href="/history"
                    className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    📖 Related: {cs.historyEraTitle}
                  </Link>
                )}
              </div>

              <Link
                href={`/case-studies/${cs.id}`}
                className="w-fit rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-600"
              >
                Start Case Study →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
