"use client";
import { useEffect, useRef } from "react";

export function BackgroundAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let waveX = -300;
    let hexOpacity = 1;

    // ── Constants ────────────────────────────────────────────────────────────────
    const HEX_R = 14;
    const HEX_W = Math.sqrt(3) * HEX_R;   // pointy-top: width = √3·r
    const ROW_SPACING = HEX_R * 1.5;       // vertical center-to-center
    const HEX_WAVE_WIDTH = 200;
    const PARTICLE_COUNT = 80;
    const CONNECTION_DISTANCE = 120;
    const WAVE_WIDTH = 450;
    const WAVE_SPEED = 6;

    // ── Hex grid ─────────────────────────────────────────────────────────────────
    interface Hex { x: number; y: number; brightness: number }
    let hexes: Hex[] = [];

    function buildHexGrid() {
      hexes = [];
      const cols = Math.ceil(canvas.width / HEX_W) + 3;
      const rows = Math.ceil(canvas.height / ROW_SPACING) + 3;
      for (let row = -1; row < rows; row++) {
        for (let col = -1; col < cols; col++) {
          hexes.push({
            x: col * HEX_W + (row % 2 === 1 ? HEX_W / 2 : 0),
            y: row * ROW_SPACING,
            brightness: 0,
          });
        }
      }
    }

    function drawHex(x: number, y: number, r: number) {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        const px = x + r * Math.cos(angle);
        const py = y + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
    }

    // ── Particles ────────────────────────────────────────────────────────────────
    interface Particle {
      x: number; y: number; vx: number; vy: number;
      radius: number; brightness: number; targetBrightness: number;
    }

    const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 2 + 1,
      brightness: 0.3,
      targetBrightness: 0.3,
    }));

    // ── Resize ───────────────────────────────────────────────────────────────────
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      buildHexGrid();
    };
    resize();
    window.addEventListener("resize", resize);

    // ── Scroll fade ───────────────────────────────────────────────────────────────
    const handleScroll = () => {
      const heroHeight = window.innerHeight;
      const scrolled = window.scrollY;
      const fadeStart = heroHeight * 0.3;
      const fadeEnd = heroHeight * 0.65;
      if (scrolled < fadeStart) {
        hexOpacity = 1;
      } else if (scrolled > fadeEnd) {
        hexOpacity = 0;
      } else {
        hexOpacity = 1 - (scrolled - fadeStart) / (fadeEnd - fadeStart);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    // ── Draw loop ─────────────────────────────────────────────────────────────────
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      waveX += WAVE_SPEED;
      if (waveX > canvas.width + WAVE_WIDTH) waveX = -WAVE_WIDTH;

      // ── Layer 1: hex grid with flip wave (fades on scroll) ──
      if (hexOpacity > 0) {
        ctx.save();
        ctx.globalAlpha = hexOpacity;
        ctx.lineWidth = 1;
        hexes.forEach((hex) => {
          const dist = Math.abs(hex.x - waveX);
          hex.brightness =
            dist < HEX_WAVE_WIDTH
              ? Math.cos((dist / HEX_WAVE_WIDTH) * Math.PI * 0.5)
              : 0;
          drawHex(hex.x, hex.y, HEX_R);
          ctx.strokeStyle = `rgba(29, 158, 117, ${0.025 + hex.brightness * 0.1})`;
          ctx.stroke();
        });

        // wave gradient overlay
        const waveGradient = ctx.createLinearGradient(
          waveX - WAVE_WIDTH, 0,
          waveX + WAVE_WIDTH, 0,
        );
        waveGradient.addColorStop(0, "rgba(29, 158, 117, 0)");
        waveGradient.addColorStop(0.25, "rgba(29, 158, 117, 0.03)");
        waveGradient.addColorStop(0.45, "rgba(29, 158, 117, 0.07)");
        waveGradient.addColorStop(0.5, "rgba(29, 158, 117, 0.09)");
        waveGradient.addColorStop(0.55, "rgba(29, 158, 117, 0.07)");
        waveGradient.addColorStop(0.75, "rgba(29, 158, 117, 0.03)");
        waveGradient.addColorStop(1, "rgba(29, 158, 117, 0)");
        ctx.fillStyle = waveGradient;
        ctx.fillRect(waveX - WAVE_WIDTH, 0, WAVE_WIDTH * 2, canvas.height);

        ctx.restore();
      }

      // ── Layer 2: particles — update brightness & position ──
      particles.forEach((p) => {
        const dist = Math.abs(p.x - waveX);
        p.targetBrightness =
          dist < WAVE_WIDTH / 2
            ? 0.2 + (1 - dist / (WAVE_WIDTH / 2)) * 0.6
            : 0.3;
        p.brightness += (p.targetBrightness - p.brightness) * 0.05;

        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
      });

      // connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECTION_DISTANCE) {
            const opacity =
              (1 - dist / CONNECTION_DISTANCE) *
              ((particles[i].brightness + particles[j].brightness) / 2) *
              0.4;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(29, 158, 117, ${opacity})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      // dots + glow
      particles.forEach((p, idx) => {
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 4);
        glow.addColorStop(0, `rgba(29, 158, 117, ${p.brightness * 0.4})`);
        glow.addColorStop(1, "rgba(29, 158, 117, 0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(29, 158, 117, ${p.brightness * 0.9})`;
        ctx.fill();

        if (idx % 12 === 0) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 0.8, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(239, 159, 39, ${p.brightness * 0.7})`;
          ctx.fill();
        }
      });

      // ── Layer 3: DNA helixes (always visible, not affected by scroll) ──
      const time = Date.now() * 0.001;
      const helixHeight = canvas.height;
      const helixX_left = 38;
      const helixX_right = canvas.width - 38;
      const amplitude = 24;
      const frequency = 0.055;
      const speed = 0.5;

      for (let y = 0; y < helixHeight; y += 4) {
        const offset = Math.sin(y * frequency + time * speed) * amplitude;
        const offset2 = Math.sin(y * frequency + time * speed + Math.PI) * amplitude;
        const bright = 0.28 + Math.abs(Math.sin(y * frequency + time * speed)) * 0.35;

        ctx.beginPath();
        ctx.arc(helixX_left + offset, y, 2.0, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(29, 158, 117, ${bright})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(helixX_left + offset2, y, 2.0, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(29, 158, 117, ${bright * 0.7})`;
        ctx.fill();

        if (y % 22 === 0) {
          ctx.beginPath();
          ctx.moveTo(helixX_left + offset, y);
          ctx.lineTo(helixX_left + offset2, y);
          ctx.strokeStyle = "rgba(29, 158, 117, 0.2)";
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      }

      for (let y = 0; y < helixHeight; y += 4) {
        const offset = Math.sin(y * frequency + time * speed) * amplitude;
        const offset2 = Math.sin(y * frequency + time * speed + Math.PI) * amplitude;
        const bright = 0.28 + Math.abs(Math.sin(y * frequency + time * speed)) * 0.35;

        ctx.beginPath();
        ctx.arc(helixX_right + offset, y, 2.0, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(29, 158, 117, ${bright})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(helixX_right + offset2, y, 2.0, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(29, 158, 117, ${bright * 0.7})`;
        ctx.fill();

        if (y % 22 === 0) {
          ctx.beginPath();
          ctx.moveTo(helixX_right + offset, y);
          ctx.lineTo(helixX_right + offset2, y);
          ctx.strokeStyle = "rgba(29, 158, 117, 0.2)";
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
        opacity: 0.85,
      }}
    />
  );
}
