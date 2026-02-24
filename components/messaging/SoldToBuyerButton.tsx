"use client";

import { useState } from "react";
import { CheckCircle, PackageCheck, X } from "lucide-react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface SoldToBuyerButtonProps {
  listingId: string;
  buyerId: string;
  buyerName: string;
  alreadySold: boolean;   // listing already marked sold to this buyer
}

export function SoldToBuyerButton({ listingId, buyerId, buyerName, alreadySold }: SoldToBuyerButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading]       = useState(false);
  const router = useRouter();

  const markSold = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, buyerId }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Marked as sold to ${buyerName}!`);
      setConfirming(false);
      router.refresh();
    } catch {
      toast.error("Failed to mark as sold");
    } finally {
      setLoading(false);
    }
  };

  if (alreadySold) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-medium">
        <CheckCircle className="w-4 h-4 flex-shrink-0" />
        Sold to {buyerName}
      </div>
    );
  }

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
                <div className="w-10 h-10 rounded-full bg-green-500/15 flex items-center justify-center">
                  <PackageCheck className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="font-semibold text-white">Mark as sold?</p>
                  <p className="text-xs text-gray-400 mt-0.5">This will be sold to <span className="text-white font-medium">{buyerName}</span></p>
                </div>
              </div>
              <button onClick={() => setConfirming(false)} className="text-gray-500 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-gray-400 bg-dark-700 rounded-xl p-3">
              This will mark your listing as <span className="text-white">Sold</span> and allow {buyerName} to leave you a rating. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirming(false)}
                className="flex-1 py-2.5 rounded-xl bg-dark-600 hover:bg-dark-500 text-gray-300 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={markSold}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                {loading ? "Saving…" : "Yes, mark sold"}
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
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 hover:border-green-500/50 transition-all text-sm font-medium"
      >
        <PackageCheck className="w-4 h-4" />
        Sold to this buyer
      </button>
      {popup}
    </>
  );
}
