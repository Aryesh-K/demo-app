"use client";

import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { getProfile } from "~/lib/profile";
import { createClient } from "~/lib/supabase/client";
import { cn } from "~/lib/utils";

type Tab = "account" | "premium";

type Profile = {
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  is_premium?: boolean | null;
  age?: string | null;
  conditions?: string | null;
  medications?: string | null;
  allergies?: string | null;
  notes?: string | null;
};

function formatJoinDate(isoDate: string) {
  return new Date(isoDate).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

// ─── Delete dialog ─────────────────────────────────────────────────────────────

function DeleteDialog({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
      >
        <h2 className="mb-2 text-lg font-semibold">Delete Account</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          To delete your account, please contact us at{" "}
          <a
            href="mailto:toxiclearai@gmail.com"
            className="text-teal-400 underline underline-offset-2 hover:text-teal-300"
          >
            toxiclearai@gmail.com
          </a>
        </p>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={onClose}
        >
          Close
        </Button>
      </div>
    </div>
  );
}

// ─── Account Info tab ──────────────────────────────────────────────────────────

function AccountInfoTab({
  user,
  profile: _profile,
  firstName,
  setFirstName,
  lastName,
  setLastName,
  phone,
  setPhone,
  isPremium,
  setIsPremium,
  onSaved,
}: {
  user: User;
  profile: Profile;
  firstName: string;
  setFirstName: (v: string) => void;
  lastName: string;
  setLastName: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  isPremium: boolean;
  setIsPremium: (v: boolean) => void;
  onSaved: (updated: Partial<Profile>) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [accessCode, setAccessCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [redeemResult, setRedeemResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const router = useRouter();

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
      })
      .eq("id", user.id);
    if (error) console.error("[account] save error:", error);
    setSaving(false);
    setSaved(true);
    onSaved({ first_name: firstName, last_name: lastName, phone });
    setTimeout(() => setSaved(false), 3000);
  }

  async function handleLogOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  async function handleRedeem() {
    if (!accessCode.trim()) return;
    setRedeeming(true);
    setRedeemResult(null);
    try {
      const res = await fetch("/api/redeem-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: accessCode.trim(), userId: user.id }),
      });
      const data = (await res.json()) as { success: boolean; message: string };
      setRedeemResult(data);
      if (data.success) {
        setIsPremium(true);
        onSaved({ is_premium: true });
        setAccessCode("");
      }
    } catch {
      setRedeemResult({
        success: false,
        message: "Network error. Please try again.",
      });
    } finally {
      setRedeeming(false);
    }
  }

  const joinedDate = formatJoinDate(user.created_at);

  return (
    <>
      {showDelete && <DeleteDialog onClose={() => setShowDelete(false)} />}

      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoComplete="given-name"
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
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">
            Email{" "}
            <span className="text-xs text-muted-foreground">(read-only)</span>
          </Label>
          <Input
            id="email"
            type="email"
            value={user.email ?? ""}
            readOnly
            disabled
            autoComplete="email"
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

        {saved && (
          <div className="rounded-xl border border-green-700/50 bg-green-950/30 p-3 text-sm text-green-300">
            Changes saved.
          </div>
        )}

        <Button
          type="submit"
          disabled={saving}
          className="w-full bg-teal-600 text-white hover:bg-teal-500 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </form>

      {/* Access code redemption — hidden once premium */}
      {!isPremium && (
        <div className="mt-6 flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Access Code
          </p>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Enter access code"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRedeem();
              }}
            />
            <Button
              type="button"
              disabled={redeeming || !accessCode.trim()}
              className="shrink-0 bg-teal-600 text-white hover:bg-teal-500 disabled:opacity-60"
              onClick={handleRedeem}
            >
              {redeeming ? "…" : "Redeem"}
            </Button>
          </div>
          {redeemResult && (
            <div
              className={cn(
                "rounded-xl border p-3 text-sm",
                redeemResult.success
                  ? "border-green-700/50 bg-green-950/30 text-green-300"
                  : "border-red-700/50 bg-red-950/30 text-red-300",
              )}
            >
              {redeemResult.success
                ? `🎉 ${redeemResult.message} Refresh the page to see your premium features.`
                : redeemResult.message}
            </div>
          )}
        </div>
      )}

      {/* Account status */}
      <div className="mt-6 flex flex-col gap-2 rounded-xl border border-border bg-card/50 p-4">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "rounded-full px-3 py-0.5 text-xs font-medium",
              isPremium
                ? "border border-yellow-600 bg-yellow-950/40 text-yellow-400"
                : "border border-border bg-muted text-muted-foreground",
            )}
          >
            {isPremium ? "👑 Premium Account" : "Free Account"}
          </span>
        </div>
        {!isPremium && (
          <p className="text-xs text-muted-foreground">
            Upgrade to Premium for $15 — coming soon
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Member since {joinedDate}
        </p>
      </div>

      {/* Log out + delete */}
      <div className="mt-6 flex flex-col gap-2">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleLogOut}
        >
          Log Out
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full border-red-800 text-red-400 hover:bg-red-950/30 hover:text-red-300"
          onClick={() => setShowDelete(true)}
        >
          Delete Account
        </Button>
      </div>
    </>
  );
}

// ─── Premium Info tab ──────────────────────────────────────────────────────────

