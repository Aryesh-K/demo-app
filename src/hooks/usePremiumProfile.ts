"use client";
import { useEffect, useState } from "react";
import { decryptField } from "~/lib/encrypt";
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
          age: decryptField(data.age ?? ""),
          conditions: decryptField(data.conditions ?? ""),
          medications: decryptField(data.medications ?? ""),
          allergies: decryptField(data.allergies ?? ""),
          notes: decryptField(data.notes ?? ""),
        });
      }
      setLoading(false);
    });
  }, []);

  return { profile, loading };
}
