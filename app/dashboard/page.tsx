import { Navbar } from "@/components/layout/Navbar";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { formatPrice } from "@/lib/utils";
import { ListingCard } from "@/components/listings/ListingCard";
import { Plus, Eye, DollarSign, Tag } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");

  const [listings, offers] = await Promise.all([
    prisma.listing.findMany({
      where: { sellerId: session.user.id },
      include: {
        seller: { select: { id: true, name: true, image: true } },
        _count:  { select: { wishlistedBy: true, offers: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.offer.findMany({
      where: { sellerId: session.user.id, status: "pending" },
      include: {
        buyer:   { select: { name: true } },
        listing: { select: { title: true, price: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Serialise Date objects so ListingCard (client component) receives plain strings
  const serialisedListings = listings.map((l) => ({
    ...l,
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
  }));

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-screen-2xl mx-auto px-4 sm:px-8 w-full py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-2xl font-bold text-white">My Listings</h1>
          <Link href="/listings/new" className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Listing
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          {[
            { icon: Tag,        label: "Active Listings", value: listings.filter((l) => l.status === "active").length },
            { icon: DollarSign, label: "Pending Offers",  value: offers.length },
            { icon: Eye,        label: "Total Saves",     value: listings.reduce((s, l) => s + l._count.wishlistedBy, 0) },
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
          <div className="mb-10">
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
                  <a
                    href={`/messages?with=${offer.buyer.name}`}
                    className="flex-shrink-0 text-xs px-3 py-1.5 rounded-lg bg-brand-500/10 border border-brand-500/30 text-brand-400 hover:bg-brand-500/20 transition-colors"
                  >
                    Reply
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Listings grid — identical cards to the home page */}
        <div>
          <h2 className="font-semibold text-white mb-4">All Listings</h2>

          {serialisedListings.length === 0 ? (
            <div className="card p-12 text-center">
              <Tag className="w-10 h-10 text-gray-500 mx-auto mb-3" />
              <h3 className="text-white font-semibold mb-2">No listings yet</h3>
              <p className="text-gray-400 text-sm mb-4">Post your first game and start selling!</p>
              <Link href="/listings/new" className="btn-primary inline-flex">Post a Game</Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {serialisedListings.map((listing) => (
                <div key={listing.id} className="relative">
                  <ListingCard listing={listing} />

                  {/* Inactive overlay */}
                  {listing.status !== "active" && (
                    <div className="absolute inset-0 rounded-xl bg-dark-900/60 flex items-center justify-center pointer-events-none">
                      <span className="px-3 py-1 rounded-full bg-dark-800 border border-dark-500 text-gray-400 text-xs font-semibold uppercase tracking-wider">
                        {listing.status}
                      </span>
                    </div>
                  )}

                  {/* Quick-edit button sitting above the card footer */}
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

      </main>
    </div>
  );
}
