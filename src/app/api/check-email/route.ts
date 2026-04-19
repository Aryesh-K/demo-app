import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { env } from "~/env";

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { email?: string };
  const { email } = body;

  if (!email?.includes("@")) {
    return NextResponse.json(
      { exists: false, error: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  const { error } = await supabase.auth.admin.generateLink({
    type: "recovery",
    email,
  });
  return NextResponse.json({ exists: !error });
}
