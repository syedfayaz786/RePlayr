"use client";

import { useState } from "react";
import { Flag, ShieldOff, ShieldCheck } from "lucide-react";
import { ReportModal } from "@/components/safety/ReportModal";
import { BlockModal } from "@/components/safety/BlockModal";
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

  const handleUnblock = async () => {
    setUnblocking(true);
    try {
      await fetch("/api/blocks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockedId: userId }),
      });
      setBlocked(false);
      toast.success("User unblocked");
    } catch {
      toast.error("Failed to unblock");
    } finally {
      setUnblocking(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        {isBlockedBy && (
          <span
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ color: "#f97316", border: "1px solid rgba(249,115,22,0.2)", background: "rgba(249,115,22,0.06)" }}
          >
            <ShieldOff className="w-3 h-3" />
            This user has blocked you
          </span>
        )}
        <button
          onClick={() => setShowReport(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 hover:bg-white/05"
          style={{ color: "var(--text-muted)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <Flag className="w-3 h-3" style={{ color: "#ef4444" }} />
          Report
        </button>

        {blocked ? (
          <button
            onClick={handleUnblock}
            disabled={unblocking}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 disabled:opacity-50"
            style={{
              color: "var(--accent)",
              border: "1px solid rgba(0,240,255,0.2)",
              background: "rgba(0,240,255,0.08)",
            }}
          >
            <ShieldCheck className="w-3 h-3" />
            {unblocking ? "Unblocking…" : "Unblock"}
          </button>
        ) : (
          <button
            onClick={() => setShowBlock(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 hover:bg-white/05"
            style={{ color: "var(--text-muted)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <ShieldOff className="w-3 h-3" style={{ color: "#f97316" }} />
            Block
          </button>
        )}
      </div>

      {showReport && (
        <ReportModal
          type="user"
          targetId={userId}
          targetName={userName ?? undefined}
          onClose={() => setShowReport(false)}
        />
      )}
      {showBlock && (
        <BlockModal
          userId={userId}
          userName={userName ?? undefined}
          onClose={() => setShowBlock(false)}
          onBlocked={() => setBlocked(true)}
        />
      )}
    </>
  );
}