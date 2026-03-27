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
import { SavesPanel } from "@/components/dashboard/SavesPanel";
import { OffersPanel } from "@/components/dashboard/OffersPanel";

type FilterParam = "all" | "active" | "available" | "pending" | "sold" | "views" | "saves" | "offers";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { filter?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");

  const filter = (searchParams?.filter ?? "all") as FilterParam;

  const [listings, offers, savedListings] = await Promise.all([
    prisma.listing.findMany({
      where: { sellerId: session.user.id },
      include: {
        seller: { select: { id: true, name: true, image: true } },
        _count:  { select: { wishlistedBy: true, offers: true } },
        sale: {
          include: {
            buyer: { select: { id: true, name: true, image: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.offer.findMany({
      where: { sellerId: session.user.id, status: "pending" },
      include: {
        buyer:   { select: { id: true, name: true, image: true } },
        listing: { select: { id: true, title: true, price: true, images: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    // Listings that have been wishlisted, with who saved them
    prisma.listing.findMany({
      where: {
        sellerId: session.user.id,
        wishlistedBy: { some: {} },
      },
      include: {
        wishlistedBy: {
          include: { user: { select: { id: true, name: true, image: true } } },
          orderBy: { createdAt: "desc" },
        },
        _count: { select: { wishlistedBy: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Fetch reviews that buyers left for the seller, keyed by listingId
  const soldListingIds = listings
    .filter(l => l.sale?.listingId)
    .map(l => l.id);

  const buyerReviews = soldListingIds.length > 0
    ? await prisma.review.findMany({
        where: {
          listingId: { in: soldListingIds },
          targetId: session.user.id,
          role: "buyer", // author was buyer => they reviewed the seller
        },
        select: { id: true, rating: true, authorId: true, listingId: true },
      })
    : [];

  const reviewByListingId = Object.fromEntries(
    buyerReviews.map(r => [r.listingId, r])
  );

  const serialisedListings = listings.map((l) => ({
    ...l,
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
    saleBuyer: (l as any).sale?.buyer ?? null,
    saleBuyerId: (l as any).sale?.buyerId ?? null,
    buyerReview: reviewByListingId[l.id] ?? null,
  }));

  const serialisedOffers = offers.map((o) => ({
    ...o,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
  }));

  const serialisedSaved = savedListings.map((l) => ({
    id: l.id,
    title: l.title,
    price: l.price,
    images: l.images,
    saveCount: l._count.wishlistedBy,
    savedBy: l.wishlistedBy.map((w) => ({
      id: w.user.id,
      name: w.user.name,
      image: w.user.image,
      savedAt: w.createdAt.toISOString(),
    })),
  }));

  const stats = {
    active:        listings.filter((l) => l.status === "active" || l.status === "available").length,
    sold:          listings.filter((l) => l.status === "sold" || l.sale).length,
    totalViews:    listings.reduce((s, l) => s + (l.views ?? 0), 0),
    totalSaves:    listings.reduce((s, l) => s + l._count.wishlistedBy, 0),
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
      hint: "View listings →",
    },
    {
      icon: BadgeCheck,
      label: "Sold",
      value: stats.sold,
      href: "/dashboard?filter=sold",
      color: "text-green-400",
      hoverBorder: "hover:border-green-500/50",
      hint: "View listings →",
    },
    {
      icon: Eye,
      label: "Total Views",
      value: stats.totalViews,
      href: "/dashboard?filter=views",
      color: "text-sky-400",
      hoverBorder: "hover:border-sky-500/50",
      hint: "View listings →",
    },
    {
      icon: Heart,
      label: "Total Saves",
      value: stats.totalSaves,
      href: "/dashboard?filter=saves",
      color: "text-pink-400",
      hoverBorder: "hover:border-pink-500/50",
      hint: "View saved →",
    },
    {
      icon: DollarSign,
      label: "Pending Offers",
      value: stats.pendingOffers,
      href: "/dashboard?filter=offers",
      color: "text-amber-400",
      hoverBorder: "hover:border-amber-500/50",
      hint: "View offers →",
    },
  ];

  const isGridFilter = ["all", "active", "available", "pending", "sold", "views"].includes(filter);

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
          {statCards.map(({ icon: Icon, label, value, href, color, hoverBorder, hint }) => {
            const isActive = filter === href?.split("=")[1];
            const inner = (
              <div className={`card p-4 h-full transition-all ${
                isActive
                  ? `border-2 ${color.replace("text-", "border-")}/60 bg-dark-700`
                  : href ? `${hoverBorder} cursor-pointer` : ""
              }`}>
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                  <Icon className={`w-4 h-4 ${color}`} />
                  {label}
                </div>
                <div className={`font-display font-bold text-2xl ${color}`}>
                  {value}
                </div>
                <p className={`text-xs mt-1.5 ${color} transition-opacity ${isActive ? "opacity-100 font-medium" : "opacity-50 group-hover:opacity-80"}`}>
                  {isActive ? "Currently viewing" : hint}
                </p>
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

        {/* Content area — switches based on filter */}
        {isGridFilter ? (
          <div>
            <h2 className="font-semibold text-white mb-4">My Listings</h2>
            <Suspense fallback={null}>
              <MyListingsGrid
                listings={serialisedListings}
                initialFilter={filter as "all" | "available" | "pending" | "sold" | "views"}
              />
            </Suspense>
          </div>
        ) : filter === "saves" ? (
          <SavesPanel listings={serialisedSaved} />
        ) : filter === "offers" ? (
          <OffersPanel offers={serialisedOffers} />
        ) : null}

      </main>
    </div>
  );
}
