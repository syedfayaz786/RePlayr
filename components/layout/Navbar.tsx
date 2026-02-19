"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import {
  Gamepad2, Heart, MessageSquare, Plus,
  User, LogOut, Menu, X, ChevronDown,
} from "lucide-react";
import Image from "next/image";

function useUnreadCount(enabled: boolean) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    const fetch_ = () =>
      fetch("/api/messages/unread")
        .then((r) => r.json())
        .then((d) => setCount(d.count ?? 0))
        .catch(() => {});

    fetch_();
    const interval = setInterval(fetch_, 30_000); // poll every 30 s
    return () => clearInterval(interval);
  }, [enabled]);

  return count;
}

export function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen]     = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const unread = useUnreadCount(!!session);

  return (
    <nav className="sticky top-0 z-50 glass border-b border-dark-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300" style={{background: "linear-gradient(135deg, #06b6d4, #6366f1)", boxShadow: "0 0 20px rgba(6,182,212,0.4))"}}>
              <Gamepad2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl text-white">
              Re<span className="text-brand-400">Playr</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-2">
            {session ? (
              <>
                <Link href="/listings/new" className="btn-primary flex items-center gap-2 py-2">
                  <Plus className="w-4 h-4" />
                  Sell a Game
                </Link>
                <Link href="/wishlist" className="btn-ghost flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  Wishlist
                </Link>

                {/* Messages with unread badge */}
                <Link href="/messages" className="btn-ghost flex items-center gap-2">
                  <span className="relative inline-flex">
                    <MessageSquare className="w-4 h-4" />
                    {unread > 0 && (
                      <span className="absolute -top-1.5 -right-2 min-w-[15px] h-[15px] px-0.5 rounded-full bg-brand-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
                        {unread > 99 ? "99+" : unread}
                      </span>
                    )}
                  </span>
                  Messages
                </Link>

                {/* User dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 rounded-xl px-3 py-2 transition-all duration-200 hover:bg-dark-600/80" style={{background: "rgba(11,13,31,0.7)", border: "1px solid rgba(6,182,212,0.12)"}}
                  >
                    {session.user?.image ? (
                      <Image
                        src={session.user.image}
                        alt="avatar"
                        width={28}
                        height={28}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{background: "linear-gradient(135deg, #06b6d4, #6366f1)"}}>
                        {session.user?.name?.[0]?.toUpperCase() ?? "U"}
                      </div>
                    )}
                    <span className="text-sm text-gray-300 max-w-[100px] truncate">
                      {session.user?.name?.split(" ")[0]}
                    </span>
                    <ChevronDown className="w-3 h-3 text-gray-400" />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 rounded-xl shadow-2xl overflow-hidden" style={{background: "rgba(11,13,31,0.98)", border: "1px solid rgba(6,182,212,0.15)", backdropFilter: "blur(16px)"}}>
                      <Link
                        href="/profile"
                        className="flex items-center gap-3 px-4 py-3 hover:bg-dark-600/80 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">My Profile</span>
                      </Link>
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-3 px-4 py-3 hover:bg-dark-600/80 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Gamepad2 className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">My Listings</span>
                      </Link>
                      <div className="border-t border-dark-500/50" />
                      <button
                        onClick={() => signOut({ callbackUrl: "/auth/login" })}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-rose-500/10 text-rose-400 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm">Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="btn-ghost">Sign In</Link>
                <Link href="/auth/signup" className="btn-primary py-2">Get Started</Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden btn-ghost" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-dark-600 bg-dark-800 px-4 py-4 space-y-2">
          {session ? (
            <>
              <Link href="/listings/new" className="btn-primary flex items-center gap-2 w-full justify-center" onClick={() => setMenuOpen(false)}>
                <Plus className="w-4 h-4" />Sell a Game
              </Link>
              <Link href="/wishlist" className="btn-ghost flex items-center gap-2 w-full" onClick={() => setMenuOpen(false)}>
                <Heart className="w-4 h-4" />Wishlist
              </Link>
              <Link href="/messages" className="btn-ghost flex items-center justify-between w-full" onClick={() => setMenuOpen(false)}>
                <span className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />Messages
                </span>
                {unread > 0 && (
                  <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-brand-500 text-white text-[11px] font-bold flex items-center justify-center">
                    {unread > 99 ? "99+" : unread}
                  </span>
                )}
              </Link>
              <Link href="/profile" className="btn-ghost flex items-center gap-2 w-full" onClick={() => setMenuOpen(false)}>
                <User className="w-4 h-4" />Profile
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/auth/login" })}
                className="btn-ghost flex items-center gap-2 w-full text-red-400"
              >
                <LogOut className="w-4 h-4" />Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="btn-secondary flex justify-center w-full">Sign In</Link>
              <Link href="/auth/signup" className="btn-primary flex justify-center w-full">Get Started</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
