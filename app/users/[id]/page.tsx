import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/layout/Navbar";
import { StarRating } from "@/components/ui/StarRating";
import { ListingCard } from "@/components/listings/ListingCard";
import Image from "next/image";
import { MapPin, Calendar, Package, Star, ShoppingBag } from "lucide-react";
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
        take: 12,
        select: {
          id: true, title: true, price: true, platform: true,
          condition: true, edition: true, images: true, status: true,
          createdAt: true, location: true, sellerId: true,
          _count: { select: { wishlistedBy: true } },
        },
      },
      reviewsReceived: {
        orderBy: { createdAt: "desc" },
        select: { id: true, rating: true, comment: true, role: true, createdAt: true, author: { select: { id: true, name: true, image: true } } },
      },
      _count: {
        select: { listings: true, reviewsReceived: true, salesAsSeller: true },
      },
    },
  });

  if (!user) notFound();

  const isOwnProfile = session?.user?.id === user.id;
  const avgRating = user.reviewsReceived.length
    ? user.reviewsReceived.reduce((sum, r) => sum + r.rating, 0) / user.reviewsReceived.length
    : 0;

  return (
    <div className="min-h-screen flex flex-col bg-dark-900">
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 space-y-6">

        {/* Profile header */}
        <div className="card p-6">
          <div className="flex items-start gap-5">
            {user.image ? (
              <Image src={user.image} alt={user.name ?? ""} width={80} height={80}
                className="rounded-full flex-shrink-0" />
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

              <div className="flex items-center gap-4 mt-1 flex-wrap">
                {avgRating > 0 && (
                  <div className="flex items-center gap-1.5">
                    <StarRating rating={Math.round(avgRating)} size="sm" />
                    <span className="text-sm text-gray-400">{avgRating.toFixed(1)} · {user._count.reviewsReceived} review{user._count.reviewsReceived !== 1 ? "s" : ""}</span>
                  </div>
                )}
              </div>

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
              <div className="flex gap-4 mt-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-white">{user._count.listings}</div>
                  <div className="text-xs text-gray-500 flex items-center gap-1"><Package className="w-3 h-3" />Listings</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-white">{user._count.salesAsSeller}</div>
                  <div className="text-xs text-gray-500 flex items-center gap-1"><ShoppingBag className="w-3 h-3" />Sold</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-white">{user._count.reviewsReceived}</div>
                  <div className="text-xs text-gray-500 flex items-center gap-1"><Star className="w-3 h-3" />Reviews</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Active listings */}
        {user.listings.length > 0 && (
          <div>
            <h2 className="font-display font-bold text-white text-lg mb-3">Active Listings</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {user.listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing as any} />
              ))}
            </div>
          </div>
        )}

        {/* Reviews — categorized by seller/buyer */}
        {user.reviewsReceived.length > 0 && (() => {
          // role = author's role, so if author was "buyer" => target (this user) was the seller
          const asSellerReviews = user.reviewsReceived.filter((r: any) => r.role === "buyer");
          const asBuyerReviews  = user.reviewsReceived.filter((r: any) => r.role === "seller");

          const ReviewCard = ({ review }: { review: any }) => (
            <div key={review.id} className="p-4 flex gap-3">
              <a href={`/users/${review.author.id}`} className="flex-shrink-0">
                {review.author.image ? (
                  <Image src={review.author.image} alt={review.author.name ?? ""} width={36} height={36}
                    className="rounded-full hover:ring-2 hover:ring-brand-500 transition-all" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-300 text-sm font-bold">
                    {review.author.name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                )}
              </a>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <a href={`/users/${review.author.id}`} className="text-sm font-medium text-white hover:text-brand-400 transition-colors">
                    {review.author.name ?? "Anonymous"}
                  </a>
                  <StarRating rating={review.rating} size="sm" />
                  <span className="text-xs text-gray-500">
                    {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(review.createdAt))}
                  </span>
                </div>
                {review.comment && <p className="text-sm text-gray-400 mt-1">{review.comment}</p>}
              </div>
            </div>
          );

          return (
            <div className="space-y-4">
              {asSellerReviews.length > 0 && (
                <div>
                  <h2 className="font-display font-bold text-white text-lg mb-3">
                    As a Seller
                    <span className="text-gray-500 font-normal text-base ml-2">({asSellerReviews.length})</span>
                  </h2>
                  <div className="card divide-y divide-dark-600">
                    {asSellerReviews.map((review: any) => <ReviewCard key={review.id} review={review} />)}
                  </div>
                </div>
              )}
              {asBuyerReviews.length > 0 && (
                <div>
                  <h2 className="font-display font-bold text-white text-lg mb-3">
                    As a Buyer
                    <span className="text-gray-500 font-normal text-base ml-2">({asBuyerReviews.length})</span>
                  </h2>
                  <div className="card divide-y divide-dark-600">
                    {asBuyerReviews.map((review: any) => <ReviewCard key={review.id} review={review} />)}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {user.listings.length === 0 && user.reviewsReceived.length === 0 && (
          <div className="card p-10 text-center">
            <p className="text-gray-500">This user hasn&apos;t posted any listings or received any reviews yet.</p>
          </div>
        )}

      </main>
    </div>
  );
}
