"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AccordionCards } from "~/components/accordion-cards";
import { BackgroundAnimation } from "~/components/background-animation";
import { LogoFull } from "~/components/logo-full";
import { DidYouKnow } from "~/components/did-you-know";
import { HeroCtaButtons } from "~/components/hero-cta-buttons";
import { HeroStats } from "~/components/hero-stats";
import { ScrollIndicator } from "~/components/scroll-indicator";
import { createClient } from "~/lib/supabase/client";

// ─── Premium features carousel data ──────────────────────────────────────────

const premiumFeatures = [
  {
    icon: "🃏",
    title: "MCAT Flashcards",
    description: "100+ pharmacology cards",
    path: "/flashcards",
  },
  {
    icon: "🔬",
    title: "Case Studies",
    description: "Interactive patient scenarios",
    path: "/case-studies",
  },
  {
    icon: "✈️",
    title: "Travel Mode",
    description: "Identify foreign medications",
    path: "/check/travel",
  },
];

// ─── Clickable term demo component ───────────────────────────────────────────

function ClickableTermDemo({
  term,
  definition,
}: {
  term: string;
  definition: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      <span
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        style={{
          color: "#1D9E75",
          borderBottom: "1px dashed #1D9E75",
          cursor: "pointer",
          fontWeight: 600,
        }}
      >
        {term}
      </span>
      {open && (
        <div
          style={{
            position: "absolute",
            bottom: "100%",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#0d1f2d",
            border: "1px solid rgba(29,158,117,0.3)",
            borderRadius: "8px",
            padding: "10px 12px",
            width: "220px",
            fontSize: "11px",
            color: "rgba(255,255,255,0.8)",
            lineHeight: "1.5",
            zIndex: 100,
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          }}
        >
          <div
            style={{
              fontWeight: 700,
              color: "#1D9E75",
              marginBottom: "4px",
              fontSize: "12px",
            }}
          >
            {term}
          </div>
          {definition}
        </div>
      )}
    </span>
  );
}

// ─── Home page ────────────────────────────────────────────────────────────────

