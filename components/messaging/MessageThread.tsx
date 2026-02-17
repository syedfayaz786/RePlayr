"use client";

import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import Image from "next/image";
import toast from "react-hot-toast";

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  listing?: { id: string; title: string } | null;
}

interface MessageThreadProps {
  thread: Message[];
  currentUserId: string;
  partnerId: string;
  partnerName: string;
  partnerImage?: string | null;
}

export function MessageThread({
  thread: initialThread,
  currentUserId,
  partnerId,
  partnerName,
  partnerImage,
}: MessageThreadProps) {
  const [messages, setMessages] = useState(initialThread);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    const content = input.trim();
    setInput("");
    setSending(true);
    // Optimistic update
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
        body: JSON.stringify({ receiverId: partnerId, content }),
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
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-dark-600">
        {partnerImage ? (
          <Image src={partnerImage} alt={partnerName} width={36} height={36} className="rounded-full" />
        ) : (
          <div className="w-9 h-9 bg-brand-500/20 rounded-full flex items-center justify-center text-brand-400 font-bold text-sm">
            {partnerName[0].toUpperCase()}
          </div>
        )}
        <div>
          <div className="font-semibold text-white">{partnerName}</div>
          <div className="text-xs text-gray-400">Active seller</div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 text-sm py-8">
            Start the conversation!
          </div>
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
                {msg.listing && (
                  <div className="text-xs opacity-70 mb-1 border-b border-white/10 pb-1">
                    Re: {msg.listing.title}
                  </div>
                )}
                <p className="whitespace-pre-wrap">{msg.content}</p>
                <div className={`text-xs mt-1 opacity-60`}>
                  {formatRelativeTime(msg.createdAt)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
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
