import { Navbar } from "@/components/layout/Navbar";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { formatPrice, formatDate } from "@/lib/utils";
import { PlatformBadge, ConditionBadge } from "@/components/ui/Badges";
import { Plus, Eye, DollarSign, Tag } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");

  const [listings, offers] = await Promise.all([
    prisma.listing.findMany({
      where: { sellerId: session.user.id },
      include: {
        _count: { select: { wishlistedBy: true, offers: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.offer.findMany({
      where: { sellerId: session.user.id, status: "pending" },
      include: {
        buyer: { select: { name: true } },
        listing: { select: { title: true, price: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const totalViews = listings.length * 3; // placeholder

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 w-full py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-2xl font-bold text-white">My Listings</h1>
          <Link href="/listings/new" className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Listing
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Tag, label: "Active Listings", value: listings.filter((l) => l.status === "active").length },
            { icon: DollarSign, label: "Pending Offers", value: offers.length },
            { icon: Eye, label: "Total Saves", value: listings.reduce((s, l) => s + l._count.wishlistedBy, 0) },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="card p-4">
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                <Icon className="w-4 h-4 text-brand-400" />
                {label}
              </div>
              <div className="font-display font-bold text-2xl text-white">{value}</div>
            </div>
          ))}
        </div>

        {/* Pending Offers */}
        {offers.length > 0 && (
          <div className="mb-8">
            <h2 className="font-semibold text-white mb-4">Pending Offers</h2>
            <div className="space-y-3">
              {offers.map((offer) => (
                <div key={offer.id} className="card p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-white">{offer.listing.title}</p>
                    <p className="text-sm text-gray-400">
                      {offer.buyer.name} offers{" "}
                      <span className="text-brand-400 font-semibold">{formatPrice(offer.amount)}</span>
                      {" "}(listed at {formatPrice(offer.listing.price)})
                    </p>
                    {offer.message && (
                      <p className="text-xs text-gray-500 mt-1 italic">"{offer.message}"</p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <form action="/api/offers" method="PATCH">
                      <OfferAction offerId={offer.id} status="accepted" />
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Listings table */}
        <div>
          <h2 className="font-semibold text-white mb-4">All Listings</h2>
          {listings.length === 0 ? (
            <div className="card p-12 text-center">
              <Tag className="w-10 h-10 text-gray-500 mx-auto mb-3" />
              <h3 className="text-white font-semibold mb-2">No listings yet</h3>
              <p className="text-gray-400 text-sm mb-4">Post your first game and start selling!</p>
              <Link href="/listings/new" className="btn-primary inline-flex">Post a Game</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {listings.map((listing) => (
                <div key={listing.id} className="card p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/listings/${listing.id}`}
                        className="font-medium text-white hover:text-brand-400 transition-colors"
                      >
                        {listing.title}
                      </Link>
                      <span
                        className={`badge ${
                          listing.status === "active"
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                        }`}
                      >
                        {listing.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <PlatformBadge platform={listing.platform} />
                      <ConditionBadge condition={listing.condition} />
                      <span className="text-xs text-gray-400">{formatDate(listing.createdAt)}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-display font-bold text-brand-400">{formatPrice(listing.price)}</div>
                    <div className="text-xs text-gray-400">
                      {listing._count.wishlistedBy} saves · {listing._count.offers} offers
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// Simple client component for offer actions
function OfferAction({ offerId, status }: { offerId: string; status: string }) {
  return null; // Handled via messages in MVP
}
