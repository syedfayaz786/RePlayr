"use client";

import { useState, useRef, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface DeleteChatButtonProps {
  partnerId: string;
  listingId?: string | null;
  variant?: "icon" | "full";
}

export function DeleteChatButton({ partnerId, listingId, variant = "icon" }: DeleteChatButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const router  = useRouter();
  const popupRef = useRef<HTMLDivElement>(null);

  // Close popup on outside click
  useEffect(() => {
    if (!confirming) return;
    const handler = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
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

  const triggerBtn = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirming((v) => !v);
  };

  // Floating popup (used for both variants when confirming)
  const popup = confirming ? (
    <div
      ref={popupRef}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
      className={`absolute z-50 bg-dark-800 border border-dark-500 rounded-2xl shadow-2xl shadow-black/60 p-4 flex flex-col gap-3 w-52
        ${variant === "icon"
          ? "bottom-full right-0 mb-2"   // above the icon, aligned right
          : "top-full right-0 mt-2"      // below the header button
        }`}
    >
      {/* Arrow pointer */}
      <div className={`absolute w-3 h-3 bg-dark-800 border-dark-500 rotate-45
        ${variant === "icon"
          ? "bottom-[-7px] right-3 border-r border-b"
          : "top-[-7px] right-3 border-l border-t"
        }`}
      />
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-red-500/15 flex items-center justify-center flex-shrink-0">
          <Trash2 className="w-4 h-4 text-red-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white leading-tight">Delete chat?</p>
          <p className="text-xs text-gray-400 leading-tight mt-0.5">This cannot be undone.</p>
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
    </div>
  ) : null;

  if (variant === "full") {
    return (
      <div className="relative flex-shrink-0">
        <button
          onClick={triggerBtn}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:border-red-500/50 transition-all text-xs font-medium"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete Chat
        </button>
        {popup}
      </div>
    );
  }

  return (
    <div className="relative flex-shrink-0">
      <button
        onClick={triggerBtn}
        className="p-1.5 rounded-lg hover:bg-red-500/15 text-gray-500 hover:text-red-400 transition-colors"
        title="Delete conversation"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
      {popup}
    </div>
  );
}
