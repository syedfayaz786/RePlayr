"use client";

import { useState } from "react";
import { Star, Send, CheckCircle, Sparkles } from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";

// ── Preset strengths ─────────────────────────────────────────────────────────
const SELLER_STRENGTHS = [
  "Fast response",
  "Great communication",
  "Item as described",
  "Fair pricing",
  "Flexible pickup",
  "Professional",
  "Trustworthy",
  "Punctual",
  "Well packaged",
  "Smooth transaction",
];

const BUYER_STRENGTHS = [
  "Punctual",
  "Fair negotiation",
  "Great communication",
  "Reliable",
  "Respectful",
  "Quick decision",
  "Easy to deal with",
  "Showed up on time",
  "Paid as agreed",
  "Would trade again",
];

// ── Star picker ───────────────────────────────────────────────────────────────
function StarPicker({ value, onChange, disabled }: { value: number; onChange: (v: number) => void; disabled?: boolean }) {
  const [hovered, setHovered] = useState(0);
  const labels: Record<number, string> = { 1: "Poor", 2: "Fair", 3: "Good", 4: "Great", 5: "Excellent!" };
  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((s) => (
          <button key={s} type="button" disabled={disabled}
            onClick={() => !disabled && onChange(s)}
            onMouseEnter={() => !disabled && setHovered(s)}
            onMouseLeave={() => setHovered(0)}
            className="transition-transform hover:scale-110 disabled:cursor-default"
          >
            <Star className={`w-6 h-6 transition-colors ${s <= (hovered || value) ? "fill-amber-400 text-amber-400" : "text-gray-600"}`} />
          </button>
        ))}
      </div>
      {(hovered || value) > 0 && (
        <p className="text-xs font-semibold text-amber-400">{labels[hovered || value]}</p>
      )}
    </div>
  );
}

// ── Strength chip picker ──────────────────────────────────────────────────────
function StrengthPicker({ options, selected, onChange, disabled }: {
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
  disabled?: boolean;
}) {
  const toggle = (s: string) => {
    if (disabled) return;
    onChange(selected.includes(s) ? selected.filter((x) => x !== s) : [...selected, s]);
  };
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((s) => (
        <button key={s} type="button" onClick={() => toggle(s)} disabled={disabled}
          className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
            selected.includes(s)
              ? "bg-brand-500 border-brand-500 text-white"
              : "bg-dark-700 border-dark-600 text-gray-400 hover:border-brand-500/50 hover:text-white"
          } disabled:cursor-default`}
        >
          {s}
        </button>
      ))}
    </div>
  );
}

// ── Single review form ────────────────────────────────────────────────────────
function ReviewForm({
  targetId, targetName, targetImage, listingId, role, strengthOptions,
  existingReview, label,
}: {
  targetId: string; targetName: string; targetImage?: string | null;
  listingId: string; role: "buyer" | "seller"; strengthOptions: string[];
  existingReview: { rating: number; comment: string | null; strengths: string[] } | null;
  label: string;
}) {
  const [rating,    setRating]    = useState(existingReview?.rating ?? 0);
  const [comment,   setComment]   = useState(existingReview?.comment ?? "");
  const [strengths, setStrengths] = useState<string[]>(existingReview?.strengths ?? []);
  const [submitted, setSubmitted] = useState(!!existingReview);
  const [saving,    setSaving]    = useState(false);

  const submit = async () => {
    if (!rating) { toast.error("Please select a star rating"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId, listingId, rating, comment: comment.trim() || null, strengths, role }),
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
    <div className="flex flex-col gap-3">
      {/* Target user */}
      <div className="flex items-center gap-2">
        {targetImage ? (
          <Image src={targetImage} alt={targetName} width={28} height={28} className="rounded-full flex-shrink-0" />
        ) : (
          <div className="w-7 h-7 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 font-bold text-xs flex-shrink-0">
            {targetName[0]?.toUpperCase()}
          </div>
        )}
        <span className="text-sm font-medium text-white">{label}</span>
      </div>

      {/* Stars */}
      <StarPicker value={rating} onChange={setRating} disabled={submitted} />

      {/* Strength chips */}
      <div>
        <p className="text-xs text-gray-500 mb-1.5 font-medium">Highlight strengths</p>
        <StrengthPicker options={strengthOptions} selected={strengths} onChange={setStrengths} disabled={submitted} />
      </div>

      {/* Comment */}
      {!submitted ? (
        <>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)}
            placeholder="Add a comment (optional)…" rows={2}
            className="input-base text-sm resize-none"
          />
          <button onClick={submit} disabled={saving || !rating}
            className="btn-primary text-sm py-2 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? "Submitting…" : <><Send className="w-3.5 h-3.5" /> Submit Review</>}
          </button>
        </>
      ) : (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-sm text-green-400">
            <CheckCircle className="w-4 h-4" />
            <span>Review submitted</span>
          </div>
          {strengths.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {strengths.map((s) => (
                <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">{s}</span>
              ))}
            </div>
          )}
          {comment && <p className="text-xs text-gray-400 italic mt-1">"{comment}"</p>}
        </div>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
interface MutualRatingCardProps {
  listingId: string;
  listingTitle: string;
  currentUserId: string;
  isSeller: boolean;   // is the current user the seller?
  // The other party
  partnerId: string;
  partnerName: string;
  partnerImage?: string | null;
  // The current user's info (for label)
  currentUserName: string;
  // Seller's info (for buyer to rate)
  sellerId: string;
  sellerName: string;
  sellerImage?: string | null;
  // Pre-fetched existing reviews
  myExistingReview: { rating: number; comment: string | null; strengths: string[] } | null;
}

export function MutualRatingCard({
  listingId, listingTitle, currentUserId, isSeller,
  partnerId, partnerName, partnerImage,
  sellerId, sellerName, sellerImage,
  myExistingReview,
}: MutualRatingCardProps) {
  // Who am I rating? 
  // If I'm the seller → I rate the buyer (partnerId)
  // If I'm the buyer  → I rate the seller (sellerId)
  const targetId    = isSeller ? partnerId  : sellerId;
  const targetName  = isSeller ? partnerName : sellerName;
  const targetImage = isSeller ? partnerImage : sellerImage;
  const myRole      = isSeller ? "seller" : "buyer";
  const strengths   = isSeller ? BUYER_STRENGTHS : SELLER_STRENGTHS;
  const label       = isSeller
    ? `Rate ${partnerName} as a buyer`
    : `Rate ${sellerName} as a seller`;

  return (
    <div className="mx-4 my-3 rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-500/8 to-brand-500/5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-amber-500/20">
        <div className="w-7 h-7 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">You can now rate each other</p>
          <p className="text-xs text-gray-400">
            Sale confirmed for <span className="text-amber-300 font-medium">{listingTitle}</span>
          </p>
        </div>
      </div>

      {/* Review form */}
      <div className="px-4 py-4">
        <ReviewForm
          targetId={targetId}
          targetName={targetName}
          targetImage={targetImage}
          listingId={listingId}
          role={myRole}
          strengthOptions={strengths}
          existingReview={myExistingReview}
          label={label}
        />
      </div>
    </div>
  );
}
