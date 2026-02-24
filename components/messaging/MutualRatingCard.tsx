"use client";

import { useState } from "react";
import { Star, Send, CheckCircle, Sparkles } from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";

const SELLER_STRENGTHS = [
  "Fast response","Great communication","Item as described",
  "Fair pricing","Flexible pickup","Professional",
  "Trustworthy","Punctual","Well packaged","Smooth transaction",
];
const BUYER_STRENGTHS = [
  "Punctual","Fair negotiation","Great communication",
  "Reliable","Respectful","Quick decision",
  "Easy to deal with","Showed up on time","Paid as agreed","Would trade again",
];

const LABELS: Record<number, string> = { 1:"Poor", 2:"Fair", 3:"Good", 4:"Great", 5:"Excellent!" };

function StarPicker({ value, onChange, disabled }: { value: number; onChange: (v: number) => void; disabled?: boolean }) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;
  return (
    // Fixed height container prevents layout shift when label appears
    <div className="flex flex-col gap-1" style={{ minHeight: 44 }}>
      <div className="flex gap-1">
        {[1,2,3,4,5].map((s) => (
          <button key={s} type="button" disabled={disabled}
            onClick={() => !disabled && onChange(s)}
            onMouseEnter={() => !disabled && setHovered(s)}
            onMouseLeave={() => setHovered(0)}
            // No transform on hover — that's what causes flicker by triggering layout
            className="disabled:cursor-default focus:outline-none"
          >
            <Star className={`w-6 h-6 transition-colors duration-100 ${
              s <= active ? "fill-amber-400 text-amber-400" : "text-gray-600 hover:text-gray-400"
            }`} />
          </button>
        ))}
      </div>
      {/* Reserve space always so no layout shift */}
      <p className="text-xs font-semibold text-amber-400 h-4">
        {active > 0 ? LABELS[active] : ""}
      </p>
    </div>
  );
}

function StrengthPicker({ options, selected, onChange, disabled }: {
  options: string[]; selected: string[];
  onChange: (v: string[]) => void; disabled?: boolean;
}) {
  const toggle = (s: string) => {
    if (disabled) return;
    onChange(selected.includes(s) ? selected.filter(x => x !== s) : [...selected, s]);
  };
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(s => (
        <button key={s} type="button" onClick={() => toggle(s)} disabled={disabled}
          className={`text-xs px-2.5 py-1 rounded-full border transition-colors duration-100 ${
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

interface MutualRatingCardProps {
  listingId: string;
  listingTitle: string;
  currentUserId: string;
  isSeller: boolean;
  partnerId: string;
  partnerName: string;
  partnerImage?: string | null;
  currentUserName: string;
  sellerId: string;
  sellerName: string;
  sellerImage?: string | null;
  myExistingReview: { rating: number; comment: string | null; strengths: string[] } | null;
  /** Called with the formatted rating message content after successful submission */
  onRatingMessage?: (msgContent: string) => void;
}

export function MutualRatingCard({
  listingId, listingTitle, isSeller,
  partnerId, partnerName, partnerImage,
  sellerId, sellerName, sellerImage,
  myExistingReview,
  onRatingMessage,
}: MutualRatingCardProps) {
  const targetId    = isSeller ? partnerId   : sellerId;
  const targetName  = isSeller ? partnerName : sellerName;
  const targetImage = isSeller ? partnerImage : sellerImage;
  const myRole      = isSeller ? "seller" : "buyer";
  const strengths   = isSeller ? BUYER_STRENGTHS : SELLER_STRENGTHS;
  const label       = isSeller ? `Rate ${partnerName} as a buyer` : `Rate ${sellerName} as a seller`;

  const [rating,    setRating]    = useState(myExistingReview?.rating ?? 0);
  const [comment,   setComment]   = useState(myExistingReview?.comment ?? "");
  const [selected,  setSelected]  = useState<string[]>(myExistingReview?.strengths ?? []);
  const [submitted, setSubmitted] = useState(!!myExistingReview);
  const [saving,    setSaving]    = useState(false);

  const submit = async () => {
    if (!rating) { toast.error("Please select a star rating"); return; }
    setSaving(true);
    try {
      // 1. Save the review
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId, listingId, rating, comment: comment.trim() || null, strengths: selected, role: myRole }),
      });
      if (!res.ok) throw new Error();

      // 2. Build a human-readable message to send to the other party
      const stars = "★".repeat(rating) + "☆".repeat(5 - rating);
      const roleLabel = isSeller ? "buyer" : "seller";
      const strengthLine = selected.length > 0 ? `\n✨ ${selected.join(" · ")}` : "";
      const commentLine  = comment.trim() ? `\n"${comment.trim()}"` : "";
      const msgContent = `⭐ Rating received\n${stars} ${LABELS[rating]} — rated you as a ${roleLabel}${strengthLine}${commentLine}`;

      // 3. Send as a real message so it shows in chat + triggers navbar badge
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: targetId, content: msgContent, listingId }),
      });

      toast.success("Review submitted!");
      setSubmitted(true);
      // Notify parent (MessageThread) to append the message locally without reload
      onRatingMessage?.(msgContent);
    } catch {
      toast.error("Failed to submit review");
    } finally {
      setSaving(false);
    }
  };

  return (
    // Rendered as a normal flow element inside the scrollable message list
    <div className="flex justify-center px-3 py-2">
      <div className="w-full max-w-sm rounded-2xl border border-amber-500/25 bg-dark-800/90 overflow-hidden shadow-lg">

        {/* Header */}
        <div className="flex items-center gap-2.5 px-4 py-2.5 bg-amber-500/8 border-b border-amber-500/20">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <p className="text-xs font-semibold text-white truncate">
            Sale confirmed · <span className="text-amber-300">{listingTitle}</span>
          </p>
        </div>

        <div className="px-4 py-3 flex flex-col gap-3">

          {/* Who am I rating */}
          <div className="flex items-center gap-2">
            {targetImage ? (
              <Image src={targetImage} alt={targetName} width={24} height={24} className="rounded-full flex-shrink-0" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 font-bold text-xs flex-shrink-0">
                {targetName[0]?.toUpperCase()}
              </div>
            )}
            <span className="text-xs font-medium text-gray-300">{label}</span>
          </div>

          {submitted ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1.5 text-green-400 text-xs font-medium">
                <CheckCircle className="w-3.5 h-3.5" />
                Review submitted
              </div>
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} className={`w-4 h-4 ${s <= rating ? "fill-amber-400 text-amber-400" : "text-gray-600"}`} />
                ))}
                <span className="text-xs text-amber-400 ml-1 font-medium">{LABELS[rating]}</span>
              </div>
              {selected.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selected.map(s => (
                    <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">{s}</span>
                  ))}
                </div>
              )}
              {comment && <p className="text-xs text-gray-400 italic">"{comment}"</p>}
            </div>
          ) : (
            <>
              <StarPicker value={rating} onChange={setRating} />

              <div>
                <p className="text-xs text-gray-500 mb-1.5">Highlight strengths</p>
                <StrengthPicker options={strengths} selected={selected} onChange={setSelected} />
              </div>

              <textarea value={comment} onChange={e => setComment(e.target.value)}
                placeholder="Add a comment (optional)…" rows={2}
                className="input-base text-xs resize-none py-2"
              />

              <button onClick={submit} disabled={saving || !rating}
                className="btn-primary text-xs py-2 flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {saving ? "Submitting…" : <><Send className="w-3 h-3" /> Submit Review</>}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
