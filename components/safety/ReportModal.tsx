"use client";

import { useState } from "react";
import { X, Flag } from "lucide-react";
import { createPortal } from "react-dom";
import { ErrorBanner } from "@/components/ui/InlineError";

const REASONS = ["Scam or fraud","Spam","Inappropriate behavior","Fake listing","Other"];

interface Props {
  type: "user" | "listing";
  targetId: string;
  targetName?: string;
  onClose: () => void;
}

export function ReportModal({ type, targetId, targetName, onClose }: Props) {
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!reason) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, targetId, reason, message }),
      });
      if (!res.ok) throw new Error();
      setDone(true);
    } catch {
      setError("Failed to submit report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const modal = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
      onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl p-6 relative animate-slide-up"
        style={{ background: "var(--bg-elevated)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 24px 64px rgba(0,0,0,0.6)" }}
        onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 transition-colors duration-150 hover:text-white"
          style={{ color: "var(--text-muted)" }}>
          <X className="w-4 h-4" />
        </button>

        {done ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: "rgba(0,240,255,0.1)", border: "1px solid rgba(0,240,255,0.2)" }}>
              <Flag className="w-5 h-5" style={{ color: "var(--accent)" }} />
            </div>
            <h3 className="font-display font-semibold text-white mb-2" style={{ letterSpacing: "-0.02em" }}>
              Report submitted
            </h3>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>
              Thanks for reporting. We'll review this and take appropriate action.
            </p>
            <button onClick={onClose} className="btn-primary mt-6 w-full">Done</button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.2)" }}>
                <Flag className="w-4 h-4" style={{ color: "#ef4444" }} />
              </div>
              <div>
                <h3 className="font-display font-semibold text-white" style={{ letterSpacing: "-0.02em", fontSize: 16 }}>
                  Report {type === "user" ? "user" : "listing"}
                </h3>
                {targetName && <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 1 }}>{targetName}</p>}
              </div>
            </div>

            <div className="mb-4">
              <label className="label-base">Reason</label>
              <select value={reason} onChange={e => setReason(e.target.value)} className="input-base">
                <option value="">Select a reason…</option>
                {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div className="mb-4">
              <label className="label-base">
                Additional details{" "}
                <span style={{ color: "var(--text-muted)", textTransform: "none", letterSpacing: 0 }}>(optional)</span>
              </label>
              <textarea value={message} onChange={e => setMessage(e.target.value)}
                rows={3} placeholder="Describe what happened…" className="input-base resize-none" />
            </div>

            {error && <div className="mb-4"><ErrorBanner message={error} onDismiss={() => setError("")} /></div>}

            <div className="flex gap-3">
              <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
              <button onClick={submit} disabled={!reason || loading}
                className="flex-1 font-semibold rounded-xl transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ padding: "10px 20px", fontSize: 13.5, background: "#ef4444", color: "#fff", boxShadow: loading ? "none" : "0 0 16px rgba(239,68,68,0.2)" }}>
                {loading ? "Submitting…" : "Submit report"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modal, document.body) : null;
}
