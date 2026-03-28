"use client";

import { useState } from "react";
import Image from "next/image";
import { Heart, MessageSquare, DollarSign, Share2, Check, Edit, RotateCcw, Copy, Globe, X, Flag, ShieldOff, Clock, AlertTriangle } from "lucide-react";
import { ReportModal } from "@/components/safety/ReportModal";
import { BlockModal } from "@/components/safety/BlockModal";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
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
  images: string;
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
  buyer?: { id: string; name?: string | null; image?: string | null } | null;
  soldOutside?: boolean;
}

// Normalize: treat "active" and "available" as the same
function normalizeStatus(s: string) {
  return s === "active" ? "available" : s;
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
  soldOutside,
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
  const [currentStatus, setCurrentStatus] = useState(normalizeStatus(status));
  const [markingStatus, setMarkingStatus] = useState(false);
  const [showSoldModal, setShowSoldModal] = useState(false);
  const [showRelistModal, setShowRelistModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);

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
        body: JSON.stringify({ receiverId: sellerId, listingId, content: messageText }),
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
      // Send "active" to API (DB value), map from our UI status
      const dbStatus = newStatus === "available" ? "active" : newStatus;
      const res = await fetch(`/api/listings/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: dbStatus }),
      });
      if (res.ok) {
        setCurrentStatus(newStatus);
        if (newStatus === "available") toast.success("Listing is now available");
        else if (newStatus === "pending") toast.success("Listing marked as pending");
        else if (newStatus === "sold") toast.success("🎉 Marked as sold!");
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

  // ── SELLER VIEW ──────────────────────────────────────────────────────────
  if (isSeller) {
    const statusConfig = {
      available: { label: "● Available", pill: "bg-green-500/15 text-green-300 border-green-500/30" },
      pending:   { label: "⏳ Pending",   pill: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
      sold:      { label: "Sold",         pill: "bg-green-500/15 text-green-400 border-green-500/30"  },
    };
    const cfg = statusConfig[currentStatus as keyof typeof statusConfig] ?? statusConfig.available;

    return (
      <>
        <div className="card p-4 sm:p-6 space-y-3">
          <h3 className="font-semibold text-white text-sm">Your Listing</h3>

          {/* Status pill */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {currentStatus === "sold" ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border bg-green-500/15 text-green-400 border-green-500/30">
                <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                Sold
              </span>
            ) : (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${cfg.pill}`}>
                {cfg.label}
              </span>
            )}
            {currentStatus === "sold" && soldOutside && (
              <span className="flex items-center gap-1 text-xs font-semibold text-gray-200">
                <Globe className="w-3 h-3" /> Outside RePlayr
              </span>
            )}
            {currentStatus === "sold" && buyer && (
              <>
                <span className="text-xs text-gray-500">to</span>
                <a href={`/users/${buyer.id}`} className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
                  {buyer.image ? (
                    <Image src={buyer.image} alt={buyer.name ?? ""} width={18} height={18} className="rounded-full object-cover w-[18px] h-[18px] flex-shrink-0" />
                  ) : (
                    <div className="w-[18px] h-[18px] rounded-full bg-brand-500/30 flex items-center justify-center text-brand-300 text-[9px] font-bold flex-shrink-0">
                      {buyer.name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                  )}
                  <span className="text-xs font-medium text-white hover:text-brand-400 transition-colors">
                    {buyer.name ?? "buyer"}
                  </span>
                </a>
              </>
            )}
          </div>

          {/* Action buttons by status */}
          {currentStatus === "available" && (
            <>
              <button
                onClick={() => updateStatus("pending")}
                disabled={markingStatus}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 hover:text-amber-200 disabled:opacity-50"
              >
                <Clock className="w-4 h-4" />
                {markingStatus ? "Updating…" : "Mark as Pending"}
              </button>
              <button
                onClick={() => setShowSoldModal(true)}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-300 hover:text-blue-200"
              >
                Mark as Sold
              </button>
              <Link href={`/listings/${listingId}/edit`} className="btn-secondary flex items-center gap-2 justify-center w-full">
                <Edit className="w-4 h-4" />Edit Listing
              </Link>
            </>
          )}

          {currentStatus === "pending" && (
            <>
              <button
                onClick={() => updateStatus("available")}
                disabled={markingStatus}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all bg-green-500/15 hover:bg-green-500/25 border border-green-500/30 text-green-300 hover:text-green-200 disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4" />
                {markingStatus ? "Updating…" : "Mark as Available"}
              </button>
              <button
                onClick={() => setShowSoldModal(true)}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-300 hover:text-blue-200"
              >
                Mark as Sold
              </button>
              <Link href={`/listings/${listingId}/edit`} className="btn-secondary flex items-center gap-2 justify-center w-full">
                <Edit className="w-4 h-4" />Edit Listing
              </Link>
            </>
          )}

          {currentStatus === "sold" && (
            <>
              <button
                onClick={() => setShowRelistModal(true)}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all bg-brand-500/15 hover:bg-brand-500/25 border border-brand-500/30 text-brand-300 hover:text-brand-200"
              >
                <Copy className="w-4 h-4" />
                Relist as New
              </button>
              <button
                onClick={() => updateStatus("available")}
                disabled={markingStatus}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all bg-green-500/15 hover:bg-green-500/25 border border-green-500/30 text-green-300 hover:text-green-200 disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4" />
                {markingStatus ? "Updating…" : "Mark as Available"}
              </button>
              {buyer && (
                <a
                  href={`/messages?with=${buyer.id}&listing=${listingId}`}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all bg-dark-700 hover:bg-dark-600 border border-dark-500 text-gray-300 hover:text-white"
                >
                  <MessageSquare className="w-4 h-4" />
                  Open Chat with Buyer
                </a>
              )}
            </>
          )}
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
          <RelistModal listingData={listingData} onClose={() => setShowRelistModal(false)} />
        )}
      </>
    );
  }

  // ── BUYER VIEW ───────────────────────────────────────────────────────────
  const isSold    = currentStatus === "sold";
  const isPending = currentStatus === "pending";

  const buyerStatusConfig = {
    available: { label: "● Available", pill: "bg-green-500/15 text-green-300 border-green-500/30" },
    pending:   { label: "⏳ Pending",   pill: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
    sold:      { label: "💰 Sold",      pill: "bg-gray-500/15 text-gray-300 border-gray-500/30"  },
  };
  const buyerCfg = buyerStatusConfig[currentStatus as keyof typeof buyerStatusConfig] ?? buyerStatusConfig.available;

  return (
    <>
      <div className="card p-4 sm:p-6 space-y-3">
        {/* Status pill */}
        <div className="flex items-center justify-center">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${buyerCfg.pill}`}>
            {buyerCfg.label}
          </span>
        </div>

        {isSold ? (
          <div className="bg-dark-700 rounded-xl p-4 text-center text-gray-400 text-sm">
            This listing is no longer available
          </div>
        ) : (
          <>
            {/* Pending warning banner */}
            {isPending && (
              <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-amber-500/8 border border-amber-500/25">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-300 leading-relaxed">
                  This item is currently pending with another buyer. You can still message the seller.
                </p>
              </div>
            )}

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

        {/* Safety actions */}
        {!isSeller && session && (
          <>
            <style>{`
              .listing-safety-btn {
                flex: 1; display: flex; align-items: center; justify-content: center;
                gap: 6px; padding: 8px 0; border-radius: 12px; font-size: 12px;
                font-weight: 500; cursor: pointer; outline: none;
                transition: background 180ms ease, border-color 180ms ease, color 180ms ease, box-shadow 180ms ease, transform 150ms ease;
              }
              .listing-safety-btn:hover { transform: translateY(-1px); }
              .listing-safety-btn .ls-icon { transition: transform 200ms ease; }
              .listing-safety-btn:hover .ls-icon { transform: scale(1.2); }
              .listing-safety-btn-report { border: 1px solid rgba(239,68,68,0.2); background: rgba(239,68,68,0.06); color: #fca5a5; }
              .listing-safety-btn-report:hover { background: rgba(239,68,68,0.12); border-color: rgba(239,68,68,0.35); box-shadow: 0 0 12px rgba(239,68,68,0.1); }
              .listing-safety-btn-block { border: 1px solid rgba(249,115,22,0.2); background: rgba(249,115,22,0.06); color: #fdba74; }
              .listing-safety-btn-block:hover { background: rgba(249,115,22,0.12); border-color: rgba(249,115,22,0.35); box-shadow: 0 0 12px rgba(249,115,22,0.1); }
            `}</style>
            <div className="flex gap-2 mt-2">
              <button onClick={() => setShowReportModal(true)} className="listing-safety-btn listing-safety-btn-report">
                <Flag className="w-3 h-3 ls-icon" style={{color: "#ef4444"}} />
                Report listing
              </button>
              <button onClick={() => setShowBlockModal(true)} className="listing-safety-btn listing-safety-btn-block">
                <ShieldOff className="w-3 h-3 ls-icon" style={{color: "#f97316"}} />
                Block seller
              </button>
            </div>
          </>
        )}
      </div>

      {/* Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md p-6 relative">
            <button onClick={() => setShowMessageModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-display font-bold text-white text-xl mb-1">Message {sellerName}</h3>
            <p className="text-gray-400 text-sm mb-4">About: <span className="text-white">{listingTitle}</span></p>
            {isPending && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/8 border border-amber-500/20 mb-3">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <p className="text-xs text-amber-300">This item is currently pending</p>
              </div>
            )}
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Hi, is this still available?"
              rows={4}
              className="input-base resize-none mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button onClick={() => setShowMessageModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={sendMessage} disabled={loading || !messageText.trim()} className="btn-primary flex-1">
                {loading ? "Sending..." : "Send Message"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Offer Modal */}
      {showOfferModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md p-6 relative">
            <button onClick={() => setShowOfferModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-display font-bold text-white text-xl mb-1">Make an Offer</h3>
            <p className="text-gray-400 text-sm mb-4">
              Listed for <span className="text-brand-400 font-semibold">{formatPrice(listingPrice)}</span>
            </p>
            <div className="mb-4">
              <label className="label-base">Your Offer (CAD)</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number" value={offerAmount} onChange={(e) => setOfferAmount(e.target.value)}
                  placeholder="0.00" min="1" step="0.01" className="input-base pl-11" autoFocus
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="label-base">Message (optional)</label>
              <textarea value={offerMessage} onChange={(e) => setOfferMessage(e.target.value)}
                placeholder="Add a note to your offer..." rows={3} className="input-base resize-none" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowOfferModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={sendOffer} disabled={loading || !offerAmount} className="btn-primary flex-1">
                {loading ? "Sending..." : "Send Offer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showReportModal && (
        <ReportModal type="listing" targetId={listingId} targetName={listingTitle} onClose={() => setShowReportModal(false)} />
      )}
      {showBlockModal && (
        <BlockModal userId={sellerId} userName={sellerName} onClose={() => setShowBlockModal(false)}
          onBlocked={() => { setShowBlockModal(false); router.push("/?blocked=1"); }} />
      )}
    </>
  );
}
