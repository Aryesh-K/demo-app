"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "~/lib/supabase/client";

// ─── Data ─────────────────────────────────────────────────────────────────────

type UserType = "student" | "teacher" | "patient" | "healthcare";

const USER_TYPES: {
  id: UserType;
  emoji: string;
  label: string;
  desc: string;
}[] = [
  { id: "student", emoji: "📚", label: "Student", desc: "Learning pharmacology or health sciences" },
  { id: "teacher", emoji: "🏫", label: "Educator", desc: "Teaching or creating curriculum" },
  { id: "patient", emoji: "🩺", label: "Patient / Caregiver", desc: "Managing personal medications" },
  { id: "healthcare", emoji: "💊", label: "Healthcare Professional", desc: "Clinical or pharmacy practice" },
];

const SUBTYPES: Record<UserType, { id: string; emoji: string; label: string }[]> = {
  student: [
    { id: "undergrad", emoji: "🎓", label: "Undergraduate" },
    { id: "grad", emoji: "🔬", label: "Graduate / PhD" },
    { id: "medical", emoji: "🏥", label: "Medical / Nursing school" },
    { id: "pharmacy", emoji: "⚗️", label: "Pharmacy school" },
  ],
  teacher: [
    { id: "university", emoji: "🏛️", label: "University / College" },
    { id: "highschool", emoji: "📐", label: "High School" },
    { id: "online", emoji: "💻", label: "Online educator / Tutor" },
    { id: "hospital", emoji: "🏨", label: "Hospital educator" },
  ],
  patient: [
    { id: "self", emoji: "🙋", label: "Managing my own meds" },
    { id: "caregiver", emoji: "👨‍👩‍👧", label: "Caregiver for a family member" },
    { id: "chronic", emoji: "📋", label: "Chronic illness management" },
    { id: "new_rx", emoji: "💌", label: "Just started a new prescription" },
  ],
  healthcare: [
    { id: "pharmacist", emoji: "⚗️", label: "Pharmacist" },
    { id: "physician", emoji: "🩻", label: "Physician / NP / PA" },
    { id: "nurse", emoji: "🩺", label: "Nurse" },
    { id: "researcher", emoji: "🔬", label: "Researcher" },
  ],
};

const USE_CASES = [
  { id: "check_interactions", emoji: "⚡", label: "Check drug interactions" },
  { id: "learn_pharmacology", emoji: "🧠", label: "Learn pharmacology" },
  { id: "patient_safety", emoji: "🛡️", label: "Patient safety" },
  { id: "case_studies", emoji: "📖", label: "Study case reports" },
  { id: "clinical_reference", emoji: "📋", label: "Clinical reference" },
  { id: "curriculum", emoji: "🏫", label: "Build curriculum" },
];

// ─── Destination logic ────────────────────────────────────────────────────────

function getDestination(userType: UserType, isPremium: boolean): string {
  if (userType === "student" || userType === "teacher") return "/learn/free";
  if (isPremium) return "/check/premium";
  return "/check/premium";
}

// ─── Step components ──────────────────────────────────────────────────────────

