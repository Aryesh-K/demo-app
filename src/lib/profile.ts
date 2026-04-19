import { createClient } from "~/lib/supabase/client";

export async function getProfile(userId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  return data;
}

export async function updateProfile(
  userId: string,
  updates: {
    first_name?: string;
    last_name?: string;
    phone?: string;
    is_premium?: boolean;
    age?: string;
    conditions?: string;
    medications?: string;
    allergies?: string;
    notes?: string;
  },
) {
  const supabase = createClient();
  return await supabase.from("profiles").upsert({ id: userId, ...updates });
}
