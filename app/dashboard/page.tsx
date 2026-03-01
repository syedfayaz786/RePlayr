import { Navbar } from "@/components/layout/Navbar";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { formatPrice } from "@/lib/utils";
import { Plus, Eye, DollarSign, Tag, Heart, BadgeCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import Link from "next/link";
import { Suspense } from "react";
import { MyListingsGrid } from "@/components/dashboard/MyListingsGrid";

export default async function DashboardPage({ searchParams }: { searchParams: { filter?: string } }) {
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

  const serialisedListings = listings.map((l) => ({
    ...l,
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
  }));

  const stats = {
    active:       listings.filter((l) => l.status === "active").length,
    sold:         listings.filter((l) => l.status === "sold" || l.sale).length,
    totalViews:   listings.reduce((s, l) => s + (l.views ?? 0), 0),
    totalSaves:   listings.reduce((s, l) => s + l._count.wishlistedBy, 0),
    pendingOffers: offers.length,
  };

  const statCards = [
    {
      icon: Tag,
      label: "Active",
      value: stats.active,
      href: "/dashboard?filter=active",
      color: "text-brand-400",
      hoverBorder: "hover:border-brand-500/50",
    },
    {
      icon: BadgeCheck,
      label: "Sold",
      value: stats.sold,
      href: "/dashboard?filter=sold",
      color: "text-green-400",
      hoverBorder: "hover:border-green-500/50",
    },
    {
      icon: Eye,
      label: "Total Views",
      value: stats.totalViews,
      href: "/dashboard?filter=views",
      color: "text-sky-400",
      hoverBorder: "hover:border-sky-500/50",
    },
    {
      icon: Heart,
      label: "Total Saves",
      value: stats.totalSaves,
      href: null,
      color: "text-pink-400",
      hoverBorder: "",
    },
    {
      icon: DollarSign,
      label: "Pending Offers",
      value: stats.pendingOffers,
      href: stats.pendingOffers > 0 ? "#pending-offers" : null,
      color: "text-amber-400",
      hoverBorder: "hover:border-amber-500/50",
    },
  ];

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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {statCards.map(({ icon: Icon, label, value, href, color, hoverBorder }) => {
            const inner = (
              <div className={`card p-4 h-full transition-all ${href ? `${hoverBorder} cursor-pointer` : ""}`}>
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                  <Icon className={`w-4 h-4 ${color}`} />
                  {label}
                </div>
                <div className={`font-display font-bold text-2xl ${href ? color : "text-white"}`}>
                  {value}
                </div>
                {href && (
                  <p className={`text-xs mt-1.5 ${color} opacity-60 group-hover:opacity-100 transition-opacity`}>
                    View listings →
                  </p>
                )}
              </div>
            );
            return href ? (
              <Link key={label} href={href} className="block group">
                {inner}
              </Link>
            ) : (
              <div key={label}>{inner}</div>
            );
          })}
        </div>

        {/* Pending Offers */}
        {offers.length > 0 && (
          <div className="mb-10" id="pending-offers">
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-amber-400" />
              Pending Offers
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30">
                {offers.length}
              </span>
            </h2>
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
                      <p className="text-xs text-gray-500 mt-1 italic">&ldquo;{offer.message}&rdquo;</p>
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
          <h2 className="font-semibold text-white mb-4">My Listings</h2>
          <Suspense fallback={null}>
            <MyListingsGrid listings={serialisedListings} initialFilter={(searchParams?.filter as "all" | "active" | "sold" | "views") ?? "all"} />
          </Suspense>
        </div>

      </main>
    </div>
  );
}
