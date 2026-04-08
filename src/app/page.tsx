import Link from "next/link";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";

const features = [
  {
    title: "Notes App",
    description:
      "Full CRUD notes with real-time editing, auto-save on blur, and localStorage persistence. Two-column layout with a notes list and focused editor.",
    badge: "Built",
    badgeVariant: "default" as const,
    href: "/notes",
    cta: "Open Notes",
  },
  {
    title: "Supabase Integration",
    description:
      "Database, Auth, and Storage clients pre-configured. Browser and server-side Supabase clients available for building full-stack features.",
    badge: "Ready",
    badgeVariant: "secondary" as const,
  },
  {
    title: "shadcn/ui Components",
    description:
      "Button, Card, Badge, Input, Label, Separator, and Skeleton — built on Radix UI primitives with class-variance-authority for consistent variants.",
    badge: "8 Components",
    badgeVariant: "outline" as const,
  },
  {
    title: "Light & Dark Theme",
    description:
      "OKLCH design tokens in globals.css with full dark mode support via next-themes. Semantic tokens like text-foreground and bg-background adapt automatically.",
    badge: "Themed",
    badgeVariant: "secondary" as const,
  },
  {
    title: "Type-Safe Env Vars",
    description:
      "Environment variables validated at runtime with @t3-oss/env-nextjs and Zod. Import the env object — no raw process.env in application code.",
    badge: "Validated",
    badgeVariant: "outline" as const,
  },
  {
    title: "Next.js App Router",
    description:
      "Server components by default, file-based routing, layouts, and metadata. Biome for fast linting and formatting with the ~/  import alias.",
    badge: "App Router",
    badgeVariant: "default" as const,
  },
];

const stack = [
  "Next.js 16",
  "React 19",
  "TypeScript",
  "Tailwind CSS v4",
  "Supabase",
  "shadcn/ui",
  "Biome",
  "pnpm",
];

export default function Home() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16 flex flex-col gap-16">
      {/* Hero */}
      <section className="flex flex-col items-center gap-6 text-center">
        <Badge variant="secondary">Starter Template</Badge>
        <h1 className="text-5xl font-bold tracking-tight">
          Welcome to Lumos App
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          A production-ready Next.js starter with Supabase, shadcn/ui, and
          Tailwind CSS v4. Everything you need to build your next app.
        </p>
        <Button asChild size="lg">
          <Link href="/notes">Open Notes App</Link>
        </Button>
      </section>

      <Separator />

      {/* Features */}
      <section className="flex flex-col gap-8">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-semibold tracking-tight">Features</h2>
          <p className="text-muted-foreground">
            Everything included out of the box.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{feature.title}</CardTitle>
                  <Badge variant={feature.badgeVariant}>{feature.badge}</Badge>
                </div>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              {feature.href && feature.cta && (
                <CardContent>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={feature.href}>{feature.cta}</Link>
                  </Button>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </section>

      <Separator />

      {/* Stack */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-semibold tracking-tight">Tech Stack</h2>
          <p className="text-muted-foreground">Built with modern tooling.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {stack.map((item) => (
            <Badge key={item} variant="secondary">
              {item}
            </Badge>
          ))}
        </div>
      </section>
    </main>
  );
}
