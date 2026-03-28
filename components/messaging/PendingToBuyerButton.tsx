"use client";

import { useState } from "react";
import { Clock, CheckCircle, X } from "lucide-react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";

interface PendingToBuyerButtonProps {
  listingId: string;
  buyerName: string;
  currentStatus: string; // "available" | "pending" | "sold"
  onStatusChange?: (newStatus: string) => void;
}

export function PendingToBuyerButton({ listingId, buyerName, currentStatus, onStatusChange }: PendingToBuyerButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [localStatus, setLocalStatus] = useState(
    currentStatus === "active" ? "available" : currentStatus
  );

  const isPending   = localStatus === "pending";
  const isAvailable = localStatus === "available";

  // Don't show if sold
  if (localStatus === "sold") return null;

  const toggle = async () => {
    const newStatus = isPending ? "available" : "pending";
    setLoading(true);
    try {
      // API still stores "active" for available
      const dbStatus = newStatus === "available" ? "active" : newStatus;
      const res = await fetch(`/api/listings/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: dbStatus }),
      });
      if (!res.ok) throw new Error();
      setLocalStatus(newStatus);
      setConfirming(false);
      onStatusChange?.(newStatus);
      toast.success(newStatus === "pending" ? `Marked as pending for ${buyerName}` : "Listing marked as available again");
    } catch {
      toast.error("Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  const popup = confirming && typeof document !== "undefined"
    ? createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setConfirming(false)}
        >
          <div
            className="bg-dark-800 border border-dark-600 rounded-2xl shadow-2xl p-6 w-full max-w-sm flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/15 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="font-semibold text-white">
                    {isPending ? "Mark as Available?" : "Mark as Pending?"}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {isPending
                      ? "This will make the listing available again"
                      : `Holding for ${buyerName}`}
                  </p>
                </div>
              </div>
              <button onClick={() => setConfirming(false)} className="text-gray-500 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-gray-400 bg-dark-700 rounded-xl p-3">
              {isPending
                ? "Other buyers will be able to see and message you about this listing again."
                : `This signals to ${buyerName} that you're holding the listing for them. You can undo this at any time.`}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirming(false)}
                className="flex-1 py-2.5 rounded-xl bg-dark-600 hover:bg-dark-500 text-gray-300 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={toggle}
                disabled={loading}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${
                  isPending
                    ? "bg-green-500 hover:bg-green-600 text-white"
                    : "bg-amber-500 hover:bg-amber-600 text-white"
                }`}
              >
                {isPending ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                {loading ? "Saving…" : isPending ? "Yes, mark available" : "Yes, mark pending"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <button
        onClick={() => setConfirming(true)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all text-xs font-medium ${
          isPending
            ? "bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30"
            : "bg-amber-500/10 border-amber-500/25 text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/40"
        }`}
      >
        <Clock className="w-3.5 h-3.5" />
        {isPending ? "Mark Available" : "Mark Pending"}
      </button>
      {popup}
    </>
  );
}
