"use client";
import { useEffect, useRef } from "react";

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const style = document.createElement("style");
    style.id = "custom-cursor-style";
    style.innerHTML = `
      *, *::before, *::after,
      a, a:hover, a:active, a:focus,
      button, button:hover, button:active, button:focus,
      input, input:hover, input:active, input:focus,
      textarea, textarea:hover, textarea:active,
      select, select:hover, select:active,
      label, label:hover,
      [role="button"], [role="button"]:hover,
      [tabindex], [tabindex]:hover,
      [onclick], [onclick]:hover,
      summary, summary:hover,
      details, details:hover,
      nav, nav *,
      header, header *,
      [style*="position: fixed"], [style*="position:fixed"] {
        cursor: none !important;
      }
    `;
    document.head.appendChild(style);

    document.documentElement.style.setProperty("cursor", "none", "important");
    document.body.style.setProperty("cursor", "none", "important");

    return () => {
      const el = document.getElementById("custom-cursor-style");
      if (el) el.remove();
    };
  }, []);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    const onMove = (e: MouseEvent) => {
      cursor.style.left = e.clientX + "px";
      cursor.style.top = e.clientY + "px";
      cursor.style.opacity = "1";
    };

    const onOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const clickable = target.closest(
        'a, button, [role="button"], input, textarea, select, label, [tabindex], [onclick]',
      );
      if (clickable) {
        cursor.style.width = "32px";
        cursor.style.height = "32px";
        cursor.style.borderColor = "rgba(239,159,39,0.9)";
      } else {
        cursor.style.width = "20px";
        cursor.style.height = "20px";
        cursor.style.borderColor = "rgba(255,255,255,0.7)";
      }
    };

    const onDown = () => {
      cursor.style.transform = "translate(-50%, -50%) scale(0.75)";
    };

    const onUp = () => {
      cursor.style.transform = "translate(-50%, -50%) scale(1)";
    };

    const onLeave = () => {
      cursor.style.opacity = "0";
    };

    const onEnter = () => {
      cursor.style.opacity = "1";
    };

    document.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseover", onOver, { passive: true });
    document.addEventListener("mousedown", onDown, { passive: true });
    document.addEventListener("mouseup", onUp, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);

    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("mouseup", onUp);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
    };
  }, []);

  return (
    <div
      ref={cursorRef}
      style={{
        position: "fixed",
        left: "-100px",
        top: "-100px",
        width: "20px",
        height: "20px",
        borderRadius: "50%",
        border: "1.5px solid rgba(255,255,255,0.7)",
        transform: "translate(-50%, -50%) scale(1)",
        pointerEvents: "none",
        zIndex: 2147483647,
        opacity: 0,
        transition:
          "width 0.15s ease, height 0.15s ease, border-color 0.15s ease, transform 0.1s ease, opacity 0.2s ease",
        willChange: "transform, left, top",
        mixBlendMode: "difference",
      }}
    />
  );
}
