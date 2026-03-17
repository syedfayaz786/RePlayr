"use client";

import { useState } from "react";
import { ListingCard } from "@/components/listings/ListingCard";
import { ReviewsTabs } from "@/components/ui/ReviewsTabs";

type Listing = {
  id: string;
  title: string;
  price: number;
  platform: string;
  condition: string;
  edition?: string | null;
  location?: string | null;
  images: string;
  status: string;
  views?: number;
  createdAt: string;
  seller: { id: string; name?: string | null; image?: string | null };
  _count?: { wishlistedBy: number };
};

type Review = {
  id: string;
  rating: number;
  comment?: string | null;
  strengths?: string | null;
  role: string;
  createdAt: string;
  author: { id: string; name?: string | null; image?: string | null };
};

interface Props {
  listings: Listing[];
  reviews: Review[];
}

export function ListingsReviewsTabs({ listings, reviews }: Props) {
  const [activeTab, setActiveTab] = useState<"listings" | "reviews">("listings");

  const tabs = [
    { key: "listings" as const, label: "Active Listings", count: listings.length },
    { key: "reviews"  as const, label: "Reviews",         count: reviews.length  },
  ];

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 mb-6 bg-dark-800 rounded-xl p-1 border border-dark-600">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? "bg-brand-500 text-white shadow"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <span>{tab.label}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded-md font-semibold ${
              activeTab === tab.key ? "bg-white/30 text-white" : "bg-dark-600 text-gray-300"
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Listings tab */}
      {activeTab === "listings" && (
        listings.length === 0 ? (
          <div className="card p-10 text-center text-gray-500 text-sm">No active listings</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )
      )}

      {/* Reviews tab */}
      {activeTab === "reviews" && (
        reviews.length === 0 ? (
          <div className="card p-10 text-center text-gray-500 text-sm">No reviews yet</div>
        ) : (
          <ReviewsTabs reviews={reviews} />
        )
      )}
    </div>
  );
}