export default function Home() {
  const router = useRouter();
  const [isPremium, setIsPremium] = useState(false);
  const [premiumFeatureIndex, setPremiumFeatureIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkPremium = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("is_premium")
        .eq("id", user.id)
        .single();
      if (data?.is_premium) setIsPremium(true);
    };
    checkPremium();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setPremiumFeatureIndex((prev) => (prev + 1) % premiumFeatures.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

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

        {/* ── Interactive preview grid ── */}
        <section>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
              gap: "20px",
              maxWidth: "900px",
              margin: "0 auto",
            }}
          >
            {/* ── Cell 1: Check Mode ── */}
            <div
              onClick={() => router.push("/check/free")}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "16px",
                padding: "24px",
                cursor: "pointer",
                transition: "border-color 0.2s, transform 0.2s",
                overflow: "hidden",
                minHeight: "320px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(29,158,117,0.4)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: "11px",
                    color: "#1D9E75",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    fontWeight: 600,
                  }}
                >
                  Free
                </span>
                <h3
                  style={{
                    fontSize: "20px",
                    fontWeight: 700,
                    color: "white",
                    margin: "4px 0 0",
                  }}
                >
                  Check an Interaction
                </h3>
              </div>

              <div
                style={{
                  background: "rgba(0,0,0,0.3)",
                  borderRadius: "12px",
                  padding: "16px",
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  pointerEvents: "none",
                }}
              >
                <div style={{ display: "flex", gap: "8px" }}>
                  <div
                    style={{
                      flex: 1,
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      fontSize: "13px",
                      color: "rgba(255,255,255,0.8)",
                    }}
                  >
                    Ibuprofen
                  </div>
                  <div
                    style={{
                      flex: 1,
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      fontSize: "13px",
                      color: "rgba(255,255,255,0.8)",
                    }}
                  >
                    Alcohol
                  </div>
                </div>

                <div
                  style={{
                    background: "rgba(245,158,11,0.08)",
                    border: "1px solid rgba(245,158,11,0.2)",
                    borderRadius: "8px",
                    padding: "10px 12px",
                  }}
                >
                  <div
                    style={{
                      height: "4px",
                      borderRadius: "2px",
                      background:
                        "linear-gradient(to right, #22c55e, #f59e0b, #ef4444)",
                      marginBottom: "6px",
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        left: "52%",
                        top: "50%",
                        transform: "translate(-50%, -50%)",
                        width: "10px",
                        height: "10px",
                        borderRadius: "50%",
                        background: "#f59e0b",
                        border: "2px solid white",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "8px",
                    }}
                  >
                    <span style={{ fontSize: "9px", color: "#22c55e" }}>
                      LOW
                    </span>
                    <span
                      style={{
                        fontSize: "9px",
                        color: "#f59e0b",
                        fontWeight: 700,
                      }}
                    >
                      ⚡ MODERATE RISK
                    </span>
                    <span style={{ fontSize: "9px", color: "#ef4444" }}>
                      HIGH
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: "11px",
                      color: "rgba(255,255,255,0.6)",
                      margin: 0,
                      lineHeight: "1.5",
                    }}
                  >
                    Combining ibuprofen with alcohol increases risk of stomach
                    bleeding and liver stress...
                  </p>
                </div>

                <div
                  style={{
                    fontSize: "11px",
                    color: "#1D9E75",
                    textAlign: "right",
                  }}
                >
                  Try it free — no account needed →
                </div>
              </div>
            </div>

            {/* ── Cell 2: Learn Mode ── */}
            <div
              onClick={() =>
                router.push(isPremium ? "/learn/premium" : "/learn/free")
              }
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "16px",
                padding: "24px",
                cursor: "pointer",
                transition: "border-color 0.2s, transform 0.2s",
                overflow: "hidden",
                minHeight: "320px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(29,158,117,0.4)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: "11px",
                      color: "#EF9F27",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      fontWeight: 600,
                    }}
                  >
                    👑 Premium
                  </span>
                  <h3
                    style={{
                      fontSize: "20px",
                      fontWeight: 700,
                      color: "white",
                      margin: "4px 0 0",
                    }}
                  >
                    Learn the Biology
                  </h3>
                </div>
                <span
                  style={{
                    fontSize: "11px",
                    background: "rgba(29,158,117,0.15)",
                    border: "1px solid rgba(29,158,117,0.3)",
                    color: "#1D9E75",
                    padding: "3px 8px",
                    borderRadius: "999px",
                  }}
                >
                  AP Biology
                </span>
              </div>

              <div
                style={{
                  background: "rgba(0,0,0,0.3)",
                  borderRadius: "12px",
                  padding: "16px",
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <p
                  style={{
                    fontSize: "13px",
                    color: "rgba(255,255,255,0.7)",
                    lineHeight: "1.7",
                    margin: 0,
                  }}
                >
                  Grapefruit inhibits{" "}
                  <ClickableTermDemo
                    term="CYP3A4"
                    definition="An enzyme in the intestinal wall responsible for metabolizing ~50% of all drugs. Grapefruit permanently inactivates it."
                  />{" "}
                  in the intestinal wall, causing drug levels to rise
                  dangerously high.
                </p>

                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {["Honors Bio", "AP Biology", "Pre-Med"].map((level, i) => (
                    <span
                      key={level}
                      style={{
                        fontSize: "10px",
                        padding: "3px 10px",
                        borderRadius: "999px",
                        background:
                          i === 1
                            ? "rgba(29,158,117,0.2)"
                            : "rgba(255,255,255,0.05)",
                        border: `1px solid ${
                          i === 1
                            ? "rgba(29,158,117,0.4)"
                            : "rgba(255,255,255,0.1)"
                        }`,
                        color:
                          i === 1 ? "#1D9E75" : "rgba(255,255,255,0.4)",
                      }}
                    >
                      {level}
                    </span>
                  ))}
                </div>

                <div
                  style={{
                    fontSize: "11px",
                    color: "#EF9F27",
                    textAlign: "right",
                  }}
                >
                  {isPremium ? "Open Learn Mode →" : "Unlock with Premium →"}
                </div>
              </div>
            </div>

            {/* ── Cell 3: History ── */}
            <div
              onClick={() => router.push("/history")}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "16px",
                padding: "24px",
                cursor: "pointer",
                transition: "border-color 0.2s, transform 0.2s",
                overflow: "hidden",
                minHeight: "320px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: "11px",
                    color: "rgba(255,255,255,0.4)",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    fontWeight: 600,
                  }}
                >
                  Free
                </span>
                <h3
                  style={{
                    fontSize: "20px",
                    fontWeight: 700,
                    color: "white",
                    margin: "4px 0 0",
                  }}
                >
                  Learn the History
                </h3>
              </div>

              <div
                style={{
                  background: "black",
                  borderRadius: "12px",
                  overflow: "hidden",
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  pointerEvents: "none",
                }}
              >
                <div
                  style={{
                    height: "120px",
                    background: "rgba(255,255,255,0.05)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/history-images/era6-photo.png"
                    alt="Grapefruit discovery"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      filter: "grayscale(100%)",
                      opacity: 0.7,
                    }}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      bottom: "8px",
                      left: "8px",
                      fontSize: "9px",
                      color: "rgba(255,255,255,0.5)",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                    }}
                  >
                    Era 6 — 1991
                  </div>
                </div>

                <div style={{ padding: "12px" }}>
                  <p
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "white",
                      margin: "0 0 6px",
                      fontFamily: "serif",
                    }}
                  >
                    The Grapefruit Discovery
                  </p>
                  <p
                    style={{
                      fontSize: "11px",
                      color: "rgba(255,255,255,0.5)",
                      margin: 0,
                      lineHeight: "1.5",
                    }}
                  >
                    How a chance experiment revealed that a single glass of
                    juice could double a drug&apos;s potency...
                  </p>
                </div>
              </div>

              <div
                style={{
                  fontSize: "11px",
                  color: "rgba(255,255,255,0.4)",
                  textAlign: "right",
                }}
              >
                10 eras of drug history →
              </div>
            </div>

            {/* ── Cell 4: Premium Features ── */}
            <div
              onClick={() => {
                if (isPremium) {
                  router.push(premiumFeatures[premiumFeatureIndex]!.path);
                } else {
                  router.push("/account");
                }
              }}
              style={{
                background: "rgba(239,159,39,0.04)",
                border: "1px solid rgba(239,159,39,0.15)",
                borderRadius: "16px",
                padding: "24px",
                cursor: "pointer",
                transition: "border-color 0.2s, transform 0.2s",
                overflow: "hidden",
                minHeight: "320px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(239,159,39,0.4)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(239,159,39,0.15)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: "11px",
                    color: "#EF9F27",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    fontWeight: 600,
                  }}
                >
                  👑 Premium
                </span>
                <h3
                  style={{
                    fontSize: "20px",
                    fontWeight: 700,
                    color: "white",
                    margin: "4px 0 0",
                  }}
                >
                  Premium Features
                </h3>
              </div>

              <div
                style={{
                  background: "rgba(0,0,0,0.3)",
                  borderRadius: "12px",
                  padding: "20px",
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "12px",
                }}
              >
                <div style={{ display: "flex", gap: "6px", marginBottom: "8px" }}>
                  {premiumFeatures.map((_, i) => (
                    <div
                      key={i}
                      style={{
                        width: i === premiumFeatureIndex ? "20px" : "6px",
                        height: "6px",
                        borderRadius: "3px",
                        background:
                          i === premiumFeatureIndex
                            ? "#EF9F27"
                            : "rgba(255,255,255,0.2)",
                        transition: "all 0.3s ease",
                      }}
                    />
                  ))}
                </div>

                <div style={{ fontSize: "40px", lineHeight: 1 }}>
                  {premiumFeatures[premiumFeatureIndex]!.icon}
                </div>
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "white",
                    textAlign: "center",
                  }}
                >
                  {premiumFeatures[premiumFeatureIndex]!.title}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "rgba(255,255,255,0.5)",
                    textAlign: "center",
                  }}
                >
                  {premiumFeatures[premiumFeatureIndex]!.description}
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "6px",
                    flexWrap: "wrap",
                    justifyContent: "center",
                    marginTop: "8px",
                  }}
                >
                  {premiumFeatures.map((f, i) => (
                    <span
                      key={f.title}
                      style={{
                        fontSize: "10px",
                        padding: "3px 8px",
                        borderRadius: "999px",
                        background:
                          i === premiumFeatureIndex
                            ? "rgba(239,159,39,0.2)"
                            : "rgba(255,255,255,0.05)",
                        border: `1px solid ${
                          i === premiumFeatureIndex
                            ? "rgba(239,159,39,0.4)"
                            : "rgba(255,255,255,0.08)"
                        }`,
                        color:
                          i === premiumFeatureIndex
                            ? "#EF9F27"
                            : "rgba(255,255,255,0.3)",
                        transition: "all 0.3s ease",
                      }}
                    >
                      {f.icon} {f.title}
                    </span>
                  ))}
                </div>
              </div>

              <div
                style={{
                  fontSize: "11px",
                  color: "#EF9F27",
                  textAlign: "right",
                }}
              >
                {isPremium ? "Open →" : "Unlock Premium →"}
              </div>
            </div>
          </div>
        </section>
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
          &copy; 2026 ToxiClear AI. For educational purposes only. Not medical
          advice.{" "}
          &middot;{" "}
          <Link href="/privacy" className="text-teal-600 hover:text-teal-500">
            Privacy Policy
          </Link>
          {" "}&middot;{" "}
          <Link href="/terms" className="text-teal-600 hover:text-teal-500">
            Terms of Service
          </Link>
        </p>
      </footer>
    </main>
  );
}
