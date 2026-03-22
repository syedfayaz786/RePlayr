"use client";

import Link from "next/link";
import { Gamepad2, Github, Twitter } from "lucide-react";

const YEAR = 2025;

export function Footer() {
  return (
    <footer style={{
      borderTop: "1px solid rgba(255,255,255,0.05)",
      background: "var(--bg-surface)",
    }}>
      <div style={{maxWidth: 1200, margin: "0 auto", padding: "56px 24px 40px"}}>

        {/* Top section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">

          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-4 group">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
                style={{background: "linear-gradient(135deg, #00e8f5, #8b5cf6)"}}>
                <Gamepad2 className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-base" style={{letterSpacing: "-0.02em", color: "var(--text-primary)"}}>
                Re<span className="gradient-text">Playr</span>
              </span>
            </Link>
            <p style={{fontSize: 14, lineHeight: 1.65, color: "var(--text-muted)", maxWidth: 280, letterSpacing: "-0.01em"}}>
              The local marketplace for physical game disc trading. Buy, sell, and trade with players near you.
            </p>
          </div>

          {/* Marketplace */}
          <div>
            <p className="font-body font-medium mb-4" style={{fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)"}}>
              Marketplace
            </p>
            <ul className="space-y-2.5">
              {[
                { label: "PlayStation Games", href: "/?platform=PlayStation+5" },
                { label: "Xbox Games",        href: "/?platform=Xbox+Series+X%2FS" },
                { label: "Nintendo Games",    href: "/?platform=Nintendo+Switch" },
                { label: "Post a Listing",    href: "/listings/new" },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} style={{fontSize: 14, color: "var(--text-secondary)", letterSpacing: "-0.01em"}}
                    className="hover:text-white transition-colors duration-150">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <p className="font-body font-medium mb-4" style={{fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)"}}>
              Account
            </p>
            <ul className="space-y-2.5">
              {[
                { label: "Sign Up",    href: "/auth/signup" },
                { label: "Log In",     href: "/auth/login" },
                { label: "My Profile", href: "/profile" },
                { label: "Wishlist",   href: "/wishlist" },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} style={{fontSize: 14, color: "var(--text-secondary)", letterSpacing: "-0.01em"}}
                    className="hover:text-white transition-colors duration-150">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.05)"}}>
          <p style={{fontSize: 13, color: "var(--text-muted)", letterSpacing: "-0.01em"}}>
            © {YEAR} RePlayr. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer"
              style={{color: "var(--text-muted)"}} className="hover:text-white transition-colors duration-150">
              <Github className="w-4 h-4" />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"
              style={{color: "var(--text-muted)"}} className="hover:text-white transition-colors duration-150">
              <Twitter className="w-4 h-4" />
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
}
