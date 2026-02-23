import { Suspense } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SearchBar } from "@/components/listings/SearchBar";
import { ListingsGrid } from "@/components/listings/ListingsGrid";
import { prisma } from "@/lib/prisma";
import { Gamepad2, Users, ShieldCheck } from "lucide-react";
import Link from "next/link";

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
  const stats = await getStats();
  const isSearching = !!(
    searchParams.q || searchParams.platform ||
    searchParams.condition || searchParams.minPrice || searchParams.maxPrice
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* ── Compact hero ── */}
      <section className="relative overflow-hidden bg-dark-800 border-b border-dark-600">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-48 bg-brand-600/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-48 bg-blue-600/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-7 sm:py-9">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">

            {/* Left: headline + stats */}
            <div className="min-w-0">
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-white leading-tight">
                Trade Game Discs{" "}
                <span className="gradient-text">Locally</span>
              </h1>
              <p className="text-gray-400 text-sm mt-1 mb-3">
                Buy &amp; sell game discs with nearby gamers — no shipping, no subscriptions.
              </p>
              {/* Stats inline */}
              <div className="flex items-center gap-5">
                {[
                  { icon: Gamepad2,    label: "Active",  value: stats.totalListings },
                  { icon: Users,       label: "Gamers",  value: stats.totalUsers },
                  { icon: ShieldCheck, label: "Trusted", value: "100%" },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
                    <span className="text-brand-300 font-bold text-sm">{value}</span>
                    <span className="text-gray-500 text-xs">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: search bar */}
            <div className="w-full sm:w-[480px] flex-shrink-0">
              <Suspense>
                <SearchBar />
              </Suspense>
            </div>
          </div>

          {/* CTA for new sellers */}
          <div className="mt-4 flex items-center gap-3">
            <Link
              href="/listings/new"
              className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-brand-300 transition-colors"
            >
              <span className="text-brand-400">+</span> Sell a game
            </Link>
            <span className="text-dark-500">·</span>
            <span className="text-xs text-gray-500">Local pickup only · Your address stays private</span>
          </div>
        </div>
      </section>

      {/* ── Listings (client-side, dynamic) ── */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 w-full py-8">
        {isSearching && (
          <div className="mb-6">
            <Suspense><SearchBar /></Suspense>
          </div>
        )}
        <Suspense fallback={
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="card aspect-[3/4] animate-pulse bg-dark-700" />
            ))}
          </div>
        }>
          <ListingsGrid isSearching={isSearching} />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
