"use client";

import { useState, useRef, useEffect } from "react";
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
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [ind, setInd] = useState({ left: 0, width: 0 });

  const tabs = [
    { key: "listings" as const, label: "Active Listings", count: listings.length },
    { key: "reviews"  as const, label: "Reviews",         count: reviews.length  },
  ];

  const activeIdx = tabs.findIndex(t => t.key === activeTab);

  useEffect(() => {
    const el = tabRefs.current[activeIdx];
    if (el) setInd({ left: el.offsetLeft, width: el.offsetWidth });
  }, [activeIdx]);

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
                {tab.count}
              </span>
            </button>
          );
        })}
        {/* Sliding indicator */}
        <div className="absolute bottom-0 h-px"
          style={{
            left: ind.left,
            width: ind.width,
            background: "linear-gradient(90deg, #00F0FF, #7C3AED)",
            boxShadow: "0 0 6px rgba(0,240,255,0.25)",
            borderRadius: 99,
            transition: "left 0.25s cubic-bezier(0.4,0,0.2,1), width 0.25s cubic-bezier(0.4,0,0.2,1)",
          }}
        />
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
