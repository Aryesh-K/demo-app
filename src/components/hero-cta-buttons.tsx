"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import { createClient } from "~/lib/supabase/client";

export function HeroCtaButtons() {
  const router = useRouter();

  async function handleNav(dest: "/check/free" | "/learn/free") {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      router.push(dest);
    } else {
      const msg =
        dest === "/check/free"
          ? "Please create a free account to check an interaction."
          : "Please create a free account to learn the biology.";
      router.push(`/signup?message=${encodeURIComponent(msg)}`);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex flex-col items-center gap-3 md:flex-row md:justify-center md:items-center">
        <Button
          type="button"
          className="bg-blue-900 text-white hover:bg-blue-800"
          size="lg"
          onClick={() => handleNav("/check/free")}
        >
          Check an Interaction →
        </Button>
        <Button
          type="button"
          variant="outline"
          className="border-teal-600 bg-teal-950/20 text-teal-400 hover:bg-teal-950/40 hover:text-teal-300"
          size="lg"
          onClick={() => handleNav("/learn/free")}
        >
          Learn the Biology →
        </Button>
        <Link
          href="/history"
          className="inline-flex items-center justify-center rounded-md px-6 py-2.5 text-sm font-medium transition-colors"
          style={{
            border: "1px solid rgba(255,255,255,0.25)",
            color: "rgba(255,255,255,0.7)",
            background: "transparent",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.borderColor =
              "rgba(255,255,255,0.5)";
            (e.currentTarget as HTMLAnchorElement).style.color = "white";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.borderColor =
              "rgba(255,255,255,0.25)";
            (e.currentTarget as HTMLAnchorElement).style.color =
              "rgba(255,255,255,0.7)";
          }}
        >
          Learn the History →
        </Link>
      </div>
      <p
        style={{
          fontSize: "11px",
          color: "rgba(255,255,255,0.3)",
          textAlign: "center",
          marginTop: "8px",
          letterSpacing: "0.3px",
        }}
      >
        History is free — no account needed
      </p>
    </div>
  );
}
