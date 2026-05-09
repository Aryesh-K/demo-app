"use client";
import { useEffect, useRef } from "react";

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const forceCursorNone = (el: Element) => {
      if (el instanceof HTMLElement) {
        el.style.setProperty("cursor", "none", "important");
      }
    };

    const applyToAll = () => {
      document.querySelectorAll("*").forEach(forceCursorNone);
    };

    applyToAll();

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            forceCursorNone(node);
            node.querySelectorAll("*").forEach(forceCursorNone);
          }
        });
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "style" &&
          mutation.target instanceof HTMLElement
        ) {
          const el = mutation.target;
          if (el !== cursorRef.current) {
            forceCursorNone(el);
          }
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style", "class"],
    });

    const interval = setInterval(applyToAll, 500);

    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    const onMove = (e: MouseEvent) => {
      if (e.target instanceof HTMLElement) {
        e.target.style.setProperty("cursor", "none", "important");
      }
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
