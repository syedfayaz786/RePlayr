"use client";

import { useState } from "react";
import { StarRating } from "@/components/ui/StarRating";
import Image from "next/image";

type Review = {
  id: string;
  rating: number;
  comment?: string | null;
  role: string;
  createdAt: string;
  author: { id: string; name?: string | null; image?: string | null };
};

function avgRating(reviews: Review[]) {
  if (!reviews.length) return 0;
  return reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
}

function StarAvg({ reviews }: { reviews: Review[] }) {
  if (!reviews.length) return null;
  const avg = avgRating(reviews);
  return (
    <span className="flex items-center gap-1 ml-2">
      <StarRating rating={Math.round(avg)} size="sm" />
      <span className="text-xs text-gray-400">{avg.toFixed(1)}</span>
    </span>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="flex gap-3 p-4 rounded-xl bg-dark-700 border border-dark-500 hover:border-dark-400 transition-colors">
      <a href={`/users/${review.author.id}`} className="flex-shrink-0">
        {review.author.image ? (
          <Image
            src={review.author.image}
            alt={review.author.name ?? ""}
            width={36}
            height={36}
            className="rounded-full hover:ring-2 hover:ring-brand-500 transition-all"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-300 text-sm font-bold">
            {review.author.name?.[0]?.toUpperCase() ?? "?"}
          </div>
        )}
      </a>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={`/users/${review.author.id}`}
            className="text-sm font-medium text-white hover:text-brand-400 transition-colors"
          >
            {review.author.name ?? "Anonymous"}
          </a>
          <StarRating rating={review.rating} size="sm" />
          <span className="text-xs text-gray-500">
            {new Intl.DateTimeFormat("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }).format(new Date(review.createdAt))}
          </span>
        </div>
        {review.comment && (
          <p className="text-sm text-gray-300 mt-1 leading-relaxed">{review.comment}</p>
        )}
      </div>
    </div>
  );
}

export function ReviewsTabs({ reviews }: { reviews: Review[] }) {
  // role = author's role: "buyer" means this user was the seller; "seller" means this user was the buyer
  const asSellerReviews = reviews.filter((r) => r.role === "buyer");
  const asBuyerReviews = reviews.filter((r) => r.role === "seller");

  const [activeTab, setActiveTab] = useState<"seller" | "buyer">(
    asSellerReviews.length > 0 ? "seller" : "buyer"
  );

  if (!reviews.length) return null;

  const tabs = [
    { key: "seller" as const, label: "As a Seller", reviews: asSellerReviews },
    { key: "buyer" as const, label: "As a Buyer", reviews: asBuyerReviews },
  ].filter((t) => t.reviews.length > 0);

  const active = tabs.find((t) => t.key === activeTab) ?? tabs[0];

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 mb-5 bg-dark-800 rounded-xl p-1 border border-dark-600">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? "bg-brand-500 text-white shadow"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-xs px-1.5 py-0.5 rounded-md ${
                activeTab === tab.key ? "bg-white/20" : "bg-dark-600"
              }`}
            >
              {tab.reviews.length}
            </span>
            <StarAvg reviews={tab.reviews} />
          </button>
        ))}
      </div>

      {/* Review tiles */}
      <div className="space-y-3">
        {active.reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </div>
  );
}
