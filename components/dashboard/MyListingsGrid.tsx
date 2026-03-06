"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ListingCard } from "@/components/listings/ListingCard";
import { Tag, CheckCircle2, Zap, Eye } from "lucide-react";

type ListingCardListing = Parameters<typeof ListingCard>[0]["listing"];
type Listing = ListingCardListing & { status: string; sale?: { id: string } | null; views?: number };

type Filter = "all" | "active" | "sold" | "views";

const EMPTY_MESSAGES: Record<Filter, { title: string; body: string }> = {
  all:    { title: "No listings yet",          body: "Post your first game and start selling!" },
  active: { title: "No active listings",        body: "All your listings are sold or inactive." },
  sold:   { title: "Nothing sold yet",          body: "Your sold games will appear here." },
  views:  { title: "No views yet",              body: "Listings with at least one view will appear here." },
};

export function MyListingsGrid({ listings, initialFilter }: { listings: Listing[]; initialFilter?: Filter }) {
  const router        = useRouter();
  const searchParams  = useSearchParams();
  const [filter, setFilter] = useState<Filter>((searchParams.get("filter") as Filter) ?? initialFilter ?? "all");

  // Keep state in sync when browser back/forward is used
  useEffect(() => {
    const f = searchParams.get("filter") as Filter | null;
    if (f && f !== filter) setFilter(f);
  }, [searchParams]);

  const updateFilter = (f: Filter) => {
    setFilter(f);
    const params = new URLSearchParams(window.location.search);
    if (f === "all") params.delete("filter");
    else params.set("filter", f);
    router.replace(`/dashboard${params.size ? "?" + params.toString() : ""}`, { scroll: false });
  };

  const counts = {
    all:    listings.length,
    active: listings.filter((l) => l.status === "active").length,
    sold:   listings.filter((l) => l.status === "sold" || l.sale).length,
    views:  listings.filter((l) => (l.views ?? 0) > 0).length,
  };

  const filtered = listings.filter((l) => {
    if (filter === "all")    return true;
    if (filter === "active") return l.status === "active";
    if (filter === "sold")   return l.status === "sold" || l.sale;
    if (filter === "views")  return (l.views ?? 0) > 0;
    return true;
  });

  // Sort viewed listings by views desc
  const sorted = filter === "views"
    ? [...filtered].sort((a, b) => (b.views ?? 0) - (a.views ?? 0))
    : filtered;

  const tabs: { key: Filter; label: string; icon: React.ReactNode; color: string }[] = [
    { key: "all",    label: "All",    icon: <Tag className="w-3.5 h-3.5" />,          color: "brand" },
    { key: "active", label: "Active", icon: <Zap className="w-3.5 h-3.5" />,          color: "brand" },
    { key: "sold",   label: "Sold",   icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: "green" },
    { key: "views",  label: "Viewed", icon: <Eye className="w-3.5 h-3.5" />,          color: "sky"   },
  ];

  const activeStyle: Record<string, string> = {
    brand: "bg-brand-500 border-brand-500 text-white shadow-lg shadow-brand-500/20",
    green: "bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/20",
    sky:   "bg-sky-500 border-sky-500 text-white shadow-lg shadow-sky-500/20",
  };
  const badgeStyle: Record<string, string> = {
    brand: "bg-white/20 text-white",
    green: "bg-white/20 text-white",
    sky:   "bg-white/20 text-white",
  };

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {tabs.map(({ key, label, icon, color }) => {
          const isActive = filter === key;
          return (
            <button
              key={key}
              onClick={() => updateFilter(key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                isActive
                  ? activeStyle[color]
                  : "bg-dark-800 border-dark-600 text-gray-400 hover:text-white hover:border-dark-500"
              }`}
            >
              {icon}
              {label}
              <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full font-bold ${
                isActive ? badgeStyle[color] : "bg-dark-700 text-gray-500"
              }`}>
                {counts[key]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid */}
      {sorted.length === 0 ? (
        <div className="card p-12 text-center">
          <Tag className="w-10 h-10 text-gray-500 mx-auto mb-3" />
          <h3 className="text-white font-semibold mb-2">{EMPTY_MESSAGES[filter].title}</h3>
          <p className="text-gray-400 text-sm mb-4">{EMPTY_MESSAGES[filter].body}</p>
          {filter === "all" && (
            <Link href="/listings/new" className="btn-primary inline-flex">Post a Game</Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {sorted.map((listing) => (
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
