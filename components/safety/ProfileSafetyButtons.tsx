"use client";

import { useState } from "react";
import { Flag, ShieldOff } from "lucide-react";
import { ReportModal } from "@/components/safety/ReportModal";
import { BlockModal } from "@/components/safety/BlockModal";

interface Props {
  userId: string;
  userName?: string | null;
}

export function ProfileSafetyButtons({ userId, userName }: Props) {
  const [showReport, setShowReport] = useState(false);
  const [showBlock, setShowBlock] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2 mt-3">
        <button
          onClick={() => setShowReport(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 hover:bg-white/05"
          style={{ color: "var(--text-muted)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <Flag className="w-3 h-3" style={{ color: "#ef4444" }} />
          Report
        </button>
        <button
          onClick={() => setShowBlock(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 hover:bg-white/05"
          style={{ color: "var(--text-muted)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <ShieldOff className="w-3 h-3" style={{ color: "#f97316" }} />
          Block
        </button>
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
        />
      )}
    </>
  );
}
