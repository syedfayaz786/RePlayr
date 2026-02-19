"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import {
  Gamepad2,
  Heart,
  MessageSquare,
  Plus,
  User,
  LogOut,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";
import Image from "next/image";

export function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 glass border-b border-dark-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center group-hover:bg-brand-400 transition-colors">
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
                <Link href="/messages" className="btn-ghost flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Messages
                </Link>

                {/* User dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 bg-dark-700 hover:bg-dark-600 rounded-xl px-3 py-2 transition-colors"
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
                      <div className="w-7 h-7 bg-brand-500 rounded-full flex items-center justify-center text-xs font-bold">
                        {session.user?.name?.[0]?.toUpperCase() ?? "U"}
                      </div>
                    )}
                    <span className="text-sm text-gray-300 max-w-[100px] truncate">
                      {session.user?.name?.split(" ")[0]}
                    </span>
                    <ChevronDown className="w-3 h-3 text-gray-400" />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-dark-700 border border-dark-500 rounded-xl shadow-xl overflow-hidden">
                      <Link
                        href="/profile"
                        className="flex items-center gap-3 px-4 py-3 hover:bg-dark-600 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">My Profile</span>
                      </Link>
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-3 px-4 py-3 hover:bg-dark-600 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Gamepad2 className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">My Listings</span>
                      </Link>
                      <div className="border-t border-dark-500" />
                      <button
                        onClick={() => signOut({ callbackUrl: "/auth/login" })}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-dark-600 text-red-400 transition-colors"
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
                <Link href="/auth/login" className="btn-ghost">
                  Sign In
                </Link>
                <Link href="/auth/signup" className="btn-primary py-2">
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden btn-ghost"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-dark-600 bg-dark-800 px-4 py-4 space-y-2">
          {session ? (
            <>
              <Link href="/listings/new" className="btn-primary flex items-center gap-2 w-full justify-center">
                <Plus className="w-4 h-4" />Sell a Game
              </Link>
              <Link href="/wishlist" className="btn-ghost flex items-center gap-2 w-full">
                <Heart className="w-4 h-4" />Wishlist
              </Link>
              <Link href="/messages" className="btn-ghost flex items-center gap-2 w-full">
                <MessageSquare className="w-4 h-4" />Messages
              </Link>
              <Link href="/profile" className="btn-ghost flex items-center gap-2 w-full">
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
