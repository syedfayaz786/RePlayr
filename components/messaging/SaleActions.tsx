"use client";

import { useState, useEffect } from "react";
import { CheckCircle, Star, ShoppingBag, X } from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface SaleActionsProps {
  listingId: string;
  listingTitle: string;
  currentUserId: string;
  partnerId: string;
  partnerName: string;
  partnerImage?: string | null;
  isSeller: boolean; // true = current user is seller, false = buyer
}

interface SaleData {
  id: string;
  buyerId: string;
  sellerId: string;
  buyer: { id: string; name: string | null; image: string | null };
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={`w-7 h-7 transition-colors ${
              n <= (hover || value) ? "fill-amber-400 text-amber-400" : "text-gray-600"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export function SaleActions({
  listingId, listingTitle, currentUserId, partnerId,
  partnerName, partnerImage, isSeller,
}: SaleActionsProps) {
  const router = useRouter();
  const [sale, setSale]           = useState<SaleData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [marking, setMarking]     = useState(false);

  // Review state
  const [showReview, setShowReview] = useState(false);
  const [rating, setRating]         = useState(0);
  const [comment, setComment]       = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/sales?listingId=${listingId}`).then((r) => r.json()),
      fetch(`/api/reviews?listingId=${listingId}`).then((r) => r.json()),
    ]).then(([saleData, reviewData]) => {
      setSale(saleData);
      setHasReviewed(!!reviewData);
      setLoading(false);
    });
  }, [listingId]);

  const markSold = async () => {
    setMarking(true);
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, buyerId: partnerId }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSale(data);
      setConfirming(false);
      toast.success(`Marked as sold to ${partnerName}!`);
      router.refresh();
    } catch {
      toast.error("Failed to mark as sold");
    } finally {
      setMarking(false);
    }
  };

  const submitReview = async () => {
    if (!rating) { toast.error("Please select a star rating"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId: partnerId, listingId, rating, comment }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("Review submitted!");
      setHasReviewed(true);
      setShowReview(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;

  // ── SELLER VIEW ──
  if (isSeller) {
    if (sale) {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-semibold">
          <CheckCircle className="w-3.5 h-3.5" />
          Sold to {sale.buyer.name ?? "buyer"}
        </div>
      );
    }

    if (confirming) {
      return (
        <div className="flex items-center gap-2 bg-dark-800 border border-brand-500/40 rounded-xl px-3 py-2 shadow-lg">
          <div className="flex items-center gap-1.5 mr-1">
            {partnerImage ? (
              <Image src={partnerImage} alt={partnerName} width={20} height={20} className="rounded-full" />
            ) : (
              <div className="w-5 h-5 rounded-full bg-brand-500/30 flex items-center justify-center text-brand-400 text-xs font-bold">
                {partnerName[0]}
              </div>
            )}
            <span className="text-xs text-gray-300 font-medium">Sold to <span className="text-white">{partnerName}</span>?</span>
          </div>
          <button
            onClick={markSold}
            disabled={marking}
            className="px-2.5 py-1 rounded-lg bg-brand-700 hover:bg-brand-600 text-white text-xs font-semibold transition-colors disabled:opacity-50"
          >
            {marking ? "Saving…" : "Confirm"}
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="text-gray-500 hover:text-gray-300 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      );
    }

    return (
      <button
        onClick={() => setConfirming(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-brand-500/30 bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 hover:border-brand-500/50 transition-all text-xs font-semibold"
      >
        <ShoppingBag className="w-3.5 h-3.5" />
        Sold to this buyer
      </button>
    );
  }

  // ── BUYER VIEW ──
  // Only show if this buyer is the confirmed purchaser
  if (!sale || sale.buyerId !== currentUserId) return null;

  if (hasReviewed) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
        <Star className="w-3.5 h-3.5 fill-current" />
        Review submitted
      </div>
    );
  }

  if (showReview) {
    return (
      <div className="flex flex-col gap-3 bg-dark-800 border border-dark-500 rounded-2xl p-4 shadow-xl w-72">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-white">Rate your experience</p>
          <button onClick={() => setShowReview(false)} className="text-gray-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-gray-400">How was <span className="text-white font-medium">{partnerName}</span> as a seller for <span className="text-white font-medium">{listingTitle}</span>?</p>
        <StarPicker value={rating} onChange={setRating} />
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Write a review (optional)..."
          rows={3}
          className="input-base text-sm resize-none"
        />
        <div className="flex gap-2">
          <button onClick={() => setShowReview(false)} className="btn-secondary flex-1 py-2 text-sm">
            Cancel
          </button>
          <button
            onClick={submitReview}
            disabled={!rating || submitting}
            className="btn-primary flex-1 py-2 text-sm"
          >
            {submitting ? "Submitting…" : "Submit"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowReview(true)}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/50 transition-all text-xs font-semibold"
    >
      <Star className="w-3.5 h-3.5" />
      Rate Seller
    </button>
  );
}
