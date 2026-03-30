"use client";

import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { useEffect, useState } from "react";

// ── Inline field-level error (under an input) ────────────────────────────────
export function FieldError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div className="flex items-center gap-1.5 mt-1.5">
      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#ef4444" }} />
      <p className="text-xs" style={{ color: "#fca5a5" }}>{message}</p>
    </div>
  );
}

// ── Banner error (inside a card/modal, full width) ───────────────────────────
export function ErrorBanner({ message, onDismiss }: { message?: string | null; onDismiss?: () => void }) {
  if (!message) return null;
  return (
    <div
      className="flex items-start gap-3 px-4 py-3 rounded-xl"
      style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
    >
      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#ef4444" }} />
      <p className="flex-1 text-sm" style={{ color: "#fca5a5", lineHeight: 1.5 }}>{message}</p>
      {onDismiss && (
        <button onClick={onDismiss} className="flex-shrink-0 hover:opacity-70 transition-opacity">
          <X className="w-3.5 h-3.5" style={{ color: "#fca5a5" }} />
        </button>
      )}
    </div>
  );
}

// ── Success banner (inside a card/modal) ─────────────────────────────────────
export function SuccessBanner({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl"
      style={{ background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.2)" }}
    >
      <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "#4ade80" }} />
      <p className="text-sm" style={{ color: "#86efac", lineHeight: 1.5 }}>{message}</p>
    </div>
  );
}

// ── Floating bottom-centre toast replacement ──────────────────────────────────
// Used for success confirmations only (not errors)
interface FloatToastProps {
  message: string;
  type?: "success" | "info";
  duration?: number;
  onDone?: () => void;
}
export function FloatToast({ message, type = "success", duration = 2800, onDone }: FloatToastProps) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => { setVisible(false); onDone?.(); }, duration);
    return () => clearTimeout(t);
  }, [duration, onDone]);
  if (!visible) return null;
  const color = type === "success" ? "#4ade80" : "var(--accent)";
  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2.5 px-5 py-3 rounded-2xl animate-slide-up"
      style={{
        background: "rgba(15,17,35,0.95)",
        border: "1px solid rgba(255,255,255,0.1)",
        backdropFilter: "blur(16px)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        pointerEvents: "none",
      }}
    >
      <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color }} />
      <span className="text-sm font-medium text-white whitespace-nowrap">{message}</span>
    </div>
  );
}
