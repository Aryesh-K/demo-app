"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { createClient } from "~/lib/supabase/client";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${window.location.origin}/update-password`,
      },
    );
    setLoading(false);

    if (authError) {
      setError(authError.message);
    } else {
      setSuccess(true);
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-6 flex flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-tight">
              Reset Your Password
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your email and we&apos;ll send you a reset link
            </p>
          </div>

          {success ? (
            <div className="rounded-xl border border-green-700/50 bg-green-950/30 p-5 text-sm leading-relaxed text-green-300">
              <p className="mb-1 font-semibold text-green-200">
                Reset link sent!
              </p>
              Check your email inbox and click the link to set a new password.
              It may take a few minutes to arrive.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              {error && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-yellow-700 text-white hover:bg-yellow-600 disabled:opacity-60"
              >
                {loading ? "Sending…" : "Send Reset Link"}
              </Button>
            </form>
          )}

          <div className="mt-5 text-center">
            <Link
              href="/signup"
              className="text-sm text-teal-400 hover:text-teal-300"
            >
              ← Back to Log In
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
