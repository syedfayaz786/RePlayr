"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { StarRating } from "@/components/ui/StarRating";
import { ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import Image from "next/image";

type Review = {
  id: string;
  rating: number;
  comment?: string | null;
  strengths?: string | null;
  role: string;
  createdAt: string;
  author: { id: string; name?: string | null; image?: string | null };
};

type SortKey = "newest" | "oldest" | "rating_high" | "rating_low";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "newest",      label: "Newest first" },
  { value: "oldest",      label: "Oldest first" },
  { value: "rating_high", label: "Rating: High to Low" },
  { value: "rating_low",  label: "Rating: Low to High" },
];

const PAGE_SIZE = 10;

function avgRating(reviews: Review[]) {
  if (!reviews.length) return 0;
  return reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
}

function StarAvg({ reviews, active }: { reviews: Review[]; active?: boolean }) {
  if (!reviews.length) return null;
  const avg = avgRating(reviews);
  const rounded = Math.round(avg);
  return (
    <span className="flex items-center gap-1 ml-1">
      <span className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg key={i} className="w-3 h-3" viewBox="0 0 24 24" fill="none">
            <polygon
              points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
              fill={i < rounded ? (active ? "#041018" : "#00F0FF") : "none"}
              stroke={i < rounded ? (active ? "#041018" : "#00F0FF") : (active ? "rgba(4,16,24,0.3)" : "rgba(255,255,255,0.12)")}
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            />
          </svg>
        ))}
      </span>
      <span className={`text-xs font-semibold ${active ? "text-[#041018]" : "text-[#9FB0C3]"}`}>{avg.toFixed(1)}</span>
    </span>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const chips = useMemo(() => {
    try { const p = JSON.parse(review.strengths ?? "[]"); return Array.isArray(p) ? p : []; }
    catch { return []; }
  }, [review.strengths]);

  return (
    <div className="flex gap-3 p-4 rounded-xl bg-dark-700 border border-dark-500 hover:border-dark-400 transition-colors">
      <a href={`/users/${review.author.id}`} className="flex-shrink-0">
        {review.author.image ? (
          <Image src={review.author.image} alt={review.author.name ?? ""} width={36} height={36}
            className="rounded-full hover:ring-2 hover:ring-brand-500 transition-all" />
        ) : (
          <div className="w-9 h-9 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-300 text-sm font-bold">
            {review.author.name?.[0]?.toUpperCase() ?? "?"}
          </div>
        )}
      </a>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <a href={`/users/${review.author.id}`} className="text-sm font-medium text-white hover:text-brand-400 transition-colors">
            {review.author.name ?? "Anonymous"}
          </a>
          <StarRating rating={review.rating} size="sm" />
          <span className="text-xs text-gray-500">
            {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" })
              .format(new Date(review.createdAt))}
          </span>
        </div>
        {chips.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {chips.map((s: string) => (
              <span key={s} className="text-xs px-2.5 py-0.5 rounded-full bg-brand-500/15 border border-brand-500/30 text-brand-300">{s}</span>
            ))}
          </div>
        )}
        {review.comment && (
          <p className="text-sm text-gray-300 mt-1.5 leading-relaxed">{review.comment}</p>
        )}
      </div>
    </div>
  );
}