function PremiumInfoTab({
  user,
  profile,
  onSaved,
}: {
  user: User;
  profile: Profile;
  onSaved: (updated: Partial<Profile>) => void;
}) {
  const [age, setAge] = useState(profile.age ?? "");
  const [conditions, setConditions] = useState(profile.conditions ?? "");
  const [medications, setMedications] = useState(profile.medications ?? "");
  const [allergies, setAllergies] = useState(profile.allergies ?? "");
  const [notes, setNotes] = useState(profile.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        age: age || null,
        conditions: conditions || null,
        medications: medications || null,
        allergies: allergies || null,
        notes: notes || null,
      })
      .eq("id", user.id);
    if (error) console.error("[account] premium save error:", error);
    setSaving(false);
    setSaved(true);
    onSaved({ age, conditions, medications, allergies, notes });
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="age">Age</Label>
        <Input
          id="age"
          type="text"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          placeholder="e.g. 42"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="conditions">Known Conditions</Label>
        <textarea
          id="conditions"
          value={conditions}
          onChange={(e) => setConditions(e.target.value)}
          rows={3}
          placeholder="e.g. Type 2 diabetes, hypertension"
          className="w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 dark:bg-input/30"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="medications">Current Medications</Label>
        <textarea
          id="medications"
          value={medications}
          onChange={(e) => setMedications(e.target.value)}
          rows={3}
          placeholder="e.g. Metformin 500mg, Lisinopril 10mg"
          className="w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 dark:bg-input/30"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="allergies">Allergies</Label>
        <Input
          id="allergies"
          type="text"
          value={allergies}
          onChange={(e) => setAllergies(e.target.value)}
          placeholder="e.g. Penicillin, sulfa drugs"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="notes">Extra Notes</Label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Anything else relevant to your health profile"
          className="w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 dark:bg-input/30"
        />
      </div>

      {saved && (
        <div className="rounded-xl border border-green-700/50 bg-green-950/30 p-3 text-sm text-green-300">
          Premium info saved.
        </div>
      )}

      <Button
        type="submit"
        disabled={saving}
        className="w-full bg-yellow-700 text-white hover:bg-yellow-600 disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save Premium Info"}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        This information is used to personalize your Premium interaction
        analyses. It is stored securely and never shared.
      </p>
    </form>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile>({});
  const [tab, setTab] = useState<Tab>("account");
  const [loading, setLoading] = useState(true);

  // Lifted field state so useEffect can pre-fill after getProfile resolves
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        router.replace("/signup");
        return;
      }

      setUser(authUser);
      const profileData = await getProfile(authUser.id);
      setProfile(profileData ?? {});
      if (profileData) {
        setFirstName(profileData.first_name ?? "");
        setLastName(profileData.last_name ?? "");
        setPhone(profileData.phone ?? "");
        setIsPremium(profileData.is_premium ?? false);
      }
      setLoading(false);
    }

    load();
  }, [router]);

  if (loading) {
    return (
      <main className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-6 py-12">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </main>
    );
  }

  if (!user) return null;

  function mergeProfile(updated: Partial<Profile>) {
    setProfile((prev) => ({ ...prev, ...updated }));
    if (updated.is_premium !== undefined) {
      setIsPremium(updated.is_premium ?? false);
    }
  }

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-12">
      <h1 className="text-2xl font-bold tracking-tight">My Account</h1>

      {/* Tab bar */}
      <div className="flex border-b border-border">
        <button
          type="button"
          onClick={() => setTab("account")}
          className={cn(
            "pb-3 pr-6 text-sm font-medium transition-colors",
            tab === "account"
              ? "border-b-2 border-teal-400 text-white"
              : "text-muted-foreground hover:text-slate-300",
          )}
          style={{ marginBottom: tab === "account" ? "-1px" : undefined }}
        >
          Account Info
        </button>

        {isPremium ? (
          <button
            type="button"
            onClick={() => setTab("premium")}
            className={cn(
              "pb-3 pr-6 text-sm font-medium transition-colors",
              tab === "premium"
                ? "border-b-2 border-yellow-500 text-white"
                : "text-muted-foreground hover:text-slate-300",
            )}
            style={{ marginBottom: tab === "premium" ? "-1px" : undefined }}
          >
            Premium Info
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setTab("premium")}
            className="pb-3 pr-6 text-sm font-medium text-muted-foreground/50 transition-colors"
            style={{ marginBottom: tab === "premium" ? "-1px" : undefined }}
          >
            Premium Info 🔒
          </button>
        )}
      </div>

      {/* Tab content */}
      <div className="rounded-xl border border-border bg-card p-6">
        {tab === "account" && (
          <AccountInfoTab
            user={user}
            profile={profile}
            firstName={firstName}
            setFirstName={setFirstName}
            lastName={lastName}
            setLastName={setLastName}
            phone={phone}
            setPhone={setPhone}
            isPremium={isPremium}
            setIsPremium={setIsPremium}
            onSaved={mergeProfile}
          />
        )}
        {tab === "premium" && isPremium && (
          <PremiumInfoTab
            user={user}
            profile={profile}
            onSaved={mergeProfile}
          />
        )}
        {tab === "premium" && !isPremium && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              Upgrade to Premium to unlock personalized health profile features.
            </p>
            <p className="text-xs text-muted-foreground">
              Premium upgrade coming soon.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
