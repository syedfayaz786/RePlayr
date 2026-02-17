"use client";

import { Search, SlidersHorizontal, MapPin, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useCallback } from "react";
import { PLATFORMS, CONDITIONS } from "@/lib/utils";

export function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [platform, setPlatform] = useState(searchParams.get("platform") ?? "");
  const [condition, setCondition] = useState(searchParams.get("condition") ?? "");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") ?? "");
  const [radius, setRadius] = useState(searchParams.get("radius") ?? "50");

  const applyFilters = useCallback(() => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (platform) params.set("platform", platform);
    if (condition) params.set("condition", condition);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (radius) params.set("radius", radius);
    router.push(`/?${params.toString()}`);
  }, [query, platform, condition, minPrice, maxPrice, radius, router]);

  const clearFilters = () => {
    setQuery("");
    setPlatform("");
    setCondition("");
    setMinPrice("");
    setMaxPrice("");
    setRadius("50");
    router.push("/");
  };

  const hasFilters = query || platform || condition || minPrice || maxPrice;

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
          {hasFilters && (
            <span className="w-2 h-2 bg-brand-400 rounded-full" />
          )}
        </button>
        <button onClick={applyFilters} className="btn-primary whitespace-nowrap">
          Search
        </button>
      </div>

      {/* Expandable filters */}
      {showFilters && (
        <div className="card p-4 space-y-4 animate-slide-up">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Platform */}
            <div>
              <label className="label-base">Platform</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="input-base"
              >
                <option value="">All Platforms</option>
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
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
            <div>
              <label className="label-base">Min Price ($)</label>
              <input
                type="number"
                placeholder="0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="input-base"
              />
            </div>
            <div>
              <label className="label-base">Max Price ($)</label>
              <input
                type="number"
                placeholder="500"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="input-base"
              />
            </div>
          </div>

          {/* Radius */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-gray-400">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">Within</span>
            </div>
            <input
              type="range"
              min="5"
              max="500"
              step="5"
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
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-red-400 transition-colors"
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
