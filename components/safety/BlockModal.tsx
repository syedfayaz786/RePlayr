"use client";

import { useState } from "react";
import { X, ShieldOff } from "lucide-react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";

interface Props {
  userId: string;
  userName?: string;
  onClose: () => void;
  onBlocked?: () => void;
}

export function BlockModal({ userId, userName, onClose, onBlocked }: Props) {
  const [loading, setLoading] = useState(false);

  const confirm = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockedId: userId }),
      });
      if (!res.ok) throw new Error();
      toast.success("User blocked");
      onBlocked?.();
      onClose();
    } catch {
      toast.error("Failed to block user");
    } finally {
      setLoading(false);
    }
  };

  const modal = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6 relative animate-slide-up"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
        }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 transition-colors duration-150 hover:text-white"
          style={{ color: "var(--text-muted)" }}
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.2)" }}
          >
            <ShieldOff className="w-4 h-4" style={{ color: "#f97316" }} />
          </div>
          <h3 className="font-display font-semibold text-white" style={{ letterSpacing: "-0.02em", fontSize: 16 }}>
            Block {userName ?? "user"}?
          </h3>
        </div>

        <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.65, marginBottom: 24 }}>
          You won't be able to message or see this user anymore. They won't be notified.
        </p>

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button
            onClick={confirm}
            disabled={loading}
            className="flex-1 font-semibold rounded-xl transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              padding: "10px 20px",
              fontSize: 13.5,
              background: "#f97316",
              color: "#fff",
              boxShadow: loading ? "none" : "0 0 16px rgba(249,115,22,0.2)",
            }}
          >
            {loading ? "Blocking…" : "Block user"}
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modal, document.body) : null;
}
