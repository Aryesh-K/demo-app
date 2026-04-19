import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { env } from "~/env";

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { code?: string; userId?: string };
  const { code, userId } = body;

  if (!code || !userId) {
    return NextResponse.json(
      { success: false, message: "Missing code or userId." },
      { status: 400 },
    );
  }

  const validCodes = env.NEXT_PUBLIC_ACCESS_CODES.split(",").map((c) =>
    c.trim().toLowerCase(),
  );

  if (!validCodes.includes(code.toLowerCase())) {
    return NextResponse.json(
      { success: false, message: "Invalid access code." },
      { status: 400 },
    );
  }

  const { error } = await supabase
    .from("profiles")
    .update({ is_premium: true })
    .eq("id", userId);

  if (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update profile. Please try again.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    message: "Premium access unlocked!",
  });
}
