"use client";

import { useState } from "react";
import Link from "next/link";
import { ListingCard } from "@/components/listings/ListingCard";
import { Tag, CheckCircle2, Zap } from "lucide-react";

type ListingCardListing = Parameters<typeof ListingCard>[0]["listing"];
type Listing = ListingCardListing & { status: string; sale?: { id: string } | null; views?: number };

type Filter = "all" | "active" | "sold";

export function MyListingsGrid({ listings }: { listings: Listing[] }) {
  const [filter, setFilter] = useState<Filter>("all");

  const counts = {
    all:    listings.length,
    active: listings.filter((l) => l.status === "active").length,
    sold:   listings.filter((l) => l.status === "sold" || l.sale).length,
  };

  const filtered = listings.filter((l) => {
    if (filter === "all")    return true;
    if (filter === "active") return l.status === "active";
    if (filter === "sold")   return l.status === "sold" || l.sale;
    return true;
  });

  const tabs: { key: Filter; label: string; icon: React.ReactNode }[] = [
    { key: "all",    label: "All",    icon: <Tag className="w-3.5 h-3.5" /> },
    { key: "active", label: "Active", icon: <Zap className="w-3.5 h-3.5" /> },
    { key: "sold",   label: "Sold",   icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  ];

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex items-center gap-2 mb-6">
        {tabs.map(({ key, label, icon }) => {
          const active = filter === key;
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                active
                  ? "bg-brand-500 border-brand-500 text-white shadow-lg shadow-brand-500/20"
                  : "bg-dark-800 border-dark-600 text-gray-400 hover:text-white hover:border-dark-500"
              }`}
            >
              {icon}
              {label}
              <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full font-bold ${
                active ? "bg-white/20 text-white" : "bg-dark-700 text-gray-500"
              }`}>
                {counts[key]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Tag className="w-10 h-10 text-gray-500 mx-auto mb-3" />
          {filter === "all" ? (
            <>
              <h3 className="text-white font-semibold mb-2">No listings yet</h3>
              <p className="text-gray-400 text-sm mb-4">Post your first game and start selling!</p>
              <Link href="/listings/new" className="btn-primary inline-flex">Post a Game</Link>
            </>
          ) : (
            <>
              <h3 className="text-white font-semibold mb-2">No {filter} listings</h3>
              <p className="text-gray-400 text-sm">
                {filter === "active" ? "You have no active listings right now." : "You haven't sold anything yet."}
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {filtered.map((listing) => (
            <div key={listing.id} className="relative">
              <ListingCard listing={{ ...listing, isSeller: true, views: listing.views ?? 0 }} />

              {/* Sold / inactive overlay */}
              {listing.status !== "active" && (
                <div className="absolute inset-0 rounded-xl bg-dark-900/60 flex items-center justify-center pointer-events-none">
                  <span className={`px-3 py-1 rounded-full border text-xs font-semibold uppercase tracking-wider ${
                    listing.status === "sold"
                      ? "bg-green-500/20 border-green-500/40 text-green-400"
                      : "bg-dark-800 border-dark-500 text-gray-400"
                  }`}>
                    {listing.status}
                  </span>
                </div>
              )}

              {/* Edit button */}
              <Link
                href={`/listings/${listing.id}/edit`}
                className="absolute bottom-[4.5rem] right-3 text-xs px-2.5 py-1 rounded-lg bg-dark-800/90 border border-dark-500 text-gray-300 hover:text-white hover:border-brand-500 transition-all"
              >
                Edit
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
