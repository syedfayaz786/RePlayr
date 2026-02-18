"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, Loader2, LocateFixed, X } from "lucide-react";

export interface LocationResult {
  display: string;       // shown in input + stored in DB
  city?: string;
  postalCode?: string;
  neighbourhood?: string;
  lat?: number;
  lng?: number;
}

interface LocationInputProps {
  value: string;
  onChange: (val: string, result?: LocationResult) => void;
  required?: boolean;
  className?: string;
}

// ── Nominatim (OpenStreetMap) geocoding — free, no key needed ────────────────
async function searchLocations(query: string): Promise<LocationResult[]> {
  if (query.length < 2) return [];
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      query
    )}&format=json&addressdetails=1&limit=6&countrycodes=ca,us`;
    const res = await fetch(url, {
      headers: { "Accept-Language": "en", "User-Agent": "RePlayr/1.0" },
    });
    const data: any[] = await res.json();
    return data.map((item) => {
      const addr = item.address ?? {};
      const city =
        addr.city || addr.town || addr.village || addr.municipality || addr.county || "";
      const neighbourhood = addr.neighbourhood || addr.suburb || "";
      const postalCode = addr.postcode || "";
      const province = addr.state || addr.province || "";
      const country = addr.country_code?.toUpperCase() || "";

      // Build a clean display string
      const parts: string[] = [];
      if (neighbourhood) parts.push(neighbourhood);
      if (city) parts.push(city);
      if (province) parts.push(province);
      if (postalCode) parts.push(postalCode);

      const display = parts.length > 0 ? parts.join(", ") : item.display_name.split(",").slice(0, 3).join(",").trim();

      return {
        display,
        city,
        postalCode,
        neighbourhood,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
      };
    });
  } catch {
    return [];
  }
}

async function reverseGeocode(lat: number, lng: number): Promise<LocationResult | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
    const res = await fetch(url, {
      headers: { "Accept-Language": "en", "User-Agent": "RePlayr/1.0" },
    });
    const item = await res.json();
    const addr = item.address ?? {};
    const city = addr.city || addr.town || addr.village || addr.municipality || "";
    const postalCode = addr.postcode || "";
    const neighbourhood = addr.neighbourhood || addr.suburb || "";
    const province = addr.state || addr.province || "";

    const parts: string[] = [];
    if (neighbourhood) parts.push(neighbourhood);
    if (city) parts.push(city);
    if (province) parts.push(province);
    if (postalCode) parts.push(postalCode);

    return {
      display: parts.join(", "),
      city,
      postalCode,
      neighbourhood,
      lat,
      lng,
    };
  } catch {
    return null;
  }
}

export function LocationInput({ value, onChange, required, className }: LocationInputProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<LocationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-detect location on mount if field is empty
  useEffect(() => {
    if (!value && "geolocation" in navigator) {
      detectLocation();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const detectLocation = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setGeoError("Geolocation not supported by your browser");
      return;
    }
    setGeoLoading(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const result = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        setGeoLoading(false);
        if (result) {
          setQuery(result.display);
          onChange(result.display, result);
        }
      },
      (err) => {
        setGeoLoading(false);
        if (err.code === 1) {
          setGeoError("Location access denied. Please type your city or postal code.");
        } else {
          setGeoError("Could not detect location. Please enter it manually.");
        }
      },
      { timeout: 8000, maximumAge: 60000 }
    );
  }, [onChange]);

  const handleInput = (val: string) => {
    setQuery(val);
    onChange(val); // keep parent updated even mid-typing
    setOpen(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!val.trim()) { setResults([]); setOpen(false); return; }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const found = await searchLocations(val);
      setResults(found);
      setLoading(false);
      setOpen(found.length > 0);
    }, 400);
  };

  const handleSelect = (result: LocationResult) => {
    setQuery(result.display);
    onChange(result.display, result);
    setResults([]);
    setOpen(false);
  };

  const handleClear = () => {
    setQuery("");
    onChange("", undefined);
    setResults([]);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative flex items-center">
        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          placeholder="City, postal code, or neighbourhood"
          required={required}
          className={`input-base pl-11 pr-20 ${className ?? ""}`}
          autoComplete="off"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-gray-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={detectLocation}
            disabled={geoLoading}
            title="Use my current location"
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-dark-700 border border-dark-500 hover:border-brand-500 hover:text-brand-400 text-gray-400 transition-colors"
          >
            {geoLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <LocateFixed className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* GPS error */}
      {geoError && (
        <p className="mt-1.5 text-xs text-amber-400 flex items-center gap-1">
          <span>⚠️</span> {geoError}
        </p>
      )}

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-dark-800 border border-dark-600 rounded-xl shadow-2xl overflow-hidden">
          {loading && (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              Searching...
            </div>
          )}
          {!loading && results.length === 0 && query.length >= 2 && (
            <div className="px-4 py-3 text-sm text-gray-500">No results found</div>
          )}
          {results.map((r, i) => (
            <button
              key={i}
              type="button"
              onMouseDown={() => handleSelect(r)}
              className="w-full flex items-start gap-3 px-4 py-3 text-sm text-left hover:bg-dark-700 transition-colors border-b border-dark-700/50 last:border-0"
            >
              <MapPin className="w-4 h-4 text-brand-500 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-white font-medium leading-tight">{r.display}</div>
                {(r.city || r.postalCode) && (
                  <div className="text-gray-500 text-xs mt-0.5">
                    {[r.neighbourhood, r.city, r.postalCode].filter(Boolean).join(" · ")}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
