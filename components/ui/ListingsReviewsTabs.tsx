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
      {/* Tab bar — floating segmented control */}
      <div className="inline-flex w-full mb-6 p-1.5 rounded-2xl"
        style={{
          background: "rgba(255,255,255,0.03)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium transition-all duration-200"
              style={{
                borderRadius: 12,
                background: isActive ? "linear-gradient(135deg, #00F0FF, #7C3AED)" : "transparent",
                color: isActive ? "#041018" : "#8FA3B8",
                boxShadow: isActive ? "0 4px 20px rgba(0,240,255,0.2)" : "none",
                transform: isActive ? "translateY(-1px)" : "translateY(0)",
              }}
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.color = "#EAF2FF"; }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.color = "#8FA3B8"; }}
            >
              <span className="tracking-tight">{tab.label}</span>
              <span className="text-[11px] px-1.5 py-0.5 rounded-md font-semibold"
                style={{
                  background: isActive ? "rgba(4,16,24,0.2)" : "rgba(255,255,255,0.06)",
                  color: isActive ? "#041018" : "#5C6B7A",
                }}>
                {tab.count}
              </span>
            </button>
          );
        })}
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
