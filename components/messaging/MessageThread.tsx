"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import { Send, Package, Check, CheckCheck } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import { MutualRatingCard } from "@/components/messaging/MutualRatingCard";

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  read?: boolean;
  listing?: { id: string; title: string; price?: number } | null;
}

interface PinnedListing {
  id: string;
  title: string;
  price: number;
  platform: string;
  condition: string;
  images: string[];
}

interface MessageThreadProps {
  thread: Message[];
  currentUserId: string;
  partnerId: string;
  listingId?: string | null;
  partnerName: string;
  partnerImage?: string | null;
  pinnedListing?: PinnedListing | null;
  deleteButton?: ReactNode;
  soldToBuyerButton?: ReactNode;
  // Mutual rating
  saleConfirmed?: boolean;
  isSeller?: boolean;
  sellerId?: string;
  sellerName?: string;
  sellerImage?: string | null;
  currentUserName?: string;
  listingTitle?: string;
  myExistingReview?: { rating: number; comment: string | null; strengths: string[] } | null;
}

export function MessageThread({
  thread: initialThread,
  currentUserId,
  partnerId,
  listingId,
  partnerName,
  partnerImage,
  pinnedListing,
  deleteButton,
  soldToBuyerButton,
  saleConfirmed,
  isSeller,
  sellerId,
  sellerName,
  sellerImage,
  currentUserName,
  listingTitle,
  myExistingReview,
}: MessageThreadProps) {
  const [messages, setMessages] = useState(initialThread);
  const [input, setInput]       = useState("");
  const [sending, setSending]   = useState(false);
  const [lastSeen, setLastSeen] = useState(false); // has partner seen my last message?

  // Called by MutualRatingCard after submission — adds the rating message to local thread
  // Rating message was sent to recipient via API — sender sees submitted state in rating card,
  // not a chat bubble. So we don't append to local messages here.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleRatingMessage = (_msgContent: string) => { /* no-op for sender */ };
  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark partner's messages as read when we open/focus the thread
  useEffect(() => {
    fetch("/api/messages/read-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ partnerId, listingId }),
    }).catch(() => {});
  }, [partnerId, listingId]);

  // Poll for "Seen" status on my last message every 5s
  useEffect(() => {
    const poll = () => {
      const params = new URLSearchParams({ partnerId });
      if (listingId) params.set("listingId", listingId);
      fetch(`/api/messages/read-status?${params}`)
        .then(r => r.json())
        .then(d => setLastSeen(d.seen ?? false))
        .catch(() => {});
    };
    poll();
    const id = setInterval(poll, 5000);
    return () => clearInterval(id);
  }, [partnerId, listingId, messages]);

  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    const content = input.trim();
    setInput("");
    setSending(true);
    setLastSeen(false); // reset seen when new message sent

    const tempMsg: Message = {
      id: "temp-" + Date.now(),
      content,
      senderId: currentUserId,
      createdAt: new Date().toISOString(),
      read: false,
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: partnerId, content, listingId: listingId ?? undefined }),
      });
      if (!res.ok) throw new Error();
      const saved = await res.json();
      setMessages(prev => prev.map(m => m.id === tempMsg.id ? { ...saved, createdAt: saved.createdAt } : m));
    } catch {
      toast.error("Failed to send");
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
    } finally {
      setSending(false);
    }
  };

  // Find the last message I sent — to show Seen below it
  const myMessages = messages.filter(m => m.senderId === currentUserId);
  const lastMyMsgId = myMessages[myMessages.length - 1]?.id ?? null;

  return (
    <>
      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-dark-600 bg-dark-800/60 flex-shrink-0">
        {partnerImage ? (
          <Image src={partnerImage} alt={partnerName} width={36} height={36} className="rounded-full" />
        ) : (
          <div className="w-9 h-9 bg-brand-500/20 rounded-full flex items-center justify-center text-brand-400 font-bold text-sm flex-shrink-0">
            {partnerName[0].toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-white text-sm truncate">{partnerName}</div>
          <div className="text-xs text-gray-400">{saleConfirmed ? "Sale confirmed ✓" : "Active seller"}</div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {soldToBuyerButton}
          {deleteButton}
        </div>
      </div>

      {/* ── Pinned listing banner ── */}
      {pinnedListing && (
        <Link href={`/listings/${pinnedListing.id}`}
          className="flex items-center gap-3 px-4 py-2.5 bg-brand-500/8 border-b border-brand-500/20 hover:bg-brand-500/15 transition-colors group flex-shrink-0"
        >
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-dark-700 flex-shrink-0 border border-dark-500">
            {pinnedListing.images[0] ? (
              pinnedListing.images[0].startsWith("data:") ? (
                <img src={pinnedListing.images[0]} alt={pinnedListing.title} className="w-full h-full object-cover" />
              ) : (
                <Image src={pinnedListing.images[0]} alt={pinnedListing.title} width={48} height={48} className="object-cover w-full h-full" />
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center"><Package className="w-5 h-5 text-gray-500" /></div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-brand-400 font-semibold uppercase tracking-wider mb-0.5">About this listing</p>
            <p className="text-sm font-medium text-white truncate group-hover:text-brand-300 transition-colors">{pinnedListing.title}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-brand-400 font-bold text-sm">${Number(pinnedListing.price).toFixed(2)}</span>
              <span className="text-xs text-gray-500">·</span>
              <span className="text-xs text-gray-400">{pinnedListing.platform}</span>
              <span className="text-xs text-gray-500">·</span>
              <span className="text-xs text-gray-400">{pinnedListing.condition}</span>
            </div>
          </div>
          <span className="text-xs text-brand-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">View →</span>
        </Link>
      )}

      {/* ── Scrollable message list ── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 text-sm py-8">Start the conversation!</div>
        )}

        {messages.map((msg, idx) => {
          const isMe = msg.senderId === currentUserId;
          const isRating = msg.content.startsWith("⭐ Rating received");
          const isSystem = (msg.content.startsWith("🎉") && msg.senderId !== currentUserId) || false;
          const prevMsg = idx > 0 ? messages[idx - 1] : null;
          const showLabel = !prevMsg || prevMsg.senderId !== msg.senderId;
          const isLastMine = msg.id === lastMyMsgId;

          // System: sale notification
          if (isSystem) {
            return (
              <div key={msg.id} className="flex justify-center py-2">
                <div className="bg-dark-700/80 border border-brand-500/20 rounded-xl px-4 py-2 text-xs text-gray-300 text-center max-w-xs">
                  {msg.content}
                  <div className="text-gray-500 mt-0.5">{formatRelativeTime(msg.createdAt)}</div>
                </div>
              </div>
            );
          }

          // Rating message — only shown to the RECIPIENT (sender already sees it in rating card)
          if (isRating) {
            if (isMe) return null; // sender doesn't see their own rating as a chat bubble
            const lines = msg.content.split("\n");
            // lines[1] = "★★★★☆ Great — rated you as a seller"
            const starLine = lines[1] ?? "";
            const starMatch = starLine.match(/^(★+)(☆*) (.+?) — rated you as a (\w+)/);
            const filledStars = starMatch ? starMatch[1].length : 0;
            const ratingLabel = starMatch ? starMatch[3] : "";
            const roleLabel   = starMatch ? starMatch[4] : "";
            const strengthLine = lines.find(l => l.startsWith("✨")) ?? "";
            const commentLine  = lines.find(l => l.startsWith('"')) ?? "";
            const strengths = strengthLine.replace("✨ ", "").split(" · ").filter(Boolean);

            return (
              <div key={msg.id} className="flex justify-center py-2">
                <div className="w-full max-w-sm rounded-2xl overflow-hidden border border-amber-500/40 shadow-lg"
                  style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(251,191,36,0.08))" }}>
                  {/* Header */}
                  <div className="flex items-center gap-2 px-4 py-2.5 border-b border-amber-500/25"
                    style={{ background: "rgba(245,158,11,0.12)" }}>
                    <span className="text-base">⭐</span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-amber-300 truncate">
                        Rating received from {roleLabel} {partnerName}
                      </p>
                    </div>
                  </div>
                  {/* Stars */}
                  <div className="px-4 pt-3 pb-1 flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(s => (
                        <svg key={s} className={`w-5 h-5 ${s <= filledStars ? "text-amber-400" : "text-gray-600"}`}
                          fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                        </svg>
                      ))}
                    </div>
                    <span className="text-sm font-semibold text-amber-300">{ratingLabel}</span>
                  </div>
                  {/* Strengths */}
                  {strengths.length > 0 && (
                    <div className="px-4 pb-2 flex flex-wrap gap-1">
                      {strengths.map(s => (
                        <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">{s}</span>
                      ))}
                    </div>
                  )}
                  {/* Comment */}
                  {commentLine && (
                    <p className="px-4 pb-2 text-xs text-gray-300 italic">{commentLine}</p>
                  )}
                  <div className="px-4 pb-3 text-xs text-gray-500">{formatRelativeTime(msg.createdAt)}</div>
                </div>
              </div>
            );
          }

          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"} ${showLabel ? "mt-3" : "mt-0.5"}`}>
              {/* Sender label — only when sender changes */}
              {showLabel && (
                <span className="text-xs text-gray-500 mb-1 px-1">
                  {isMe ? "You" : partnerName}
                </span>
              )}

              {/* Bubble */}
              <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${
                isMe
                  ? "bg-brand-500 text-white rounded-br-sm"
                  : "bg-dark-700 text-gray-100 rounded-bl-sm"
              }`}>
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                <div className="text-xs mt-1 opacity-60 flex items-center gap-1 justify-end">
                  {formatRelativeTime(msg.createdAt)}
                  {isMe && (
                    isLastMine && lastSeen
                      ? <CheckCheck className="w-3 h-3 text-brand-200" />
                      : <Check className="w-3 h-3 opacity-60" />
                  )}
                </div>
              </div>

              {/* Seen label under my last message */}
              {isMe && isLastMine && lastSeen && (
                <span className="text-xs text-brand-300 mt-0.5 px-1 flex items-center gap-1">
                  <CheckCheck className="w-3 h-3" /> Seen
                </span>
              )}
            </div>
          );
        })}

        {/* Mutual rating card — inside scroll so it doesn't block messages */}
        {saleConfirmed && listingId && sellerId && (
          <MutualRatingCard
            listingId={listingId}
            listingTitle={listingTitle ?? "this listing"}
            currentUserId={currentUserId}
            isSeller={isSeller ?? false}
            partnerId={partnerId}
            partnerName={partnerName}
            partnerImage={partnerImage}
            currentUserName={currentUserName ?? "You"}
            sellerId={sellerId}
            sellerName={sellerName ?? partnerName}
            sellerImage={sellerImage}
            myExistingReview={myExistingReview ?? null}
            onRatingMessage={handleRatingMessage}
          />
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div className="p-4 border-t border-dark-600 flex-shrink-0">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Type a message..."
            className="input-base flex-1"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            className="btn-primary px-4"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
}
