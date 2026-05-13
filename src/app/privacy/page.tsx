import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link
        href="/"
        className="mb-8 inline-block text-sm text-teal-400 hover:text-teal-300"
      >
        ← Back to Home
      </Link>

      <div className="mb-8 flex flex-col gap-1">
        <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">
          Last updated: April 2026
        </p>
      </div>

      <div className="flex flex-col gap-10 leading-relaxed text-slate-300">
        <Section title="1. Introduction">
          <p>
            ToxiClear AI (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or
            &ldquo;our&rdquo;) is committed to protecting your privacy. This
            Privacy Policy explains what information we collect, how we use it,
            and your rights regarding your data. By creating an account or using
            ToxiClear AI, you agree to the practices described in this policy.
          </p>
        </Section>

        <Section title="2. Information We Collect">
          <p>When you create an account, we collect:</p>
          <BulletList
            items={[
              "First and last name",
              "Email address",
              "Phone number (optional)",
              "Password (stored securely — we never see your plain-text password)",
            ]}
          />
          <p>When you use the app, we may collect:</p>
          <BulletList
            items={[
              "Drug interaction queries you submit (not linked to your identity on the free tier)",
              "Health profile information you voluntarily provide in Premium (conditions, medications, allergies, age) — this is used only to personalize your interaction analysis and is never sold or shared",
              "Usage data such as which features you use and how often (via PostHog analytics, anonymized)",
            ]}
          />
        </Section>

        <Section title="3. How We Use Your Information">
          <p>We use the information we collect to:</p>
          <BulletList
            items={[
              "Provide and improve the ToxiClear AI service",
              "Personalize your interaction analyses when health profile data is provided",
              "Send account-related emails (verification, password reset)",
              "Contact you about important updates to the service",
              "Comply with legal obligations",
            ]}
          />
          <p className="font-semibold text-slate-200">We do NOT:</p>
          <BulletList
            items={[
              "Sell your personal information to any third party",
              "Share your health profile data with advertisers",
              "Use your drug queries to build advertising profiles",
              "Store interaction queries linked to your identity without your knowledge",
            ]}
          />
        </Section>

        <Section title="4. Data Storage and Security">
          <p>
            Your account data is stored securely using Supabase, a trusted
            database platform with industry-standard encryption. Health profile
            information is encrypted at rest. We use HTTPS for all data
            transmission. While we take security seriously, no system is 100%
            secure — please use a strong, unique password.
          </p>
          <p>
            Sensitive health profile information including medical conditions,
            medications, and allergies is encrypted before storage using AES
            encryption. This information is only readable by you when logged
            into your account.
          </p>
        </Section>

        <Section title="5. Third-Party Services">
          <p>
            ToxiClear AI uses the following third-party services to operate:
          </p>
          <BulletList
            items={[
              "Supabase — database and authentication",
              "Groq AI — AI language model for generating interaction explanations",
              "OpenFDA — public FDA drug database (no personal data sent)",
              "DailyMed — FDA's structured drug label database (no personal data sent)",
              "NIH RxNorm — public drug naming database (no personal data sent)",
              "PharmGKB/ClinPGx — Stanford's pharmacogenomics database (no personal data sent)",
              "Stripe — payment processing for Premium (we never see or store your full card details)",
              "PostHog — anonymized usage analytics",
            ]}
          />
          <p>
            Each of these services has its own privacy policy governing their
            data practices.
          </p>
        </Section>

        <Section title="6. Health Information Disclaimer">
          <p>
            ToxiClear AI is an educational tool, not a medical service. Any
            health information you provide in your profile is used solely to
            personalize educational content. It is not reviewed by medical
            professionals, not stored in any medical record system, and not
            subject to HIPAA. Do not rely on ToxiClear AI for medical decisions.
            Always consult a qualified healthcare professional.
          </p>
        </Section>

        <Section title="7. Your Rights">
          <p>You have the right to:</p>
          <BulletList
            items={[
              "Access the personal data we hold about you",
              "Correct inaccurate information",
              "Delete your account and all associated data at any time",
              "Opt out of non-essential communications",
            ]}
          />
          <p>
            To exercise any of these rights, contact us at:{" "}
            <a
              href="mailto:toxiclearai@gmail.com"
              className="text-teal-400 hover:text-teal-300 underline underline-offset-2"
            >
              toxiclearai@gmail.com
            </a>
          </p>
        </Section>

        <Section title="8. Children's Privacy">
          <p>
            ToxiClear AI is not intended for children under 13. We do not
            knowingly collect personal information from children under 13. If
            you believe a child has provided us with personal information,
            please contact us immediately at{" "}
            <a
              href="mailto:toxiclearai@gmail.com"
              className="text-teal-400 hover:text-teal-300 underline underline-offset-2"
            >
              toxiclearai@gmail.com
            </a>
            .
          </p>
        </Section>

        <Section title="9. Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time. We will notify
            registered users of significant changes via email. Continued use of
            the service after changes constitutes acceptance of the updated
            policy.
          </p>
        </Section>

        <Section title="10. Contact">
          <p>
            If you have any questions about this Privacy Policy, contact us at:{" "}
            <a
              href="mailto:toxiclearai@gmail.com"
              className="text-teal-400 hover:text-teal-300 underline underline-offset-2"
            >
              toxiclearai@gmail.com
            </a>
          </p>
        </Section>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-semibold text-slate-100">{title}</h2>
      {children}
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-2 pl-1">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
