"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import {
  Gamepad2, Heart, MessageSquare, Plus,
  User, LogOut, Menu, X, ChevronDown, LayoutDashboard,
} from "lucide-react";
import Image from "next/image";

function useUnreadCount(enabled: boolean) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    const fetch_ = () =>
      fetch("/api/messages/unread").then(r => r.json()).then(d => setCount(d.count ?? 0)).catch(() => {});
    fetch_();
    const interval = setInterval(fetch_, 30_000);
    return () => clearInterval(interval);
  }, [enabled]);
  return count;
}

export function Navbar() {
  const { data: session, status } = useSession();
  const authLoading = status === "loading";
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const unread = useUnreadCount(!!session);

  return (
    <nav className="sticky top-0 z-50 glass">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-8">
        <div className="flex items-center justify-between h-14">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{background: "linear-gradient(135deg, #f97316 0%, #8b5cf6 100%)"}}>
              <Gamepad2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-base tracking-tight" style={{color: "var(--text-primary)"}}>
              Re<span style={{color: "var(--accent)"}}>Playr</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {authLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-7 w-20 rounded-lg animate-pulse" style={{background: "var(--bg-elevated)"}} />
                <div className="h-7 w-20 rounded-lg animate-pulse" style={{background: "var(--bg-elevated)"}} />
                <div className="h-7 w-20 rounded-lg animate-pulse" style={{background: "var(--bg-elevated)"}} />
                <div className="h-7 w-24 rounded-lg animate-pulse" style={{background: "var(--bg-elevated)"}} />
              </div>
            ) : session ? (
              <>
                <Link href="/wishlist" className="btn-ghost flex items-center gap-2 text-sm">
                  <Heart className="w-4 h-4" />
                  <span>Wishlist</span>
                </Link>
                <Link href="/dashboard" className="btn-ghost flex items-center gap-2 text-sm">
                  <LayoutDashboard className="w-4 h-4" />
                  <span>My Listings</span>
                </Link>
                <Link href="/messages" className="btn-ghost flex items-center gap-2 text-sm relative">
                  <span className="relative">
                    <MessageSquare className="w-4 h-4" />
                    {unread > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] px-0.5 rounded-full text-white text-[9px] font-bold flex items-center justify-center leading-none"
                        style={{background: "var(--accent)"}}>
                        {unread > 99 ? "99+" : unread}
                      </span>
                    )}
                  </span>
                  <span>Messages</span>
                </Link>

                {/* Divider */}
                <div className="w-px h-5 mx-2" style={{background: "var(--border-default)"}} />

                <Link href="/listings/new" className="btn-primary flex items-center gap-1.5 py-2 px-4 text-sm">
                  <Plus className="w-3.5 h-3.5" />
                  Sell a Game
                </Link>

                {/* User menu */}
                <div className="relative ml-1">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 transition-all duration-150"
                    style={{background: userMenuOpen ? "var(--bg-overlay)" : "transparent", border: "1px solid " + (userMenuOpen ? "var(--border-default)" : "transparent")}}
                    onMouseEnter={e => { if (!userMenuOpen) (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)"; }}
                    onMouseLeave={e => { if (!userMenuOpen) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    {session.user?.image ? (
                      session.user.image.startsWith("data:") ? (
                        <img src={session.user.image} alt="avatar" width={24} height={24} className="rounded-full object-cover" style={{width:24,height:24}} />
                      ) : (
                        <Image src={session.user.image} alt="avatar" width={24} height={24} className="rounded-full" />
                      )
                    ) : (
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{background: "linear-gradient(135deg, #f97316, #8b5cf6)"}}>
                        {session.user?.name?.[0]?.toUpperCase() ?? "U"}
                      </div>
                    )}
                    <span className="text-sm max-w-[90px] truncate" style={{color: "var(--text-primary)"}}>
                      {session.user?.name?.split(" ")[0]}
                    </span>
                    <ChevronDown className="w-3 h-3" style={{color: "var(--text-muted)"}} />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-1.5 w-44 rounded-xl overflow-hidden shadow-2xl animate-slide-up"
                      style={{background: "var(--bg-elevated)", border: "1px solid var(--border-default)", boxShadow: "0 20px 40px rgba(0,0,0,0.6)"}}>
                      <Link href="/profile"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                        style={{color: "var(--text-secondary)"}}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-overlay)"; (e.currentTarget as HTMLElement).style.color = "var(--text-primary)"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"; }}
                        onClick={() => setUserMenuOpen(false)}>
                        <User className="w-3.5 h-3.5" />
                        My Profile
                      </Link>
                      <div style={{height: "1px", background: "var(--border-subtle)"}} />
                      <button
                        onClick={() => signOut({ callbackUrl: "/auth/login" })}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                        style={{color: "#f87171"}}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(248,113,113,0.08)"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="btn-ghost text-sm">Sign in</Link>
                <Link href="/auth/signup" className="btn-primary py-2 px-4 text-sm ml-1">Get Started</Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden p-2 rounded-lg transition-colors" 
            style={{color: "var(--text-secondary)"}}
            onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t px-4 py-4 space-y-1 animate-slide-up"
          style={{background: "var(--bg-surface)", borderColor: "var(--border-subtle)"}}>
          {authLoading ? null : session ? (
            <>
              <Link href="/listings/new" className="btn-primary flex items-center gap-2 w-full justify-center mb-3" onClick={() => setMenuOpen(false)}>
                <Plus className="w-4 h-4" />Sell a Game
              </Link>
              {[
                { href: "/wishlist", icon: Heart, label: "Wishlist" },
                { href: "/messages", icon: MessageSquare, label: "Messages" },
                { href: "/dashboard", icon: LayoutDashboard, label: "My Listings" },
                { href: "/profile", icon: User, label: "Profile" },
              ].map(({ href, icon: Icon, label }) => (
                <Link key={href} href={href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors"
                  style={{color: "var(--text-secondary)"}}
                  onClick={() => setMenuOpen(false)}>
                  <Icon className="w-4 h-4" />{label}
                  {label === "Messages" && unread > 0 && (
                    <span className="ml-auto text-xs font-bold px-1.5 py-0.5 rounded-full text-white" style={{background: "var(--accent)"}}>
                      {unread}
                    </span>
                  )}
                </Link>
              ))}
              <div style={{height: "1px", background: "var(--border-subtle)", margin: "8px 0"}} />
              <button onClick={() => signOut({ callbackUrl: "/auth/login" })}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm w-full transition-colors"
                style={{color: "#f87171"}}>
                <LogOut className="w-4 h-4" />Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="btn-secondary flex justify-center w-full text-sm" onClick={() => setMenuOpen(false)}>Sign in</Link>
              <Link href="/auth/signup" className="btn-primary flex justify-center w-full text-sm mt-2" onClick={() => setMenuOpen(false)}>Get Started</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
