"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "~/lib/supabase/client";
import { usePremiumProfile } from "~/hooks/usePremiumProfile";
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
  confirmed: boolean;
}

interface Combination {
  drug_a: string;
  drug_b: string;
  risk_level: "high" | "moderate" | "low";
  interaction_type: "safety" | "efficacy" | "both";
  classification: string;
  simple_explanation: string;
  real_world_context: string;
}

interface CheckResult {
  overall_risk: "high" | "moderate" | "low";
  combinations: Combination[];
  overall_summary: string;
  recommendation: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const INPUT_CLS =
  "w-full rounded-lg border border-input bg-transparent px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-ring";

const RISK_CONFIG = {
  high: { bg: "bg-red-950/40", border: "border-red-800", text: "text-red-300", label: "HIGH RISK" },
  moderate: { bg: "bg-amber-950/40", border: "border-amber-800", text: "text-amber-300", label: "MODERATE" },
  low: { bg: "bg-green-950/40", border: "border-green-800", text: "text-green-300", label: "LOW RISK" },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TravelPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [labelLanguage, setLabelLanguage] = useState("");
  const [foreignDrugName, setForeignDrugName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [additionalDrugs, setAdditionalDrugs] = useState<string[]>([]);

  const [identifying, setIdentifying] = useState(false);
  const [identifyError, setIdentifyError] = useState<string | null>(null);
  const [identificationResult, setIdentificationResult] = useState<IdentificationResult | null>(null);

  const [correcting, setCorrecting] = useState(false);
  const [manualUSName, setManualUSName] = useState("");

  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);

  const { profile } = usePremiumProfile();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push("/signup?message=Please create a free account to access Travel Mode."); return; }
      const { data: prof } = await supabase.from("profiles").select("is_premium").eq("id", user.id).single();
      if (!prof?.is_premium) { router.push("/account?message=Travel Mode requires a premium account."); return; }
      setReady(true);
    });
  }, [router]);

  function handleSelectCountry(c: Country) {
    setSelectedCountry(c);
    setLabelLanguage(c.language);
    setIdentificationResult(null);
    setCheckResult(null);
    setCorrecting(false);
  }

  async function handleIdentify() {
    if (!selectedCountry || !foreignDrugName.trim()) return;
    setIdentifying(true);
    setIdentifyError(null);
    setIdentificationResult(null);
    setCheckResult(null);
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
      setIdentificationResult({ ...data, confirmed: false });
    } catch {
      setIdentifyError("Network error. Please try again.");
    } finally {
      setIdentifying(false);
    }
  }

  function handleConfirm() {
    if (!identificationResult) return;
    setIdentificationResult({ ...identificationResult, confirmed: true });
    setCorrecting(false);
  }

  function handleCorrect() {
    setCorrecting(true);
    setManualUSName(identificationResult?.usEquivalent ?? "");
  }

  function handleUseManualName() {
    if (!identificationResult || !manualUSName.trim()) return;
    setIdentificationResult({ ...identificationResult, usEquivalent: manualUSName.trim(), confirmed: true });
    setCorrecting(false);
  }

  async function handleCheck() {
    if (!identificationResult?.confirmed || !selectedCountry) return;
    setChecking(true);
    setCheckError(null);
    setCheckResult(null);

    const drugs: { name: string; method: string }[] = [
      { name: identificationResult.usEquivalent, method: "Oral (swallowed)" },
      ...additionalDrugs.filter((d) => d.trim()).map((d) => ({ name: d.trim(), method: "Oral (swallowed)" })),
    ];

    if (profile?.medications?.trim()) {
      const saved = profile.medications.split(/[,\n]+/).map((m) => m.trim()).filter(Boolean);
      for (const med of saved.slice(0, 4)) {
        drugs.push({ name: med, method: "Oral (swallowed)" });
      }
    }

    if (drugs.length < 2) {
      drugs.push({ name: "No additional medications", method: "Oral (swallowed)" });
    }

    const healthContext = [
      profile?.age ? `Age: ${profile.age}` : "",
      profile?.conditions ? `Conditions: ${profile.conditions}` : "",
      profile?.allergies ? `Allergies: ${profile.allergies}` : "",
    ].filter(Boolean).join(". ");

    try {
      const res = await fetch("/api/check-interaction-premium", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          drugs,
          treatment_context: purpose.trim() || undefined,
          health_context: healthContext || undefined,
          personal_notes: profile?.notes?.trim() || undefined,
        }),
      });
      const data = (await res.json()) as CheckResult & { error?: string };
      if (data.error) { setCheckError(data.error); return; }
      setCheckResult(data);
    } catch {
      setCheckError("Network error. Please try again.");
    } finally {
      setChecking(false);
    }
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

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
          Identify foreign medications and check interactions anywhere in the world
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

          {/* Additional drugs */}
          {additionalDrugs.map((drug, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="shrink-0 text-xl">{selectedCountry.flag}</span>
              <input
                className={INPUT_CLS}
                value={drug}
                onChange={(e) => {
                  const next = [...additionalDrugs];
                  next[i] = e.target.value;
                  setAdditionalDrugs(next);
                }}
                placeholder={`Additional medication ${i + 2}`}
              />
              <button
                type="button"
                onClick={() => setAdditionalDrugs(additionalDrugs.filter((_, j) => j !== i))}
                className="shrink-0 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                ✕
              </button>
            </div>
          ))}

          {additionalDrugs.length < 2 && (
            <button
              type="button"
              onClick={() => setAdditionalDrugs([...additionalDrugs, ""])}
              className="w-fit text-sm text-teal-400 transition-colors hover:text-teal-300"
            >
              + Add another medication
            </button>
          )}

          <button
            type="button"
            onClick={handleIdentify}
            disabled={!canIdentify || identifying}
            className="w-fit rounded-lg bg-teal-700 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {identifying ? "Identifying…" : "Identify & Check →"}
          </button>

          {identifyError && (
            <p className="text-sm text-red-400">{identifyError}</p>
          )}
        </section>
      )}

      {/* Section 3: Identification result */}
      {identificationResult && !identificationResult.confirmed && (
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
            <div className="flex items-center gap-2 text-sm">
              <span>🇺🇸</span>
              <span className="text-muted-foreground">Known in the US as:</span>
              <span className="font-semibold text-teal-300">{identificationResult.usEquivalent}</span>
            </div>
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

          {/* Confirmation buttons */}
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium text-foreground">Is this identification correct?</p>
            {!correcting ? (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="rounded-lg bg-teal-700 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-600"
                >
                  ✓ Yes, continue
                </button>
                <button
                  type="button"
                  onClick={handleCorrect}
                  className="rounded-lg border border-border px-5 py-2 text-sm text-muted-foreground transition-colors hover:border-muted-foreground hover:text-foreground"
                >
                  ✗ No, let me correct it
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <label className="text-xs text-muted-foreground">Enter the correct US drug name:</label>
                <div className="flex gap-2">
                  <input
                    className={INPUT_CLS}
                    value={manualUSName}
                    onChange={(e) => setManualUSName(e.target.value)}
                    placeholder="US generic or brand name"
                  />
                  <button
                    type="button"
                    onClick={handleUseManualName}
                    disabled={!manualUSName.trim()}
                    className="shrink-0 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-600 disabled:opacity-40"
                  >
                    Use this →
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Section 4: Interaction check */}
      {identificationResult?.confirmed && !checkResult && (
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">
            Checking {selectedCountry?.flag} {foreignDrugName} ({identificationResult.usEquivalent})
          </h2>

          {profile?.medications?.trim() && (
            <div className="rounded-xl border border-teal-800 bg-teal-950/20 p-4">
              <p className="text-sm font-medium text-teal-300">
                Your saved medications will be automatically checked
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {profile.medications.split(/[,\n]+/).filter(Boolean).slice(0, 4).map((med) => (
                  <span
                    key={med}
                    className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs text-foreground"
                  >
                    {med.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleCheck}
            disabled={checking}
            className="w-fit rounded-lg bg-yellow-700 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-yellow-600 disabled:opacity-40"
          >
            {checking ? "Checking interactions…" : "Check All Interactions →"}
          </button>

          {checkError && <p className="text-sm text-red-400">{checkError}</p>}
        </section>
      )}

      {/* Results */}
      {checkResult && selectedCountry && identificationResult && (
        <section className="flex flex-col gap-6">
          {/* Travel context header */}
          <div className="flex flex-col gap-1">
            <p className="text-sm text-muted-foreground">
              📍 Traveling in {selectedCountry.flag} {selectedCountry.name}
            </p>
            <p className="text-sm text-muted-foreground">
              Checking{" "}
              <span className="font-medium text-foreground">{foreignDrugName}</span>{" "}
              ({identificationResult.usEquivalent})
            </p>
          </div>

          {/* Overall risk */}
          <div className={cn(
            "flex items-center gap-3 rounded-xl border p-4",
            RISK_CONFIG[checkResult.overall_risk].bg,
            RISK_CONFIG[checkResult.overall_risk].border,
          )}>
            <span className={cn("text-sm font-bold", RISK_CONFIG[checkResult.overall_risk].text)}>
              {RISK_CONFIG[checkResult.overall_risk].label}
            </span>
            <p className="text-sm text-muted-foreground">{checkResult.overall_summary}</p>
          </div>

          {/* Recommendation */}
          <p className="text-sm font-medium text-foreground">
            Recommendation:{" "}
            <span className="text-teal-300">{checkResult.recommendation}</span>
          </p>

          {/* Combination cards */}
          {checkResult.combinations.map((combo, i) => {
            const cfg = RISK_CONFIG[combo.risk_level];
            return (
              <div
                key={i}
                className={cn("rounded-xl border p-5", cfg.bg, cfg.border)}
              >
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className={cn("text-xs font-bold uppercase tracking-wider", cfg.text)}>
                    {cfg.label}
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {combo.drug_a} + {combo.drug_b}
                  </span>
                  <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                    {combo.classification}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{combo.simple_explanation}</p>
                {combo.real_world_context && (
                  <p className="mt-2 text-xs text-muted-foreground/80">{combo.real_world_context}</p>
                )}
              </div>
            );
          })}

          {/* Travel-specific info card */}
          <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
            <h3 className="text-base font-semibold text-foreground">✈️ Travel Considerations</h3>

            {/* Customs / Legal */}
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-foreground">Customs &amp; Legal Status</p>
              {identificationResult.isControlled ? (
                <div className="rounded-lg border border-red-800 bg-red-950/20 p-3">
                  <p className="text-xs font-semibold text-red-300">⚠️ Controlled Substance</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {identificationResult.controlledNote ?? "Check customs regulations before traveling with this medication."}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  ✓ Generally safe to carry — keep in original packaging with your prescription or doctor&apos;s note.
                </p>
              )}
            </div>

            {/* Food interactions */}
            {identificationResult.foodInteractions.length > 0 && (
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-foreground">
                  Food interactions to watch for in {selectedCountry.name}
                </p>
                <ul className="flex flex-col gap-1">
                  {identificationResult.foodInteractions.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <span className="mt-0.5 shrink-0 opacity-40">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Storage */}
            {identificationResult.storageNote && (
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-foreground">Storage in transit</p>
                <p className="text-xs text-muted-foreground">{identificationResult.storageNote}</p>
              </div>
            )}
          </div>

          {/* Start over */}
          <button
            type="button"
            onClick={() => {
              setIdentificationResult(null);
              setCheckResult(null);
              setForeignDrugName("");
              setPurpose("");
              setAdditionalDrugs([]);
            }}
            className="w-fit text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Check another medication
          </button>
        </section>
      )}
    </main>
  );
}
