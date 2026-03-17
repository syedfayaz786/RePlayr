"use client";

import { Search, SlidersHorizontal, MapPin, X, ChevronDown, Check, ArrowUpDown, Star } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { PLATFORMS, CONDITIONS } from "@/lib/utils";
import { PLATFORM_CONFIG } from "@/components/ui/Badges";

// ── Platform multi-select dropdown (portal-based to escape overflow:hidden) ──

function PlatformMultiSelect({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Position the portal dropdown under the trigger
  const updatePos = useCallback(() => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    setDropdownPos({
      top:   r.bottom + window.scrollY + 6,
      left:  r.left   + window.scrollX,
      width: r.width,
    });
  }, []);

  const handleOpen = () => {
    updatePos();
    setOpen((o) => !o);
  };

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      const target = e.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Reposition on scroll/resize
  useEffect(() => {
    if (!open) return;
    window.addEventListener("scroll", updatePos, true);
    window.addEventListener("resize", updatePos);
    return () => {
      window.removeEventListener("scroll", updatePos, true);
      window.removeEventListener("resize", updatePos);
    };
  }, [open, updatePos]);

  const toggle = (p: string) =>
    onChange(selected.includes(p) ? selected.filter((x) => x !== p) : [...selected, p]);

  const label =
    selected.length === 0
      ? "All Platforms"
      : selected.length === 1
      ? selected[0]
      : `${selected.length} platforms`;

  const dropdown = (
    <div
      ref={dropdownRef}
      style={{
        position: "absolute",
        top:      dropdownPos.top,
        left:     dropdownPos.left,
        width:    dropdownPos.width,
        zIndex:   9999,
        background: "rgba(11,13,31,0.99)",
        border: "1px solid rgba(6,182,212,0.25)",
        borderRadius: "12px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
        backdropFilter: "blur(20px)",
        overflow: "hidden",
      }}
    >
      {/* All platforms */}
      <button
        type="button"
        onClick={() => { onChange([]); setOpen(false); }}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-sm"
      >
        <span className={selected.length === 0 ? "text-brand-300 font-semibold" : "text-slate-300"}>
          All Platforms
        </span>
        {selected.length === 0 && <Check className="w-3.5 h-3.5 text-brand-400" />}
      </button>

      <div className="h-px mx-3" style={{ background: "rgba(255,255,255,0.06)" }} />

      {/* Scrollable platform list */}
      <div className="overflow-y-auto" style={{ maxHeight: "280px" }}>
        {PLATFORMS.map((p) => {
          const config  = PLATFORM_CONFIG[p] ?? PLATFORM_CONFIG["Other"];
          const Logo    = config.Logo;
          const checked = selected.includes(p);
          // Extract just the text color class
          const textColor = config.colorClass.split(" ").find((cls) => cls.startsWith("text-")) ?? "text-slate-300";

          return (
            <button
              key={p}
              type="button"
              onClick={() => toggle(p)}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-sm"
            >
              {/* Checkbox */}
              <div
                className="w-4 h-4 rounded flex-shrink-0 flex items-center justify-center transition-all"
                style={{
                  border: checked ? "none" : "1px solid rgba(255,255,255,0.2)",
                  background: checked ? "#06b6d4" : "transparent",
                }}
              >
                {checked && <Check className="w-2.5 h-2.5 text-white" />}
              </div>

              {/* Platform logo */}
              <span className={`flex-shrink-0 ${textColor}`}>
                <Logo className="w-4 h-4" />
              </span>

              {/* Label */}
              <span className={checked ? "text-white font-medium" : "text-slate-300"}>
                {p}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="relative">
      {/* Trigger button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        className={`input-base w-full flex items-center justify-between gap-2 text-left transition-all ${
          open ? "ring-2 ring-brand-500/60 border-brand-500/60" : ""
        }`}
      >
        <span className={selected.length === 0 ? "text-slate-500" : "text-white truncate"}>
          {label}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Portal dropdown — escapes overflow:hidden on parent cards */}
      {open && typeof document !== "undefined" && createPortal(dropdown, document.body)}

      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selected.map((p) => {
            const config = PLATFORM_CONFIG[p] ?? PLATFORM_CONFIG["Other"];
            const Logo   = config.Logo;
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
                  className="ml-0.5 hover:opacity-70 transition-opacity leading-none"
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
  const router       = useRouter();
  const searchParams = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  const [query,     setQuery]     = useState(searchParams.get("q") ?? "");
  const [platforms, setPlatforms] = useState<string[]>(
    searchParams.getAll("platform").flatMap((v) => v.split(",")).filter(Boolean)
  );
  const [condition, setCondition] = useState(searchParams.get("condition") ?? "");
  const [minPrice,  setMinPrice]  = useState(searchParams.get("minPrice") ?? "");
  const [maxPrice,  setMaxPrice]  = useState(searchParams.get("maxPrice") ?? "");
  const [radius,    setRadius]    = useState(searchParams.get("radius") ?? "10000");
  const [sort,      setSort]      = useState(searchParams.get("sort") ?? "newest");
  const [minRating, setMinRating] = useState(searchParams.get("minRating") ?? "");

  const applyFilters = useCallback(() => {
    const params = new URLSearchParams();
    if (query)            params.set("q",        query);
    if (platforms.length) params.set("platform", platforms.join(","));
    if (condition)        params.set("condition", condition);
    if (minPrice)         params.set("minPrice",  minPrice);
    if (maxPrice)         params.set("maxPrice",  maxPrice);
    if (radius && parseInt(radius) > 0 && parseInt(radius) < 10000) params.set("radius", radius);
    if (sort && sort !== "newest") params.set("sort", sort);
    if (minRating) params.set("minRating", minRating);
    router.push(`/?${params.toString()}`);
  }, [query, platforms, condition, minPrice, maxPrice, radius, sort, minRating, router]);

  // Auto-apply when platform selection changes — no need to hit Search
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    applyFilters();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platforms]);

  const clearFilters = () => {
    setQuery(""); setPlatforms([]); setCondition("");
    setMinPrice(""); setMaxPrice(""); setRadius("10000"); setSort("newest"); setMinRating("");
    router.push("/");
  };

  const hasFilters = query || platforms.length > 0 || condition || minPrice || maxPrice || minRating;

  return (
    <div className="w-full space-y-3">
      {/* Search row */}
      <div className="flex flex-col sm:flex-row gap-2">
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
        <div className="card p-4 space-y-4 animate-slide-up" style={{ overflow: "visible" }}>
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
                <input type="number" placeholder="0" value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)} className="input-base" />
              </div>
              <div>
                <label className="label-base">Max ($)</label>
                <input type="number" placeholder="10000" value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)} className="input-base" />
              </div>
            </div>
          </div>

          {/* Radius */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-gray-400">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">Within</span>
            </div>
            <input type="range" min="5" max="10000" step="50" value={radius || "10000"}
              onChange={(e) => setRadius(e.target.value)}
              className="flex-1 accent-brand-500" />
            <span className="text-brand-400 font-semibold text-sm w-20 text-right">{(!radius || parseInt(radius) >= 10000) ? "Any" : `${radius} km`}</span>
          </div>

          {/* Seller Rating */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-gray-400">
              <Star className="w-4 h-4" />
              <span className="text-sm">Seller Rating</span>
            </div>
            <div className="flex items-center gap-2">
              {[
                { val: "", label: "Any" },
                { val: "2",   label: "2" },
                { val: "3",   label: "3" },
                { val: "4",   label: "4" },
                { val: "4.5", label: "4.5" },
              ].map(({ val, label }) => (
                <button
                  key={val}
                  onClick={() => setMinRating(val)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    minRating === val
                      ? "bg-brand-500 border-brand-500 text-white"
                      : "bg-dark-700 border-dark-600 text-gray-400 hover:border-brand-500/50 hover:text-white"
                  }`}
                >
                  {val === "" ? "Any" : (
                    <>
                      <span className="text-amber-400">{label}</span>
                      <svg className="w-3 h-3 text-amber-400 fill-amber-400" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                      <span>+</span>
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>

          {hasFilters && (
            <button onClick={clearFilters}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-rose-400 transition-colors">
              <X className="w-3 h-3" />
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
