"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Search, X, ChevronDown, MessageSquare, Bell } from "lucide-react";
import Image from "next/image";
import { formatRelativeTime } from "@/lib/utils";
import { DeleteChatButton } from "@/components/messaging/DeleteChatButton";

interface ConvEntry {
  partnerId:   string;
  partnerName: string | null;
  partnerImage: string | null;
  lastMessageContent: string;
  lastMessageAt: string;
  unread: number;
  listingId: string | null;
  listingTitle: string | null;
  allContents: string[];
}

interface MessagesSidebarProps {
  conversations: ConvEntry[];
  activeKey: string | null;
}

type FilterType = "all" | "unread";
type SortType   = "newest" | "oldest" | "unread" | "name";

const SORT_LABELS: Record<SortType, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  unread: "Unread first",
  name:   "Name A–Z",
};

export function MessagesSidebar({ conversations, activeKey }: MessagesSidebarProps) {
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState<FilterType>("all");
  const [sort,   setSort]     = useState<SortType>("newest");
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  // Close sort dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const totalUnread = conversations.reduce((s, c) => s + c.unread, 0);

  const filtered = useMemo(() => {
    let list = [...conversations];

    // Search — matches partner name, listing title, or ANY message in the conversation
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.partnerName?.toLowerCase().includes(q) ||
        c.listingTitle?.toLowerCase().includes(q) ||
        c.allContents.some(msg => msg.toLowerCase().includes(q))
      );
    }

    // Filter
    if (filter === "unread") list = list.filter(c => c.unread > 0);

    // Sort
    switch (sort) {
      case "newest": list.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()); break;
      case "oldest": list.sort((a, b) => new Date(a.lastMessageAt).getTime() - new Date(b.lastMessageAt).getTime()); break;
      case "unread": list.sort((a, b) => b.unread - a.unread || new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()); break;
      case "name":   list.sort((a, b) => (a.partnerName ?? "").localeCompare(b.partnerName ?? "")); break;
    }

    return list;
  }, [conversations, search, filter, sort]);

  const previewContent = (content: string) => {
    if (content.startsWith("🎉 SALE_CONFIRMED")) return "🎉 Sale confirmed";
    if (content.startsWith("⭐ Rating received")) return "⭐ Rating received";
    if (content.includes("rated you as a")) return "⭐ Rating received";
    return content;
  };

  return (
    <div className="flex flex-col h-full">

      {/* ── Search bar ── */}
      <div className="p-3 border-b border-dark-600 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search messages…"
            className="w-full bg-dark-700 border border-dark-600 rounded-lg pl-8 pr-8 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-500/50 transition-colors"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* ── Filter + Sort toolbar ── */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-dark-600 flex-shrink-0">
        {/* Filter pills */}
        <button
          onClick={() => setFilter("all")}
          className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
            filter === "all"
              ? "bg-brand-500 border-brand-500 text-white"
              : "bg-dark-700 border-dark-600 text-gray-400 hover:text-white hover:border-dark-500"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`text-xs px-2.5 py-1 rounded-full border transition-colors flex items-center gap-1 ${
            filter === "unread"
              ? "bg-brand-500 border-brand-500 text-white"
              : "bg-dark-700 border-dark-600 text-gray-400 hover:text-white hover:border-dark-500"
          }`}
        >
          <Bell className="w-2.5 h-2.5" />
          Unread
          {totalUnread > 0 && (
            <span className={`text-[9px] font-bold min-w-[14px] h-3.5 px-0.5 rounded-full flex items-center justify-center ${filter === "unread" ? "bg-white text-brand-500" : "bg-brand-500 text-white"}`}>
              {totalUnread}
            </span>
          )}
        </button>

        {/* Sort dropdown */}
        <div ref={sortRef} className="relative ml-auto">
          <button
            onClick={() => setSortOpen(o => !o)}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-dark-700 border border-transparent hover:border-dark-600"
          >
            <span className="hidden sm:inline">{SORT_LABELS[sort]}</span>
            <span className="sm:hidden">Sort</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${sortOpen ? "rotate-180" : ""}`} />
          </button>
          {sortOpen && (
            <div className="absolute right-0 top-full mt-1 w-36 bg-dark-800 border border-dark-600 rounded-xl shadow-2xl overflow-hidden z-20">
              {(Object.keys(SORT_LABELS) as SortType[]).map(s => (
                <button
                  key={s}
                  onClick={() => { setSort(s); setSortOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                    sort === s
                      ? "bg-brand-500/20 text-brand-300"
                      : "text-gray-400 hover:bg-dark-700 hover:text-white"
                  }`}
                >
                  {SORT_LABELS[s]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Results count when searching ── */}
      {(search || filter === "unread") && (
        <div className="px-3 py-1.5 bg-dark-800/50 border-b border-dark-600 flex-shrink-0">
          <p className="text-xs text-gray-500">
            {filtered.length === 0
              ? "No conversations found"
              : `${filtered.length} conversation${filtered.length !== 1 ? "s" : ""}`}
            {search && <span className="text-brand-400"> matching "{search}"</span>}
          </p>
        </div>
      )}

      {/* ── Conversation list — scrollable ── */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <MessageSquare className="w-10 h-10 text-gray-500 mb-3" />
            <p className="text-sm text-gray-400">No messages yet</p>
            <p className="text-xs text-gray-500 mt-1">Find a listing and message the seller</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <Search className="w-8 h-8 text-gray-600 mb-3" />
            <p className="text-sm text-gray-400">No results</p>
            <button onClick={() => { setSearch(""); setFilter("all"); }} className="text-xs text-brand-400 mt-2 hover:underline">
              Clear filters
            </button>
          </div>
        ) : (
          filtered.map(conv => {
            const href = `/messages?with=${conv.partnerId}${conv.listingId ? `&listing=${conv.listingId}` : ""}${search.trim() ? `&q=${encodeURIComponent(search.trim())}` : ""}`;
            const key  = `${conv.partnerId}::${conv.listingId ?? "none"}`;
            const isActive = activeKey === key;
            const preview = previewContent(conv.lastMessageContent);

            return (
              <a key={key} href={href}
                className={`flex items-center gap-3 p-4 hover:bg-dark-700 transition-colors border-b border-dark-600 ${
                  isActive ? "bg-dark-700 border-l-2 border-l-brand-500" : ""
                }`}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  {conv.partnerImage ? (
                    <Image src={conv.partnerImage} alt={conv.partnerName ?? ""} width={40} height={40} className="rounded-full" />
                  ) : (
                    <div className="w-10 h-10 bg-brand-500/20 rounded-full flex items-center justify-center text-brand-400 font-bold">
                      {conv.partnerName?.[0]?.toUpperCase() ?? "?"}
                    </div>
                  )}
                  {conv.unread > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-500 rounded-full text-xs flex items-center justify-center text-white font-bold">
                      {conv.unread > 9 ? "9+" : conv.unread}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={`text-sm font-medium truncate ${conv.unread > 0 ? "text-white" : "text-gray-300"}`}>
                      {conv.partnerName}
                    </span>
                    <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                      {formatRelativeTime(conv.lastMessageAt)}
                    </span>
                  </div>
                  {conv.listingTitle && (
                    <p className="text-xs text-brand-400 truncate mb-0.5 font-medium">🎮 {conv.listingTitle}</p>
                  )}
                  <p className={`text-xs truncate ${conv.unread > 0 ? "text-gray-300 font-medium" : "text-gray-500"}`}>
                    {preview}
                  </p>
                </div>

                <DeleteChatButton partnerId={conv.partnerId} listingId={conv.listingId} variant="icon" />
              </a>
            );
          })
        )}
      </div>
    </div>
  );
}
