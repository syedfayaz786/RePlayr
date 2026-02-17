"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, MapPin, Clock, Star } from "lucide-react";
import { formatPrice, formatRelativeTime } from "@/lib/utils";
import { PlatformBadge, ConditionBadge } from "@/components/ui/Badges";
import { useState } from "react";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";

interface ListingCardProps {
  listing: {
    id: string;
    title: string;
    price: number;
    platform: string;
    condition: string;
    location?: string | null;
    images: string;
    createdAt: string | Date;
    seller: {
      id: string;
      name?: string | null;
      image?: string | null;
    };
    _count?: { wishlistedBy: number };
    isWishlisted?: boolean;
    distanceKm?: number;
  };
}

export function ListingCard({ listing }: ListingCardProps) {
  const { data: session } = useSession();
  const [wishlisted, setWishlisted] = useState(listing.isWishlisted ?? false);
  const [loading, setLoading] = useState(false);

  const images = (() => {
    try {
      return JSON.parse(listing.images) as string[];
    } catch {
      return [];
    }
  })();

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!session) {
      toast.error("Please sign in to save listings");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/wishlist`, {
        method: wishlisted ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: listing.id }),
      });
      if (res.ok) {
        setWishlisted(!wishlisted);
        toast.success(wishlisted ? "Removed from wishlist" : "Added to wishlist!");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Link href={`/listings/${listing.id}`} className="card-hover block group">
      {/* Image */}
      <div className="relative aspect-[4/3] bg-dark-700 overflow-hidden">
        {images[0] ? (
          <Image
            src={images[0]}
            alt={listing.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-6xl">🎮</span>
          </div>
        )}
        {/* Wishlist button */}
        <button
          onClick={toggleWishlist}
          disabled={loading}
          className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
            wishlisted
              ? "bg-brand-500 text-white"
              : "bg-dark-800/80 text-gray-300 hover:bg-brand-500/20 hover:text-brand-400"
          }`}
        >
          <Heart className={`w-4 h-4 ${wishlisted ? "fill-current" : ""}`} />
        </button>
        {/* Price */}
        <div className="absolute bottom-3 left-3 bg-dark-900/90 rounded-lg px-3 py-1">
          <span className="font-display font-bold text-brand-400 text-lg">
            {formatPrice(listing.price)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-white truncate mb-2 group-hover:text-brand-400 transition-colors">
          {listing.title}
        </h3>
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <PlatformBadge platform={listing.platform} />
          <ConditionBadge condition={listing.condition} />
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1">
            {listing.location && (
              <>
                <MapPin className="w-3 h-3" />
                <span className="truncate max-w-[100px]">{listing.location}</span>
                {listing.distanceKm !== undefined && (
                  <span className="text-brand-400 ml-1">
                    {listing.distanceKm < 1
                      ? `${Math.round(listing.distanceKm * 1000)}m`
                      : `${listing.distanceKm.toFixed(1)}km`}
                  </span>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{formatRelativeTime(listing.createdAt)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
