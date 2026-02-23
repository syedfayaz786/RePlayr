"use client";

import { useState } from "react";
import { Trash2, X, AlertTriangle } from "lucide-react";
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
        className="flex items-center gap-1.5 bg-red-500/15 border border-red-500/40 rounded-lg px-2 py-1"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
      >
        <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
        <span className="text-xs text-red-300 whitespace-nowrap">Delete chat?</span>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-xs font-semibold text-red-400 hover:text-red-300 transition-colors px-1"
        >
          {deleting ? "…" : "Yes"}
        </button>
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirming(false); }}
          className="text-gray-500 hover:text-gray-300 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
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
