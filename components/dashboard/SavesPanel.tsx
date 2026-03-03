"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, Users } from "lucide-react";
import { formatPrice } from "@/lib/utils";

type SavedListing = {
  id: string;
  title: string;
  price: number;
  images: string;
  saveCount: number;
  savedBy: {
    id: string;
    name: string | null;
    image: string | null;
    savedAt: string;
  }[];
};

function getFirstImage(images: string): string | null {
  try {
    const parsed = JSON.parse(images) as string[];
    return parsed[0] ?? null;
  } catch {
    return null;
  }
}

function timeAgo(iso: string) {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60)   return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

export function SavesPanel({ listings }: { listings: SavedListing[] }) {
  if (listings.length === 0) {
    return (
      <div className="card p-12 text-center">
        <Heart className="w-10 h-10 text-gray-500 mx-auto mb-3" />
        <h3 className="text-white font-semibold mb-2">No saves yet</h3>
        <p className="text-gray-400 text-sm">When buyers save your listings, they&apos;ll appear here.</p>
      </div>
    );
  }

  // Sort by most saved first
  const sorted = [...listings].sort((a, b) => b.saveCount - a.saveCount);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <h2 className="font-semibold text-white">Saved Listings</h2>
        <span className="text-xs px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-400 font-bold border border-pink-500/30">
          {listings.reduce((s, l) => s + l.saveCount, 0)} total saves
        </span>
      </div>

      <div className="space-y-3">
        {sorted.map((listing) => {
          const img = getFirstImage(listing.images);
          return (
            <Link key={listing.id} href={`/listings/${listing.id}`} className="card p-4 flex gap-4 items-start hover:border-pink-500/40 transition-colors block group">

              {/* Thumbnail */}
              <div className="flex-shrink-0">
                <div className="w-14 h-14 rounded-lg overflow-hidden bg-dark-700 border border-dark-600">
                  {img ? (
                    img.startsWith("data:") ? (
                      <img src={img} alt={listing.title} className="w-full h-full object-cover object-top" />
                    ) : (
                      <Image src={img} alt={listing.title} width={56} height={56} className="w-full h-full object-cover object-top" />
                    )
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">No img</div>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-medium text-white group-hover:text-brand-300 transition-colors truncate">
                    {listing.title}
                  </span>
                  <span className="flex-shrink-0 font-display font-bold text-brand-400 text-sm">
                    {formatPrice(listing.price)}
                  </span>
                </div>

                {/* Save count badge */}
                <div className="flex items-center gap-1.5 mb-3">
                  <Heart className="w-3.5 h-3.5 text-pink-400 fill-pink-400" />
                  <span className="text-sm font-semibold text-pink-400">{listing.saveCount}</span>
                  <span className="text-xs text-gray-400">
                    {listing.saveCount === 1 ? "person saved this" : "people saved this"}
                  </span>
                </div>

                {/* Avatars of who saved it */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Users className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {listing.savedBy.map((user) => (
                      <div key={user.id} className="flex items-center gap-1.5 bg-dark-700 rounded-full pl-0.5 pr-2.5 py-0.5 border border-dark-600">
                        {user.image ? (
                          <Image
                            src={user.image}
                            alt={user.name ?? "User"}
                            width={20}
                            height={20}
                            className="w-5 h-5 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-brand-500/30 flex items-center justify-center text-brand-300 text-xs font-bold">
                            {(user.name ?? "?")[0].toUpperCase()}
                          </div>
                        )}
                        <span className="text-xs text-gray-300">{user.name ?? "Anonymous"}</span>
                        <span className="text-xs text-gray-600">· {timeAgo(user.savedAt)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
