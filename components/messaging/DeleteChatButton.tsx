"use client";

import { useState, useRef, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";

interface DeleteChatButtonProps {
  partnerId: string;
  listingId?: string | null;
  variant?: "icon" | "full";
}

export function DeleteChatButton({ partnerId, listingId, variant = "icon" }: DeleteChatButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [popupPos, setPopupPos]     = useState({ top: 0, left: 0 });
  const btnRef   = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const router   = useRouter();

  // Position popup relative to button using fixed coords (escapes overflow clipping)
  const openPopup = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPopupPos({
        top:  rect.top - 8,   // will shift up via transform
        left: rect.right - 208, // 208 = popup width, align right edge
      });
    }
    setConfirming((v) => !v);
  };

  // Close on outside click
  useEffect(() => {
    if (!confirming) return;
    const handler = (e: MouseEvent) => {
      if (
        popupRef.current && !popupRef.current.contains(e.target as Node) &&
        btnRef.current  && !btnRef.current.contains(e.target as Node)
      ) {
        setConfirming(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [confirming]);

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
      setConfirming(false);
    }
  };

  const popup = confirming && typeof document !== "undefined"
    ? createPortal(
        <div
          ref={popupRef}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          style={{ top: popupPos.top, left: Math.max(8, popupPos.left) }}
          className="fixed z-[9999] w-52 bg-dark-800 border border-dark-500 rounded-2xl shadow-2xl shadow-black/70 p-4 flex flex-col gap-3 -translate-y-full"
        >
          {/* Arrow pointing down toward button */}
          <div className="absolute bottom-[-7px] right-4 w-3 h-3 bg-dark-800 border-r border-b border-dark-500 rotate-45" />

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-red-500/15 flex items-center justify-center flex-shrink-0">
              <Trash2 className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white leading-tight">Delete chat?</p>
              <p className="text-xs text-gray-400 mt-0.5">This cannot be undone.</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirming(false); }}
              className="flex-1 py-2 rounded-xl bg-dark-600 hover:bg-dark-500 text-gray-300 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>,
        document.body
      )
    : null;

  if (variant === "full") {
    return (
      <>
        <button
          ref={btnRef}
          onClick={openPopup}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:border-red-500/50 transition-all text-xs font-medium"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete Chat
        </button>
        {popup}
      </>
    );
  }

  return (
    <>
      <button
        ref={btnRef}
        onClick={openPopup}
        className="p-1.5 rounded-lg hover:bg-red-500/15 text-gray-500 hover:text-red-400 transition-colors flex-shrink-0"
        title="Delete conversation"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
      {popup}
    </>
  );
}
