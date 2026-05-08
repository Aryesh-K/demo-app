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
    <div className="flex flex-col items-center gap-3">
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
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
      </div>
      <Link
        href="/history"
        className="mt-3 font-serif text-sm uppercase italic tracking-widest text-white underline decoration-white/50 underline-offset-4 transition-colors hover:text-slate-300 hover:decoration-white"
      >
        — Learn the History —
      </Link>
    </div>
  );
}
