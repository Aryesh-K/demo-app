"use client";
import { useEffect, useState } from "react";
import { createClient } from "~/lib/supabase/client";

export interface PremiumProfile {
  age: string;
  conditions: string;
  medications: string;
  allergies: string;
  notes: string;
}

export function usePremiumProfile() {
  const [profile, setProfile] = useState<PremiumProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("age, conditions, medications, allergies, notes")
        .eq("id", user.id)
        .single();
      if (data) {
        setProfile({
          age: data.age ?? "",
          conditions: data.conditions ?? "",
          medications: data.medications ?? "",
          allergies: data.allergies ?? "",
          notes: data.notes ?? "",
        });
      }
      setLoading(false);
    });
  }, []);

  return { profile, loading };
}
