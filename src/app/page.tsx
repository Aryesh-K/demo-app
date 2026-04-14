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
    <main className="mx-auto max-w-5xl px-6 py-16 flex flex-col gap-12">
      {/* Hero */}
      <section className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          Welcome to Lumos App
        </h1>
        <p className="max-w-md text-lg text-muted-foreground">
          A production-ready Next.js starter with Supabase, shadcn/ui, and
          Tailwind CSS v4.
        </p>
      </section>

      {/* ToxiClear description */}
      <section className="text-center">
        <p className="mx-auto max-w-2xl text-muted-foreground leading-relaxed">
          ToxiClear AI helps you understand what happens inside your body when
          medications interact — whether you&apos;re a patient, caregiver,
          student, or educator.
        </p>
      </section>

      {/* Feature comparison grid */}
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
                <p className="font-semibold">For Students &amp; Educators</p>
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
              <div className="border-r bg-muted px-6 py-8">
                <span className="font-semibold">Premium 👑</span>
              </div>
              <div className="border-r bg-muted px-6 py-8">
                <FeatureList items={premiumPublicFeatures} />
              </div>
              <div className="bg-muted px-6 py-8">
                <FeatureList items={premiumStudentsFeatures} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
