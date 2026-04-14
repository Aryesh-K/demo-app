"use client";

import { useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { cn } from "~/lib/utils";

type Mode = "check" | "learn";
type RiskLevel = "High" | "Moderate" | "Low";

interface InteractionResult {
  riskLevel: RiskLevel;
  mechanism: string;
  plainEnglish: string;
}

const MOCK_RESULT: InteractionResult = {
  riskLevel: "High",
  mechanism:
    "Warfarin inhibits vitamin K epoxide reductase, reducing the synthesis of clotting factors II, VII, IX, and X. Aspirin irreversibly inhibits cyclooxygenase (COX-1 and COX-2), decreasing thromboxane A2 production and platelet aggregation. Together, they potentiate bleeding risk through complementary anticoagulant and antiplatelet pathways.",
  plainEnglish:
    "Both drugs thin your blood, but in different ways. Taking them together makes it much harder for your body to stop bleeding — even from a small cut. This combination requires close medical supervision and is generally avoided unless the benefit clearly outweighs the risk.",
};

const riskStyles: Record<RiskLevel, string> = {
  High: "bg-destructive text-white border-transparent hover:bg-destructive",
  Moderate: "bg-yellow-500 text-white border-transparent hover:bg-yellow-500",
  Low: "bg-green-600 text-white border-transparent hover:bg-green-600",
};

const modes = [
  {
    id: "check" as Mode,
    title: "Check Mode",
    audience: "For general public",
    description: "Quickly check if your medications are safe to combine",
  },
  {
    id: "learn" as Mode,
    title: "Learn Mode",
    audience: "For students & educators",
    description: "Explore the biology behind drug interactions",
  },
];

export default function Home() {
  const [mode, setMode] = useState<Mode>("check");
  const [drugA, setDrugA] = useState("");
  const [drugB, setDrugB] = useState("");
  const [result, setResult] = useState<InteractionResult | null>(null);
  const [loading, setLoading] = useState(false);

  function handleCheck() {
    if (!drugA.trim() || !drugB.trim()) return;
    setLoading(true);
    setResult(null);
    setTimeout(() => {
      setResult(MOCK_RESULT);
      setLoading(false);
    }, 800);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleCheck();
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-16 flex flex-col gap-10">
      {/* Hero */}
      <section className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-5xl font-bold tracking-tight">ToxiClear AI</h1>
        <p className="max-w-sm text-lg text-muted-foreground">
          Understand what happens inside your body when medications interact
        </p>
      </section>

      {/* Mode Selector */}
      <section className="grid grid-cols-2 gap-3">
        {modes.map(({ id, title, audience, description }) => (
          <Card
            key={id}
            role="button"
            tabIndex={0}
            onClick={() => setMode(id)}
            onKeyDown={(e) => e.key === "Enter" && setMode(id)}
            className={cn(
              "cursor-pointer select-none transition-all",
              mode === id
                ? "border-primary ring-2 ring-primary/20"
                : "hover:border-foreground/30",
            )}
          >
            <CardHeader className="gap-1">
              <CardTitle className="text-base">{title}</CardTitle>
              <p className="text-xs text-muted-foreground">{audience}</p>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>

      {/* Checker Form */}
      <section className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="drug-a">Drug A</Label>
            <Input
              id="drug-a"
              placeholder="e.g. Warfarin"
              value={drugA}
              onChange={(e) => setDrugA(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="drug-b">Drug B</Label>
            <Input
              id="drug-b"
              placeholder="e.g. Aspirin"
              value={drugB}
              onChange={(e) => setDrugB(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
        </div>

        <Button
          onClick={handleCheck}
          disabled={!drugA.trim() || !drugB.trim() || loading}
          size="lg"
        >
          {loading ? "Checking..." : "Check Interaction"}
        </Button>

        {/* Results */}
        {result && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Interaction Result</CardTitle>
                <Badge className={riskStyles[result.riskLevel]}>
                  {result.riskLevel} Risk
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <h3 className="text-sm font-semibold">What&apos;s happening</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {result.mechanism}
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <h3 className="text-sm font-semibold">In simple terms</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {result.plainEnglish}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </section>
    </main>
  );
}
