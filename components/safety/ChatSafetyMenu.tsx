"use client";

import { useState, useRef, useEffect } from "react";
import { MoreHorizontal, Flag, ShieldOff, Trash2 } from "lucide-react";
import { ReportModal } from "@/components/safety/ReportModal";
import { BlockModal } from "@/components/safety/BlockModal";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";

interface Props {
  partnerId: string;
  partnerName: string;
  listingId?: string | null;
  onBlocked?: () => void;
  // legacy prop — ignored, delete is handled internally now
  deleteButton?: React.ReactNode;
}

export function ChatSafetyMenu({ partnerId, partnerName, listingId, onBlocked }: Props) {
  const [open, setOpen]           = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showBlock, setShowBlock]   = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router  = useRouter();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleting(true);
    try {
      const res = await fetch("/api/messages", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partnerId, listingId: listingId ?? null }),
      });
      if (!res.ok) throw new Error();
      toast.success("Chat deleted");
      router.push("/messages");
      router.refresh();
    } catch {
      toast.error("Failed to delete chat");
    } finally {
      setDeleting(false);
      setShowDelete(false);
    }
  };

  const deletePopup = showDelete && typeof document !== "undefined"
    ? createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowDelete(false)}
        >
          <div
            className="bg-dark-800 border border-dark-600 rounded-2xl shadow-2xl p-6 w-full max-w-sm flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/15 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="font-semibold text-white">Delete this chat?</p>
                <p className="text-xs text-gray-400 mt-0.5">This cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
              <button
                onClick={() => setShowDelete(false)}
                className="flex-1 py-2.5 rounded-xl bg-dark-600 hover:bg-dark-500 text-gray-300 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <style>{`
        .chat-menu-trigger {
          display: flex; align-items: center; justify-content: center;
          width: 32px; height: 32px; border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.1);
          cursor: pointer; color: var(--text-secondary);
          background: rgba(255,255,255,0.04);
          transition: background 160ms ease, color 160ms ease, transform 150ms ease, border-color 160ms ease;
          outline: none;
        }
        .chat-menu-trigger:hover, .chat-menu-trigger.is-open {
          background: rgba(255,255,255,0.12); color: #fff; transform: scale(1.08);
          border-color: rgba(255,255,255,0.2);
        }
        .chat-menu-item {
          width: 100%; display: flex; align-items: center; gap: 10px;
          padding: 10px 16px; font-size: 13px; cursor: pointer;
          border: none; background: transparent; text-align: left;
          transition: background 150ms ease, color 150ms ease;
          color: var(--text-secondary); outline: none;
        }
        .chat-menu-item .menu-icon { flex-shrink: 0; transition: transform 180ms ease; }
        .chat-menu-item:hover .menu-icon { transform: scale(1.18); }
        .chat-menu-item-report { color: #fca5a5; background: rgba(239,68,68,0.04); }
        .chat-menu-item-report:hover { background: rgba(239,68,68,0.1); color: #fca5a5; }
        .chat-menu-item-block { color: #fdba74; background: rgba(249,115,22,0.04); }
        .chat-menu-item-block:hover { background: rgba(249,115,22,0.1); color: #fdba74; }
        .chat-menu-item-delete { color: #f87171; background: rgba(239,68,68,0.04); }
        .chat-menu-item-delete:hover { background: rgba(239,68,68,0.1); color: #f87171; }
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
            <div style={{ height: 1, background: "rgba(255,255,255,0.05)" }} />
            <button
              onClick={() => { setOpen(false); setShowDelete(true); }}
              className="chat-menu-item chat-menu-item-delete"
            >
              <Trash2 className="w-3.5 h-3.5 menu-icon" style={{ color: "#ef4444" }} />
              Delete chat
            </button>
          </div>
        )}
      </div>

      {deletePopup}

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
