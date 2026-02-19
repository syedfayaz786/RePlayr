"use client";

import { useEffect, useState, useCallback } from "react";
import { CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface LocRequest {
  id: string;
  status: string;
  createdAt: string;
  requester: { id: string; name: string | null; image: string | null };
}

export function LocationRequestPanel({ listingId }: { listingId: string }) {
  const [requests, setRequests] = useState<LocRequest[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [acting,   setActing]   = useState<string | null>(null);

  const load = useCallback(() => {
    fetch(`/api/location-request/list?listingId=${listingId}`)
      .then(r => r.json())
      .then(d => setRequests(d.requests ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [listingId]);

  useEffect(() => { load(); }, [load]);

  const act = async (requestId: string, status: "approved" | "denied") => {
    setActing(requestId);
    try {
      const res = await fetch("/api/location-request", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ requestId, status }),
      });
      if (!res.ok) throw new Error();
      setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status } : r));
      toast.success(status === "approved" ? "Pickup area shared via messages!" : "Request denied.");
    } catch {
      toast.error("Action failed — please try again.");
    } finally {
      setActing(null);
    }
  };

  if (loading) return (
    <div className="flex items-center gap-2 text-gray-500 text-sm py-2">
      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading…
    </div>
  );

  if (requests.length === 0) return (
    <p className="text-xs text-gray-500">No address requests yet.</p>
  );

  const pending = requests.filter(r => r.status === "pending");
  const done    = requests.filter(r => r.status !== "pending");

  return (
    <div className="space-y-3">
      {pending.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3 h-3" /> Pending ({pending.length})
          </p>
          {pending.map(req => (
            <div key={req.id} className="bg-dark-600/60 rounded-xl p-3 border border-dark-500">
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-7 h-7 bg-brand-500/20 rounded-full flex items-center justify-center text-brand-400 font-bold text-xs flex-shrink-0">
                  {req.requester.name?.[0]?.toUpperCase() ?? "?"}
                </div>
                <span className="text-sm text-white font-medium truncate">
                  {req.requester.name ?? "Anonymous"}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => act(req.id, "approved")}
                  disabled={acting === req.id}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-green-500/15 border border-green-500/35 text-green-400 hover:bg-green-500/25 text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {acting === req.id
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : <CheckCircle className="w-3 h-3" />}
                  Approve
                </button>
                <button
                  onClick={() => act(req.id, "denied")}
                  disabled={acting === req.id}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-red-500/10 border border-red-500/25 text-red-400 hover:bg-red-500/20 text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-3 h-3" /> Deny
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {done.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Resolved</p>
          {done.map(req => (
            <div key={req.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg">
              <div className="w-5 h-5 bg-dark-600 rounded-full flex items-center justify-center text-xs font-bold text-gray-400 flex-shrink-0">
                {req.requester.name?.[0]?.toUpperCase() ?? "?"}
              </div>
              <span className="text-xs text-gray-500 truncate flex-1">
                {req.requester.name ?? "Anonymous"}
              </span>
              <span className={`text-xs font-semibold ${req.status === "approved" ? "text-green-400" : "text-gray-500"}`}>
                {req.status === "approved" ? "✓ Approved" : "✗ Denied"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