function ReviewList({ reviews }: { reviews: Review[] }) {
  const [sort, setSort] = useState<SortKey>("newest");
  const [page, setPage] = useState(1);
  const [showSortMenu, setShowSortMenu] = useState(false);

  const sorted = useMemo(() => {
    const copy = [...reviews];
    switch (sort) {
      case "newest":      return copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case "oldest":      return copy.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      case "rating_high": return copy.sort((a, b) => b.rating - a.rating);
      case "rating_low":  return copy.sort((a, b) => a.rating - b.rating);
    }
  }, [reviews, sort]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSort = (val: SortKey) => {
    setSort(val);
    setPage(1);
    setShowSortMenu(false);
  };

  return (
    <div>
      {/* Sort control */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-500">{reviews.length} review{reviews.length !== 1 ? "s" : ""}</span>
        <div className="relative">
          <button
            onClick={() => setShowSortMenu(v => !v)}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white px-2.5 py-1.5 rounded-lg bg-dark-700 border border-dark-600 hover:border-dark-500 transition-colors"
          >
            <ArrowUpDown className="w-3 h-3" />
            {SORT_OPTIONS.find(o => o.value === sort)?.label}
          </button>
          {showSortMenu && (
            <div className="absolute right-0 top-full mt-1 bg-dark-800 border border-dark-600 rounded-xl shadow-2xl z-20 min-w-[170px] overflow-hidden">
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleSort(opt.value)}
                  className={`w-full text-left px-4 py-2.5 text-xs transition-colors hover:bg-dark-700 ${
                    sort === opt.value ? "text-brand-400 font-semibold" : "text-gray-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Review cards */}
      <div className="space-y-3">
        {paginated.map(review => <ReviewCard key={review.id} review={review} />)}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-5">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-1.5 rounded-lg bg-dark-700 border border-dark-600 text-gray-400 hover:text-white hover:border-dark-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
            .reduce<(number | "…")[]>((acc, n, i, arr) => {
              if (i > 0 && n - (arr[i - 1] as number) > 1) acc.push("…");
              acc.push(n);
              return acc;
            }, [])
            .map((n, i) =>
              n === "…" ? (
                <span key={`ellipsis-${i}`} className="text-xs text-gray-600 px-1">…</span>
              ) : (
                <button
                  key={n}
                  onClick={() => setPage(n as number)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                    page === n
                      ? "bg-brand-500 text-white"
                      : "bg-dark-700 border border-dark-600 text-gray-400 hover:text-white hover:border-dark-500"
                  }`}
                >
                  {n}
                </button>
              )
            )}

          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-1.5 rounded-lg bg-dark-700 border border-dark-600 text-gray-400 hover:text-white hover:border-dark-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export function ReviewsTabs({ reviews }: { reviews: Review[] }) {
  const asSellerReviews = reviews.filter((r) => r.role === "buyer");
  const asBuyerReviews  = reviews.filter((r) => r.role === "seller");

  const [activeTab, setActiveTab] = useState<"seller" | "buyer">(
    asSellerReviews.length > 0 ? "seller" : "buyer"
  );

  if (!reviews.length) return null;

  const tabs = [
    { key: "seller" as const, label: "As a Seller", reviews: asSellerReviews },
    { key: "buyer"  as const, label: "As a Buyer",  reviews: asBuyerReviews  },
  ].filter((t) => t.reviews.length > 0);

  const active = tabs.find((t) => t.key === activeTab) ?? tabs[0];

  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const activeIdx = tabs.findIndex(t => t.key === activeTab);

  useEffect(() => {
    const el = tabRefs.current[activeIdx];
    if (el) {
      setIndicatorStyle({ left: el.offsetLeft, width: el.offsetWidth });
    }
  }, [activeIdx, tabs.length]);

  return (
    <div>
      {/* Tab bar */}
      <div className="relative flex mb-8" style={{borderBottom: "1px solid rgba(255,255,255,0.06)"}}>
        {tabs.map((tab, i) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              ref={el => { tabRefs.current[i] = el; }}
              onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-2 pb-3 pr-6 text-sm transition-colors duration-200"
              style={{
                color: isActive ? "#EAF2FF" : "#5C6B7A",
                fontWeight: isActive ? 500 : 400,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                outline: "none",
                letterSpacing: "-0.01em",
              }}
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.color = "#9FB0C3"; }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.color = "#5C6B7A"; }}
            >
              {tab.label}
              <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium tabular-nums"
                style={{
                  background: isActive ? "rgba(0,240,255,0.08)" : "rgba(255,255,255,0.04)",
                  color: isActive ? "#00F0FF" : "#3d4f66",
                }}>
                {tab.reviews.length}
              </span>
              <StarAvg reviews={tab.reviews} active={isActive} />
            </button>
          );
        })}
        {/* Sliding indicator */}
        <div className="absolute bottom-0 h-px"
          style={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
            background: "linear-gradient(90deg, #00F0FF, #7C3AED)",
            boxShadow: "0 0 6px rgba(0,240,255,0.25)",
            borderRadius: 99,
            transition: "left 0.25s cubic-bezier(0.4,0,0.2,1), width 0.25s cubic-bezier(0.4,0,0.2,1)",
          }}
        />
      </div>

      {/* Sorted + paginated list — key resets state when tab changes */}
      <ReviewList key={active.key} reviews={active.reviews} />
    </div>
  );
}
