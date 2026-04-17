import Link from "next/link";
import { Button } from "~/components/ui/button";

export default function SignUp() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-md flex-col items-center justify-center gap-6 px-6 py-12 text-center">
      <span className="text-4xl">👑</span>

      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Create Your Account
        </h1>
        <p className="text-muted-foreground">
          Sign up to unlock Premium features
        </p>
      </div>

      <div className="w-full rounded-xl border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          Account creation coming soon. Check back shortly.
        </p>
      </div>

      <Button asChild variant="outline">
        <Link href="/">← Back to Home</Link>
      </Button>
    </main>
  );
}
