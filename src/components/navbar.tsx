"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "~/lib/supabase/client";
import { cn } from "~/lib/utils";

type AuthState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "free" }
  | { status: "premium" };

type DropdownItem = {
  href: string;
  label: string;
  locked: boolean;
  premiumColor?: "gold" | "teal";
};

function buildDropdownItems(
  mode: "check" | "learn",
  auth: AuthState,
  premiumColor: "gold" | "teal",
): DropdownItem[] {
  const base = mode === "check" ? "/check" : "/learn";

  if (auth.status === "loading" || auth.status === "unauthenticated") {
    return [
      {
        href: "/signup",
        label: "Free 🔒 - create a free account or log in",
        locked: true,
      },
      {
        href: "/signup",
        label: "Premium 🔒 - create a free account or log in",
        locked: true,
      },
    ];
  }

  if (auth.status === "free") {
    const items: DropdownItem[] = [
      { href: `${base}/free`, label: "Free", locked: false },
    ];
    items.push({ href: "/account", label: "Premium 🔒", locked: true });
    if (mode === "check") {
      items.push({ href: "/account", label: "✈️ Travel Mode 🔒", locked: true });
    }
    if (mode === "learn") {
      items.push({ href: "/account", label: "MCAT Flashcards 🔒", locked: true });
      items.push({ href: "/case-studies", label: "Case Studies 🔒", locked: true });
    }
    return items;
  }

  // premium
  const items: DropdownItem[] = [
    { href: `${base}/free`, label: "Free", locked: false },
  ];
  items.push({
    href: `${base}/premium`,
    label: "Premium 👑",
    locked: false,
    premiumColor,
  });
  if (mode === "check") {
    items.push({ href: "/check/travel", label: "✈️ Travel Mode 👑", locked: false, premiumColor: "gold" });
  }
  if (mode === "learn") {
    items.push({ href: "/flashcards", label: "MCAT Flashcards 👑", locked: false, premiumColor: "teal" });
    items.push({ href: "/case-studies", label: "Case Studies 👑", locked: false, premiumColor: "teal" });
  }
  return items;
}

