"use client";
import { useEffect, useState } from "react";

export function CustomCursor() {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = "* { cursor: none !important; }";
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      setIsVisible(true);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isClickable = target.closest(
        'a, button, [role="button"], input, textarea, select, label',
      );
      setIsHovering(!!isClickable);
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);
    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    document.addEventListener("mousemove", moveCursor);
    document.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);

    return () => {
      document.removeEventListener("mousemove", moveCursor);
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        left: position.x,
        top: position.y,
        width: isHovering ? "32px" : "20px",
        height: isHovering ? "32px" : "20px",
        borderRadius: "50%",
        border: isHovering
          ? "1.5px solid rgba(239,159,39,0.9)"
          : "1.5px solid rgba(255,255,255,0.7)",
        transform: `translate(-50%, -50%) scale(${isClicking ? 0.8 : 1})`,
        pointerEvents: "none",
        zIndex: 99999,
        opacity: isVisible ? 1 : 0,
        transition:
          "width 0.2s ease, height 0.2s ease, border-color 0.2s ease, transform 0.1s ease, opacity 0.2s ease",
        mixBlendMode: "difference",
      }}
    />
  );
}
