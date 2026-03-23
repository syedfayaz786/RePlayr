"use client";

import { useState, useRef, useEffect } from "react";
import { MoreHorizontal, Flag, ShieldOff } from "lucide-react";
import { ReportModal } from "@/components/safety/ReportModal";
import { BlockModal } from "@/components/safety/BlockModal";

interface Props {
  partnerId: string;
  partnerName: string;
  onBlocked?: () => void;
}

export function ChatSafetyMenu({ partnerId, partnerName, onBlocked }: Props) {
  const [open, setOpen] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showBlock, setShowBlock] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setOpen(v => !v)}
          className="flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-150 hover:text-white"
          style={{
            color: "var(--text-muted)",
            background: open ? "rgba(255,255,255,0.06)" : "transparent",
          }}
          title="More options"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>

        {open && (
          <div
            className="absolute right-0 top-full mt-1.5 w-44 rounded-xl overflow-hidden z-30 animate-slide-up"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 12px 32px rgba(0,0,0,0.5)",
            }}
          >
            <button
              onClick={() => { setOpen(false); setShowReport(true); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-150 hover:bg-white/05"
              style={{ color: "var(--text-secondary)" }}
            >
              <Flag className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#ef4444" }} />
              Report user
            </button>
            <div style={{ height: 1, background: "rgba(255,255,255,0.05)" }} />
            <button
              onClick={() => { setOpen(false); setShowBlock(true); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-150 hover:bg-white/05"
              style={{ color: "var(--text-secondary)" }}
            >
              <ShieldOff className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#f97316" }} />
              Block user
            </button>
          </div>
        )}
      </div>

      {showReport && (
        <ReportModal
          type="user"
          targetId={partnerId}
          targetName={partnerName}
          onClose={() => setShowReport(false)}
        />
      )}

      {showBlock && (
        <BlockModal
          userId={partnerId}
          userName={partnerName}
          onClose={() => setShowBlock(false)}
          onBlocked={onBlocked}
        />
      )}
    </>
  );
}
