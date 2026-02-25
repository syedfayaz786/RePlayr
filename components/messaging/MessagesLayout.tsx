"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Info } from "lucide-react";

// Which panel is visible on mobile
type MobilePanel = "sidebar" | "thread" | "info";

interface MessagesLayoutProps {
  sidebar: React.ReactNode;
  thread: React.ReactNode;
  info: React.ReactNode;
  hasActiveConv: boolean; // whether a conversation is selected
  hasActiveListing: boolean;
}

export function MessagesLayout({ sidebar, thread, info, hasActiveConv, hasActiveListing }: MessagesLayoutProps) {
  // On mobile, start on sidebar; if a conv is already selected (page load with ?with=), go to thread
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>(hasActiveConv ? "thread" : "sidebar");

  // Sync when URL changes (e.g. clicking a conv from search)
  useEffect(() => {
    if (hasActiveConv && mobilePanel === "sidebar") setMobilePanel("thread");
    if (!hasActiveConv) setMobilePanel("sidebar");
  }, [hasActiveConv]);

  return (
    // Full viewport height minus navbar/header — use dvh for mobile browsers
    <div className="flex-1 min-h-0 flex overflow-hidden rounded-xl border border-dark-600 bg-dark-800">

      {/* ══ COL 1: Sidebar ══
          Mobile: full width, shown only when mobilePanel=sidebar
          md+: fixed 288px, always visible
      */}
      <div className={`
        flex-shrink-0 border-r border-dark-600 flex flex-col min-h-0
        w-full md:w-72
        ${mobilePanel === "sidebar" ? "flex" : "hidden"} md:flex
      `}>
        {/* Mobile header for sidebar */}
        <div className="flex items-center px-4 py-3 border-b border-dark-600 md:hidden flex-shrink-0">
          <h2 className="font-semibold text-white text-sm">Messages</h2>
        </div>
        <div className="flex-1 min-h-0 flex flex-col">
          {sidebar}
        </div>
      </div>

      {/* ══ COL 2: Thread ══
          Mobile: full width, shown when mobilePanel=thread
          md+: flex-1, always visible
      */}
      <div className={`
        flex-col overflow-hidden min-w-0 min-h-0
        w-full md:flex-1
        ${mobilePanel === "thread" ? "flex" : "hidden"} md:flex
      `}>
        {/* Mobile top bar with back button and info button */}
        {hasActiveConv && (
          <div className="flex items-center gap-2 px-3 py-2 border-b border-dark-600 bg-dark-800/80 md:hidden flex-shrink-0">
            <button
              onClick={() => setMobilePanel("sidebar")}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-xs">All messages</span>
            </button>
            {hasActiveListing && (
              <button
                onClick={() => setMobilePanel("info")}
                className="ml-auto flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 transition-colors"
              >
                <Info className="w-3.5 h-3.5" />
                Listing info
              </button>
            )}
          </div>
        )}
        {thread}
      </div>

      {/* ══ COL 3: Listing info ══
          Mobile: full width overlay, shown when mobilePanel=info
          lg+: fixed 288px, always visible
      */}
      <div className={`
        flex-shrink-0 border-l border-dark-600 min-h-0 bg-dark-800/50
        w-full lg:w-72
        ${mobilePanel === "info" ? "flex flex-col" : "hidden"} lg:flex lg:flex-col
      `}>
        {/* Mobile back button in info panel */}
        <div className="flex items-center px-4 py-3 border-b border-dark-600 lg:hidden flex-shrink-0">
          <button
            onClick={() => setMobilePanel("thread")}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs">Back to chat</span>
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto">
          {info}
        </div>
      </div>

    </div>
  );
}
