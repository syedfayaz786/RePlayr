"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Package } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
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
}

export function MessageThread({
  thread: initialThread,
  currentUserId,
  partnerId,
  listingId,
  partnerName,
  partnerImage,
  pinnedListing,
}: MessageThreadProps) {
  const [messages, setMessages] = useState(initialThread);
  const [input, setInput]       = useState("");
  const [sending, setSending]   = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    const content = input.trim();
    setInput("");
    setSending(true);
    const tempMsg: Message = {
      id: "temp-" + Date.now(),
      content,
      senderId: currentUserId,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: partnerId, content, listingId: listingId ?? undefined }),
      });
      if (!res.ok) throw new Error();
      const saved = await res.json();
      setMessages((prev) =>
        prev.map((m) => (m.id === tempMsg.id ? { ...saved, createdAt: saved.createdAt } : m))
      );
    } catch {
      toast.error("Failed to send");
      setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* ── Partner header ── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-dark-600 bg-dark-800/60">
        {partnerImage ? (
          <Image src={partnerImage} alt={partnerName} width={36} height={36} className="rounded-full" />
        ) : (
          <div className="w-9 h-9 bg-brand-500/20 rounded-full flex items-center justify-center text-brand-400 font-bold text-sm">
            {partnerName[0].toUpperCase()}
          </div>
        )}
        <div>
          <div className="font-semibold text-white text-sm">{partnerName}</div>
          <div className="text-xs text-gray-400">Active seller</div>
        </div>
      </div>

      {/* ── Pinned listing banner ── */}
      {pinnedListing && (
        <Link
          href={`/listings/${pinnedListing.id}`}
          className="flex items-center gap-3 px-4 py-2.5 bg-brand-500/8 border-b border-brand-500/20 hover:bg-brand-500/15 transition-colors group"
        >
          {/* Thumbnail */}
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-dark-700 flex-shrink-0 border border-dark-500">
            {pinnedListing.images[0] ? (
              pinnedListing.images[0].startsWith("data:") ? (
                <img src={pinnedListing.images[0]} alt={pinnedListing.title} className="w-full h-full object-cover" />
              ) : (
                <Image src={pinnedListing.images[0]} alt={pinnedListing.title} width={48} height={48} className="object-cover w-full h-full" />
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-5 h-5 text-gray-500" />
              </div>
            )}
          </div>
          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-brand-400 font-semibold uppercase tracking-wider mb-0.5">About this listing</p>
            <p className="text-sm font-medium text-white truncate group-hover:text-brand-300 transition-colors">
              {pinnedListing.title}
            </p>
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

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 text-sm py-8">Start the conversation!</div>
        )}
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUserId;
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm ${
                  isMe
                    ? "bg-brand-500 text-white rounded-br-sm"
                    : "bg-dark-700 text-gray-100 rounded-bl-sm"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                <div className="text-xs mt-1 opacity-60">
                  {formatRelativeTime(msg.createdAt)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div className="p-4 border-t border-dark-600">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
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
