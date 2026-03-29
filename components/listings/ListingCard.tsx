"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, MapPin, Clock, ChevronLeft, ChevronRight, Eye } from "lucide-react";
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
    status?: string;
    _count?: { wishlistedBy: number };
    isWishlisted?: boolean;
    distanceKm?: number;
    views?: number;
    isSeller?: boolean;
  };
}

function CardImage({ src, alt }: { src: string; alt: string }) {
  if (src.startsWith("data:")) {
    return <img src={src} alt={alt} className="absolute inset-0 w-full h-full object-cover object-top" />;
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="(max-width: 640px) 50vw, (max-width: 1280px) 25vw, 20vw"
      quality={90}
      className="object-cover object-top"
    />
  );
}

export function ListingCard({ listing }: ListingCardProps) {
  const { data: session } = useSession();
  const [wishlisted, setWishlisted] = useState(listing.isWishlisted ?? false);
  const [loading, setLoading]       = useState(false);
  const [imgIndex, setImgIndex]     = useState(0);

  const images = (() => {
    try {
      let parsed = JSON.parse(listing.images);
      // Handle double-stringified images: "["url"]" => parse again
      if (typeof parsed === "string") parsed = JSON.parse(parsed);
      return Array.isArray(parsed) ? parsed as string[] : [];
    }
    catch { return []; }
  })();

  const hasMultiple = images.length > 1;

  const platformConfig = PLATFORM_CONFIG[listing.platform] ?? PLATFORM_CONFIG["Other"];
  const PlatformLogo   = platformConfig.Logo;

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

  const prev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImgIndex((i) => (i - 1 + images.length) % images.length);
  };

  const next = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImgIndex((i) => (i + 1) % images.length);
  };

  const goTo = (e: React.MouseEvent, idx: number) => {
    e.preventDefault();
    e.stopPropagation();
    setImgIndex(idx);
  };

  return (
    <Link href={`/listings/${listing.id}`} className="card-hover block group">

      {/* ── Image area ── */}
      <div className="relative aspect-[3/4] overflow-hidden bg-dark-900">

        {/* Images */}
        {images.length > 0 ? (
          <>
            {images.map((src, i) => (
              <div
                key={i}
                className={`absolute inset-0 transition-opacity duration-300 ${i === imgIndex ? "opacity-100" : "opacity-0 pointer-events-none"}`}
              >
                <CardImage src={src} alt={listing.title} />
              </div>
            ))}
          </>
        ) : (
          <div className={`absolute inset-0 flex flex-col items-center justify-center gap-2 ${platformConfig.bgGlow}`}>
            <PlatformLogo className={`w-10 h-10 ${platformConfig.colorClass.split(" ")[1]}`} />
          </div>
        )}

        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-900/80 via-transparent to-transparent pointer-events-none" />

        {/* ── Prev / Next arrows — only when multiple images ── */}
        {hasMultiple && (
          <>
            <button
              onClick={prev}
              className="absolute left-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-dark-900/80 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-dark-900 z-10"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={next}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-dark-900/80 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-dark-900 z-10"
              aria-label="Next image"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Dot indicators */}
            <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => goTo(e, i)}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${i === imgIndex ? "bg-white w-3" : "bg-white/50"}`}
                  aria-label={`Image ${i + 1}`}
                />
              ))}
            </div>

            {/* Image counter badge */}
            <div className="absolute top-2 left-2 bg-dark-900/80 backdrop-blur-sm rounded-md px-1.5 py-0.5 text-xs text-gray-300 font-medium z-10">
              {imgIndex + 1}/{images.length}
            </div>
          </>
        )}

        {/* Edition badge — only when no multi-image counter */}
        {listing.edition && !hasMultiple && (
          <div className="absolute top-2 left-2 z-10">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-dark-900/90 text-amber-400 border border-amber-500/30 leading-tight">
              🏷️ {listing.edition}
            </span>
          </div>
        )}

        {/* Edition badge when multi-image (move to avoid overlap with counter) */}
        {listing.edition && hasMultiple && (
          <div className="absolute top-2 left-12 z-10">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-dark-900/90 text-amber-400 border border-amber-500/30 leading-tight">
              🏷️ {listing.edition}
            </span>
          </div>
        )}

        {/* Wishlist button */}
        <button
          onClick={toggleWishlist}
          disabled={loading}
          className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 z-10 ${
            wishlisted
              ? "bg-brand-700 text-white shadow-lg shadow-brand-900/40"
              : "bg-dark-800/80 text-slate-300 hover:bg-brand-500/20 hover:text-brand-400 backdrop-blur-sm"
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${wishlisted ? "fill-current" : ""}`} />
        </button>

        {/* Price + Distance */}
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between z-10 px-2 pb-2">
          <div className="rounded-lg px-2 py-0.5" style={{background:"rgba(5,7,10,0.88)", backdropFilter:"blur(8px)"}}>
            <span className="font-display font-bold text-base" style={{color:"var(--accent)"}}>
              {formatPrice(listing.price)}
            </span>
          </div>
          {listing.distanceKm !== undefined && (
            <div className="bg-dark-900/85 backdrop-blur-sm rounded-md px-2 py-0.5 flex items-center gap-1">
              <span className="text-[10px]">📍</span>
              <span className="text-xs text-gray-200">
                {listing.distanceKm < 1 ? `${Math.round(listing.distanceKm * 1000)}m` : `${listing.distanceKm}km`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="p-2 sm:p-3">
        <h3 className="font-semibold text-white text-xs sm:text-sm truncate mb-1 sm:mb-1.5 group-hover:text-brand-300 transition-colors">
          {listing.title}
        </h3>
        <div className="flex items-center gap-1 flex-wrap mb-2">
          <PlatformBadge platform={listing.platform} showLogo={true} short={true} />
          <ConditionBadge condition={listing.condition} />
        </div>
        <div className="flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-1 min-w-0">
            {listing.location && (
              <>
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate max-w-[80px] sm:max-w-[110px] text-slate-300">{listing.location}</span>
              </>
            )}

          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {listing.isSeller && listing.views !== undefined && (
              <span className="flex items-center gap-0.5 text-sky-400/80 mr-1">
                <Eye className="w-3 h-3" />
                <span>{listing.views}</span>
              </span>
            )}
            <Clock className="w-3 h-3" />
            <span>{formatRelativeTime(listing.createdAt)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
