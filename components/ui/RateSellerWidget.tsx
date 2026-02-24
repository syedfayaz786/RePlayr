"use client";

import { useState } from "react";
import { Star, Send, CheckCircle } from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";

interface RateSellerWidgetProps {
  sellerId: string;
  sellerName: string;
  sellerImage?: string | null;
  listingId: string;
  listingTitle: string;
  existingReview?: { rating: number; comment: string | null } | null;
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={`w-7 h-7 transition-colors ${
              star <= (hovered || value) ? "fill-amber-400 text-amber-400" : "text-gray-600"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

const RATING_LABELS: Record<number, string> = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Great",
  5: "Excellent!",
};

export function RateSellerWidget({
  sellerId,
  sellerName,
  sellerImage,
  listingId,
  listingTitle,
  existingReview,
}: RateSellerWidgetProps) {
  const [rating,    setRating]    = useState(existingReview?.rating ?? 0);
  const [comment,   setComment]   = useState(existingReview?.comment ?? "");
  const [submitted, setSubmitted] = useState(!!existingReview);
  const [saving,    setSaving]    = useState(false);

  const submit = async () => {
    if (!rating) { toast.error("Please select a star rating"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId: sellerId, listingId, rating, comment: comment.trim() || null }),
      });
      if (!res.ok) throw new Error();
      toast.success("Review submitted!");
      setSubmitted(true);
    } catch {
      toast.error("Failed to submit review");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">
            {submitted ? "Your review" : "Rate this seller"}
          </p>
          <p className="text-xs text-gray-400">for <span className="text-amber-300">{listingTitle}</span></p>
        </div>
      </div>

      {/* Seller info */}
      <div className="flex items-center gap-2">
        {sellerImage ? (
          <Image src={sellerImage} alt={sellerName} width={28} height={28} className="rounded-full" />
        ) : (
          <div className="w-7 h-7 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 font-bold text-xs">
            {sellerName[0]?.toUpperCase()}
          </div>
        )}
        <span className="text-sm text-gray-300 font-medium">{sellerName}</span>
      </div>

      {/* Stars */}
      <div className="flex flex-col gap-1.5">
        <StarPicker value={rating} onChange={submitted ? () => {} : setRating} />
        {rating > 0 && (
          <p className="text-xs font-semibold text-amber-400">{RATING_LABELS[rating]}</p>
        )}
      </div>

      {/* Comment */}
      {!submitted ? (
        <>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Leave a comment (optional)..."
            rows={2}
            className="input-base text-sm resize-none"
          />
          <button
            onClick={submit}
            disabled={saving || !rating}
            className="btn-primary text-sm py-2.5 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? "Submitting…" : <><Send className="w-3.5 h-3.5" /> Submit Review</>}
          </button>
        </>
      ) : (
        <div className="flex items-center gap-2 text-sm text-green-400">
          <CheckCircle className="w-4 h-4" />
          {comment ? <span className="text-gray-300 italic">"{comment}"</span> : "Review submitted"}
        </div>
      )}
    </div>
  );
}
