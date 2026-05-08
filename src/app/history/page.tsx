"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const ERAS = [
  {
    year: "Pre-1900s",
    name: "Ancient Observations",
    desc: "The earliest recorded observations of dangerous substance combinations",
  },
  {
    year: "1906–1937",
    name: "The Sulfanilamide Disaster",
    desc: "107 deaths that created the modern FDA",
  },
  {
    year: "1957–1962",
    name: "Thalidomide",
    desc: "The morning sickness drug that changed drug testing forever",
  },
  {
    year: "1963",
    name: "The Cheese Effect",
    desc: "How aged cheese revealed a deadly interaction hiding in plain sight",
  },
  {
    year: "1954–Present",
    name: "The Warfarin Problem",
    desc: "From rat poison to life-saving blood thinner — and its deadly combinations",
  },
  {
    year: "1989",
    name: "The Grapefruit Discovery",
    desc: "An accidental finding during an alcohol study that affects 85+ medications",
  },
  {
    year: "1992–1998",
    name: "The Seldane Withdrawal",
    desc: "The world's best-selling antihistamine pulled for a fatal interaction",
  },
  {
    year: "1991–Present",
    name: "Serotonin Syndrome",
    desc: "The underdiagnosed condition hiding inside common antidepressant combinations",
  },
  {
    year: "2000s–2010s",
    name: "The Polypharmacy Crisis",
    desc: "When taking more medications became more dangerous than the diseases they treat",
  },
  {
    year: "2020s",
    name: "AI and the Future",
    desc: "How artificial intelligence is transforming drug interaction detection and prevention",
  },
];

const IMAGE_YEARS = ["1937", "1957", "1963", "1989", "1998"];

