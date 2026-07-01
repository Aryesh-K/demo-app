"use client";
import { useEffect, useRef, useState } from "react";

interface ToxiLoaderProps {
  fading?: boolean;
  label?: string;
}

export function ToxiLoader({ fading = false, label = "Analyzing…" }: ToxiLoaderProps) {
  const SIZE = 220;
  const CENTER_X = SIZE / 2;
  const CENTER_Y = SIZE / 2;
  const RING_R = 70; // radius of benzene ring
  const ELECTRON_ORBIT_R = 78; // slightly outside ring
  const NODE_COUNT = 6;
  const REVOLUTION_MS = 2200;
  const ROTATION_MS = 6000; // full 3D rotation period

  const animRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    startTimeRef.current = null;
    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      setFrame(timestamp - startTimeRef.current);
      animRef.current = requestAnimationFrame(animate);
  };
    animRef.current = requestAnimationFrame(animate);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []);

  // 3D rotation angle (Y axis rotation — like spinning a coin)
  const rotY = (frame / ROTATION_MS) * Math.PI * 2;
  // Slight tilt on X axis for depth
  const rotX = Math.PI * 0.18;

  // Project 3D point to 2D with perspective
  function project(x3: number, y3: number, z3: number): { x: number; y: number; opacity: number; scale: number } {
    // Rotate around Y axis
    const x1 = x3 * Math.cos(rotY) - z3 * Math.sin(rotY);
    const z1 = x3 * Math.sin(rotY) + z3 * Math.cos(rotY);
    // Rotate around X axis (tilt)
    const y2 = y3 * Math.cos(rotX) - z1 * Math.sin(rotX);
    const z2 = y3 * Math.sin(rotX) + z1 * Math.cos(rotX);
    // Perspective projection
    const fov = 320;
    const scale = fov / (fov + z2);
    return {
      x: CENTER_X + x1 * scale,
      y: CENTER_Y + y2 * scale,
      opacity: Math.max(0.15, Math.min(1, (z2 + RING_R * 1.5) / (RING_R * 3))),
      scale,
    };
  }

  // Benzene ring nodes (flat, in XZ plane so Y rotation spins them)
  const nodes = Array.from({ length: NODE_COUNT }, (_, i) => {
    const angle = (Math.PI * 2 * i) / NODE_COUNT - Math.PI / 2;
    return {
      x3: RING_R * Math.cos(angle),
      y3: 0,
      z3: RING_R * Math.sin(angle),
    };
  });

  // Inner ring (double bond representation, smaller)
  const innerNodes = Array.from({ length: NODE_COUNT }, (_, i) => {
    const angle = (Math.PI * 2 * i) / NODE_COUNT - Math.PI / 2;
    const r = RING_R * 0.6;
    return {
      x3: r * Math.cos(angle),
      y3: 0,
      z3: r * Math.sin(angle),
    };
  });

  // Project all nodes
  const projNodes = nodes.map(n => project(n.x3, n.y3, n.z3));
  const projInner = innerNodes.map(n => project(n.x3, n.y3, n.z3));

  // Sort bonds by depth for correct occlusion (painter's algorithm)
  const bonds = nodes.map((_, i) => {
    const next = (i + 1) % NODE_COUNT;
    const midZ = ((nodes[i].z3 + nodes[next].z3) / 2) * Math.cos(rotY);
    return { i, next, midZ };
  }).sort((a, b) => a.midZ - b.midZ);

  // Electron position — orbits slightly outside the ring, with gravity easing
  const electronAngle = (frame / REVOLUTION_MS) * Math.PI * 2 - Math.PI / 2;
  // Gravity: faster at bottom (positive Y after projection), slower at top
  const rawAngle = (frame / REVOLUTION_MS) * Math.PI * 2;
  const gravityEase = rawAngle + 0.25 * Math.sin(rawAngle * 2);
  const eAngle = gravityEase - Math.PI / 2;
  const eX3 = ELECTRON_ORBIT_R * Math.cos(eAngle);
  const eZ3 = ELECTRON_ORBIT_R * Math.sin(eAngle);
  const eProj = project(eX3, 0, eZ3);

  // Trail points (3 ghost dots behind electron)
  const trailPoints = [0.08, 0.16, 0.25].map(offset => {
    const tAngle = gravityEase - offset * Math.PI * 2 - Math.PI / 2;
    const tX3 = ELECTRON_ORBIT_R * Math.cos(tAngle);
    const tZ3 = ELECTRON_ORBIT_R * Math.sin(tAngle);
    return { proj: project(tX3, 0, tZ3), offset };
  });

  // Hydrogen atoms sticking up/down from each node (verticabonds)
  const hBonds = nodes.map((n, i) => {
    const top = project(n.x3, -RING_R * 0.55, n.z3);
    const base = projNodes[i];
    return { top, base };
  });

  return (
    <div
      className="flex flex-col items-center justify-center gap-4"
      style={{ opacity: fading ? 0 : 1, transition: "opacity 0.4s ease", minHeight: "280px" }}
    >
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ overflow: "visible" }}>
        <defs>
          <radialGradient id="electronGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#EF9F27" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#EF9F27" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Hydrogen bonds (back) */}
        {hBonds.map((h, i) => (
          h.base.opacity < 0.5 ? (
            <line
              key={`hb-back-${i}`}
              x1={h.base.x} y1={h.base.y}
              x2={h.top.x} y2={h.top.y}
              stroke="#1D9E75"
              strokeWidth={1.2}
              strokeOpacity={h.base.opacity * 0.4}
            />
          ) : null
        ))}

        {/* Inner ring bonds (back half) */}
        {bonds.slice(0, 3).map(({ i, next }) => {
          const p1 = projInner[i];
          const p2 = projInner[next];
          const avgOp = (p1.opacity + p2.opacity) / 2;
          return (
            <line key={`inner-back-${i}`}
              x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
              stroke="#1D9E75" strokeWidth={1.2}
              strokeOpacity={avgOp * 0.35}
              strokeDasharray="3 3"
            />
          );
        })}

        {/* Outer ring bonds (back half) */}
        {bonds.slice(0, 3).map(({ i, next, midZ }) => {
          const p1 = projNodes[i];
          const p2 = projNodes[next];
          const avgOp = (p1.opacity + p2.opacity) / 2;
          return (
            <line key={`bond-back-${i}`}
              x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
              stroke="#1D9E75" strokeWidth={2}
              strokeOpacity={avgOp * 0.4}
            />
          );
        })}

        {/* Electron trail */}
        {trailPoints.map(({ proj, offset }, ti) => (
          <circle
            key={`trail-${ti}`}
            cx={proj.x} cy={proj.y}
            r={7 * (1 - offset * 2.5) * proj.scale}
            fill="#EF9F27"
            fillOpacity={proj.opacity * (0.15 - offset * 0.08)}
          />
        ))}

        {/* Electron glow */}
        <circle
          cx={eProj.x} cy={eProj.y}
          r={22 * eProj.scale}
          fill="url(#electronGlow)"
          fillOpacity={eProj.opacity * 0.7}
        />

        {/* Electron */}
        <circle
          cx={eProj.x} cy={eProj.y}
          r={9 * eProj.scale}
          fill="#EF9F27"
          fillOpacity={eProj.opacity}
        />

        {/* Outer ring bonds (front half) */}
        {bonds.slice(3).map(({ i, next }) => {
          const p1 = projNodes[i];
          const p2 = projNodes[next];
          const avgOp = (p1.opacity + p2.opacity) / 2;
          return (
            <line key={`bond-front-${i}`}
              x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
              stroke="#1D9E75" strokeWidth={2.5}
              strokeOpacity={Math.min(1, avgOp * 1.2)}
            />
          );
        })}

        {/* Inner ring bonds (front half) */}
        {bonds.slice(3).map(({ i, next }) => {
          const p1 = projInner[i];
          const p2 = projInner[next];
          const avgOp = (p1.opacity + p2.opacity) / 2;
          return (
            <line key={`inner-front-${i}`}
              x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
              stroke="#1D9E75" strokeWidth={1.2}
              strokeOpacity={avgOp * 0.5}
              strokeDasharray="3 3"
            />
          );
        })}

        {/* Hydrogen bonds (front) */}
        {hBonds.map((h, i) => (
          h.base.opacity >= 0.5 ? (
            <line
              key={`hb-front-${i}`}
              x1={h.base.x} y1={h.base.y}
              x2={h.top.x} y2={h.top.y}
              stroke="#1D9E75"
              strokeWidth={1.5}
              strokeOpacity={h.base.opacity * 0.5}
            />
          ) : null
        ))}

        {/* Nodes (carbon atoms) */}
        {projNodes.map((p, i) => (
          <circle key={`node-${i}`}
            cx={p.x} cy={p.y}
            r={5.5 * p.scale}
            fill="#1D9E75"
            fillOpacity={p.opacity}
          />
        ))}
      </svg>

      <p className="animate-pulse text-sm text-muted-foreground tracking-wide">{label}</p>
    </div>
  );
}
