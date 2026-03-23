"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShieldOff, ShieldCheck, UserX } from "lucide-react";
import toast from "react-hot-toast";

interface BlockedUser {
  id: string;
  name: string | null;
  image: string | null;
  blockedAt: string;
}

interface Props {
  initialUsers: BlockedUser[];
}

export function BlockedUsersList({ initialUsers }: Props) {
  const [users, setUsers] = useState(initialUsers);
  const [unblocking, setUnblocking] = useState<string | null>(null);

  const handleUnblock = async (userId: string, userName: string | null) => {
    setUnblocking(userId);
    try {
      const res = await fetch("/api/blocks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockedId: userId }),
      });
      if (!res.ok) throw new Error();
      setUsers(prev => prev.filter(u => u.id !== userId));
      toast.success(`${userName ?? "User"} unblocked`);
    } catch {
      toast.error("Failed to unblock user");
    } finally {
      setUnblocking(null);
    }
  };

  if (users.length === 0) {
    return (
      <div className="text-center py-16"
        style={{ border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16, background: "var(--bg-surface)" }}>
        <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: "rgba(255,255,255,0.04)" }}>
          <ShieldCheck className="w-5 h-5" style={{ color: "var(--text-muted)" }} />
        </div>
        <p className="font-medium text-white mb-1" style={{ fontSize: 15 }}>No blocked users</p>
        <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Users you block will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {users.map(user => (
        <div key={user.id}
          className="flex items-center gap-4 px-4 py-3 rounded-xl transition-colors duration-150"
          style={{ background: "var(--bg-surface)", border: "1px solid rgba(255,255,255,0.05)" }}>

          {/* Avatar */}
          <Link href={`/users/${user.id}`} className="flex-shrink-0">
            {user.image ? (
              user.image.startsWith("data:") ? (
                <img src={user.image} alt={user.name ?? ""} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <Image src={user.image} alt={user.name ?? ""} width={40} height={40} className="rounded-full" />
              )
            ) : (
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                style={{ background: "rgba(255,255,255,0.06)", color: "var(--text-secondary)" }}>
                {user.name?.[0]?.toUpperCase() ?? <UserX className="w-4 h-4" />}
              </div>
            )}
          </Link>

          {/* Name + date */}
          <div className="flex-1 min-w-0">
            <Link href={`/users/${user.id}`}
              className="font-medium text-white hover:text-white/80 transition-colors truncate block"
              style={{ fontSize: 14, letterSpacing: "-0.01em" }}>
              {user.name ?? "Unknown user"}
            </Link>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 1 }}>
              Blocked {new Date(user.blockedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>

          {/* Unblock button */}
          <button
            onClick={() => handleUnblock(user.id, user.name)}
            disabled={unblocking === user.id}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 disabled:opacity-50 flex-shrink-0"
            style={{
              background: "rgba(0,240,255,0.08)",
              border: "1px solid rgba(0,240,255,0.15)",
              color: "var(--accent)",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(0,240,255,0.15)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(0,240,255,0.08)"; }}
          >
            <ShieldOff className="w-3 h-3" />
            {unblocking === user.id ? "Unblocking…" : "Unblock"}
          </button>
        </div>
      ))}

      <p className="text-center pt-2" style={{ fontSize: 12, color: "var(--text-muted)" }}>
        {users.length} blocked {users.length === 1 ? "user" : "users"}
      </p>
    </div>
  );
}
