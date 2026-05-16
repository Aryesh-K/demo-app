"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { createClient } from "~/lib/supabase/client";

type Tab = "signup" | "login";

// ─── Sign Up Form ─────────────────────────────────────────────────────────────

function SignUpForm() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setError("Please fill in all required fields.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!agreed) {
      setError("You must agree to the Privacy Policy and Terms of Service.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          phone: phone || null,
        },
      },
    });

    if (authError) {
      setLoading(false);
      setError(authError.message);
      return;
    }

    setLoading(false);
    setSuccess(true);
  }

  if (success) {
    return (
      <div className="rounded-xl border border-green-700/50 bg-green-950/30 p-5 text-sm leading-relaxed text-green-300">
        <p className="mb-1 font-semibold text-green-200">Account created!</p>
        Check your email to verify your account. Once verified, log in to get
        started.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            autoComplete="given-name"
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            autoComplete="family-name"
            required
          />
        </div>
      </div>

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

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="phone">
          Phone Number{" "}
          <span className="text-xs text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          autoComplete="tel"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Password</Label>
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
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          required
        />
      </div>

      <label className="flex cursor-pointer items-start gap-2.5 text-sm text-muted-foreground">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-teal-500"
        />
        <span>
          I agree to the{" "}
          <Link
            href="/privacy"
            className="text-teal-400 hover:text-teal-300 underline underline-offset-2"
          >
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link
            href="/terms"
            className="text-teal-400 hover:text-teal-300 underline underline-offset-2"
          >
            Terms of Service
          </Link>
        </span>
      </label>

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
        {loading ? "Creating account…" : "Create Account"}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        After signing up, you&apos;ll have the option to upgrade to Premium for
        $9.99 — one-time, no subscriptions.
      </p>
    </form>
  );
}

// ─── Log In Form ──────────────────────────────────────────────────────────────

function LogInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);

    if (authError) {
      setError(authError.message);
    } else if (data.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_complete")
        .eq("id", data.user.id)
        .single();

      if (!profile?.onboarding_complete) {
        router.push("/onboarding");
      } else {
        router.push("/");
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="loginEmail">Email</Label>
        <Input
          id="loginEmail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="loginPassword">Password</Label>
        <Input
          id="loginPassword"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
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
        {loading ? "Logging in…" : "Log In"}
      </Button>

      <p className="text-center text-sm">
        <Link
          href="/reset-password"
          className="text-teal-400 hover:text-teal-300 underline underline-offset-2"
        >
          Forgot your password?
        </Link>
      </p>
    </form>
  );
}

// ─── Message banner (needs Suspense because it reads search params) ───────────

function MessageBanner() {
  const searchParams = useSearchParams();
  const message = searchParams.get("message");
  if (!message) return null;
  return (
    <div className="mb-4 rounded-xl border border-amber-700/50 bg-amber-950/30 px-4 py-3 text-sm text-amber-300">
      {message}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SignUpPage() {
  const [tab, setTab] = useState<Tab>("signup");

  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        {/* Amber info banner for redirect messages */}
        <Suspense>
          <MessageBanner />
        </Suspense>

        {/* Tab bar */}
        <div className="mb-6 flex border-b border-border">
          {(["signup", "login"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex-1 pb-3 text-sm font-medium transition-colors ${
                tab === t
                  ? "border-b-2 border-teal-400 text-white"
                  : "text-muted-foreground hover:text-slate-300"
              }`}
              style={{ marginBottom: tab === t ? "-1px" : undefined }}
            >
              {t === "signup" ? "Sign Up" : "Log In"}
            </button>
          ))}
        </div>

        {/* Card */}
        <div className="rounded-xl border border-border bg-card p-6">
          {/* Heading */}
          <div
            key={tab}
            className="mb-6 flex flex-col gap-1"
            style={{ animation: "fade-in 0.2s ease" }}
          >
            <h1 className="text-2xl font-bold tracking-tight">
              {tab === "signup" ? "Create Your Account" : "Welcome Back"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {tab === "signup"
                ? "Free access to Check Mode and Learn Mode"
                : "Log in to your ToxiClear AI account"}
            </p>
          </div>

          {/* Form — fades on tab switch */}
          <div key={`${tab}-form`} style={{ animation: "fade-in 0.2s ease" }}>
            {tab === "signup" ? <SignUpForm /> : <LogInForm />}
          </div>
        </div>
      </div>
    </main>
  );
}
