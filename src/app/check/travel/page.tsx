"use client";

import { useState } from "react";
import Link from "next/link";
import { usePremiumGuard } from "~/hooks/usePremiumGuard";
import { cn } from "~/lib/utils";

// ─── Country data ─────────────────────────────────────────────────────────────

const COUNTRIES = [
  { code: "JP", name: "Japan", flag: "🇯🇵", language: "Japanese" },
  { code: "CN", name: "China", flag: "🇨🇳", language: "Chinese (Mandarin)" },
  { code: "KR", name: "South Korea", flag: "🇰🇷", language: "Korean" },
  { code: "DE", name: "Germany", flag: "🇩🇪", language: "German" },
  { code: "FR", name: "France", flag: "🇫🇷", language: "French" },
  { code: "ES", name: "Spain", flag: "🇪🇸", language: "Spanish" },
  { code: "IT", name: "Italy", flag: "🇮🇹", language: "Italian" },
  { code: "PT", name: "Portugal", flag: "🇵🇹", language: "Portuguese" },
  { code: "BR", name: "Brazil", flag: "🇧🇷", language: "Portuguese" },
  { code: "MX", name: "Mexico", flag: "🇲🇽", language: "Spanish" },
  { code: "IN", name: "India", flag: "🇮🇳", language: "Hindi/English" },
  { code: "AU", name: "Australia", flag: "🇦🇺", language: "English" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", language: "English" },
  { code: "CA", name: "Canada", flag: "🇨🇦", language: "English/French" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱", language: "Dutch" },
  { code: "SE", name: "Sweden", flag: "🇸🇪", language: "Swedish" },
  { code: "NO", name: "Norway", flag: "🇳🇴", language: "Norwegian" },
  { code: "DK", name: "Denmark", flag: "🇩🇰", language: "Danish" },
  { code: "CH", name: "Switzerland", flag: "🇨🇭", language: "German/French" },
  { code: "AT", name: "Austria", flag: "🇦🇹", language: "German" },
  { code: "PL", name: "Poland", flag: "🇵🇱", language: "Polish" },
  { code: "RU", name: "Russia", flag: "🇷🇺", language: "Russian" },
  { code: "TR", name: "Turkey", flag: "🇹🇷", language: "Turkish" },
  { code: "SA", name: "Saudi Arabia", flag: "🇸🇦", language: "Arabic" },
  { code: "AE", name: "UAE", flag: "🇦🇪", language: "Arabic" },
  { code: "IL", name: "Israel", flag: "🇮🇱", language: "Hebrew" },
  { code: "ZA", name: "South Africa", flag: "🇿🇦", language: "English" },
  { code: "NG", name: "Nigeria", flag: "🇳🇬", language: "English" },
  { code: "EG", name: "Egypt", flag: "🇪🇬", language: "Arabic" },
  { code: "AR", name: "Argentina", flag: "🇦🇷", language: "Spanish" },
  { code: "CL", name: "Chile", flag: "🇨🇱", language: "Spanish" },
  { code: "CO", name: "Colombia", flag: "🇨🇴", language: "Spanish" },
  { code: "TH", name: "Thailand", flag: "🇹🇭", language: "Thai" },
  { code: "VN", name: "Vietnam", flag: "🇻🇳", language: "Vietnamese" },
  { code: "ID", name: "Indonesia", flag: "🇮🇩", language: "Indonesian" },
  { code: "MY", name: "Malaysia", flag: "🇲🇾", language: "Malay" },
  { code: "PH", name: "Philippines", flag: "🇵🇭", language: "Filipino/English" },
  { code: "PK", name: "Pakistan", flag: "🇵🇰", language: "Urdu" },
  { code: "BD", name: "Bangladesh", flag: "🇧🇩", language: "Bengali" },
  { code: "GR", name: "Greece", flag: "🇬🇷", language: "Greek" },
  { code: "CZ", name: "Czech Republic", flag: "🇨🇿", language: "Czech" },
  { code: "HU", name: "Hungary", flag: "🇭🇺", language: "Hungarian" },
  { code: "RO", name: "Romania", flag: "🇷🇴", language: "Romanian" },
  { code: "UA", name: "Ukraine", flag: "🇺🇦", language: "Ukrainian" },
  { code: "NZ", name: "New Zealand", flag: "🇳🇿", language: "English" },
  { code: "SG", name: "Singapore", flag: "🇸🇬", language: "English" },
  { code: "HK", name: "Hong Kong", flag: "🇭🇰", language: "Chinese/English" },
  { code: "TW", name: "Taiwan", flag: "🇹🇼", language: "Chinese (Traditional)" },
  { code: "PE", name: "Peru", flag: "🇵🇪", language: "Spanish" },
  { code: "VE", name: "Venezuela", flag: "🇻🇪", language: "Spanish" },
];

// ─── Types ────────────────────────────────────────────────────────────────────

type Country = (typeof COUNTRIES)[number];

interface IdentificationResult {
  activeIngredient: string;
  usEquivalent: string;
  drugClass: string;
  confidence: "high" | "medium" | "low";
  confidenceReason: string;
  isControlled: boolean;
  controlledNote: string | null;
  foodInteractions: string[];
  storageNote: string;
  additionalNames: string[];
  copyableName: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const INPUT_CLS =
  "w-full rounded-lg border border-input bg-transparent px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-ring";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TravelPage() {
  const { isLoading, isPremium } = usePremiumGuard();

  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [labelLanguage, setLabelLanguage] = useState("");
  const [foreignDrugName, setForeignDrugName] = useState("");
  const [purpose, setPurpose] = useState("");

  const [identifying, setIdentifying] = useState(false);
  const [identifyError, setIdentifyError] = useState<string | null>(null);
  const [identificationResult, setIdentificationResult] = useState<IdentificationResult | null>(null);
  const [copied, setCopied] = useState(false);


  function handleSelectCountry(c: Country) {
    setSelectedCountry(c);
    setLabelLanguage(c.language);
    setIdentificationResult(null);
    setCopied(false);
  }

  async function handleIdentify() {
    if (!selectedCountry || !foreignDrugName.trim()) return;
    setIdentifying(true);
    setIdentifyError(null);
    setIdentificationResult(null);
    setCopied(false);
    try {
      const res = await fetch("/api/identify-foreign-drug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          foreignDrugName: foreignDrugName.trim(),
          countryName: selectedCountry.name,
          language: labelLanguage || selectedCountry.language,
          purpose: purpose.trim(),
        }),
      });
      const data = (await res.json()) as IdentificationResult & { error?: string };
      if (data.error) { setIdentifyError(data.error); return; }
      setIdentificationResult(data);
    } catch {
      setIdentifyError("Network error. Please try again.");
    } finally {
      setIdentifying(false);
    }
  }

  function handleReset() {
    setIdentificationResult(null);
    setForeignDrugName("");
    setPurpose("");
    setSelectedCountry(null);
    setCopied(false);
  }

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "#050d1a", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.4)", fontSize: "14px" }}>
        Checking access...
      </div>
    );
  }

  if (!isPremium) return null;

  const canIdentify = !!selectedCountry && foreignDrugName.trim().length > 0;

  return (
    <main className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-4xl flex-col gap-10 px-6 py-12">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          <span className="w-fit rounded-full border border-yellow-700 bg-yellow-950/30 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-yellow-300">
            👑 Premium
          </span>
          <span className="w-fit rounded-full border border-teal-700 bg-teal-950/30 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-teal-300">
            ✈️ Travel Mode
          </span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight">International Travel Mode</h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Identify foreign medications and find their US equivalents anywhere in the world
        </p>
      </div>

      {/* Section 1: Country selector */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Where are you traveling?</h2>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
          {COUNTRIES.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => handleSelectCountry(c)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-center transition-all",
                selectedCountry?.code === c.code
                  ? "border-teal-600 bg-teal-950/30 ring-1 ring-teal-600"
                  : "border-border bg-card hover:border-muted-foreground hover:brightness-110",
              )}
            >
              <span style={{ fontSize: "28px", lineHeight: 1 }}>{c.flag}</span>
              <span className="text-[11px] leading-tight text-muted-foreground">{c.name}</span>
            </button>
          ))}
        </div>

        {selectedCountry && (
          <div className="flex max-w-xs flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Drug label language</label>
            <input
              className={INPUT_CLS}
              value={labelLanguage}
              onChange={(e) => setLabelLanguage(e.target.value)}
              placeholder="Language on the label"
            />
          </div>
        )}
      </section>

      {/* Section 2: Drug form */}
      {selectedCountry && (
        <section className="flex flex-col gap-5">
          <h2 className="text-lg font-semibold">What medication do you have?</h2>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">
              Drug name as shown on the package
            </label>
            <input
              className={INPUT_CLS}
              value={foreignDrugName}
              onChange={(e) => setForeignDrugName(e.target.value)}
              placeholder="e.g. パブロン, Voltaren, Grippostad C"
            />
            <p className="text-xs text-muted-foreground">
              Type the name exactly as it appears — brand name, generic, or any language
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">
              What is it for? <span className="text-muted-foreground">(optional)</span>
            </label>
            <input
              className={INPUT_CLS}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. cold/flu, pain relief, allergies, blood pressure"
            />
          </div>

          <button
            type="button"
            onClick={handleIdentify}
            disabled={!canIdentify || identifying}
            className="w-fit rounded-lg bg-teal-700 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {identifying ? "Identifying…" : "Identify →"}
          </button>

          {identifyError && (
            <p className="text-sm text-red-400">{identifyError}</p>
          )}
        </section>
      )}

      {/* Section 3: Identification result */}
      {identificationResult && (
        <section
          className="flex flex-col gap-4 rounded-2xl border border-teal-800 bg-card p-6"
          style={{ borderLeft: "4px solid rgb(20 184 166)" }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-400">
            🔍 We identified this as:
          </p>

          <p className="text-2xl font-bold text-foreground">
            {identificationResult.activeIngredient}
          </p>

          <div className="flex flex-col gap-2">
            {identificationResult.usEquivalent === identificationResult.activeIngredient ? (
              <div className="flex flex-col gap-1">
                <p className="text-sm text-muted-foreground">🌐 No direct US equivalent found</p>
                <p className="text-sm">
                  Using international name:{" "}
                  <span className="font-semibold text-teal-300">{identificationResult.activeIngredient}</span>
                </p>
                <p className="text-xs italic text-muted-foreground">
                  This name may still work in the interaction checker — give it a try
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm">
                <span>🇺🇸</span>
                <span className="text-muted-foreground">Known in the US as:</span>
                <span className="font-semibold text-teal-300">{identificationResult.usEquivalent}</span>
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              💊 Drug class: <span className="text-foreground">{identificationResult.drugClass}</span>
            </p>
          </div>

          {/* Confidence badge */}
          <div>
            {identificationResult.confidence === "high" && (
              <span className="rounded-full border border-green-700 bg-green-950/30 px-3 py-1 text-xs font-medium text-green-300">
                ✓ High confidence
              </span>
            )}
            {identificationResult.confidence === "medium" && (
              <span className="rounded-full border border-amber-700 bg-amber-950/30 px-3 py-1 text-xs font-medium text-amber-300">
                ~ Moderate confidence
              </span>
            )}
            {identificationResult.confidence === "low" && (
              <span className="rounded-full border border-red-700 bg-red-950/30 px-3 py-1 text-xs font-medium text-red-300">
                ⚠ Low confidence — please verify
              </span>
            )}
          </div>

          {/* Controlled substance warning */}
          {identificationResult.isControlled && identificationResult.controlledNote && (
            <div className="rounded-xl border border-red-800 bg-red-950/20 p-4">
              <p className="text-sm font-semibold text-red-300">⚠️ Controlled Substance Notice</p>
              <p className="mt-1 text-sm text-muted-foreground">{identificationResult.controlledNote}</p>
            </div>
          )}

          {/* Food interactions */}
          {identificationResult.foodInteractions.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <p className="text-sm font-medium text-foreground">Food interactions</p>
              <ul className="flex flex-col gap-1">
                {identificationResult.foodInteractions.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="mt-0.5 shrink-0 opacity-40">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Storage note */}
          {identificationResult.storageNote && (
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-foreground">Storage in transit</p>
              <p className="text-sm text-muted-foreground">{identificationResult.storageNote}</p>
            </div>
          )}
        </section>
      )}

      {/* Next step: copy + open interaction checker, or unable-to-identify fallback */}
      {identificationResult && (
        identificationResult.copyableName ? (
          <section className="flex flex-col gap-4 rounded-2xl border border-teal-800 bg-teal-950/10 p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-400">Next Step</p>
            <p className="text-sm text-muted-foreground">
              Copy the drug name below and paste it into the Premium Interaction Checker to check for
              interactions with your other medications.
            </p>

            <div className="flex items-center gap-3">
              <span className="flex-1 rounded-lg border border-teal-800 bg-teal-950/20 px-4 py-2.5 text-sm font-semibold text-teal-100">
                {identificationResult.copyableName}
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(identificationResult.copyableName!).catch(() => undefined);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="shrink-0 rounded-lg border border-teal-700 px-4 py-2.5 text-sm font-medium text-teal-300 transition-colors hover:bg-teal-900/40"
              >
                {copied ? "✓ Copied!" : "Copy"}
              </button>
            </div>

            <Link
              href="/check/premium"
              className="w-fit rounded-lg bg-yellow-700 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-yellow-600"
            >
              Open Premium Interaction Checker →
            </Link>

            <button
              type="button"
              onClick={handleReset}
              className="w-fit text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              ✈️ Translate a Different Drug
            </button>
          </section>
        ) : (
          <section className="flex flex-col gap-4 rounded-2xl border border-red-800/30 bg-red-950/5 p-6">
            <p className="text-sm leading-relaxed text-foreground/70">
              We were unable to identify a specific active ingredient for this medication with
              enough confidence to suggest a name for the interaction checker.
            </p>
            <p className="text-xs text-foreground/40">
              Try searching the drug name on drugs.com or consulting a local pharmacist for the
              active ingredient, then enter it manually in the Premium Checker.
            </p>
            <button
              type="button"
              onClick={handleReset}
              className="w-fit text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              ✈️ Translate a Different Drug
            </button>
          </section>
        )
      )}
    </main>
  );
}
