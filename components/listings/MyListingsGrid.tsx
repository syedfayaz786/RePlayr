"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ListingCard } from "@/components/listings/ListingCard";
import { Tag, CheckCircle2, Zap, Eye, ArrowUpDown, ChevronDown, Clock } from "lucide-react";

type ListingCardListing = Parameters<typeof ListingCard>[0]["listing"];
type Listing = ListingCardListing & {
  status: string;
  sale?: { id: string } | null;
  views?: number;
  saleBuyer?: { id: string; name: string | null; image: string | null } | null;
  saleBuyerId?: string | null;
  buyerReview?: { id: string; rating: number; authorId: string } | null;
};

type Filter  = "all" | "available" | "pending" | "sold" | "views";
type SortKey = "newest" | "oldest" | "price_desc" | "price_asc" | "views_desc" | "title_asc";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "newest",     label: "Newest first"      },
  { key: "oldest",     label: "Oldest first"       },
  { key: "price_desc", label: "Price: High → Low"  },
  { key: "price_asc",  label: "Price: Low → High"  },
  { key: "views_desc", label: "Most viewed"         },
  { key: "title_asc",  label: "Title A → Z"        },
];

const EMPTY_MESSAGES: Record<Filter, { title: string; body: string }> = {
  all:       { title: "No listings yet",       body: "Post your first game and start selling!" },
  available: { title: "No available listings", body: "All your listings are sold or pending."  },
  pending:   { title: "No pending listings",   body: "Mark a listing as pending when you're in talks with a buyer." },
  sold:      { title: "Nothing sold yet",      body: "Your sold games will appear here."        },
  views:     { title: "No views yet",          body: "Listings with at least one view will appear here." },
};

// treat legacy DB value "active" as "available"
function isAvailable(s: string) { return s === "active" || s === "available"; }

// normalise any incoming filter value — map "active" → "available"
function normalise(f: string | null): Filter {
  if (!f) return "all";
  if (f === "active") return "available";
  if (["all", "available", "pending", "sold", "views"].includes(f)) return f as Filter;
  return "all";
}

// ── Inline tile with status overlay only ────────────────────────────────────
function ListingTile({ listing }: { listing: Listing }) {
  const status = listing.status === "active" ? "available" : listing.status;
  const isSold    = status === "sold" || !!listing.sale;
  const isPending = status === "pending";

  return (
    <div className="relative">
      <ListingCard listing={{ ...listing, status, isSeller: true, views: listing.views ?? 0 }} />

      {/* Sold overlay */}
      {isSold && (
        <>
          <div className="absolute inset-0 rounded-xl pointer-events-none"
            style={{ background: "rgba(10,12,28,0.55)", backdropFilter: "grayscale(60%)" }} />
          <div className="absolute left-0 right-0 top-0 bottom-[3.5rem] flex items-center justify-center pointer-events-none">
            <span className="px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-gray-500/30 backdrop-blur-sm border border-gray-400/40 text-gray-300 shadow-lg">
              Sold
            </span>
          </div>
        </>
      )}

      {/* Pending overlay */}
      {isPending && (
        <div className="absolute left-0 right-0 top-0 bottom-[3.5rem] flex items-center justify-center pointer-events-none">
          <span className="px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/25 backdrop-blur-sm border border-amber-400/50 text-amber-300 shadow-lg">
            Pending
          </span>
        </div>
      )}
    </div>
  );
}

