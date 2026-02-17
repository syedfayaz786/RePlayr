"use client";

import { useState } from "react";
import { Heart, MessageSquare, DollarSign, Share2, Check, Edit } from "lucide-react";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";

interface ListingActionsProps {
  listingId: string;
  listingTitle: string;
  listingPrice: number;
  sellerId: string;
  sellerName: string;
  isWishlisted: boolean;
  isSeller: boolean;
  status: string;
}

export function ListingActions({
  listingId,
  listingTitle,
  listingPrice,
  sellerId,
  sellerName,
  isWishlisted: initialWishlisted,
  isSeller,
  status,
}: ListingActionsProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const [offerMessage, setOfferMessage] = useState("");
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const requireAuth = () => {
    if (!session) {
      toast.error("Please sign in first");
      router.push("/auth/login");
      return false;
    }
    return true;
  };

  const toggleWishlist = async () => {
    if (!requireAuth()) return;
    try {
      await fetch(`/api/wishlist`, {
        method: wishlisted ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });
      setWishlisted(!wishlisted);
      toast.success(wishlisted ? "Removed from wishlist" : "Saved to wishlist!");
    } catch {
      toast.error("Something went wrong");
    }
  };

  const sendMessage = async () => {
    if (!requireAuth() || !messageText.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: sellerId,
          listingId,
          content: messageText,
        }),
      });
      if (res.ok) {
        toast.success("Message sent!");
        setShowMessageModal(false);
        setMessageText("");
        router.push("/messages");
      }
    } catch {
      toast.error("Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  const sendOffer = async () => {
    if (!requireAuth()) return;
    const amount = parseFloat(offerAmount);
    if (!amount || amount <= 0) { toast.error("Enter a valid offer amount"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, amount, message: offerMessage }),
      });
      if (res.ok) {
        toast.success("Offer sent to seller!");
        setShowOfferModal(false);
        setOfferAmount("");
        setOfferMessage("");
      } else {
        const d = await res.json();
        toast.error(d.error ?? "Failed to send offer");
      }
    } catch {
      toast.error("Failed to send offer");
    } finally {
      setLoading(false);
    }
  };

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success("Link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy link");
    }
  };

  if (isSeller) {
    return (
      <div className="card p-6 space-y-3">
        <h3 className="font-semibold text-white text-sm">Your Listing</h3>
        <p className="text-xs text-gray-400">
          Status: <span className={`font-semibold ${status === "active" ? "text-green-400" : "text-gray-400"}`}>{status}</span>
        </p>
        <Link href={`/listings/${listingId}/edit`} className="btn-secondary flex items-center gap-2 justify-center w-full">
          <Edit className="w-4 h-4" />Edit Listing
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="card p-6 space-y-3">
        <div className="text-2xl font-display font-bold text-brand-400 mb-2">
          {formatPrice(listingPrice)}
        </div>

        {status !== "active" ? (
          <div className="bg-dark-700 rounded-xl p-4 text-center text-gray-400 text-sm">
            This listing is no longer available
          </div>
        ) : (
          <>
            <button
              onClick={() => { if (requireAuth()) setShowMessageModal(true); }}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Message Seller
            </button>
            <button
              onClick={() => { if (requireAuth()) setShowOfferModal(true); }}
              className="btn-secondary w-full flex items-center justify-center gap-2"
            >
              <DollarSign className="w-4 h-4" />
              Make an Offer
            </button>
          </>
        )}

        <div className="flex gap-2 pt-1">
          <button
            onClick={toggleWishlist}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border transition-all text-sm font-medium ${
              wishlisted
                ? "bg-brand-500/20 border-brand-500 text-brand-400"
                : "bg-dark-700 border-dark-500 text-gray-300 hover:border-brand-500/50"
            }`}
          >
            <Heart className={`w-4 h-4 ${wishlisted ? "fill-current" : ""}`} />
            {wishlisted ? "Saved" : "Save"}
          </button>
          <button
            onClick={share}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dark-500 bg-dark-700 text-gray-300 hover:border-gray-400 transition-all text-sm font-medium"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Share2 className="w-4 h-4" />}
            Share
          </button>
        </div>
      </div>

      {/* Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md p-6">
            <h3 className="font-display font-bold text-white text-xl mb-1">
              Message {sellerName}
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              About: <span className="text-white">{listingTitle}</span>
            </p>
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Hi, is this still available?"
              rows={4}
              className="input-base resize-none mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowMessageModal(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={sendMessage}
                disabled={loading || !messageText.trim()}
                className="btn-primary flex-1"
              >
                {loading ? "Sending..." : "Send Message"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Offer Modal */}
      {showOfferModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md p-6">
            <h3 className="font-display font-bold text-white text-xl mb-1">Make an Offer</h3>
            <p className="text-gray-400 text-sm mb-4">
              Listed for{" "}
              <span className="text-brand-400 font-semibold">{formatPrice(listingPrice)}</span>
            </p>
            <div className="mb-4">
              <label className="label-base">Your Offer (CAD)</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  value={offerAmount}
                  onChange={(e) => setOfferAmount(e.target.value)}
                  placeholder="0.00"
                  min="1"
                  step="0.01"
                  className="input-base pl-11"
                  autoFocus
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="label-base">Message (optional)</label>
              <textarea
                value={offerMessage}
                onChange={(e) => setOfferMessage(e.target.value)}
                placeholder="Add a note to your offer..."
                rows={3}
                className="input-base resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowOfferModal(false)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button
                onClick={sendOffer}
                disabled={loading || !offerAmount}
                className="btn-primary flex-1"
              >
                {loading ? "Sending..." : "Send Offer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
