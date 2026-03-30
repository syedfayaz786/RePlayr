"use client";

import { useState } from "react";
import { Flag, ShieldOff, ShieldCheck } from "lucide-react";
import { ReportModal } from "@/components/safety/ReportModal";
import { BlockModal } from "@/components/safety/BlockModal";
import { ErrorBanner } from "@/components/ui/InlineError";
import toast from "react-hot-toast";

interface Props {
  userId: string;
  userName?: string | null;
  isBlocked?: boolean;
  isBlockedBy?: boolean;
}

export function ProfileSafetyButtons({ userId, userName, isBlocked: initialBlocked = false, isBlockedBy = false }: Props) {
  const [showReport, setShowReport] = useState(false);
  const [showBlock, setShowBlock] = useState(false);
  const [blocked, setBlocked] = useState(initialBlocked);
  const [unblocking, setUnblocking] = useState(false);
  const [error, setError] = useState("");

  const handleUnblock = async () => {
    setUnblocking(true);
    setError("");
    try {
      const res = await fetch("/api/blocks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockedId: userId }),
      });
      if (!res.ok) throw new Error();
      setBlocked(false);
      toast.success("User unblocked");
      window.dispatchEvent(new CustomEvent("user-unblocked", { detail: { userId } }));
    } catch {
      setError("Failed to unblock. Please try again.");
    } finally {
      setUnblocking(false);
    }
  };

  const handleBlocked = () => {
    setBlocked(true);
    window.dispatchEvent(new CustomEvent("user-blocked", { detail: { userId } }));
  };

  return (
    <>
      <style>{`
        .safety-btn { display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:8px;font-size:12px;font-weight:500;cursor:pointer;transition:background 180ms ease,border-color 180ms ease,color 180ms ease,box-shadow 180ms ease,transform 150ms ease;outline:none; }
        .safety-btn:hover{transform:translateY(-1px);}
        .safety-btn .btn-icon{transition:transform 200ms ease;}
        .safety-btn:hover .btn-icon{transform:scale(1.2);}
        .safety-btn-report{background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.15);color:#fca5a5;}
        .safety-btn-report:hover{background:rgba(239,68,68,0.12);border-color:rgba(239,68,68,0.3);box-shadow:0 0 12px rgba(239,68,68,0.12);}
        .safety-btn-block{background:rgba(249,115,22,0.06);border:1px solid rgba(249,115,22,0.15);color:#fdba74;}
        .safety-btn-block:hover{background:rgba(249,115,22,0.12);border-color:rgba(249,115,22,0.3);box-shadow:0 0 12px rgba(249,115,22,0.12);}
        .safety-btn-unblock{color:var(--accent);border:1px solid rgba(0,240,255,0.2);background:rgba(0,240,255,0.06);font-weight:600;}
        .safety-btn-unblock:hover{background:rgba(0,240,255,0.12);border-color:rgba(0,240,255,0.35);box-shadow:0 0 14px rgba(0,240,255,0.15);}
        .safety-btn-unblock:disabled{opacity:0.5;cursor:not-allowed;transform:none;}
      `}</style>

      <div className="flex flex-col gap-2 mt-3">
        <div className="flex items-center gap-2 flex-wrap">
          {isBlockedBy && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ color: "#f97316", border: "1px solid rgba(249,115,22,0.2)", background: "rgba(249,115,22,0.06)" }}>
              <ShieldOff className="w-3 h-3" />
              This user has blocked you
            </span>
          )}
          <button onClick={() => setShowReport(true)} className="safety-btn safety-btn-report">
            <Flag className="w-3 h-3 btn-icon" style={{ color: "#ef4444" }} />Report
          </button>
          {blocked ? (
            <button onClick={handleUnblock} disabled={unblocking} className="safety-btn safety-btn-unblock">
              <ShieldCheck className="w-3 h-3 btn-icon" />
              {unblocking ? "Unblocking…" : "Unblock"}
            </button>
          ) : (
            <button onClick={() => setShowBlock(true)} className="safety-btn safety-btn-block">
              <ShieldOff className="w-3 h-3 btn-icon" style={{ color: "#f97316" }} />Block
            </button>
          )}
        </div>
        {error && <ErrorBanner message={error} onDismiss={() => setError("")} />}
      </div>

      {showReport && (
        <ReportModal type="user" targetId={userId} targetName={userName ?? undefined} onClose={() => setShowReport(false)} />
      )}
      {showBlock && (
        <BlockModal userId={userId} userName={userName ?? undefined} onClose={() => setShowBlock(false)} onBlocked={handleBlocked} />
      )}
    </>
  );
}
