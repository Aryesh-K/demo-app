"use client";
import { useEffect, useRef, useState } from "react";

interface ToxiLoaderProps {
  fading?: boolean;
  label?: string;
}

export function ToxiLoader({ fading = false, label = "Analyzing…" }: ToxiLoaderProps) {
  const SIZE = 200;
  const CENTER = SIZE / 2;
  const OUTER_R = 80;
  const INNER_R = 52;
  const DOT_R = 9;
  const NODE_R = 6;
  const REVOLUTION_MS = 900;

  // Outer hexagon points (flat-top)
  const outerPoints = Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 180) * (60 * i - 30);
    return { x: CENTER + OUTER_R * Math.cos(angle), y: CENTER + OUTER_R * Math.sin(angle) };
  });

  // Inner pentagon/hexagon nodes (5 nodes from logo)
  const innerNodes = Array.from({ length: 5 }, (_, i) => {
    const angle = (Math.PI / 180) * (72 * i - 90);
    return { x: CENTER + INNER_R * Math.cos(angle), y: CENTER + INNER_R * Math.sin(angle) };
  });

  // Build path segments between consecutive nodes (loop back to start)
  const segments = innerNodes.map((node, i) => ({
    from: node,
    to: innerNodes[(i + 1) % innerNodes.length],
  }));

  const totalSegments = segments.length;
  const [progress, setProgress] = useState(0); // 0 to totalSegments (continuous)

  const animRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    startTimeRef.current = null;
    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const totalTime = REVOLUTION_MS * totalSegments;
      const rawProgress = (elapsed % totalTime) / REVOLUTION_MS;

      // Apply gravity easing per segment
      // Each segment gets eased individually based on its vertical position
      const segIdx = Math.floor(rawProgress) % totalSegments;
      const segFrac = rawProgress - Math.floor(rawProgress);

      // Get the vertical midpoint of this segment (0 = top, 1 = bottom)
      const seg = segments[segIdx];
      const midY = ((seg.from.y + seg.to.y) / 2 - CENTER) / INNER_R;
      // midY ranges from -1 (top) to +1 (bottom)

      // Speed multiplier: faster at bottom (midY=1), slower at top (midY=-1)
      // Use easeInOut but biased by vertical position
      const gravityBias = (midY + 1) / 2; // 0 at top, 1 at bottom
      // Ease: slow->fast when going down, fast->slow when going up
      const easedFrac = gravityBias > 0.5
        ? segFrac * segFrac * (3 - 2 * segFrac) * 1.2  // faster, ease-in
        : segFrac * (2 - segFrac) * 0.85; // slower, ease-out

      const p = Math.floor(rawProgress) + Math.min(easedFrac, 0.999);
      setProgress(p);
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [totalSegments]);

  // Compute dot position from progress
  const segIndex = Math.floor(progress) % totalSegments;
  const segT = progress - Math.floor(progress);
  const seg = segments[segIndex];
  const dotX = seg.from.x + (seg.to.x - seg.from.x) * segT;
  const dotY = seg.from.y + (seg.to.y - seg.from.y) * segT;

  const outerPath = outerPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";
  const innerPath = innerNodes.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";

  return (
    <div
      className="flex flex-col items-center justify-center gap-6"
      style={{ opacity: fading ? 0 : 1, transition: "opacity 0.4s ease", minHeight: "260px" }}
    >
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        {/* Outer hexagon */}
        <path d={outerPath} fill="none" stroke="#1D9E75" strokeWidth="3" strokeOpacity="0.35" strokeLinejoin="round" />
        {/* Inner molecule bonds */}
        <path d={innerPath} fill="none" stroke="#1D9E75" strokeWidth="2" strokeOpacity="0.6" strokeLinejoin="round" />
        {/* Inner nodes */}
        {innerNodes.map((node, i) => (
          <circle key={i} cx={node.x} cy={node.y} r={NODE_R} fill="#1D9E75" fillOpacity="0.8" />
        ))}
        {/* Electron dot */}
        <circle cx={dotX} cy={dotY} r={DOT_R} fill="#EF9F27">
          <animate attributeName="r" values={`${DOT_R};${DOT_R + 2};${DOT_R}`} dur="0.6s" repeatCount="indefinite" />
        </circle>
        {/* Glow */}
        <circle cx={dotX} cy={dotY} r={DOT_R + 6} fill="#EF9F27" fillOpacity="0.15" />
        <circle cx={dotX} cy={dotY} r={DOT_R + 12} fill="#EF9F27" fillOpacity="0.07" />
      </svg>
      <p className="animate-pulse text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
