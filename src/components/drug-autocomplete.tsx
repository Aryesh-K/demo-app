"use client";
import { useEffect, useRef, useState } from "react";
import { getDrugSuggestions } from "~/lib/drug-suggestions";

interface DrugAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  mode: "free" | "premium" | "premium-learn";
  recentSearches?: string[];
  label?: string;
  subtitle?: string;
}

export function DrugAutocomplete({
  value,
  onChange,
  placeholder,
  mode,
  recentSearches = [],
  label,
  subtitle,
}: DrugAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSuggestions(getDrugSuggestions(value, mode, recentSearches));
  }, [value, mode]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={wrapperRef} className="relative w-full">
      {label && (
        <label className="mb-1 block text-sm font-medium text-white">
          {label}
        </label>
      )}
      {subtitle && <p className="mb-2 text-xs text-slate-400">{subtitle}</p>}
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-600 bg-slate-800/50 px-4 py-3 text-white placeholder-slate-400 focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-400"
      />
      {open && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 shadow-xl">
          {value.length === 0 && recentSearches.length > 0 && (
            <p className="px-3 pt-2 text-xs uppercase text-slate-500">
              Recent Searches
            </p>
          )}
          {value.length > 0 && (
            <p className="px-3 pt-2 text-xs uppercase text-slate-500">
              Suggestions
            </p>
          )}
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              onMouseDown={() => {
                onChange(s);
                setOpen(false);
              }}
              className="w-full px-4 py-2 text-left text-sm text-white hover:bg-slate-700 first:rounded-t-lg last:rounded-b-lg"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
