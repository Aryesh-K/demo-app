"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "~/lib/utils";

const dropdowns = [
  {
    label: "Check Mode",
    basePath: "/check-mode",
    items: [
      { href: "/check-mode/free", label: "Free" },
      { href: "/check-mode/premium", label: "Premium (Log In)" },
    ],
  },
  {
    label: "Learn Mode",
    basePath: "/learn-mode",
    items: [
      { href: "/learn-mode/free", label: "Free" },
      { href: "/learn-mode/premium", label: "Premium (Log In)" },
    ],
  },
];

function NavDropdown({
  label,
  items,
  isActive,
}: {
  label: string;
  items: { href: string; label: string }[];
  isActive: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-1 text-sm transition-colors hover:text-foreground",
          isActive ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {label}
        <span
          className={cn(
            "text-xs transition-transform duration-150",
            open ? "rotate-180" : "rotate-0",
          )}
        >
          ▾
        </span>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 min-w-44 overflow-hidden rounded-md border bg-background shadow-md">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-border bg-background">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-6 px-4">
        <Link href="/" className="font-semibold tracking-tight">
          Lumos App
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className={cn(
              "text-sm transition-colors hover:text-foreground",
              pathname === "/" ? "text-foreground" : "text-muted-foreground",
            )}
          >
            Home
          </Link>
          {dropdowns.map((d) => (
            <NavDropdown
              key={d.label}
              label={d.label}
              items={d.items}
              isActive={pathname.startsWith(d.basePath)}
            />
          ))}
        </div>
      </div>
    </nav>
  );
}
