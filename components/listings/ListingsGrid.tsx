"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowUpDown } from "lucide-react";
import { ListingCard } from "@/components/listings/ListingCard";
import { TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

const PAGE_SIZE_OPTIONS = [50, 100, 150, 200];

interface Listing {
  id: string;
  title: string;
  price: number;
  platform: string;
  edition: string | null;
  condition: string;
  location: string | null;
  images: string;
  status: string;
  createdAt: string;
  sellerId: string;
  seller: { id: string; name: string | null; image: string | null };
  _count: { wishlistedBy: number };
}

interface FetchResult {
  listings: Listing[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

function PaginationBar({
  page, totalPages, onPageChange,
}: {
  page: number; totalPages: number; onPageChange: (p: number) => void;
}) {
  const pages: (number | "…")[] = [];
  const W = 2;
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - W && i <= page + W)) {
      pages.push(i);
    } else if ((i === 2 && page - W > 2) || (i === totalPages - 1 && page + W < totalPages - 1)) {
      pages.push("…");
    }
  }
  const deduped = pages.filter((p, i) => !(p === "…" && pages[i - 1] === "…"));

  return (
    <div className="flex items-center justify-center gap-2 mt-12">
      <button
        onClick={() => onPageChange(page - 1)} disabled={page <= 1}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-dark-500 bg-dark-700 text-gray-300 hover:border-brand-500/60 hover:text-brand-300 transition-all text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="w-4 h-4" /> Prev
      </button>
      <div className="flex items-center gap-1">
        {deduped.map((p, i) =>
          p === "…" ? (
            <span key={`el-${i}`} className="w-9 h-9 flex items-center justify-center text-gray-500 text-sm">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-medium transition-all ${
                p === page
                  ? "bg-brand-500 text-white shadow-lg shadow-brand-500/25"
                  : "bg-dark-700 border border-dark-500 text-gray-300 hover:border-brand-500/60 hover:text-brand-300"
              }`}
            >
              {p}
            </button>
          )
        )}
      </div>
      <button
        onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-dark-500 bg-dark-700 text-gray-300 hover:border-brand-500/60 hover:text-brand-300 transition-all text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Next <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

export function ListingsGrid({ isSearching }: { isSearching: boolean }) {
  const searchParams = useSearchParams();
  const [userCoords, setUserCoords] = useState<{lat: number; lng: number} | null>(null);
  const router = useRouter();
  const gridRef = useRef<HTMLDivElement>(null);

  const [page,    setPage]    = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [data,    setData]    = useState<FetchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [fadeKey, setFadeKey] = useState(0);

  const paramStr = searchParams.toString();

  // Get user location once on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {} // silently ignore if denied
      );
    }
  }, []);
  const prevParamStr = useRef(paramStr);
  useEffect(() => {
    if (paramStr !== prevParamStr.current) {
      prevParamStr.current = paramStr;
      setPage(1);
    }
  }, [paramStr]);

  const fetchListings = useCallback(async (p: number, pp: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", String(p));
      params.set("perPage", String(pp));
      if (userCoords) {
        params.set("userLat", userCoords.lat.toString());
        params.set("userLng", userCoords.lng.toString());
      }
      const res = await fetch(`/api/listings?${params.toString()}`);
      const json = await res.json();
      setData(json);
      setFadeKey((k) => k + 1);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [searchParams, userCoords]);

  useEffect(() => {
    fetchListings(page, perPage);
  }, [fetchListings, page, perPage]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handlePerPage = (size: number) => {
    setPerPage(size);
    setPage(1);
  };

  const total      = data?.total      ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const listings   = data?.listings   ?? [];
  const start      = total === 0 ? 0 : (page - 1) * perPage + 1;
  const end        = Math.min(page * perPage, total);

  return (
    <div ref={gridRef} className="scroll-mt-4">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="section-title">
            {isSearching
              ? `${total} result${total !== 1 ? "s" : ""} found`
              : "Recent Listings"}
          </h2>
          {total > 0 && (
            <p className="text-gray-400 text-sm mt-1">
              Showing {start}–{end} of {total} listings
              {totalPages > 1 && ` · Page ${page} of ${totalPages}`}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {!isSearching && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <TrendingUp className="w-4 h-4 text-brand-400" />
              <span className="text-slate-300">Updated live</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-300 whitespace-nowrap">Per page:</span>
            <div className="flex gap-1">
              {PAGE_SIZE_OPTIONS.map((size) => (
                <button
                  key={size}
                  onClick={() => handlePerPage(size)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    perPage === size
                      ? "bg-brand-500 text-white"
                      : "bg-dark-700 border border-dark-500 text-slate-300 hover:border-brand-500/50 hover:text-white"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Platform quick filters — multiselect pills */}
      {(() => {
        const activePlatforms = (searchParams.get("platform") ?? "")
          .split(",").map(s => s.trim()).filter(Boolean);

        const pills = [
          { label: "PS5",             value: "PlayStation 5" },
          { label: "PS4",             value: "PlayStation 4" },
          { label: "Xbox Series",     value: "Xbox Series X/S" },
          { label: "Nintendo Switch", value: "Nintendo Switch" },
          { label: "PC",              value: "PC" },
        ];

        const toggle = (value: string) => {
          let next: string[];
          if (activePlatforms.includes(value)) {
            next = activePlatforms.filter(p => p !== value);
          } else {
            next = [...activePlatforms, value];
          }
          const params = new URLSearchParams(searchParams.toString());
          if (next.length) params.set("platform", next.join(","));
          else params.delete("platform");
          params.delete("page");
          // Use router push to update URL without full reload
          router.push(`/?${params.toString()}`);
        };

        const clearAll = () => {
          const params = new URLSearchParams(searchParams.toString());
          params.delete("platform");
          params.delete("page");
          router.push(`/?${params.toString()}`);
        };

        return (
          <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 flex-wrap">
            {/* All / Clear button */}
            <button
              onClick={clearAll}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm border transition-all ${
                activePlatforms.length === 0
                  ? "bg-brand-500 border-brand-500 text-white font-semibold"
                  : "bg-dark-700 border-dark-500 hover:border-brand-500 hover:text-brand-400 text-gray-300"
              }`}
            >
              All
            </button>

            {pills.map(({ label, value }) => {
              const isActive = activePlatforms.includes(value);
              return (
                <button
                  key={label}
                  onClick={() => toggle(value)}
                  className={`whitespace-nowrap px-4 py-2 rounded-full text-sm border transition-all ${
                    isActive
                      ? "bg-brand-500 border-brand-500 text-white font-semibold"
                      : "bg-dark-700 border-dark-500 hover:border-brand-500 hover:text-brand-400 text-gray-300"
                  }`}
                >
                  {label}
                </button>
              );
            })}
            {/* Sort dropdown — right aligned */}
            <div className="ml-auto flex items-center gap-2 flex-shrink-0">
              <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
              <select
                value={searchParams.get("sort") ?? "newest"}
                onChange={(e) => {
                  const params = new URLSearchParams(searchParams.toString());
                  if (e.target.value === "newest") params.delete("sort");
                  else params.set("sort", e.target.value);
                  params.delete("page");
                  router.push(`/?${params.toString()}`);
                }}
                className="bg-dark-700 border border-dark-500 text-gray-300 text-sm rounded-lg px-3 py-1.5 hover:border-brand-500/50 focus:outline-none focus:border-brand-500 transition-colors"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="distance_asc">Nearest first</option>
                <option value="distance_desc">Furthest first</option>
                <option value="price_asc">Price: Low → High</option>
                <option value="price_desc">Price: High → Low</option>
              </select>
            </div>
          </div>
        );
      })()}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card aspect-[3/4] animate-pulse bg-dark-700" />
          ))}
        </div>
      ) : listings.length > 0 ? (
        <div key={fadeKey} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 animate-fade-in">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        <div className="text-center py-24">
          <div className="text-6xl mb-4">🎮</div>
          <h3 className="text-xl font-semibold text-white mb-2">No listings found</h3>
          <p className="text-gray-400 mb-6">
            {isSearching ? "Try adjusting your filters or search terms" : "Be the first to list a game in your area!"}
          </p>
          <Link href="/listings/new" className="btn-primary inline-flex">Post a Listing</Link>
        </div>
      )}

      {!loading && totalPages > 1 && (
        <PaginationBar page={page} totalPages={totalPages} onPageChange={handlePageChange} />
      )}
    </div>
  );
}