function NavDropdown({
  label,
  items,
  isActive,
}: {
  label: string;
  items: DropdownItem[];
  isActive: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  return (
    <div ref={ref} className="relative" style={{ flexShrink: 0 }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-1 text-sm transition-colors hover:text-foreground",
          isActive ? "text-foreground" : "text-muted-foreground",
        )}
        style={{ fontSize: "clamp(10px, 2.8vw, 14px)", padding: "clamp(2px, 1vw, 8px) clamp(4px, 1.5vw, 12px)", whiteSpace: "nowrap" }}
      >
        {label}
        <span
          className={cn(
            "text-xs transition-transform duration-150",
            open ? "rotate-180" : "rotate-0",
          )}
        >
          ▾
        </span>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 min-w-56 overflow-hidden rounded-md border bg-background shadow-md">
          {items.map((item) => (
            <Link
              key={item.href + item.label}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                item.locked ? "text-muted-foreground" : "text-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}


function AvatarButton() {
  return (
    <Link
      href="/account"
      className="flex items-center justify-center rounded-full bg-[#0d1b2a] ring-2 ring-teal-500"
      style={{ width: "28px", height: "28px", flexShrink: 0 }}
      aria-label="Account"
    >
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <circle cx="10" cy="7" r="4" fill="#9ca3af" />
        <path d="M2 18c0-4 3.582-7 8-7s8 3 8 7" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </Link>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const [auth, setAuth] = useState<AuthState>({ status: "loading" });
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const supabase = createClient();

    async function loadAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setAuth({ status: "unauthenticated" });
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_premium")
        .eq("id", user.id)
        .single();

      const isPremium = profile?.is_premium ?? false;
      setAuth({ status: isPremium ? "premium" : "free" });
    }

    loadAuth();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      loadAuth();
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const dropdowns = [
    {
      label: "Check Mode",
      basePath: "/check",
      items: buildDropdownItems("check", auth, "gold"),
    },
    {
      label: "Learn Mode",
      basePath: "/learn",
      items: buildDropdownItems("learn", auth, "teal"),
    },
  ];

  return (
    <>
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          background: "rgba(5,13,26,0.95)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* ── Main row ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 16px",
            height: "52px",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          {/* Logo */}
          <Link
            href="/"
            style={{
              color: "white",
              fontWeight: 700,
              fontSize: "16px",
              textDecoration: "none",
              flexShrink: 0,
            }}
          >
            ToxiClear AI
          </Link>

          {/* Desktop nav — JS-gated, not shown on mobile */}
          {!isMobile && (
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <Link
                href="/"
                className={cn(
                  "text-sm transition-colors hover:text-foreground",
                  pathname === "/" ? "text-foreground" : "text-muted-foreground",
                )}
                style={{ padding: "6px 10px", whiteSpace: "nowrap" }}
              >
                Home
              </Link>
              {dropdowns.map((d) => (
                <NavDropdown
                  key={d.label}
                  label={d.label}
                  items={d.items}
                  isActive={pathname.startsWith(d.basePath)}
                />
              ))}
              <Link
                href="/history"
                className={cn(
                  "text-sm transition-colors hover:text-foreground",
                  pathname === "/history"
                    ? "text-foreground"
                    : "text-muted-foreground",
                )}
                style={{ padding: "6px 10px", whiteSpace: "nowrap" }}
              >
                History
              </Link>
            </div>
          )}

          {/* Right side: account icon + hamburger */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              flexShrink: 0,
              paddingRight: "16px",
            }}
          >
            {auth.status === "unauthenticated" ? (
              <Link
                href="/signup"
                className="rounded-md bg-yellow-700 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-yellow-600"
              >
                Sign In
              </Link>
            ) : auth.status === "loading" ? (
              <div style={{ width: "28px", height: "28px" }} />
            ) : (
              <AvatarButton />
            )}

            {/* Hamburger — mobile only, JS-gated */}
            {isMobile && (
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "5px",
                  flexShrink: 0,
                  minWidth: "32px",
                  minHeight: "32px",
                }}
                aria-label="Toggle menu"
              >
                <span
                  style={{
                    display: "block",
                    width: "22px",
                    height: "2px",
                    background: "rgba(255,255,255,0.8)",
                    transition: "all 0.2s",
                    transform: menuOpen
                      ? "rotate(45deg) translate(0, 7px)"
                      : "none",
                  }}
                />
                <span
                  style={{
                    display: "block",
                    width: "22px",
                    height: "2px",
                    background: "rgba(255,255,255,0.8)",
                    transition: "all 0.2s",
                    opacity: menuOpen ? 0 : 1,
                  }}
                />
                <span
                  style={{
                    display: "block",
                    width: "22px",
                    height: "2px",
                    background: "rgba(255,255,255,0.8)",
                    transition: "all 0.2s",
                    transform: menuOpen
                      ? "rotate(-45deg) translate(0, -7px)"
                      : "none",
                  }}
                />
              </button>
            )}
          </div>
        </div>

        {/* ── Mobile dropdown menu — JS-gated ── */}
        {isMobile && menuOpen && (
          <div
            style={{
              background: "rgba(5,13,26,0.98)",
              borderTop: "1px solid rgba(255,255,255,0.06)",
              padding: "8px 0 16px",
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            <Link
              href="/"
              onClick={() => setMenuOpen(false)}
              style={{
                display: "block",
                padding: "12px 20px",
                color: "rgba(255,255,255,0.8)",
                textDecoration: "none",
                fontSize: "15px",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
              }}
            >
              Home
            </Link>

            <div
              style={{
                padding: "12px 20px 4px",
                fontSize: "11px",
                color: "rgba(255,255,255,0.3)",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              Check Mode
            </div>
            <Link href="/check/free" onClick={() => setMenuOpen(false)} style={{ display: "block", padding: "10px 28px", color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: "14px" }}>Free</Link>
            <Link href={auth.status === "premium" ? "/check/premium" : "/account"} onClick={() => setMenuOpen(false)} style={{ display: "block", padding: "10px 28px", color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: "14px" }}>Premium {auth.status === "premium" ? "👑" : "🔒"}</Link>
            <Link href={auth.status === "premium" ? "/check/travel" : "/account"} onClick={() => setMenuOpen(false)} style={{ display: "block", padding: "10px 28px", color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: "14px" }}>✈️ Travel Mode {auth.status === "premium" ? "👑" : "🔒"}</Link>

            <div
              style={{
                padding: "12px 20px 4px",
                fontSize: "11px",
                color: "rgba(255,255,255,0.3)",
                textTransform: "uppercase",
                letterSpacing: "1px",
                marginTop: "4px",
              }}
            >
              Learn Mode
            </div>
            <Link href="/learn/free" onClick={() => setMenuOpen(false)} style={{ display: "block", padding: "10px 28px", color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: "14px" }}>Free</Link>
            <Link href={auth.status === "premium" ? "/learn/premium" : "/account"} onClick={() => setMenuOpen(false)} style={{ display: "block", padding: "10px 28px", color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: "14px" }}>Premium {auth.status === "premium" ? "👑" : "🔒"}</Link>
            <Link href={auth.status === "premium" ? "/flashcards" : "/account"} onClick={() => setMenuOpen(false)} style={{ display: "block", padding: "10px 28px", color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: "14px" }}>🃏 MCAT Flashcards {auth.status === "premium" ? "👑" : "🔒"}</Link>
            <Link href={auth.status === "premium" ? "/case-studies" : "/account"} onClick={() => setMenuOpen(false)} style={{ display: "block", padding: "10px 28px", color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: "14px" }}>🔬 Case Studies {auth.status === "premium" ? "👑" : "🔒"}</Link>

            <Link
              href="/history"
              onClick={() => setMenuOpen(false)}
              style={{
                display: "block",
                padding: "12px 20px",
                color: "rgba(255,255,255,0.8)",
                textDecoration: "none",
                fontSize: "15px",
                borderTop: "1px solid rgba(255,255,255,0.04)",
                marginTop: "4px",
              }}
            >
              History
            </Link>
          </div>
        )}
      </nav>

      {/* Spacer to push page content below the fixed navbar */}
      <div style={{ height: "52px" }} />
    </>
  );
}
