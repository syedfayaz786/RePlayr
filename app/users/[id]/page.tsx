import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/layout/Navbar";
import { StarRating } from "@/components/ui/StarRating";
import { ReviewsTabs } from "@/components/ui/ReviewsTabs";
import { ListingsReviewsTabs } from "@/components/ui/ListingsReviewsTabs";
import Image from "next/image";
import { MapPin, Calendar, Package, Star, ShoppingBag, ChevronRight, Home, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date(date));
}

export default async function UserProfilePage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      image: true,
      bio: true,
      location: true,
      createdAt: true,
      listings: {
        where: { status: "active" },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          price: true,
          platform: true,
          condition: true,
          edition: true,
          location: true,
          images: true,
          status: true,
          views: true,
          createdAt: true,
          _count: { select: { wishlistedBy: true } },
        },
      },
      reviewsReceived: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          rating: true,
          comment: true,
          strengths: true,
          role: true,
          createdAt: true,
          author: { select: { id: true, name: true, image: true } },
        },
      },
      _count: {
        select: {
          listings: true,
          reviewsReceived: true,
          salesAsSeller: true,
          salesAsBuyer: true,
        },
      },
    },
  });

  if (!user) notFound();

  const isOwnProfile = session?.user?.id === user.id;
  const avgRating = user.reviewsReceived.length
    ? user.reviewsReceived.reduce((sum, r) => sum + r.rating, 0) / user.reviewsReceived.length
    : 0;

  const reviewsForClient = user.reviewsReceived.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  }));

  const listingsForClient = user.listings.map((l) => ({
    ...l,
    createdAt: l.createdAt.toISOString(),
    seller: { id: user.id, name: user.name, image: user.image },
  }));

  return (
    <div className="min-h-screen flex flex-col bg-dark-900">
      <Navbar />
      {/* Breadcrumb */}
      <div className="border-b border-dark-600 bg-dark-800/40">
        <div className="max-w-screen-xl mx-auto px-4 py-2.5 flex items-center gap-1.5 text-xs text-gray-500">
          <Link href="/" className="flex items-center gap-1 hover:text-white transition-colors">
            <Home className="w-3 h-3" />Home
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-400 truncate">{user.name ?? "User Profile"}</span>
        </div>
      </div>

      <main className="flex-1 max-w-screen-xl mx-auto w-full px-4 py-8 space-y-6">

        {/* Profile hero */}
        <div className="card p-6">
          <div className="flex items-start gap-5">
            {user.image ? (
              <Image src={user.image} alt={user.name ?? ""} width={80} height={80}
                className="rounded-full flex-shrink-0 object-cover w-20 h-20" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 font-bold text-2xl flex-shrink-0">
                {user.name?.[0]?.toUpperCase() ?? "?"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="font-display text-2xl font-bold text-white">{user.name ?? "Anonymous"}</h1>
                {isOwnProfile && (
                  <a href="/profile" className="text-xs px-2.5 py-1 rounded-lg bg-dark-700 border border-dark-500 text-gray-400 hover:text-white transition-colors">
                    Edit Profile
                  </a>
                )}
              </div>

              {avgRating > 0 && (
                <div className="flex items-center gap-1.5 mt-1">
                  <StarRating rating={Math.round(avgRating)} size="sm" />
                  <span className="text-sm text-gray-400">{avgRating.toFixed(1)} · {user._count.reviewsReceived} review{user._count.reviewsReceived !== 1 ? "s" : ""}</span>
                </div>
              )}

              <div className="flex flex-wrap gap-3 mt-2">
                {user.location && (
                  <span className="flex items-center gap-1 text-sm text-gray-400">
                    <MapPin className="w-3.5 h-3.5" />{user.location}
                  </span>
                )}
                <span className="flex items-center gap-1 text-sm text-gray-400">
                  <Calendar className="w-3.5 h-3.5" />Member since {formatDate(user.createdAt)}
                </span>
              </div>

              {user.bio && <p className="text-sm text-gray-300 mt-3 leading-relaxed">{user.bio}</p>}

              {/* Stats row */}
              <div className="flex gap-5 mt-4 flex-wrap">
                <div className="text-center">
                  <div className="text-lg font-bold text-white">{user._count.listings}</div>
                  <div className="text-xs text-gray-500 flex items-center gap-1"><Package className="w-3 h-3" />Listings</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-white">{user._count.salesAsSeller}</div>
                  <div className="text-xs text-gray-500 flex items-center gap-1"><ShoppingBag className="w-3 h-3" />Sold</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-white">{user._count.salesAsBuyer}</div>
                  <div className="text-xs text-gray-500 flex items-center gap-1"><ShoppingCart className="w-3 h-3" />Bought</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-white">{user._count.reviewsReceived}</div>
                  <div className="text-xs text-gray-500 flex items-center gap-1"><Star className="w-3 h-3" />Reviews</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabbed: Listings | Reviews */}
        <ListingsReviewsTabs
          listings={listingsForClient}
          reviews={reviewsForClient}
        />
      </main>
    </div>
  );
}
