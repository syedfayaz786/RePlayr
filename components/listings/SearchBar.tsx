"use client";

import { Search, SlidersHorizontal, MapPin, X, ChevronDown, Check } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useCallback, useRef, useEffect } from "react";
import { PLATFORMS, CONDITIONS } from "@/lib/utils";
import { PLATFORM_CONFIG } from "@/components/ui/Badges";

// ── Platform multi-select dropdown ───────────────────────────────────────────

function PlatformMultiSelect({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (p: string) => {
    onChange(selected.includes(p) ? selected.filter((x) => x !== p) : [...selected, p]);
  };

  const label =
    selected.length === 0
      ? "All Platforms"
      : selected.length === 1
      ? selected[0]
      : `${selected.length} platforms`;

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`input-base flex items-center justify-between gap-2 text-left transition-all ${
          open ? "ring-2 ring-brand-500/60 border-brand-500/60" : ""
        }`}
      >
        <span className={selected.length === 0 ? "text-slate-500" : "text-white"}>
          {label}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute z-50 top-full mt-2 left-0 right-0 rounded-xl overflow-hidden shadow-2xl animate-slide-up"
          style={{
            background: "rgba(11,13,31,0.98)",
            border: "1px solid rgba(6,182,212,0.2)",
            backdropFilter: "blur(16px)",
            minWidth: "220px",
          }}
        >
          {/* All platforms option */}
          <button
            type="button"
            onClick={() => onChange([])}
            className="w-full flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-dark-600/60 transition-colors text-sm"
          >
            <span className={selected.length === 0 ? "text-brand-300 font-semibold" : "text-slate-300"}>
              All Platforms
            </span>
            {selected.length === 0 && <Check className="w-3.5 h-3.5 text-brand-400" />}
          </button>

          <div className="h-px bg-dark-500/60 mx-3" />

          {/* Individual platforms */}
          {PLATFORMS.map((p) => {
            const config = PLATFORM_CONFIG[p] ?? PLATFORM_CONFIG["Other"];
            const Logo = config.Logo;
            const checked = selected.includes(p);
            return (
              <button
                key={p}
                type="button"
                onClick={() => toggle(p)}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-dark-600/60 transition-colors text-sm group"
              >
                {/* Checkbox */}
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all ${
                    checked
                      ? "bg-brand-500 border-brand-500"
                      : "border border-dark-400 group-hover:border-brand-500/50"
                  }`}
                >
                  {checked && <Check className="w-2.5 h-2.5 text-white" />}
                </div>
                {/* Logo */}
                <span className={`flex-shrink-0 ${config.colorClass.split(" ")[1]}`}>
                  <Logo className="w-3.5 h-3.5" />
                </span>
                {/* Label */}
                <span className={checked ? "text-white font-medium" : "text-slate-300"}>
                  {p}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Selected chips shown below trigger */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selected.map((p) => {
            const config = PLATFORM_CONFIG[p] ?? PLATFORM_CONFIG["Other"];
            const Logo = config.Logo;
            return (
              <span
                key={p}
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${config.colorClass}`}
              >
                <Logo className="w-3 h-3" />
                {config.shortLabel}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); toggle(p); }}
                  className="ml-0.5 hover:opacity-70 transition-opacity"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main SearchBar ────────────────────────────────────────────────────────────

export function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  const [query,     setQuery]     = useState(searchParams.get("q") ?? "");
  // platforms is now an array
  const [platforms, setPlatforms] = useState<string[]>(
    searchParams.getAll("platform").flatMap((v) => v.split(",")).filter(Boolean)
  );
  const [condition, setCondition] = useState(searchParams.get("condition") ?? "");
  const [minPrice,  setMinPrice]  = useState(searchParams.get("minPrice") ?? "");
  const [maxPrice,  setMaxPrice]  = useState(searchParams.get("maxPrice") ?? "");
  const [radius,    setRadius]    = useState(searchParams.get("radius") ?? "50");

  const applyFilters = useCallback(() => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    // Send platforms as comma-separated value
    if (platforms.length > 0) params.set("platform", platforms.join(","));
    if (condition) params.set("condition", condition);
    if (minPrice)  params.set("minPrice",  minPrice);
    if (maxPrice)  params.set("maxPrice",  maxPrice);
    if (radius)    params.set("radius",    radius);
    router.push(`/?${params.toString()}`);
  }, [query, platforms, condition, minPrice, maxPrice, radius, router]);

  const clearFilters = () => {
    setQuery("");
    setPlatforms([]);
    setCondition("");
    setMinPrice("");
    setMaxPrice("");
    setRadius("50");
    router.push("/");
  };

  const hasFilters = query || platforms.length > 0 || condition || minPrice || maxPrice;

  return (
    <div className="w-full space-y-3">
      {/* Main search row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search games, consoles, editions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            className="input-base pl-11"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`btn-secondary flex items-center gap-2 whitespace-nowrap ${showFilters ? "border-brand-500 text-brand-400" : ""}`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">Filters</span>
          {hasFilters && <span className="w-2 h-2 bg-brand-400 rounded-full" />}
        </button>
        <button onClick={applyFilters} className="btn-primary whitespace-nowrap">
          Search
        </button>
      </div>

      {/* Expandable filters */}
      {showFilters && (
        <div className="card p-4 space-y-4 animate-slide-up">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-start">

            {/* Platform multi-select */}
            <div className="sm:col-span-2">
              <label className="label-base">Platform</label>
              <PlatformMultiSelect selected={platforms} onChange={setPlatforms} />
            </div>

            {/* Condition */}
            <div>
              <label className="label-base">Condition</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="input-base"
              >
                <option value="">Any Condition</option>
                {CONDITIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Price range */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label-base">Min ($)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="input-base"
                />
              </div>
              <div>
                <label className="label-base">Max ($)</label>
                <input
                  type="number"
                  placeholder="500"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="input-base"
                />
              </div>
            </div>
          </div>

          {/* Radius */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-gray-400">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">Within</span>
            </div>
            <input
              type="range" min="5" max="500" step="5"
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
              className="flex-1 accent-brand-500"
            />
            <span className="text-brand-400 font-semibold text-sm w-20 text-right">
              {radius} km
            </span>
          </div>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-rose-400 transition-colors"
            >
              <X className="w-3 h-3" />
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
