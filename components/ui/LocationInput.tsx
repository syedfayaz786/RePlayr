"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, Loader2, LocateFixed, X } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface LocationResult {
  display: string;      // e.g. "Chelsea, Manhattan, New York, NY 10001, United States"
  postalCode: string;   // resolved zip / postal code
  city: string;
  neighbourhood: string;
  state: string;
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
}

interface Props {
  value: string;
  onChange: (display: string, result?: LocationResult) => void;
  required?: boolean;
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Nominatim helpers — runs entirely in the browser, no server needed
// ─────────────────────────────────────────────────────────────────────────────

const BASE = "https://nominatim.openstreetmap.org";
const HDR  = { "Accept-Language": "en", "User-Agent": "RePlayr/1.0 contact@replayr.app" };

function parseAddr(item: any): LocationResult {
  const a = item.address ?? {};
  const neighbourhood = a.neighbourhood || a.suburb || a.quarter || a.city_district || "";
  const city          = a.city || a.town || a.village || a.municipality || a.county || "";
  const state         = a.state || a.province || a.region || a.state_district || "";
  const country       = a.country || "";
  const countryCode   = (a.country_code || "").toUpperCase();
  const postalCode    = a.postcode || "";

  const parts: string[] = [];
  if (neighbourhood) parts.push(neighbourhood);
  if (city && city !== neighbourhood) parts.push(city);
  if (state) parts.push(state);
  if (postalCode) parts.push(postalCode);
  if (country) parts.push(country);

  const display = parts.length
    ? parts.join(", ")
    : (item.display_name || "").split(",").slice(0, 4).join(",").trim();

  return {
    display, postalCode, city, neighbourhood,
    state, country, countryCode,
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
  };
}

function dedupe(results: LocationResult[]): LocationResult[] {
  const seen = new Set<string>();
  return results.filter((r) => {
    const key = `${r.lat.toFixed(3)},${r.lng.toFixed(3)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Detect postcode patterns for many countries
const POSTCODE_RE = [
  /^\d{5}(-\d{4})?$/,                                    // US  10001
  /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/,             // CA  M5V 3A8
  /^[A-Za-z]{1,2}\d[A-Za-z\d]?[ ]?\d[A-Za-z]{2}$/,    // UK  SW1A 2AA
  /^\d{4,5}$/,                                            // DE/FR/NL/AU/BR
  /^\d{3}-\d{4}$/,                                        // JP  123-4567
  /^\d{6}$/,                                              // IN/RU/CN
  /^\d{4}[A-Za-z]{2}$/,                                  // NL  1234AB
];

function looksLikePostcode(q: string): boolean {
  return POSTCODE_RE.some((re) => re.test(q.trim()));
}

async function searchPostcode(postcode: string): Promise<LocationResult[]> {
  // Strategy 1: structured postalcode param — most reliable globally
  const u1 = new URL(`${BASE}/search`);
  u1.searchParams.set("postalcode", postcode.trim());
  u1.searchParams.set("format", "json");
  u1.searchParams.set("addressdetails", "1");
  u1.searchParams.set("limit", "8");
  const r1 = await fetch(u1.toString(), { headers: HDR });
  const d1: any[] = await r1.json();
  if (d1.length > 0) return dedupe(d1.map(parseAddr));
  // Strategy 2: fall back to free-text
  return searchText(postcode);
}

async function searchText(query: string): Promise<LocationResult[]> {
  const u = new URL(`${BASE}/search`);
  u.searchParams.set("q", query.trim());
  u.searchParams.set("format", "json");
  u.searchParams.set("addressdetails", "1");
  u.searchParams.set("limit", "8");
  // No countrycodes — worldwide
  const r = await fetch(u.toString(), { headers: HDR });
  const d: any[] = await r.json();
  return dedupe(d.map(parseAddr));
}

async function reverseGeocode(lat: number, lng: number): Promise<LocationResult | null> {
  const u = new URL(`${BASE}/reverse`);
  u.searchParams.set("lat", String(lat));
  u.searchParams.set("lon", String(lng));
  u.searchParams.set("format", "json");
  u.searchParams.set("addressdetails", "1");
  u.searchParams.set("zoom", "14");
  const r = await fetch(u.toString(), { headers: HDR });
  const d = await r.json();
  if (d.error) return null;
  return parseAddr(d);
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function LocationInput({ value, onChange, required, className }: Props) {
  const [query, setQuery]     = useState(value);
  const [results, setResults] = useState<LocationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [open, setOpen]       = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef  = useRef<HTMLDivElement>(null);

  // Try to auto-detect on first render when field is empty
  useEffect(() => {
    if (!value && typeof navigator !== "undefined" && "geolocation" in navigator) {
      detectGPS();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const detectGPS = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setGeoError("Geolocation not supported — please type your location.");
      return;
    }
    setGeoLoading(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const r = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        setGeoLoading(false);
        if (r) { setQuery(r.display); onChange(r.display, r); }
      },
      (err) => {
        setGeoLoading(false);
        setGeoError(
          err.code === 1
            ? "Location access denied — please type your city or postcode."
            : "Could not detect location — please enter it manually."
        );
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  }, [onChange]);

  const runSearch = useCallback(async (val: string) => {
    const t = val.trim();
    if (t.length < 2) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      const found = looksLikePostcode(t)
        ? await searchPostcode(t)
        : await searchText(t);
      setResults(found);
      setOpen(found.length > 0);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInput = (val: string) => {
    setQuery(val);
    onChange(val);
    if (debounce.current) clearTimeout(debounce.current);
    if (!val.trim()) { setResults([]); setOpen(false); return; }
    setOpen(true);
    debounce.current = setTimeout(() => runSearch(val), 380);
  };

  const select = (r: LocationResult) => {
    setQuery(r.display);
    onChange(r.display, r);
    setResults([]);
    setOpen(false);
  };

  const clear = () => {
    setQuery(""); onChange(""); setResults([]); setOpen(false);
  };

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative flex items-center">
        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="City, zip / postal code, or neighbourhood"
          required={required}
          autoComplete="off"
          className={`input-base pl-11 pr-20 ${className ?? ""}`}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {query && (
            <button type="button" onClick={clear}
              className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-gray-300">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button type="button" onClick={detectGPS} disabled={geoLoading}
            title="Use my current location"
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-dark-700 border border-dark-500 hover:border-brand-500 hover:text-brand-400 text-gray-400 transition-colors">
            {geoLoading
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <LocateFixed className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {geoError && (
        <p className="mt-1.5 text-xs text-amber-400">⚠️ {geoError}</p>
      )}

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-dark-800 border border-dark-600 rounded-xl shadow-2xl overflow-hidden max-h-72 overflow-y-auto">
          {loading && (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin" /> Searching…
            </div>
          )}
          {!loading && results.length === 0 && query.trim().length >= 2 && (
            <div className="px-4 py-3 text-sm text-gray-500">
              No results found. Try adding the country name, e.g. &quot;Paris, France&quot;.
            </div>
          )}
          {results.map((r, i) => (
            <button key={i} type="button" onMouseDown={() => select(r)}
              className="w-full flex items-start gap-3 px-4 py-3 text-sm text-left hover:bg-dark-700 transition-colors border-b border-dark-700/40 last:border-0">
              <MapPin className="w-4 h-4 text-brand-500 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-white font-medium leading-tight">{r.display}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  {r.postalCode && (
                    <span className="text-xs font-mono bg-dark-600 text-brand-400 border border-dark-500 px-1.5 py-0.5 rounded">
                      {r.postalCode}
                    </span>
                  )}
                  {r.country && <span className="text-xs text-gray-500">{r.country}</span>}
                </div>
              </div>
            </button>
          ))}
          {results.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-dark-900/50 border-t border-dark-700">
              <span className="text-brand-400" style={{fontSize: 10}}>🔒</span>
              <span className="text-xs text-gray-600">Only a fuzzy area shown to buyers — exact address never shared publicly</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