export default function HistoryPage() {
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const cards = document.querySelectorAll<HTMLElement>(".era-card");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            el.style.opacity = "1";
            el.style.transform = "translateY(0)";
          }
        }
      },
      { threshold: 0.15 },
    );
    for (const card of cards) observer.observe(card);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <style>{`
        @keyframes scroll-strip {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes pulse-arrow {
          0%, 100% { opacity: 0.35; transform: translateY(0); }
          50% { opacity: 0.9; transform: translateY(8px); }
        }
        .era-card {
          opacity: 0;
          transform: translateY(22px);
          transition: opacity 0.55s ease, transform 0.55s ease, background 0.2s ease;
        }
      `}</style>

      <div style={{ backgroundColor: "#000", minHeight: "100vh", color: "#fff" }}>

        {/* ── Hero ── */}
        <section
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "5rem 1.5rem 10rem",
            position: "relative",
          }}
        >
          <h1
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: "clamp(1.9rem, 5vw, 3.75rem)",
              fontWeight: 400,
              color: "#ffffff",
              letterSpacing: "0.02em",
              lineHeight: 1.2,
              marginBottom: "1.25rem",
              maxWidth: "700px",
            }}
          >
            A History of Drug Interactions
          </h1>

          <p
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: "clamp(0.95rem, 2vw, 1.2rem)",
              fontStyle: "italic",
              color: "#8a8a8a",
              maxWidth: "560px",
              lineHeight: 1.65,
              marginBottom: "2.25rem",
            }}
          >
            The discoveries, tragedies, and breakthroughs that shaped modern medicine
          </p>

          <div
            style={{
              width: "40%",
              maxWidth: "320px",
              height: "1px",
              backgroundColor: "rgba(255,255,255,0.28)",
              marginBottom: "1.5rem",
            }}
          />

          <p
            style={{
              fontFamily: "Arial, sans-serif",
              fontSize: "0.62rem",
              letterSpacing: "0.22em",
              color: "#555",
              textTransform: "uppercase",
              marginBottom: "1.4rem",
            }}
          >
            Scroll to Explore
          </p>

          <div
            style={{
              animation: "pulse-arrow 2.2s ease-in-out infinite",
              fontSize: "1.2rem",
              color: "rgba(255,255,255,0.7)",
              marginBottom: "2rem",
              lineHeight: 1,
            }}
          >
            ↓
          </div>

          {/* Rolling image strip */}
          <div
            style={{
              position: "absolute",
              bottom: "2.5rem",
              left: 0,
              right: 0,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "1.25rem",
                animation: "scroll-strip 22s linear infinite",
                width: "max-content",
                paddingLeft: "1.25rem",
              }}
            >
              {[...IMAGE_YEARS, ...IMAGE_YEARS].map((year, idx) => (
                <div key={idx} style={{ textAlign: "center", flexShrink: 0 }}>
                  <div
                    style={{
                      width: "200px",
                      height: "130px",
                      backgroundColor: "#111",
                      border: "1px solid rgba(255,255,255,0.18)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span
                      style={{
                        color: "#3a3a3a",
                        fontSize: "0.7rem",
                        letterSpacing: "0.12em",
                        fontFamily: "Arial, sans-serif",
                        textTransform: "uppercase",
                      }}
                    >
                      Photo
                    </span>
                  </div>
                  <p
                    style={{
                      color: "rgba(255,255,255,0.38)",
                      fontSize: "0.68rem",
                      marginTop: "0.45rem",
                      fontFamily: "Arial, sans-serif",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {year}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Timeline ── */}
        <section
          style={{
            maxWidth: "780px",
            margin: "0 auto",
            padding: "5rem 2rem 5rem",
          }}
        >
          <div style={{ position: "relative" }}>
            {/* Vertical line — at the start of the content column (100px from left of grid) */}
            <div
              style={{
                position: "absolute",
                left: "100px",
                top: 0,
                bottom: 0,
                width: "1px",
                backgroundColor: "rgba(255,255,255,0.08)",
              }}
            />

            {ERAS.map((era) => (
              <div
                key={era.year}
                className="era-card"
                onClick={() => setModalOpen(true)}
                style={{
                  display: "grid",
                  gridTemplateColumns: "100px 1fr",
                  marginBottom: "3rem",
                  cursor: "pointer",
                  borderRadius: "4px",
                  padding: "0.75rem 0.75rem 0.75rem 0",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.025)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                {/* Year */}
                <div
                  style={{
                    textAlign: "right",
                    paddingRight: "1.25rem",
                    paddingTop: "3px",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "Georgia, 'Times New Roman', serif",
                      fontSize: "0.85rem",
                      color: "rgba(255,255,255,0.5)",
                      lineHeight: 1.4,
                      display: "block",
                    }}
                  >
                    {era.year}
                  </span>
                </div>

                {/* Content */}
                <div style={{ paddingLeft: "1.75rem", position: "relative" }}>
                  {/* Dot on timeline */}
                  <div
                    style={{
                      position: "absolute",
                      left: "-4px",
                      top: "5px",
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      border: "1px solid rgba(255,255,255,0.35)",
                      backgroundColor: "#000",
                    }}
                  />

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.6rem",
                      flexWrap: "wrap",
                      marginBottom: "0.3rem",
                    }}
                  >
                    <h3
                      style={{
                        fontFamily: "Georgia, 'Times New Roman', serif",
                        fontSize: "1.05rem",
                        fontWeight: 700,
                        color: "#ffffff",
                        margin: 0,
                      }}
                    >
                      {era.name}
                    </h3>
                    <span
                      style={{
                        fontSize: "0.57rem",
                        letterSpacing: "0.1em",
                        color: "#555",
                        border: "1px solid #333",
                        borderRadius: "999px",
                        padding: "2px 7px",
                        textTransform: "uppercase",
                        fontFamily: "Arial, sans-serif",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Coming Soon
                    </span>
                  </div>

                  <p
                    style={{
                      fontFamily: "Arial, sans-serif",
                      fontSize: "0.82rem",
                      color: "#777",
                      margin: 0,
                      lineHeight: 1.55,
                    }}
                  >
                    {era.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Footer ── */}
        <footer
          style={{
            backgroundColor: "#000",
            borderTop: "1px solid rgba(255,255,255,0.07)",
            padding: "4rem 1.5rem",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: "0.9rem",
              color: "rgba(255,255,255,0.4)",
              maxWidth: "460px",
              margin: "0 auto 2rem",
              lineHeight: 1.8,
            }}
          >
            This page is under active development. Full case studies with
            historical media, newspaper archives, and primary sources coming
            soon.
          </p>
          <Link
            href="/check/free"
            className="inline-block rounded border border-teal-700 px-6 py-2.5 text-sm text-teal-500 transition-colors hover:border-teal-500 hover:bg-teal-950/20 hover:text-teal-400"
            style={{ fontFamily: "Arial, sans-serif" }}
          >
            Check a Drug Interaction Now →
          </Link>
        </footer>

        {/* ── Modal ── */}
        {modalOpen && (
          <div
            onClick={() => setModalOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.88)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 200,
              padding: "1.5rem",
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: "#0d0d0d",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "6px",
                padding: "2.5rem 2rem",
                maxWidth: "380px",
                width: "100%",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontSize: "1rem",
                  color: "rgba(255,255,255,0.8)",
                  marginBottom: "1.75rem",
                  lineHeight: 1.7,
                }}
              >
                Full case study coming soon. Check back after launch.
              </p>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                style={{
                  fontFamily: "Arial, sans-serif",
                  fontSize: "0.72rem",
                  color: "#555",
                  border: "1px solid #2a2a2a",
                  background: "transparent",
                  padding: "0.45rem 1.1rem",
                  borderRadius: "3px",
                  cursor: "pointer",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
