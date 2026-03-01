import { Navbar } from "@/components/layout/Navbar";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { formatPrice } from "@/lib/utils";
import { Plus, Eye, DollarSign, Tag } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import Link from "next/link";
import { MyListingsGrid } from "@/components/dashboard/MyListingsGrid";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");

  const [listings, offers] = await Promise.all([
    prisma.listing.findMany({
      where: { sellerId: session.user.id },
      include: {
        seller: { select: { id: true, name: true, image: true } },
        _count:  { select: { wishlistedBy: true, offers: true } },
        sale:    { select: { id: true } },
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
      <PageHeader crumbs={[{ label: "My Dashboard" }]} />
      <main className="flex-1 max-w-screen-2xl mx-auto px-4 sm:px-8 w-full py-8">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 sm:mb-8">
          <h1 className="font-display text-xl sm:text-2xl font-bold text-white">My Listings</h1>
          <Link href="/listings/new" className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Listing
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {[
            { icon: Tag,        label: "Active Listings", value: listings.filter((l) => l.status === "active").length },
            { icon: DollarSign, label: "Sold",             value: listings.filter((l) => l.status === "sold" || l.sale).length },
            { icon: Eye,        label: "Total Saves",      value: listings.reduce((s, l) => s + l._count.wishlistedBy, 0) },
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
                <div key={offer.id} className="card p-3 sm:p-4 flex flex-wrap sm:flex-nowrap items-start sm:items-center justify-between gap-3">
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

        {/* Listings grid with filter tabs */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">My Listings</h2>
          </div>
          <MyListingsGrid listings={serialisedListings} />
        </div>

      </main>
    </div>
  );
}
