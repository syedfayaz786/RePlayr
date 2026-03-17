"use client";

import { useState } from "react";
import { Heart, MessageSquare, DollarSign, Share2, Check, Edit, CheckCircle2, RotateCcw, Copy } from "lucide-react";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import { LocationRequestPanel } from "@/components/listings/LocationRequestPanel";
import { MarkAsSoldModal } from "@/components/listings/MarkAsSoldModal";
import { RelistModal } from "@/components/listings/RelistModal";

interface ListingData {
  title: string;
  description: string | null;
  price: number;
  platform: string;
  edition: string | null;
  condition: string;
  location: string | null;
  images: string; // JSON string
}

interface ListingActionsProps {
  listingId: string;
  listingTitle: string;
  listingPrice: number;
  sellerId: string;
  sellerName: string;
  isWishlisted: boolean;
  isSeller: boolean;
  status: string;
  listingData?: ListingData;
  buyer?: { id: string; name?: string | null } | null;
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
  listingData,
  buyer,
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
  const [currentStatus, setCurrentStatus] = useState(status);
  const [markingStatus, setMarkingStatus] = useState(false);
  const [showSoldModal, setShowSoldModal] = useState(false);
  const [showRelistModal, setShowRelistModal] = useState(false);

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
        router.push(`/messages?with=${sellerId}&listing=${listingId}`);
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

  const updateStatus = async (newStatus: string) => {
    setMarkingStatus(true);
    try {
      const res = await fetch(`/api/listings/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setCurrentStatus(newStatus);
        toast.success(newStatus === "sold" ? "🎉 Marked as sold!" : "Listing is now active");
        router.refresh();
      } else {
        toast.error("Failed to update status");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setMarkingStatus(false);
    }
  };

  if (isSeller) {
    return (
      <>
      <div className="card p-4 sm:p-6 space-y-3">
        <h3 className="font-semibold text-white text-sm">Your Listing</h3>

        {/* Status pill */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
            currentStatus === "active"
              ? "bg-green-500/15 text-green-300 border-green-500/30"
              : currentStatus === "sold"
              ? "bg-blue-500/15 text-blue-300 border-blue-500/30"
              : "bg-gray-500/15 text-gray-300 border-gray-500/30"
          }`}>
            {currentStatus === "active" ? "● Active" : currentStatus === "sold" ? "💰 Sold" : "○ Inactive"}
          </span>
          {currentStatus === "sold" && buyer && (
            <>
              <span className="text-xs text-gray-500">to</span>
              <a
                href={`/users/${buyer.id}`}
                className="text-xs font-medium text-white hover:text-brand-400 transition-colors"
              >
                {buyer.name ?? "buyer"}
              </a>
              <span className="text-gray-600 text-xs">·</span>
              <a
                href={`/messages?with=${buyer.id}&listing=${listingId}`}
                className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
              >
                Open Chat →
              </a>
            </>
          )}
        </div>

        {/* Mark as sold / relist */}
        {currentStatus === "active" ? (
          <>
            <button
              onClick={() => setShowSoldModal(true)}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-300 hover:text-blue-200"
            >
              <CheckCircle2 className="w-4 h-4" />
              Mark as Sold
            </button>
            <Link href={`/listings/${listingId}/edit`} className="btn-secondary flex items-center gap-2 justify-center w-full">
              <Edit className="w-4 h-4" />Edit Listing
            </Link>
          </>
        ) : currentStatus === "sold" ? (
          <>
            <button
              onClick={() => setShowRelistModal(true)}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all bg-brand-500/15 hover:bg-brand-500/25 border border-brand-500/30 text-brand-300 hover:text-brand-200"
            >
              <Copy className="w-4 h-4" />
              Relist as New
            </button>
            <button
              onClick={() => updateStatus("active")}
              disabled={markingStatus}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all bg-green-500/15 hover:bg-green-500/25 border border-green-500/30 text-green-300 hover:text-green-200 disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
              {markingStatus ? "Updating…" : "Mark as Available"}
            </button>
          </>
        ) : null}

        {/* Address requests from buyers */}
        <div className="border-t border-dark-600 pt-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <span className="w-4 h-4 text-brand-400">📍</span> Address Requests
          </p>
          <LocationRequestPanel listingId={listingId} />
        </div>
      </div>

      {showSoldModal && (
        <MarkAsSoldModal
          listingId={listingId}
          listingTitle={listingTitle}
          onClose={() => setShowSoldModal(false)}
          onSold={() => { setCurrentStatus("sold"); setShowSoldModal(false); }}
        />
      )}

      {showRelistModal && listingData && (
        <RelistModal
          listingData={listingData}
          onClose={() => setShowRelistModal(false)}
        />
      )}
    </>
    );
  }

  return (
    <>
      <div className="card p-4 sm:p-6 space-y-3">
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
