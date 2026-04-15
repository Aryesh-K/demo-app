import Link from "next/link";
import { GridReveal } from "~/components/grid-reveal";
import { HeroCanvas } from "~/components/hero-canvas";
import { ScrollIndicator } from "~/components/scroll-indicator";
import { Button } from "~/components/ui/button";

const freePublicFeatures = [
  "Check interactions between 2 drugs or substances",
  "Risk level indicator (Low / Moderate / High)",
  "Plain English explanation of why the combination is dangerous",
  "Works anonymously — no account needed",
];

const freeStudentsFeatures = [
  "Check interactions between 2 drugs",
  "Basic biological mechanism explanation",
  "Intro-level biochemistry context (neurotransmitters, enzymes)",
  "Two explanation levels: simple and intermediate",
];

const premiumPublicFeatures = [
  "Check up to 3–5 drugs and supplements at once",
  "Includes alcohol and herbal supplement interactions",
  "Save your interaction history",
  "Medication reminders",
  'Real-life context (e.g. "this may affect your focus or sleep")',
];

const premiumStudentsFeatures = [
  "Advanced biochemical pathway explanations",
  "Multi-layer learning mode (beginner → advanced → pre-med)",
  "Interaction classification (CYP450, serotonin, CNS depression)",
  "Visual pathway diagrams",
  '"Explain to a patient / student / pre-med" modes',
];

function FeatureList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li
          key={item}
          className="flex items-start gap-2 text-sm leading-relaxed"
        >
          <span className="mt-0.5 shrink-0 opacity-40">•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function Home() {
  return (
    <main className="flex flex-col">
      {/* ── Hero — full viewport width ── */}
      <section className="relative flex min-h-[90vh] w-full flex-col items-center justify-center gap-6 overflow-hidden bg-[#f8fafc] py-[120px] text-center dark:bg-background dark:bg-gradient-to-b dark:from-blue-950/60 dark:via-blue-900/20 dark:to-transparent">
        <HeroCanvas />

        {/* content sits above canvas */}
        <div className="relative z-10 flex flex-col items-center gap-6 px-8">
          {/* Molecule icon — two atoms joined by a single bond */}
          <svg
            viewBox="0 0 56 28"
            className="h-8 w-16 text-blue-900 dark:text-blue-400"
            aria-hidden="true"
          >
            <circle cx="13" cy="14" r="10" fill="currentColor" />
            <line
              x1="23"
              y1="14"
              x2="33"
              y2="14"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx="43" cy="14" r="10" fill="currentColor" />
          </svg>

          <div className="flex flex-col gap-3">
            <h1 className="text-4xl font-bold tracking-tight">ToxiClear AI</h1>
            <p className="max-w-md text-lg text-muted-foreground">
              Know before you take. Understand the science behind your
              medications.
            </p>
          </div>

          <Button
            asChild
            className="bg-blue-900 text-white hover:bg-blue-800"
            size="lg"
          >
            <Link href="/check/free">Check an Interaction →</Link>
          </Button>
        </div>
        <ScrollIndicator />
      </section>

      {/* ── Content — constrained ── */}
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-6 pb-20 pt-12">
        {/* ── ToxiClear description ── */}
        <section className="text-center">
          <p className="mx-auto max-w-2xl leading-relaxed text-muted-foreground">
            ToxiClear AI helps you understand what happens inside your body when
            medications interact — whether you&apos;re a patient, caregiver,
            student, or educator.
          </p>
        </section>

        {/* ── Feature comparison grid ── */}
        <GridReveal>
          <section>
            <div className="overflow-x-auto">
              <div className="min-w-[640px] overflow-hidden rounded-xl border shadow-sm">
                <div className="grid grid-cols-[160px_1fr_1fr]">
                  {/* ── Header row ── */}
                  <div className="border-b border-r bg-muted" />
                  <div className="border-b border-r border-blue-800 bg-blue-900 px-6 py-5 text-white">
                    <p className="font-semibold">For the General Public</p>
                  </div>
                  <div className="border-b border-green-700 bg-green-800 px-6 py-5 text-white">
                    <p className="font-semibold">
                      For Students &amp; Educators
                    </p>
                  </div>

                  {/* ── Free row ── */}
                  <div className="border-b border-r bg-muted px-6 py-8">
                    <span className="font-semibold">Free</span>
                  </div>
                  <div className="border-b border-r px-6 py-8">
                    <FeatureList items={freePublicFeatures} />
                  </div>
                  <div className="border-b px-6 py-8">
                    <FeatureList items={freeStudentsFeatures} />
                  </div>

                  {/* ── Premium row ── */}
                  <div className="border-r bg-muted px-6 pb-12 pt-8">
                    <span className="font-semibold">Premium 👑</span>
                  </div>
                  <div className="border-r bg-muted px-6 pb-12 pt-8">
                    <FeatureList items={premiumPublicFeatures} />
                  </div>
                  <div className="bg-muted px-6 pb-12 pt-8">
                    <FeatureList items={premiumStudentsFeatures} />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </GridReveal>
        <hr className="border-border" />
      </div>
      <div className="h-24" />
    </main>
  );
}
