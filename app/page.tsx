import { Suspense } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SearchBar } from "@/components/listings/SearchBar";
import { ListingCard } from "@/components/listings/ListingCard";
import { Pagination } from "@/components/listings/Pagination";
import { prisma } from "@/lib/prisma";
import { Gamepad2, TrendingUp, Users, ShieldCheck } from "lucide-react";
import Link from "next/link";

const PAGE_SIZE_OPTIONS = [50, 100, 150, 200];
const DEFAULT_PAGE_SIZE = 50;

async function getListings(searchParams: Record<string, string>) {
  try {
    const where: any = { status: "active" };

    if (searchParams.q) {
      where.OR = [
        { title: { contains: searchParams.q, mode: "insensitive" } },
        { description: { contains: searchParams.q, mode: "insensitive" } },
      ];
    }
    if (searchParams.platform) {
      const platformList = searchParams.platform.split(",").map((p: string) => p.trim()).filter(Boolean);
      if (platformList.length === 1) {
        where.platform = platformList[0];
      } else if (platformList.length > 1) {
        where.platform = { in: platformList };
      }
    }
    if (searchParams.condition) where.condition = searchParams.condition;
    if (searchParams.minPrice || searchParams.maxPrice) {
      where.price = {};
      if (searchParams.minPrice) where.price.gte = parseFloat(searchParams.minPrice);
      if (searchParams.maxPrice) where.price.lte = parseFloat(searchParams.maxPrice);
    }

    const pageSize = Math.min(
      PAGE_SIZE_OPTIONS.includes(parseInt(searchParams.perPage))
        ? parseInt(searchParams.perPage)
        : DEFAULT_PAGE_SIZE,
      200
    );
    const page   = Math.max(1, parseInt(searchParams.page ?? "1") || 1);
    const skip   = (page - 1) * pageSize;

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: {
          seller: { select: { id: true, name: true, image: true } },
          _count: { select: { wishlistedBy: true } },
        },
        orderBy: { createdAt: "desc" },
        take: pageSize,
        skip,
      }),
      prisma.listing.count({ where }),
    ]);

    return { listings, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  } catch (err) {
    console.error("Failed to fetch listings:", err);
    return { listings: [], total: 0, page: 1, pageSize: DEFAULT_PAGE_SIZE, totalPages: 0 };
  }
}

async function getStats() {
  try {
    const [totalListings, totalUsers] = await Promise.all([
      prisma.listing.count({ where: { status: "active" } }),
      prisma.user.count(),
    ]);
    return { totalListings, totalUsers };
  } catch {
    return { totalListings: 0, totalUsers: 0 };
  }
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const [{ listings, total, page, pageSize, totalPages }, stats] = await Promise.all([
    getListings(searchParams),
    getStats(),
  ]);

  const isSearching = !!(searchParams.q || searchParams.platform || searchParams.condition || searchParams.minPrice || searchParams.maxPrice);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero — only when not filtering */}
      {!isSearching && (
        <section className="relative overflow-hidden bg-dark-800 border-b border-dark-600">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl" />
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 rounded-full px-4 py-2 text-sm text-brand-400 mb-6">
                <Gamepad2 className="w-4 h-4" />
                {stats.totalListings} games listed near you
              </div>
              <h1 className="font-display text-5xl sm:text-6xl font-bold text-white mb-6 leading-tight">
                Trade Game Discs{" "}
                <span className="gradient-text">Locally</span>
              </h1>
              <p className="text-gray-400 text-lg mb-8 text-balance">
                Buy and sell video game discs with gamers in your neighbourhood.
                No subscriptions, no shipping — just local deals.
              </p>
              <div className="flex items-center justify-center gap-8 mb-10">
                {[
                  { icon: Gamepad2, label: "Active Listings", value: stats.totalListings },
                  { icon: Users,    label: "Gamers",          value: stats.totalUsers },
                  { icon: ShieldCheck, label: "Trusted Platform", value: "100%" },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="text-center">
                    <div className="text-2xl font-display font-bold text-brand-400">{value}</div>
                    <div className="text-xs text-gray-500">{label}</div>
                  </div>
                ))}
              </div>
              <Suspense>
                <SearchBar />
              </Suspense>
            </div>
          </div>
        </section>
      )}

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 w-full py-10">
        {isSearching && (
          <div className="mb-8">
            <Suspense><SearchBar /></Suspense>
          </div>
        )}

        {/* Section header with per-page selector */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="section-title">
              {isSearching
                ? `${total} result${total !== 1 ? "s" : ""} found`
                : "Recent Listings"}
            </h2>
            {!isSearching && (
              <p className="text-gray-400 text-sm mt-1">
                Showing {listings.length === 0 ? 0 : (page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total} listings
              </p>
            )}
            {isSearching && total > 0 && (
              <p className="text-gray-400 text-sm mt-1">
                Page {page} of {totalPages}
              </p>
            )}
          </div>

          {/* Per-page picker */}
          <div className="flex items-center gap-3">
            {!isSearching && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <TrendingUp className="w-4 h-4 text-brand-400" />
                Updated live
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 whitespace-nowrap">Per page:</span>
              <div className="flex gap-1">
                {PAGE_SIZE_OPTIONS.map((size) => {
                  const params = new URLSearchParams(searchParams);
                  params.set("perPage", String(size));
                  params.delete("page"); // reset to page 1 when changing size
                  return (
                    <Link
                      key={size}
                      href={`/?${params.toString()}`}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        pageSize === size
                          ? "bg-brand-500 text-white"
                          : "bg-dark-700 border border-dark-500 text-gray-400 hover:border-brand-500/50 hover:text-white"
                      }`}
                    >
                      {size}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Platform quick filters */}
        {!isSearching && (
          <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-none">
            {[
              { label: "All",            href: "/" },
              { label: "PS5",            href: "/?platform=PlayStation+5" },
              { label: "PS4",            href: "/?platform=PlayStation+4" },
              { label: "Xbox Series",    href: "/?platform=Xbox+Series+X%2FS" },
              { label: "Nintendo Switch",href: "/?platform=Nintendo+Switch" },
              { label: "PC",             href: "/?platform=PC" },
            ].map(({ label, href }) => (
              <Link key={label} href={href}
                className="whitespace-nowrap px-4 py-2 rounded-full text-sm bg-dark-700 border border-dark-500 hover:border-brand-500 hover:text-brand-400 transition-all">
                {label}
              </Link>
            ))}
          </div>
        )}

        {/* Grid */}
        {listings.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={{ ...listing, createdAt: listing.createdAt.toISOString() }}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                searchParams={searchParams}
              />
            )}
          </>
        ) : (
          <div className="text-center py-24">
            <div className="text-6xl mb-4">🎮</div>
            <h3 className="text-xl font-semibold text-white mb-2">No listings found</h3>
            <p className="text-gray-400 mb-6">
              {isSearching
                ? "Try adjusting your filters or search terms"
                : "Be the first to list a game in your area!"}
            </p>
            <Link href="/listings/new" className="btn-primary inline-flex">Post a Listing</Link>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
