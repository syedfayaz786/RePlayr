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
      <style>{`
        .chat-menu-trigger {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          color: var(--text-muted);
          background: transparent;
          transition: background 160ms ease, color 160ms ease, transform 150ms ease;
          outline: none;
        }
        .chat-menu-trigger:hover {
          background: rgba(255,255,255,0.07);
          color: #fff;
          transform: scale(1.08);
        }
        .chat-menu-trigger.is-open {
          background: rgba(255,255,255,0.07);
          color: #fff;
        }

        .chat-menu-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 16px;
          font-size: 13px;
          cursor: pointer;
          border: none;
          background: transparent;
          text-align: left;
          transition: background 150ms ease, color 150ms ease;
          color: var(--text-secondary);
          outline: none;
        }
        .chat-menu-item .menu-icon {
          flex-shrink: 0;
          transition: transform 180ms ease;
        }
        .chat-menu-item:hover .menu-icon {
          transform: scale(1.2);
        }

        .chat-menu-item-report:hover {
          background: rgba(239,68,68,0.07);
          color: #fca5a5;
        }
        .chat-menu-item-block:hover {
          background: rgba(249,115,22,0.07);
          color: #fdba74;
        }
      `}</style>

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setOpen(v => !v)}
          className={`chat-menu-trigger${open ? " is-open" : ""}`}
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
              className="chat-menu-item chat-menu-item-report"
            >
              <Flag className="w-3.5 h-3.5 menu-icon" style={{ color: "#ef4444" }} />
              Report user
            </button>
            <div style={{ height: 1, background: "rgba(255,255,255,0.05)" }} />
            <button
              onClick={() => { setOpen(false); setShowBlock(true); }}
              className="chat-menu-item chat-menu-item-block"
            >
              <ShieldOff className="w-3.5 h-3.5 menu-icon" style={{ color: "#f97316" }} />
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
