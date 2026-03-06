"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { MapPin, Lock, MessageSquare, CheckCircle, Clock, XCircle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface LocationMapProps {
  fuzzyLat?: number;
  fuzzyLng?: number;
  label?: string;
  radiusKm?: number;
  listingId?: string;
  isSeller?: boolean;
}

function MapWidget({ fuzzyLat, fuzzyLng, radiusKm = 3 }: { fuzzyLat: number; fuzzyLng: number; radiusKm?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let L: any;
    try { L = require("leaflet"); } catch { return; }

    // Inject CSS once
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    // Fix default icon paths broken by webpack
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });

    const map = L.map(containerRef.current, {
      center: [fuzzyLat, fuzzyLng],
      zoom: 11,
      scrollWheelZoom: false,
      attributionControl: false,
      zoomControl: true,
      dragging: true,
    });
    mapRef.current = map;

    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      subdomains: "abcd",
      maxZoom: 19,
    }).addTo(map);

    L.circle([fuzzyLat, fuzzyLng], {
      radius: radiusKm * 1000 * 1.25,
      color: "#06b6d4", fillColor: "#06b6d4", fillOpacity: 0.08, weight: 0, interactive: false,
    }).addTo(map);

    L.circle([fuzzyLat, fuzzyLng], {
      radius: radiusKm * 1000,
      color: "#0891b2", fillColor: "#06b6d4", fillOpacity: 0.22, weight: 2.5, opacity: 0.9, dashArray: "8 5", interactive: false,
    }).addTo(map);

    L.circleMarker([fuzzyLat, fuzzyLng], {
      radius: 8, color: "#fff", fillColor: "#06b6d4", fillOpacity: 1, weight: 2.5, interactive: false,
    }).addTo(map);

    const bounds = L.circle([fuzzyLat, fuzzyLng], { radius: radiusKm * 1000 * 1.3 }).getBounds();
    map.fitBounds(bounds, { padding: [20, 20], maxZoom: 12 });
    setTimeout(() => map.invalidateSize(), 150);

    return () => { map.remove(); mapRef.current = null; };
  }, [fuzzyLat, fuzzyLng, radiusKm]);

  return <div ref={containerRef} style={{ height: "100%", width: "100%" }} />;
}

export default function LocationMap({
  fuzzyLat,
  fuzzyLng,
  label,
  radiusKm = 3,
  listingId,
  isSeller = false,
}: LocationMapProps) {
  const [mounted, setMounted] = useState(false);

  type ReqStatus = "idle" | "pending" | "approved" | "denied" | "sending" | "checking";
  const [reqStatus, setReqStatus] = useState<ReqStatus>(
    !isSeller && listingId ? "checking" : "idle"
  );

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (isSeller || !listingId) return;
    fetch(`/api/location-request?listingId=${listingId}`)
      .then(r => r.json())
      .then(data => setReqStatus(data.request ? data.request.status : "idle"))
      .catch(() => setReqStatus("idle"));
  }, [listingId, isSeller]);

  const sendRequest = useCallback(async () => {
    if (!listingId) return;
    setReqStatus("sending");
    try {
      const res = await fetch("/api/location-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
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

  const bottomBar = () => {
    if (isSeller) return (
      <div className="flex items-center gap-2 px-4 py-2.5 bg-dark-700 border-t border-dark-600">
        <Lock className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
        <p className="text-xs text-gray-400">Buyers see a <strong className="text-white">fuzzy area</strong> — your exact address is never shown until you approve a request.</p>
      </div>
    );
    if (reqStatus === "checking") return (
      <div className="flex items-center gap-2 px-4 py-2.5 bg-dark-700 border-t border-dark-600">
        <Loader2 className="w-3.5 h-3.5 text-gray-400 animate-spin flex-shrink-0" />
        <span className="text-xs text-gray-400">Checking status…</span>
      </div>
    );
    if (reqStatus === "approved") return (
      <div className="flex items-center gap-2 px-4 py-2.5 bg-green-900/30 border-t border-green-500/25">
        <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
        <span className="text-xs text-green-300">Approved — check your <strong>Messages</strong> for the pickup area.</span>
      </div>
    );
    if (reqStatus === "pending") return (
      <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-900/25 border-t border-amber-500/25">
        <Clock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
        <span className="text-xs text-amber-300">Request sent — waiting for seller to respond.</span>
      </div>
    );
    if (reqStatus === "denied") return (
      <div className="flex items-center gap-2 px-4 py-2.5 bg-red-900/20 border-t border-red-500/20">
        <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
        <span className="text-xs text-red-300">Request not approved. Message the seller to arrange a meetup.</span>
      </div>
    );
    if (reqStatus === "sending") return (
      <div className="flex items-center gap-2 px-4 py-2.5 bg-dark-700 border-t border-dark-600">
        <Loader2 className="w-3.5 h-3.5 text-brand-400 animate-spin flex-shrink-0" />
        <span className="text-xs text-gray-400">Sending request…</span>
      </div>
    );
    if (listingId) return (
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-dark-700 border-t border-dark-600">
        <div className="flex items-center gap-2 min-w-0">
          <Lock className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
          <span className="text-xs text-gray-400 truncate">Exact address hidden — ask the seller</span>
        </div>
        <button onClick={sendRequest} className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 active:scale-95 text-white text-xs font-semibold transition-all">
          <MessageSquare className="w-3 h-3" />
          Request Address
        </button>
      </div>
    );
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 bg-dark-700 border-t border-dark-600">
        <div className="w-3 h-3 rounded-full bg-brand-500/30 border border-brand-500/50 flex-shrink-0" />
        <span className="text-xs text-gray-400">Shaded area = ~{radiusKm} km approximate pickup zone</span>
      </div>
    );
  };

  return (
    <div className="rounded-xl overflow-hidden border border-dark-600 bg-dark-800">
      <div className="flex items-center gap-2.5 px-4 py-3 bg-dark-700 border-b border-dark-600">
        <MapPin className="w-4 h-4 text-brand-400 flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-white truncate leading-tight">{label ?? "Pickup area"}</p>
          <p className="text-xs text-gray-500 leading-tight mt-0.5">Approximate location — exact address shared privately after contact</p>
        </div>
      </div>
      <div className="h-[200px] sm:h-[260px] w-full bg-dark-700">
        {mounted && fuzzyLat && fuzzyLng
          ? <MapWidget fuzzyLat={fuzzyLat} fuzzyLng={fuzzyLng} radiusKm={radiusKm} />
          : <div className="h-full flex items-center justify-center text-gray-500 text-sm">Loading map…</div>
        }
      </div>
      {bottomBar()}
    </div>
  );
}
