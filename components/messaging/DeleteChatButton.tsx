"use client";

import { useState } from "react";
import { Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface DeleteChatButtonProps {
  partnerId: string;
  listingId?: string | null;
  variant?: "icon" | "full"; // icon = small trash for sidebar, full = button in header
}

export function DeleteChatButton({ partnerId, listingId, variant = "icon" }: DeleteChatButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const router = useRouter();

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

  if (confirming) {
    return (
      <div
        className="flex items-center gap-2 bg-dark-800 border border-red-500/50 rounded-xl px-3 py-2 shadow-lg shadow-red-500/10"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
      >
        <span className="text-xs text-gray-300 whitespace-nowrap font-medium">Delete this chat?</span>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-50"
        >
          {deleting ? "…" : "Delete"}
        </button>
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirming(false); }}
          className="text-xs font-medium px-2.5 py-1 rounded-lg bg-dark-600 hover:bg-dark-500 text-gray-300 transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  if (variant === "full") {
    return (
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirming(true); }}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:border-red-500/50 transition-all text-xs font-medium"
      >
        <Trash2 className="w-3.5 h-3.5" />
        Delete Chat
      </button>
    );
  }

  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirming(true); }}
      className="p-1.5 rounded-lg hover:bg-red-500/15 text-gray-500 hover:text-red-400 transition-colors flex-shrink-0"
      title="Delete conversation"
    >
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  );
}
