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
      {/* Tab bar — Dribbble style */}
      <div className="relative flex mb-8" style={{borderBottom: "1px solid rgba(255,255,255,0.05)"}}>
        {tabs.map((tab, i) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              ref={el => { tabRefs.current[i] = el; }}
              onClick={() => setActiveTab(tab.key)}
              className="relative flex items-center gap-2.5 pb-3.5 pr-8"
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                outline: "none",
                transform: isActive ? "scale(1.04)" : "scale(1)",
                transformOrigin: "left center",
                transition: "transform 250ms cubic-bezier(0.34,1.56,0.64,1), color 200ms ease",
                color: isActive ? "#EAF2FF" : "#4a5568",
                fontWeight: isActive ? 600 : 400,
                fontSize: 14,
                letterSpacing: "-0.015em",
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.color = "#8FA3B8";
                  (e.currentTarget as HTMLElement).style.transform = "scale(1.02)";
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.color = "#4a5568";
                  (e.currentTarget as HTMLElement).style.transform = "scale(1)";
                }
              }}
            >
              {isActive && (
                <span className="absolute inset-x-0 bottom-0 h-8 pointer-events-none"
                  style={{
                    background: "radial-gradient(ellipse at 40% 100%, rgba(0,240,255,0.08) 0%, transparent 70%)",
                    filter: "blur(4px)",
                  }}
                />
              )}

              <span style={{position:"relative", zIndex:1}}>{tab.label}</span>

              <span style={{
                position: "relative",
                zIndex: 1,
                fontSize: 10,
                fontWeight: 600,
                padding: "2px 7px",
                borderRadius: 99,
                background: isActive ? "rgba(0,240,255,0.1)" : "rgba(255,255,255,0.04)",
                color: isActive ? "#00F0FF" : "#3a4a5a",
                border: `1px solid ${isActive ? "rgba(0,240,255,0.18)" : "rgba(255,255,255,0.06)"}`,
                transition: "all 200ms ease",
              }}>
                {tab.count}
              </span>
            </button>
          );
        })}

        {/* Sliding indicator */}
        <div className="absolute bottom-0 pointer-events-none"
          style={{
            left: ind.left,
            width: ind.width,
            height: 2,
            background: "linear-gradient(90deg, #00F0FF 0%, #7C3AED 100%)",
            borderRadius: 99,
            boxShadow: "0 0 8px rgba(0,240,255,0.45), 0 0 16px rgba(0,240,255,0.2)",
            transition: "left 0.28s cubic-bezier(0.4,0,0.2,1), width 0.28s cubic-bezier(0.4,0,0.2,1)",
            filter: "blur(0.3px)",
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