export function MyListingsGrid({ listings, initialFilter }: { listings: Listing[]; initialFilter?: Filter }) {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [filter,   setFilter]   = useState<Filter>(normalise(searchParams.get("filter")) ?? initialFilter ?? "all");
  const [sort,     setSort]     = useState<SortKey>((searchParams.get("sort") as SortKey) ?? "newest");
  const [sortOpen, setSortOpen] = useState(false);

  useEffect(() => {
    const f = normalise(searchParams.get("filter"));
    const s = searchParams.get("sort") as SortKey | null;
    if (f !== filter) setFilter(f);
    if (s && s !== sort) setSort(s);
  }, [searchParams]);

  const updateFilter = (f: Filter) => {
    setFilter(f);
    const params = new URLSearchParams(window.location.search);
    if (f === "all") params.delete("filter"); else params.set("filter", f);
    router.replace(`/dashboard${params.size ? "?" + params.toString() : ""}`, { scroll: false });
  };

  const updateSort = (s: SortKey) => {
    setSort(s);
    setSortOpen(false);
    const params = new URLSearchParams(window.location.search);
    if (s === "newest") params.delete("sort"); else params.set("sort", s);
    router.replace(`/dashboard${params.size ? "?" + params.toString() : ""}`, { scroll: false });
  };

  const counts = {
    all:       listings.length,
    available: listings.filter((l) => isAvailable(l.status)).length,
    pending:   listings.filter((l) => l.status === "pending").length,
    sold:      listings.filter((l) => l.status === "sold" || l.sale).length,
    views:     listings.filter((l) => (l.views ?? 0) > 0).length,
  };

  const filtered = listings.filter((l) => {
    if (filter === "available") return isAvailable(l.status);
    if (filter === "pending")   return l.status === "pending";
    if (filter === "sold")      return l.status === "sold" || l.sale;
    if (filter === "views")     return (l.views ?? 0) > 0;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    switch (sort) {
      case "oldest":     return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case "price_desc": return b.price - a.price;
      case "price_asc":  return a.price - b.price;
      case "views_desc": return (b.views ?? 0) - (a.views ?? 0);
      case "title_asc":  return (a.title ?? "").localeCompare(b.title ?? "");
      default:           return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const tabs: { key: Filter; label: string; icon: React.ReactNode; color: string }[] = [
    { key: "all",       label: "All",       icon: <Tag className="w-3.5 h-3.5" />,          color: "brand" },
    { key: "available", label: "Available", icon: <Zap className="w-3.5 h-3.5" />,          color: "brand" },
    { key: "pending",   label: "Pending",   icon: <Clock className="w-3.5 h-3.5" />,        color: "amber" },
    { key: "sold",      label: "Sold",      icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: "green" },
    { key: "views",     label: "Viewed",    icon: <Eye className="w-3.5 h-3.5" />,          color: "sky"   },
  ];

  const activeStyle: Record<string, string> = {
    brand: "bg-brand-500 border-brand-500 text-white shadow-lg shadow-brand-500/20",
    amber: "bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/20",
    green: "bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/20",
    sky:   "bg-sky-500 border-sky-500 text-white shadow-lg shadow-sky-500/20",
  };

  const currentSortLabel = SORT_OPTIONS.find(o => o.key === sort)?.label ?? "Newest first";

  return (
    <div>
      {/* Filter tabs + Sort */}
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {tabs.map(({ key, label, icon, color }) => {
            const isActive = filter === key;
            return (
              <button key={key} onClick={() => updateFilter(key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                  isActive ? activeStyle[color] : "bg-dark-800 border-dark-600 text-gray-400 hover:text-white hover:border-dark-500"
                }`}>
                {icon}
                {label}
                <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full font-bold ${
                  isActive ? "bg-white/20 text-white" : "bg-dark-700 text-gray-500"
                }`}>{counts[key]}</span>
              </button>
            );
          })}
        </div>

        {/* Sort dropdown */}
        <div className="relative">
          <button onClick={() => setSortOpen(!sortOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-dark-800 border border-dark-600 text-sm text-gray-300 hover:text-white hover:border-dark-500 transition-all">
            <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
            <span>{currentSortLabel}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${sortOpen ? "rotate-180" : ""}`} />
          </button>
          {sortOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />
              <div className="absolute right-0 top-full mt-1 w-48 rounded-xl shadow-2xl z-20 overflow-hidden"
                style={{ background: "rgba(11,13,31,0.98)", border: "1px solid rgba(6,182,212,0.15)", backdropFilter: "blur(16px)" }}>
                {SORT_OPTIONS.map((option) => (
                  <button key={option.key} onClick={() => updateSort(option.key)}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      sort === option.key ? "text-brand-400 bg-brand-500/10" : "text-gray-300 hover:bg-dark-600/80 hover:text-white"
                    }`}>
                    {sort === option.key && <span className="mr-2">✓</span>}{option.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Grid */}
      {sorted.length === 0 ? (
        <div className="card p-12 text-center">
          <Tag className="w-10 h-10 text-gray-500 mx-auto mb-3" />
          <h3 className="text-white font-semibold mb-2">{EMPTY_MESSAGES[filter].title}</h3>
          <p className="text-gray-400 text-sm mb-4">{EMPTY_MESSAGES[filter].body}</p>
          {filter === "all" && <Link href="/listings/new" className="btn-primary inline-flex">Post a Game</Link>}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {sorted.map((listing) => (
            <ListingTile key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
