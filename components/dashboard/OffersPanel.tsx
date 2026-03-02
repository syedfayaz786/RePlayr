"use client";

import Link from "next/link";
import Image from "next/image";
import { DollarSign, MessageCircle, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { formatPrice } from "@/lib/utils";

type Offer = {
  id: string;
  amount: number;
  message: string | null;
  status: string;
  createdAt: string;
  buyer: {
    id: string;
    name: string | null;
    image: string | null;
  };
  listing: {
    id: string;
    title: string;
    price: number;
    images: string;
  };
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

export function OffersPanel({ offers }: { offers: Offer[] }) {
  if (offers.length === 0) {
    return (
      <div className="card p-12 text-center">
        <DollarSign className="w-10 h-10 text-gray-500 mx-auto mb-3" />
        <h3 className="text-white font-semibold mb-2">No pending offers</h3>
        <p className="text-gray-400 text-sm">When buyers make offers on your listings, they&apos;ll appear here.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <h2 className="font-semibold text-white">Pending Offers</h2>
        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30">
          {offers.length}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {offers.map((offer) => {
          const img = getFirstImage(offer.listing.images);
          const diff = offer.amount - offer.listing.price;
          const pct  = Math.round(Math.abs(diff / offer.listing.price) * 100);
          const isAbove = diff > 0;
          const isEqual = diff === 0;

          return (
            <div key={offer.id} className="card p-4 flex flex-col gap-3 border border-dark-600 hover:border-amber-500/30 transition-colors">

              {/* Listing row */}
              <Link href={`/listings/${offer.listing.id}`} className="flex items-center gap-3 group">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-dark-700 border border-dark-600 flex-shrink-0">
                  {img ? (
                    img.startsWith("data:") ? (
                      <img src={img} alt={offer.listing.title} className="w-full h-full object-cover object-top" />
                    ) : (
                      <Image src={img} alt={offer.listing.title} width={48} height={48} className="w-full h-full object-cover object-top" />
                    )
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">No img</div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white group-hover:text-brand-300 transition-colors truncate">
                    {offer.listing.title}
                  </p>
                  <p className="text-xs text-gray-500">Listed at {formatPrice(offer.listing.price)}</p>
                </div>
              </Link>

              {/* Offer amount + vs listed */}
              <div className="flex items-center justify-between bg-dark-800 rounded-lg px-3 py-2.5 border border-dark-600">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Offer</p>
                  <p className="font-display font-bold text-xl text-amber-400">{formatPrice(offer.amount)}</p>
                </div>
                <div className={`flex items-center gap-1 text-sm font-semibold px-2 py-1 rounded-md ${
                  isEqual
                    ? "text-gray-400 bg-dark-700"
                    : isAbove
                    ? "text-green-400 bg-green-500/10"
                    : "text-red-400 bg-red-500/10"
                }`}>
                  {isEqual ? (
                    <><Minus className="w-3.5 h-3.5" /> Listed price</>
                  ) : isAbove ? (
                    <><TrendingUp className="w-3.5 h-3.5" /> +{pct}%</>
                  ) : (
                    <><TrendingDown className="w-3.5 h-3.5" /> -{pct}%</>
                  )}
                </div>
              </div>

              {/* Buyer + message */}
              <div className="flex items-center gap-2">
                {offer.buyer.image ? (
                  <Image
                    src={offer.buyer.image}
                    alt={offer.buyer.name ?? "Buyer"}
                    width={28}
                    height={28}
                    className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-brand-500/30 flex items-center justify-center text-brand-300 text-xs font-bold flex-shrink-0">
                    {(offer.buyer.name ?? "?")[0].toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white leading-tight truncate">{offer.buyer.name ?? "Anonymous"}</p>
                  <p className="text-xs text-gray-500">{timeAgo(offer.createdAt)}</p>
                </div>
              </div>

              {offer.message && (
                <p className="text-xs text-gray-400 italic bg-dark-800 rounded-lg px-3 py-2 border border-dark-700 line-clamp-2">
                  &ldquo;{offer.message}&rdquo;
                </p>
              )}

              {/* Reply CTA */}
              <Link
                href={`/messages?with=${offer.buyer.id}&listing=${offer.listing.id}`}
                className="flex items-center justify-center gap-1.5 w-full text-xs px-3 py-2 rounded-lg bg-brand-500/10 border border-brand-500/30 text-brand-400 hover:bg-brand-500/20 transition-colors font-medium mt-auto"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Reply to offer
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
