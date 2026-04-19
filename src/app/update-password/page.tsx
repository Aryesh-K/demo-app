"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { createClient } from "~/lib/supabase/client";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (authError) {
      setError(authError.message);
    } else {
      setSuccess(true);
      setTimeout(() => router.push("/signup"), 2000);
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-6 flex flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-tight">
              Set New Password
            </h1>
            <p className="text-sm text-muted-foreground">
              Choose a strong password for your account
            </p>
          </div>

          {success ? (
            <div className="rounded-xl border border-green-700/50 bg-green-950/30 p-5 text-sm leading-relaxed text-green-300">
              <p className="font-semibold text-green-200">
                Password updated successfully!
              </p>
              <p className="mt-1 text-green-400/70">
                Redirecting you to log in…
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
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
                {loading ? "Updating…" : "Update Password"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
