import { Navbar } from "@/components/layout/Navbar";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ListingCard } from "@/components/listings/ListingCard";
import { Heart } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import Link from "next/link";

export default async function WishlistPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");

  const wishlist = await prisma.wishlist.findMany({
    where: { userId: session.user.id },
    include: {
      listing: {
        include: {
          seller: { select: { id: true, name: true, image: true } },
          _count: { select: { wishlistedBy: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <PageHeader crumbs={[{ label: "My Wishlist" }]} />
      <main className="flex-1 max-w-screen-2xl mx-auto px-4 sm:px-8 w-full py-8">
        <div className="flex items-center gap-3 mb-8">
          <Heart className="w-6 h-6 text-brand-400 fill-brand-400" />
          <h1 className="font-display text-2xl font-bold text-white">My Wishlist</h1>
          <span className="badge bg-dark-700 text-gray-300 border border-dark-500">
            {wishlist.length} saved
          </span>
        </div>

        {wishlist.length === 0 ? (
          <div className="text-center py-24">
            <Heart className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Nothing saved yet</h3>
            <p className="text-gray-400 mb-6">
              Browse listings and tap the heart icon to save games you&apos;re interested in
            </p>
            <Link href="/" className="btn-primary inline-flex">Browse Games</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {wishlist.map(({ listing }) => (
              <ListingCard
                key={listing.id}
                listing={{
                  ...listing,
                  createdAt: listing.createdAt.toISOString(),
                  isWishlisted: true,
                }}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
