"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  MapPin, Lock, CheckCircle, Clock, XCircle, Loader2, MessageSquare,
} from "lucide-react";
import toast from "react-hot-toast";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface LocationMapProps {
  /** Fuzzy coords — already offset ±500 m server-side. Never exact. */
  fuzzyLat: number;
  fuzzyLng: number;
  /** Human-readable label, e.g. "Chelsea, Manhattan, NY 10001" */
  label?: string;
  /** Radius of the buyer-facing circle in km (default 3) */
  radiusKm?: number;
  /** If set, enables the Request Address flow */
  listingId?: string;
  /** Seller sees a privacy-info bar instead of the request button */
  isSeller?: boolean;
}

declare global {
  interface Window { L: any; _leafletLoaded: boolean; }
}

// ─────────────────────────────────────────────────────────────────────────────
// Leaflet CDN loader — idempotent
// ─────────────────────────────────────────────────────────────────────────────

function loadLeaflet(): Promise<any> {
  if (typeof window === "undefined") return Promise.resolve(null);
  // Already fully loaded
  if (window._leafletLoaded && window.L && typeof window.L.map === "function") {
    return Promise.resolve(window.L);
  }

  return new Promise((resolve, reject) => {
    // Helper: poll until L.map is a real function, then resolve
    const waitForL = () => {
      const poll = setInterval(() => {
        if (window.L && typeof window.L.map === "function") {
          clearInterval(poll);
          window._leafletLoaded = true;
          resolve(window.L);
        }
      }, 30);
      // Timeout after 10s
      setTimeout(() => { clearInterval(poll); reject(new Error("Leaflet load timeout")); }, 10000);
    };

    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id   = "leaflet-css";
      link.rel  = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    if (!document.getElementById("leaflet-js")) {
      const s = document.createElement("script");
      s.id  = "leaflet-js";
      s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      // Don't resolve in onload directly — L.map may not be ready yet
      s.onload  = waitForL;
      s.onerror = reject;
      document.head.appendChild(s);
    } else {
      // Script already injected, just wait for it
      waitForL();
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function LocationMap({
  fuzzyLat,
  fuzzyLng,
  label,
  radiusKm = 3,
  listingId,
  isSeller = false,
}: LocationMapProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  // Request-address state
  type ReqStatus = "idle" | "pending" | "approved" | "denied" | "sending" | "checking";
  const [reqStatus, setReqStatus] = useState<ReqStatus>(
    !isSeller && listingId ? "checking" : "idle"
  );

  // ── Check whether the current buyer already sent a request ────────────────
  useEffect(() => {
    if (isSeller || !listingId) return;

    fetch(`/api/location-request?listingId=${listingId}`)
      .then(r => r.json())
      .then(data => {
        if (data.request) {
          setReqStatus(data.request.status as ReqStatus);
        } else {
          setReqStatus("idle");
        }
      })
      .catch(() => setReqStatus("idle"));
  }, [listingId, isSeller]);

  // ── Build / rebuild the map whenever coords change ────────────────────────
  useEffect(() => {
    if (!divRef.current) return;
    let mounted = true;

    loadLeaflet().then((L) => {
      if (!L || !L.map || !mounted || !divRef.current) return;
      try {

      // Destroy old instance first
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }

      const map = L.map(divRef.current, {
        center:          [fuzzyLat, fuzzyLng],
        zoom:            11,
        zoomControl:     true,
        scrollWheelZoom: false,
        attributionControl: false,
        dragging:        true,
      });
      mapRef.current = map;

      // Dark CartoDB tiles
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        subdomains: "abcd",
        maxZoom:    19,
      }).addTo(map);

      // ── Facebook-style: soft fuzzy circle — NO precise pin marker ─────────

      // Outer glow ring
      L.circle([fuzzyLat, fuzzyLng], {
        radius:      radiusKm * 1000 * 1.25,
        color:       "#06b6d4",
        fillColor:   "#06b6d4",
        fillOpacity: 0.08,
        weight:      0,
        interactive: false,
      }).addTo(map);

      // Main filled circle
      L.circle([fuzzyLat, fuzzyLng], {
        radius:      radiusKm * 1000,
        color:       "#0891b2",
        fillColor:   "#06b6d4",
        fillOpacity: 0.22,
        weight:      2.5,
        opacity:     0.9,
        dashArray:   "8 5",
        interactive: false,
      }).addTo(map);

      // Small centre dot (non-precise visual anchor)
      L.circleMarker([fuzzyLat, fuzzyLng], {
        radius:      8,
        color:       "#fff",
        fillColor:   "#06b6d4",
        fillOpacity: 1,
        weight:      2.5,
        interactive: false,
      }).addTo(map);

      L.control.attribution({ position: "bottomright", prefix: false })
        .addAttribution('© <a href="https://openstreetmap.org">OSM</a>')
        .addTo(map);

      // Fit map so the full circle is visible with padding
      const circleBounds = L.circle([fuzzyLat, fuzzyLng], { radius: radiusKm * 1000 * 1.3 }).getBounds();
      map.fitBounds(circleBounds, { padding: [20, 20], maxZoom: 12 });
      setTimeout(() => map.invalidateSize(), 120);
      } catch (e) {
        console.warn("Leaflet map init failed:", e);
      }
    }).catch((e) => {
      console.warn("Leaflet failed to load:", e);
    });

    return () => {
      mounted = false;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, [fuzzyLat, fuzzyLng, radiusKm]);

  // ── Send address request ──────────────────────────────────────────────────
  const sendRequest = useCallback(async () => {
    if (!listingId) return;
    setReqStatus("sending");
    try {
      const res  = await fetch("/api/location-request", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ listingId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      setReqStatus((data.status as ReqStatus) ?? "pending");
      toast.success("Request sent — the seller will be notified.");
    } catch (err: any) {
      toast.error(err.message ?? "Could not send request");
      setReqStatus("idle");
    }
  }, [listingId]);

  // ── Bottom bar ────────────────────────────────────────────────────────────
  const bottomBar = () => {
    // Seller view — privacy info only
    if (isSeller) return (
      <div className="flex items-center gap-2 px-4 py-2.5 bg-dark-700 border-t border-dark-600">
        <Lock className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
        <p className="text-xs text-gray-400">
          Buyers see a <strong className="text-white">fuzzy area</strong> — your exact address
          is never shown until you approve a request.
        </p>
      </div>
    );

    // Checking existing request
    if (reqStatus === "checking") return (
      <div className="flex items-center gap-2 px-4 py-2.5 bg-dark-700 border-t border-dark-600">
        <Loader2 className="w-3.5 h-3.5 text-gray-400 animate-spin flex-shrink-0" />
        <span className="text-xs text-gray-400">Checking status…</span>
      </div>
    );

    // Approved
    if (reqStatus === "approved") return (
      <div className="flex items-center gap-2 px-4 py-2.5 bg-green-900/30 border-t border-green-500/25">
        <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
        <span className="text-xs text-green-300">
          Approved — check your <strong>Messages</strong> for the pickup area.
        </span>
      </div>
    );

    // Pending
    if (reqStatus === "pending") return (
      <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-900/25 border-t border-amber-500/25">
        <Clock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
        <span className="text-xs text-amber-300">
          Request sent — waiting for seller to respond.
        </span>
      </div>
    );

    // Denied
    if (reqStatus === "denied") return (
      <div className="flex items-center gap-2 px-4 py-2.5 bg-red-900/20 border-t border-red-500/20">
        <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
        <span className="text-xs text-red-300">
          Request not approved. Message the seller to arrange a meetup.
        </span>
      </div>
    );

    // Sending spinner
    if (reqStatus === "sending") return (
      <div className="flex items-center gap-2 px-4 py-2.5 bg-dark-700 border-t border-dark-600">
        <Loader2 className="w-3.5 h-3.5 text-brand-400 animate-spin flex-shrink-0" />
        <span className="text-xs text-gray-400">Sending request…</span>
      </div>
    );

    // Idle — show request button (buyer, logged-in context)
    if (listingId) return (
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-dark-700 border-t border-dark-600">
        <div className="flex items-center gap-2 min-w-0">
          <Lock className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
          <span className="text-xs text-gray-400 truncate">
            Exact address hidden — ask the seller
          </span>
        </div>
        <button
          onClick={sendRequest}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 active:scale-95 text-white text-xs font-semibold transition-all"
        >
          <MessageSquare className="w-3 h-3" />
          Request Address
        </button>
      </div>
    );

    // No listingId — plain legend (e.g. sell-form preview)
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 bg-dark-700 border-t border-dark-600">
        <div className="w-3 h-3 rounded-full bg-brand-500/30 border border-brand-500/50 flex-shrink-0" />
        <span className="text-xs text-gray-400">
          Shaded area = ~{radiusKm} km approximate pickup zone
        </span>
      </div>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="rounded-xl overflow-hidden border border-dark-600 bg-dark-800">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 bg-dark-700 border-b border-dark-600">
        <MapPin className="w-4 h-4 text-brand-400 flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-white truncate leading-tight">
            {label ?? "Pickup area"}
          </p>
          <p className="text-xs text-gray-500 leading-tight mt-0.5">
            Approximate location — exact address shared privately after contact
          </p>
        </div>
      </div>

      {/* Map canvas */}
      <div ref={divRef} style={{ height: 272, width: "100%" }} />

      {/* Bottom bar */}
      {bottomBar()}
    </div>
  );
}
