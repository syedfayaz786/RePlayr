"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { Gamepad2, Heart, MessageSquare, Plus, User, LogOut, Menu, X, ChevronDown, LayoutDashboard } from "lucide-react";
import Image from "next/image";

function useUnreadCount(enabled: boolean) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    const fetch_ = () =>
      fetch("/api/messages/unread").then(r => r.json()).then(d => setCount(d.count ?? 0)).catch(() => {});
    fetch_();
    const iv = setInterval(fetch_, 30_000);
    return () => clearInterval(iv);
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
          <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 group-hover:scale-105"
              style={{
                background: "linear-gradient(135deg, #00F0FF, #7C3AED)",
                boxShadow: "0 0 10px rgba(0,240,255,0.15)"
              }}>
              <Gamepad2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-[20px]" style={{color:"var(--text-primary)", letterSpacing:"-0.03em"}}>
              Re<span className="gradient-text">Playr</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {authLoading ? (
              <div className="flex items-center gap-2">
                {[72,72,80,96].map((w,i) => (
                  <div key={i} className="h-7 rounded-lg animate-pulse"
                    style={{width:w, background:"var(--bg-elevated)"}} />
                ))}
              </div>
            ) : session ? (
              <>
                {[
                  { href:"/wishlist",  Icon:Heart,          label:"Wishlist" },
                  { href:"/dashboard", Icon:LayoutDashboard, label:"My Listings" },
                ].map(({ href, Icon, label }) => (
                  <Link key={href} href={href} className="btn-ghost flex items-center gap-2 text-sm">
                    <Icon className="w-4 h-4" />{label}
                  </Link>
                ))}

                {/* Messages with badge */}
                <Link href="/messages" className="btn-ghost flex items-center gap-2 text-sm">
                  <span className="relative">
                    <MessageSquare className="w-4 h-4" />
                    {unread > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] px-0.5 rounded-full text-[9px] font-bold flex items-center justify-center text-black"
                        style={{background:"var(--accent)", boxShadow:"0 0 6px rgba(0,240,255,0.3)"}}>
                        {unread > 99 ? "99+" : unread}
                      </span>
                    )}
                  </span>
                  Messages
                </Link>

                {/* Separator */}
                <div className="w-px h-5 mx-2" style={{background:"var(--border-default)"}} />

                {/* CTA */}
                <Link href="/listings/new" className="btn-primary flex items-center gap-1.5 text-sm py-2 px-4">
                  <Plus className="w-3.5 h-3.5" />
                  Sell a Game
                </Link>

                {/* User dropdown */}
                <div className="relative ml-1">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 transition-all duration-200"
                    style={{
                      background: userMenuOpen ? "var(--bg-elevated)" : "transparent",
                      border: `1px solid ${userMenuOpen ? "var(--border-accent)" : "transparent"}`,
                      boxShadow: userMenuOpen ? "0 0 16px rgba(0,240,255,0.08)" : "none"
                    }}>
                    {session.user?.image ? (
                      session.user.image.startsWith("data:") ? (
                        <img src={session.user.image} alt="" width={24} height={24} className="rounded-full object-cover" style={{width:24,height:24}} />
                      ) : (
                        <Image src={session.user.image} alt="" width={24} height={24} className="rounded-full" />
                      )
                    ) : (
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{background:"linear-gradient(135deg, #00F0FF, #7C3AED)"}}>
                        {session.user?.name?.[0]?.toUpperCase() ?? "U"}
                      </div>
                    )}
                    <span className="text-sm max-w-[90px] truncate" style={{color:"var(--text-primary)"}}>
                      {session.user?.name?.split(" ")[0]}
                    </span>
                    <ChevronDown className="w-3 h-3 transition-transform duration-200" style={{
                      color:"var(--text-muted)",
                      transform: userMenuOpen ? "rotate(180deg)" : "rotate(0deg)"
                    }} />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 rounded-2xl overflow-hidden animate-slide-up"
                      style={{
                        background:"var(--bg-elevated)",
                        border:"1px solid var(--border-default)",
                        boxShadow:"0 16px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)"
                      }}>
                      <Link href="/profile"
                        className="flex items-center gap-3 px-4 py-3 text-sm transition-all duration-150"
                        style={{color:"var(--text-secondary)"}}
                        onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background="var(--bg-overlay)"; el.style.color="var(--text-primary)"; }}
                        onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background="transparent"; el.style.color="var(--text-secondary)"; }}
                        onClick={() => setUserMenuOpen(false)}>
                        <User className="w-3.5 h-3.5" />My Profile
                      </Link>
                      <div style={{height:"1px", background:"var(--border-subtle)"}} />
                      <button onClick={() => signOut({ callbackUrl:"/auth/login" })}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm transition-all duration-150"
                        style={{color:"#ff4d6a"}}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,77,106,0.08)"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                        <LogOut className="w-3.5 h-3.5" />Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="btn-ghost text-sm">Sign in</Link>
                <Link href="/auth/signup" className="btn-primary text-sm py-2 px-4 ml-1">Get Started</Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button className="md:hidden p-2 rounded-lg transition-colors"
            style={{color:"var(--text-secondary)"}}
            onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t px-4 py-4 space-y-1 animate-slide-up"
          style={{background:"var(--bg-surface)", borderColor:"var(--border-subtle)"}}>
          {authLoading ? null : session ? (
            <>
              <Link href="/listings/new" className="btn-primary flex items-center gap-2 w-full justify-center mb-3"
                onClick={() => setMenuOpen(false)}>
                <Plus className="w-4 h-4" />Sell a Game
              </Link>
              {[
                { href:"/wishlist",  Icon:Heart,           label:"Wishlist" },
                { href:"/messages",  Icon:MessageSquare,   label:"Messages",   badge:unread },
                { href:"/dashboard", Icon:LayoutDashboard, label:"My Listings" },
                { href:"/profile",   Icon:User,            label:"Profile" },
              ].map(({ href, Icon, label, badge }) => (
                <Link key={href} href={href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150"
                  style={{color:"var(--text-secondary)"}}
                  onClick={() => setMenuOpen(false)}>
                  <Icon className="w-4 h-4" />{label}
                  {badge ? (
                    <span className="ml-auto text-xs font-bold px-1.5 py-0.5 rounded-full text-black"
                      style={{background:"var(--accent)"}}>
                      {badge}
                    </span>
                  ) : null}
                </Link>
              ))}
              <div style={{height:"1px", background:"var(--border-subtle)", margin:"8px 0"}} />
              <button onClick={() => signOut({ callbackUrl:"/auth/login" })}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm w-full"
                style={{color:"#ff4d6a"}}>
                <LogOut className="w-4 h-4" />Sign Out
              </button>
            </>
          ) : (
            <div className="space-y-2">
              <Link href="/auth/login" className="btn-secondary flex justify-center w-full text-sm" onClick={() => setMenuOpen(false)}>Sign in</Link>
              <Link href="/auth/signup" className="btn-primary flex justify-center w-full text-sm" onClick={() => setMenuOpen(false)}>Get Started</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
