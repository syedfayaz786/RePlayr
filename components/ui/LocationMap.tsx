"use client";

import { useEffect, useRef } from "react";
import { MapPin } from "lucide-react";

interface LocationMapProps {
  lat: number;
  lng: number;
  label?: string;        // e.g. "Chelsea, NY 10001"
  radiusKm?: number;     // shaded radius circle — default 2 km
}

declare global {
  interface Window {
    L: any;
    _leafletLoaded: boolean;
  }
}

// Load Leaflet CSS + JS from CDN once, then resolve
function loadLeaflet(): Promise<any> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (window._leafletLoaded && window.L) return Promise.resolve(window.L);

  return new Promise((resolve, reject) => {
    // CSS
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id   = "leaflet-css";
      link.rel  = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    // JS
    if (!document.getElementById("leaflet-js")) {
      const script = document.createElement("script");
      script.id  = "leaflet-js";
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = () => {
        window._leafletLoaded = true;
        resolve(window.L);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    } else {
      // script tag exists but might still be loading
      const wait = setInterval(() => {
        if (window.L) { clearInterval(wait); resolve(window.L); }
      }, 50);
    }
  });
}

export default function LocationMap({ lat, lng, label, radiusKm = 2 }: LocationMapProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (!divRef.current) return;
    let mounted = true;

    loadLeaflet().then((L) => {
      if (!L || !mounted || !divRef.current) return;

      // Destroy previous map instance if re-rendering
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }

      const map = L.map(divRef.current, {
        center: [lat, lng],
        zoom: 13,
        zoomControl: true,
        scrollWheelZoom: false,
        attributionControl: false,
      });
      mapRef.current = map;

      // Dark-styled tile layer (CartoDB Dark Matter — free, no key)
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        { subdomains: "abcd", maxZoom: 19 }
      ).addTo(map);

      // Shaded radius circle
      L.circle([lat, lng], {
        radius: radiusKm * 1000,
        color: "#f97316",
        fillColor: "#f97316",
        fillOpacity: 0.12,
        weight: 2,
        opacity: 0.7,
      }).addTo(map);

      // Custom orange pin marker
      const icon = L.divIcon({
        className: "",
        html: `
          <div style="
            width:32px;height:32px;
            background:#f97316;
            border:3px solid #fff;
            border-radius:50% 50% 50% 0;
            transform:rotate(-45deg);
            box-shadow:0 2px 8px rgba(0,0,0,0.5);
          "></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      L.marker([lat, lng], { icon })
        .addTo(map)
        .bindPopup(
          `<div style="font-family:sans-serif;font-size:13px;color:#111;max-width:180px;text-align:center">
            <strong>📍 Pickup area</strong><br/>
            <span style="color:#555;font-size:12px">${label ?? "~" + radiusKm + " km radius"}</span>
          </div>`,
          { offset: [0, -28] }
        )
        .openPopup();

      // Small attribution in corner
      L.control.attribution({ position: "bottomright", prefix: false })
        .addAttribution('© <a href="https://openstreetmap.org">OSM</a>')
        .addTo(map);

      // Ensure tiles render after container is visible
      setTimeout(() => map.invalidateSize(), 100);
    });

    return () => {
      mounted = false;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, [lat, lng, label, radiusKm]);

  return (
    <div className="rounded-xl overflow-hidden border border-dark-600">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-dark-700 border-b border-dark-600">
        <MapPin className="w-4 h-4 text-brand-500 flex-shrink-0" />
        <div className="min-w-0">
          <span className="text-white text-sm font-medium truncate block">
            {label || "Pickup area"}
          </span>
          <span className="text-gray-500 text-xs">
            Approximate location — exact address shared after contact
          </span>
        </div>
      </div>
      {/* Map canvas */}
      <div ref={divRef} style={{ height: 260, width: "100%" }} />
      {/* Legend */}
      <div className="flex items-center gap-2 px-4 py-2 bg-dark-800 border-t border-dark-600">
        <div className="w-3 h-3 rounded-full bg-brand-500/30 border border-brand-500/60 flex-shrink-0" />
        <span className="text-xs text-gray-400">
          Shaded area = ~{radiusKm} km meetup radius around this postal code
        </span>
      </div>
    </div>
  );
}
