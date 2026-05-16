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
    <nav
      className="relative z-10 border-b border-border bg-background"
      style={{ width: "100%", maxWidth: "100vw", overflowX: "hidden" }}
    >
      <div
        className="mx-auto flex h-14 max-w-5xl items-center gap-6 px-4"
        style={{ gap: "clamp(2px, 1.5vw, 24px)", padding: "0 clamp(8px, 2vw, 16px)" }}
      >
        <Link
          href="/"
          className="font-semibold tracking-tight"
          style={{ fontSize: "clamp(12px, 3.5vw, 18px)", whiteSpace: "nowrap", flexShrink: 0 }}
        >
          ToxiClear AI
        </Link>
        <div
          className="flex flex-1 items-center gap-4"
          style={{ gap: "clamp(2px, 1.2vw, 16px)", flexWrap: "nowrap" }}
        >
          <Link
            href="/"
            className={cn(
              "text-sm transition-colors hover:text-foreground",
              pathname === "/" ? "text-foreground" : "text-muted-foreground",
            )}
            style={{ fontSize: "clamp(10px, 2.8vw, 14px)", padding: "clamp(2px, 1vw, 8px) clamp(4px, 1.5vw, 12px)", whiteSpace: "nowrap", flexShrink: 0 }}
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
              pathname === "/history" ? "text-foreground" : "text-muted-foreground",
            )}
            style={{ fontSize: "clamp(10px, 2.8vw, 14px)", padding: "clamp(2px, 1vw, 8px) clamp(4px, 1.5vw, 12px)", whiteSpace: "nowrap", flexShrink: 0 }}
          >
            History
          </Link>
        </div>
        <div style={{ flexShrink: 0, marginLeft: "auto" }}>
          {auth.status === "unauthenticated" || auth.status === "loading" ? (
            auth.status === "unauthenticated" ? (
              <Link
                href="/signup"
                className="rounded-md bg-yellow-700 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-yellow-600"
              >
                Sign Up / Log In
              </Link>
            ) : (
              // loading — reserve space to avoid layout shift
              <div className="h-[38px] w-[38px]" />
            )
          ) : (
            <AvatarButton />
          )}
        </div>
      </div>
    </nav>
  );
}
