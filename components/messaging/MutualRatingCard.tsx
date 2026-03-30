"use client";

import { useState } from "react";
import { Star, Send, CheckCircle, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ErrorBanner, FieldError } from "@/components/ui/InlineError";
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
    <div className="flex flex-col gap-1" style={{ minHeight: 44 }}>
      <div className="flex gap-1">
        {[1,2,3,4,5].map((s) => (
          <button key={s} type="button" disabled={disabled}
            onClick={() => !disabled && onChange(s)}
            onMouseEnter={() => !disabled && setHovered(s)}
            onMouseLeave={() => setHovered(0)}
            className="disabled:cursor-default focus:outline-none">
            <Star className={`w-6 h-6 transition-colors duration-100 ${
              s <= active ? "fill-amber-400 text-amber-400" : "text-gray-600 hover:text-gray-400"
            }`} />
          </button>
        ))}
      </div>
      <p className="text-xs font-semibold text-amber-400 h-4">{active > 0 ? LABELS[active] : ""}</p>
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
              ? "bg-brand-700 border-brand-600 text-white"
              : "bg-dark-700 border-dark-600 text-gray-400 hover:border-brand-500/50 hover:text-white"
          } disabled:cursor-default`}>
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
  onRatingMessage?: (msgContent: string) => void;
}

export function MutualRatingCard({
  listingId, listingTitle, isSeller,
  partnerId, partnerName, partnerImage,
  sellerId, sellerName, sellerImage,
  myExistingReview, onRatingMessage,
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
  const [ratingError, setRatingError] = useState("");
  const [submitError, setSubmitError] = useState("");

  const submit = async () => {
    if (!rating) {
      setRatingError("Please select a star rating before submitting.");
      return;
    }
    setRatingError("");
    setSubmitError("");
    setSaving(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId, listingId, rating, comment: comment.trim() || null, strengths: selected, role: myRole }),
      });
      if (!res.ok) throw new Error();
      toast.success("Review submitted!");
      setSubmitted(true);
      onRatingMessage?.("");
    } catch {
      setSubmitError("Failed to submit review. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex justify-center px-3 py-2">
      <div className="w-full max-w-full sm:max-w-sm rounded-2xl border border-amber-500/25 bg-dark-800/90 overflow-hidden shadow-lg">
        <div className="flex items-center gap-2.5 px-4 py-2.5 bg-amber-500/8 border-b border-amber-500/20">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <p className="text-xs font-semibold text-white truncate">
            Sale confirmed · <span className="text-amber-300">{listingTitle}</span>
          </p>
        </div>

        <div className="px-4 py-3 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Link href={`/users/${targetId}`} target="_blank" className="flex-shrink-0 hover:ring-2 hover:ring-brand-500 rounded-full transition-all">
              {targetImage ? (
                <Image src={targetImage} alt={targetName} width={24} height={24} className="rounded-full" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 font-bold text-xs">
                  {targetName[0]?.toUpperCase()}
                </div>
              )}
            </Link>
            <span className="text-xs font-medium text-gray-300">
              {label.split(targetName)[0]}
              <Link href={`/users/${targetId}`} target="_blank" className="text-brand-400 hover:text-brand-300 transition-colors">{targetName}</Link>
              {label.split(targetName)[1]}
            </span>
          </div>

          {submitted ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1.5 text-green-400 text-xs font-medium">
                <CheckCircle className="w-3.5 h-3.5" />Review submitted
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
              <div>
                <StarPicker value={rating} onChange={(v) => { setRating(v); setRatingError(""); }} />
                <FieldError message={ratingError} />
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1.5">Highlight strengths</p>
                <StrengthPicker options={strengths} selected={selected} onChange={setSelected} />
              </div>

              <textarea value={comment} onChange={e => setComment(e.target.value)}
                placeholder="Add a comment (optional)…" rows={2}
                className="input-base text-xs resize-none py-2" />

              {submitError && <ErrorBanner message={submitError} onDismiss={() => setSubmitError("")} />}

              <button onClick={submit} disabled={saving || !rating}
                className="btn-primary text-xs py-2 flex items-center justify-center gap-1.5 disabled:opacity-50">
                {saving ? "Submitting…" : <><Send className="w-3 h-3" /> Submit Review</>}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
