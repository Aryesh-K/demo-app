"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "~/lib/supabase/client";

export function usePremiumGuard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const check = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/signup");
        return;
      }

      setIsLoggedIn(true);

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_premium")
        .eq("id", user.id)
        .single();

      if (!profile?.is_premium) {
        router.replace("/account");
        return;
      }

      setIsPremium(true);
      setIsLoading(false);
    };
    void check();
  }, [router]);

  return { isLoading, isPremium, isLoggedIn };
}
