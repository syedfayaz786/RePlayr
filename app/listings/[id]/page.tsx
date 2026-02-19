import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatPrice, formatDate } from "@/lib/utils";
import { PlatformBadge, ConditionBadge, EditionBadge } from "@/components/ui/Badges";
import { StarRating } from "@/components/ui/StarRating";
import { MapPin, Clock, Package, ChevronLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ListingActions } from "@/components/listings/ListingActions";
import dynamic from "next/dynamic";
const LocationMap = dynamic(() => import("@/components/ui/LocationMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] rounded-xl bg-dark-700 border border-dark-600 flex items-center justify-center text-gray-500 text-sm">
      Loading map…
    </div>
  ),
});

export default async function ListingPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    include: {
      seller: {
        include: {
          reviewsReceived: {
            include: { author: { select: { name: true, image: true } } },
            orderBy: { createdAt: "desc" },
            take: 5,
          },
          _count: { select: { listings: true, reviewsReceived: true } },
        },
      },
      _count: { select: { wishlistedBy: true } },
    },
  });

  if (!listing) notFound();

  const images = (() => {
    try { return JSON.parse(listing.images) as string[]; }
    catch { return []; }
  })();

  const avgRating = listing.seller.reviewsReceived.length
    ? listing.seller.reviewsReceived.reduce((sum, r) => sum + r.rating, 0) /
      listing.seller.reviewsReceived.length
    : 0;

  const isWishlisted = session
    ? !!(await prisma.wishlist.findUnique({
        where: { userId_listingId: { userId: session.user.id, listingId: listing.id } },
      }))
    : false;

  const isSeller = session?.user.id === listing.sellerId;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 w-full py-8">
        {/* Breadcrumb */}
        <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 text-sm">
          <ChevronLeft className="w-4 h-4" />
          Back to listings
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Images + Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image gallery */}
            <div className="card overflow-hidden">
              <div className="relative aspect-video bg-dark-700">
                {images[0] ? (
                  <Image src={images[0]} alt={listing.title} fill className="object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-7xl">🎮</div>
                )}
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto">
                  {images.slice(1).map((img, i) => (
                    <div key={i} className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
                      <Image src={img} alt="" fill className="object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Game info */}
            <div className="card p-6">
              <div className="flex flex-wrap gap-2 mb-4">
                <PlatformBadge platform={listing.platform} showLogo={true} />
                <ConditionBadge condition={listing.condition} />
                <EditionBadge edition={listing.edition} />
              </div>

              <h1 className="font-display text-3xl font-bold text-white mb-3">{listing.title}</h1>

              <div className="flex items-center gap-2 text-brand-400 text-3xl font-display font-bold mb-6">
                {formatPrice(listing.price)}
              </div>

              {listing.description && (
                <div className="bg-dark-700/50 rounded-xl p-4 mb-4">
                  <h3 className="font-semibold text-white text-sm mb-2">Description</h3>
                  <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                    {listing.description}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                {listing.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-brand-400" />
                    {listing.location}
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-brand-400" />
                  Listed {formatDate(listing.createdAt)}
                </div>
                <div className="flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-brand-400" />
                  {listing.condition}
                </div>
              </div>
            </div>

            {/* Location map — Facebook-style fuzzy area */}
            {listing.fuzzyLat && listing.fuzzyLng && (
              <LocationMap
                fuzzyLat={listing.fuzzyLat}
                fuzzyLng={listing.fuzzyLng}
                label={listing.location ?? undefined}
                radiusKm={3}
                listingId={listing.id}
                isSeller={isSeller}
              />
            )}

            {/* Privacy shield — only shown to the seller */}
            {isSeller && listing.fuzzyLat && (
              <div className="card p-5 border border-brand-500/20 bg-brand-500/5">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-500/15 flex items-center justify-center flex-shrink-0 text-lg">🔒</div>
                  <div>
                    <h4 className="font-semibold text-white text-sm mb-1">Your location is protected</h4>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Buyers see only a <strong className="text-white">fuzzy area</strong> (the circle on the map) —
                      your exact address is never exposed. The centre point is randomised by ~500 m
                      so it cannot be reverse-engineered from multiple listings.
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      When a buyer requests your address, you decide whether to share it.
                      The exact pickup spot is only sent via private message after your approval.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Seller reviews */}
            {listing.seller.reviewsReceived.length > 0 && (
              <div className="card p-6">
                <h3 className="font-semibold text-white mb-4">
                  Reviews for {listing.seller.name}
                </h3>
                <div className="space-y-4">
                  {listing.seller.reviewsReceived.map((review) => (
                    <div key={review.id} className="border-b border-dark-600 last:border-0 pb-4 last:pb-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-brand-500/20 rounded-full flex items-center justify-center text-xs font-bold text-brand-400">
                          {review.author.name?.[0]?.toUpperCase() ?? "?"}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">{review.author.name}</div>
                          <StarRating rating={review.rating} size="sm" />
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-gray-400">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Seller card + Actions */}
          <div className="space-y-4">
            {/* Seller */}
            <div className="card p-6">
              <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Seller</h3>
              <div className="flex items-center gap-3 mb-4">
                {listing.seller.image ? (
                  <Image
                    src={listing.seller.image}
                    alt={listing.seller.name ?? ""}
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-12 h-12 bg-brand-500/20 rounded-full flex items-center justify-center text-brand-400 font-bold text-lg">
                    {listing.seller.name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                )}
                <div>
                  <div className="font-semibold text-white">{listing.seller.name}</div>
                  <StarRating rating={Math.round(avgRating)} size="sm" />
                  <div className="text-xs text-gray-400">
                    {listing.seller._count.reviewsReceived} reviews · {listing.seller._count.listings} listings
                  </div>
                </div>
              </div>
            </div>

            {/* Actions panel */}
            <ListingActions
              listingId={listing.id}
              listingTitle={listing.title}
              listingPrice={listing.price}
              sellerId={listing.sellerId}
              sellerName={listing.seller.name ?? "Seller"}
              isWishlisted={isWishlisted}
              isSeller={isSeller}
              status={listing.status}
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
