"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
}

const PARTICLE_COUNT = 18;
const CONNECTION_DIST = 130;

export function HeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const context = el.getContext("2d");
    if (!context) return;

    // Explicitly-typed non-null refs safe to use inside closures
    const cv: HTMLCanvasElement = el;
    const ctx: CanvasRenderingContext2D = context;

    let raf = 0;
    let t = 0;
    let particles: Particle[] = [];

    function init() {
      particles = Array.from({ length: PARTICLE_COUNT }, () => ({
        x: Math.random() * cv.width,
        y: Math.random() * cv.height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        r: Math.random() * 1.5 + 2,
      }));
    }

    function resize() {
      cv.width = cv.offsetWidth;
      cv.height = cv.offsetHeight;
      init();
    }

    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(cv);

    function drawHelix(centerX: number, color: string, speed: number) {
      const h = cv.height;
      const amp = 18;
      const steps = 60;
      const freq = 0.055 * Math.PI * 2;

      ctx.lineWidth = 1.5;
      ctx.strokeStyle = color;

      // strand A
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const y = (i / steps) * h;
        const x = centerX + Math.sin(y * freq + t * speed) * amp;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();

      // strand B — offset by π so strands cross
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const y = (i / steps) * h;
        const x = centerX + Math.sin(y * freq + t * speed + Math.PI) * amp;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();

      // rungs every 5 steps
      ctx.lineWidth = 1;
      ctx.strokeStyle = color.replace(/[\d.]+\)$/, "0.07)");
      for (let i = 0; i <= steps; i += 5) {
        const y = (i / steps) * h;
        const x1 = centerX + Math.sin(y * freq + t * speed) * amp;
        const x2 = centerX + Math.sin(y * freq + t * speed + Math.PI) * amp;
        ctx.beginPath();
        ctx.moveTo(x1, y);
        ctx.lineTo(x2, y);
        ctx.stroke();
      }
    }

    function draw() {
      const { width, height } = cv;
      ctx.clearRect(0, 0, width, height);
      t++;

      // subtle helices on the left and right edges
      drawHelix(44, "rgba(59,130,246,0.14)", 0.012);
      drawHelix(width - 44, "rgba(34,197,94,0.14)", 0.009);

      // move particles, bounce off walls
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
      }

      // draw edges between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECTION_DIST) {
            const alpha = ((1 - dist / CONNECTION_DIST) * 0.2).toFixed(3);
            ctx.strokeStyle = `rgba(59,130,246,${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // draw nodes — every 3rd one is green for variety
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        ctx.fillStyle =
          i % 3 === 0 ? "rgba(34,197,94,0.2)" : "rgba(59,130,246,0.22)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />;
}