function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 32 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            width: i === current ? 24 : 8,
            height: 8,
            borderRadius: 4,
            background: i === current ? "#2dd4bf" : "#1e3a4a",
            transition: "all 0.25s ease",
          }}
        />
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [userSubtype, setUserSubtype] = useState<string | null>(null);
  const [selectedUseCases, setSelectedUseCases] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  function toggleUseCase(id: string) {
    setSelectedUseCases((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function handleFinish() {
    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase.from("profiles").update({
        user_type: userType,
        user_subtype: userSubtype,
        use_case: selectedUseCases.join(","),
        onboarding_complete: true,
      }).eq("id", user.id);

      const { data: profileRow } = await supabase
        .from("profiles")
        .select("is_premium")
        .eq("id", user.id)
        .single();

      const isPremium = profileRow?.is_premium ?? false;
      router.push(getDestination(userType!, isPremium));
    } else {
      router.push("/");
    }
  }

  const cardGrid: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(2, 1fr)",
    gap: isMobile ? 10 : 14,
    width: "100%",
  };

  function Card({
    emoji,
    label,
    desc,
    selected,
    onClick,
    multiSelect,
  }: {
    emoji: string;
    label: string;
    desc?: string;
    selected: boolean;
    onClick: () => void;
    multiSelect?: boolean;
  }) {
    return (
      <button
        type="button"
        onClick={onClick}
        style={{
          background: selected ? "rgba(45,212,191,0.12)" : "rgba(15,23,42,0.8)",
          border: `1.5px solid ${selected ? "#2dd4bf" : "#1e3a4a"}`,
          borderRadius: 12,
          padding: isMobile ? "12px 10px" : "16px 14px",
          cursor: "pointer",
          textAlign: "left",
          display: "flex",
          flexDirection: "column",
          gap: 6,
          minHeight: isMobile ? 90 : 110,
          transition: "border-color 0.15s ease, background 0.15s ease",
          position: "relative",
        }}
      >
        {multiSelect && (
          <div
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              width: 18,
              height: 18,
              borderRadius: 4,
              border: `1.5px solid ${selected ? "#2dd4bf" : "#334155"}`,
              background: selected ? "#2dd4bf" : "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {selected && (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 5l2.5 2.5L8 3" stroke="#050d1a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        )}
        <span style={{ fontSize: isMobile ? 24 : 28, lineHeight: 1 }}>{emoji}</span>
        <span
          style={{
            fontSize: isMobile ? 12 : 13,
            fontWeight: 600,
            color: selected ? "#2dd4bf" : "#f1f5f9",
            lineHeight: 1.3,
          }}
        >
          {label}
        </span>
        {desc && (
          <span
            style={{
              fontSize: isMobile ? 10 : 11,
              color: "#64748b",
              lineHeight: 1.4,
            }}
          >
            {desc}
          </span>
        )}
      </button>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#050d1a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: isMobile ? "32px 20px" : "48px 24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          display: "flex",
          flexDirection: "column",
          gap: 0,
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <span
            style={{
              fontSize: isMobile ? 22 : 26,
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "#f1f5f9",
            }}
          >
            Toxi<span style={{ color: "#2dd4bf" }}>Clear</span>{" "}
            <span style={{ color: "#fbbf24" }}>AI</span>
          </span>
        </div>

        <StepDots total={3} current={step} />

        {/* Step 0 — Who are you? */}
        {step === 0 && (
          <div
            key="step0"
            style={{ animation: "fade-in 0.25s ease forwards" }}
          >
            <h1
              style={{
                fontSize: isMobile ? 20 : 24,
                fontWeight: 700,
                color: "#f1f5f9",
                margin: "0 0 6px",
                textAlign: "center",
              }}
            >
              Who are you?
            </h1>
            <p
              style={{
                fontSize: 13,
                color: "#64748b",
                textAlign: "center",
                margin: "0 0 24px",
              }}
            >
              Help us personalize your experience.
            </p>
            <div style={cardGrid}>
              {USER_TYPES.map((t) => (
                <Card
                  key={t.id}
                  emoji={t.emoji}
                  label={t.label}
                  desc={t.desc}
                  selected={userType === t.id}
                  onClick={() => {
                    setUserType(t.id);
                    setUserSubtype(null);
                    setTimeout(() => setStep(1), 180);
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Step 1 — More about you */}
        {step === 1 && userType && (
          <div
            key="step1"
            style={{ animation: "fade-in 0.25s ease forwards" }}
          >
            <h1
              style={{
                fontSize: isMobile ? 20 : 24,
                fontWeight: 700,
                color: "#f1f5f9",
                margin: "0 0 6px",
                textAlign: "center",
              }}
            >
              A bit more about you
            </h1>
            <p
              style={{
                fontSize: 13,
                color: "#64748b",
                textAlign: "center",
                margin: "0 0 24px",
              }}
            >
              Which best describes your situation?
            </p>
            <div style={cardGrid}>
              {SUBTYPES[userType].map((s) => (
                <Card
                  key={s.id}
                  emoji={s.emoji}
                  label={s.label}
                  selected={userSubtype === s.id}
                  onClick={() => {
                    setUserSubtype(s.id);
                    setTimeout(() => setStep(2), 180);
                  }}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => setStep(0)}
              style={{
                marginTop: 20,
                width: "100%",
                background: "none",
                border: "none",
                color: "#475569",
                fontSize: 13,
                cursor: "pointer",
                textAlign: "center",
              }}
            >
              ← Back
            </button>
          </div>
        )}

        {/* Step 2 — Use cases */}
        {step === 2 && (
          <div
            key="step2"
            style={{ animation: "fade-in 0.25s ease forwards" }}
          >
            <h1
              style={{
                fontSize: isMobile ? 20 : 24,
                fontWeight: 700,
                color: "#f1f5f9",
                margin: "0 0 6px",
                textAlign: "center",
              }}
            >
              What will you use it for?
            </h1>
            <p
              style={{
                fontSize: 13,
                color: "#64748b",
                textAlign: "center",
                margin: "0 0 24px",
              }}
            >
              Select all that apply.
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: isMobile ? 10 : 14,
                width: "100%",
              }}
            >
              {USE_CASES.map((u) => (
                <Card
                  key={u.id}
                  emoji={u.emoji}
                  label={u.label}
                  selected={selectedUseCases.includes(u.id)}
                  onClick={() => toggleUseCase(u.id)}
                  multiSelect
                />
              ))}
            </div>

            <button
              type="button"
              onClick={handleFinish}
              disabled={saving}
              style={{
                marginTop: 24,
                width: "100%",
                background: "#2dd4bf",
                color: "#050d1a",
                border: "none",
                borderRadius: 10,
                padding: "14px 0",
                fontSize: 15,
                fontWeight: 700,
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.7 : 1,
                transition: "opacity 0.15s ease",
              }}
            >
              {saving ? "Saving…" : "Get Started →"}
            </button>

            <button
              type="button"
              onClick={() => setStep(1)}
              style={{
                marginTop: 12,
                width: "100%",
                background: "none",
                border: "none",
                color: "#475569",
                fontSize: 13,
                cursor: "pointer",
                textAlign: "center",
              }}
            >
              ← Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
