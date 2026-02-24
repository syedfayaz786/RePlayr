"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, MapPin, Clock } from "lucide-react";
import { formatPrice, formatRelativeTime } from "@/lib/utils";
import { PlatformBadge, ConditionBadge, PLATFORM_CONFIG } from "@/components/ui/Badges";
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
    edition?: string | null;
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
    try { return JSON.parse(listing.images) as string[]; }
    catch { return []; }
  })();

  const platformConfig = PLATFORM_CONFIG[listing.platform] ?? PLATFORM_CONFIG["Other"];
  const PlatformLogo = platformConfig.Logo;

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!session) { toast.error("Please sign in to save listings"); return; }
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
      {/* Cover image / platform fallback */}
      <div className="relative aspect-[3/4] overflow-hidden">
        {images[0] ? (
          images[0].startsWith("data:") ? (
            <img
              src={images[0]}
              alt={listing.title}
              className="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <Image
              src={images[0]}
              alt={listing.title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1280px) 25vw, 20vw"
              quality={95}
              className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
            />
          )
        ) : (
          <div className={`absolute inset-0 flex flex-col items-center justify-center gap-2 ${platformConfig.bgGlow}`}>
            <PlatformLogo className={`w-10 h-10 ${platformConfig.colorClass.split(" ")[1]}`} />
          </div>
        )}

        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-900/80 via-transparent to-transparent" />

        {/* Wishlist button */}
        <button
          onClick={toggleWishlist}
          disabled={loading}
          className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 ${
            wishlisted
              ? "bg-brand-500 text-white shadow-lg shadow-brand-500/30"
              : "bg-dark-800/80 text-slate-300 hover:bg-brand-500/20 hover:text-brand-400 backdrop-blur-sm"
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${wishlisted ? "fill-current" : ""}`} />
        </button>

        {/* Edition badge — top left on image */}
        {listing.edition && (
          <div className="absolute top-2 left-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-dark-900/90 text-amber-400 border border-amber-500/30 leading-tight">
              🏷️ {listing.edition}
            </span>
          </div>
        )}

        {/* Price */}
        <div className="absolute bottom-2 left-2 bg-dark-900/90 rounded-md px-2 py-0.5">
          <span className="font-display font-bold text-brand-400 text-base">
            {formatPrice(listing.price)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="font-semibold text-white text-sm truncate mb-1.5 group-hover:text-brand-300 transition-colors">
          {listing.title}
        </h3>

        {/* Badges row — platform + condition only (edition is on image) */}
        <div className="flex items-center gap-1 flex-wrap mb-2">
          <PlatformBadge platform={listing.platform} showLogo={true} short={true} />
          <ConditionBadge condition={listing.condition} />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-1 min-w-0">
            {listing.location && (
              <>
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate max-w-[110px] text-slate-300">{listing.location}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Clock className="w-3 h-3" />
            <span>{formatRelativeTime(listing.createdAt)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
