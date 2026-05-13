import Link from "next/link";
import { AccordionCards } from "~/components/accordion-cards";
import { BackgroundAnimation } from "~/components/background-animation";
import { LogoFull } from "~/components/logo-full";
import { DidYouKnow } from "~/components/did-you-know";
import { GridReveal } from "~/components/grid-reveal";
import { HeroCtaButtons } from "~/components/hero-cta-buttons";
import { HeroStats } from "~/components/hero-stats";
import { ScrollIndicator } from "~/components/scroll-indicator";

const freePublicFeatures = [
  "Check interactions between 2 drugs, OTC medications, or alcohol",
  "Risk level indicator (Low / Moderate / High)",
  "Plain English explanation of why the combination is dangerous",
];

const freeStudentsFeatures = [
  "Check interactions between 2 drugs, OTC medications, or alcohol",
  "Basic biological mechanism explanation",
  "Intro-level biochemistry context (neurotransmitters, enzymes)",
  "Two explanation levels: simple and intermediate",
];

const premiumPublicFeatures = [
  "Check up to 3–5 drugs and supplements at once",
  "Includes herbal supplement and vitamin interactions",
  "Save your interaction history",
  'Real-life context (e.g. "this may affect your focus or sleep")',
  "Saved user profile that auto-updates and includes prescribed medications",
  "Curriculum-aligned explanation modes for middle school/honors biology, AP Biology, and pre-med students",
];

const premiumStudentsFeatures = [
  "Advanced biochemical pathway explanations",
  "Interaction classification (CYP450, serotonin, CNS depression)",
  "Immersive 3D interactive models tailored to selected explanation level 🧪 Beta",
  "Curriculum-aligned explanations for middle school/honors biology, AP Biology, and pre-med students",
  "Chemical substance analysis — explore toxicological interactions involving cyanide, heavy metals, industrial chemicals, and more",
  "Case study mode — analyze interactions for a specific patient profile",
  "Organ and biochemical process focus — direct the AI to emphasize specific systems like cardiac function, cellular respiration, or liver metabolism",
  "Clickable term definitions — tap any highlighted word for an instant explanation calibrated to your curriculum level",
  "🃏 MCAT Pharmacology Flashcard Bank — 100 pre-loaded cards across pharmacokinetics, pharmacodynamics, and drug interactions. Add terms directly from your analyses.",
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
    <main className="relative z-[1] flex flex-col">
      <BackgroundAnimation />

      {/* ── Hero + accordion cards — three-column layout ── */}
      <section className="relative w-full bg-gradient-to-b from-blue-950/60 via-blue-900/20 to-transparent">
        <div className="relative z-10 min-h-screen">
          <AccordionCards>
            <div className="flex flex-col items-center gap-6 text-center">
              <LogoFull />

              <p className="max-w-md text-2xl text-slate-200">
                Know before you take. Understand the science behind your
                medications.
              </p>

              <HeroCtaButtons />

              <div
                className="mt-4 inline-flex rounded-full px-6 py-2"
                style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "1px solid rgba(255, 255, 255, 0.25)",
                }}
              >
                <p className="text-sm text-slate-400">
                  Powered by &nbsp;🧪 FDA Data &nbsp;·&nbsp; 📋 NIH RxNorm
                  &nbsp;·&nbsp; 💊 DailyMed &nbsp;·&nbsp; 🧬 PharmGKB
                  &nbsp;·&nbsp; 🤖 Llama 3.3 70B &nbsp;·&nbsp; 🎓 Built for
                  students and patients
                </p>
              </div>
            </div>
          </AccordionCards>

          <ScrollIndicator />
        </div>
      </section>

      {/* ── Stats card ── */}
      <HeroStats />

      {/* ── Did You Know ── */}
      <DidYouKnow />

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
      </div>

      {/* ── Contact footer banner ── */}
      <footer className="w-full bg-black px-8 py-6 text-center">
        <p className="text-sm text-slate-400">
          Questions? Contact us at{" "}
          <a
            href="mailto:toxiclearai@gmail.com"
            className="text-teal-400 hover:text-teal-300"
          >
            toxiclearai@gmail.com
          </a>
        </p>
        <p className="mt-1 text-xs text-slate-600">
          &copy; 2026 ToxiClear AI. For educational purposes only. Not medical advice.{" "}
          &middot;{" "}
          <Link href="/privacy" className="text-teal-600 hover:text-teal-500">Privacy Policy</Link>
          {" "}&middot;{" "}
          <Link href="/terms" className="text-teal-600 hover:text-teal-500">Terms of Service</Link>
        </p>
      </footer>
    </main>
  );
}
