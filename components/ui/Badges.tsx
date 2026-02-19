"use client";

import { cn } from "@/lib/utils";

// ── Official Platform Logos ────────────────────────────────────────────────────
// Accurate SVG reproductions of official brand marks

function PlayStationLogo({ className }: { className?: string }) {
  // Official PlayStation "P" mark shape
  return (
    <svg className={className} viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M 36.7 77.6 L 36.7 25.0 C 36.7 25.0 36.7 17.8 44.5 20.4 L 44.5 20.4 C 44.5 20.4 51.2 22.5 51.2 31.7 L 51.2 51.5 L 58.3 49.1 L 58.3 30.2 C 58.3 30.2 59.0 18.1 46.1 13.8 C 46.1 13.8 36.5 10.3 28.0 14.4 L 28.0 80.3 Z" />
      <path d="M 58.8 86.2 L 58.8 71.5 L 72.0 67.2 L 72.0 55.7 L 44.5 64.7 L 44.5 78.6 C 44.5 78.6 44.5 85.9 51.5 88.2 C 51.5 88.2 57.0 90.2 62.5 88.0 C 62.5 88.0 71.8 84.3 72.0 77.3 L 72.0 65.5 L 58.8 69.8 Z" />
      <path d="M 80.0 56.6 C 80.0 56.6 84.1 49.5 72.0 45.4 C 72.0 45.4 65.0 43.0 58.8 44.4 L 58.8 56.4 L 71.5 52.4 C 71.5 52.4 75.5 51.0 75.5 55.0 C 75.5 55.0 76.0 58.2 71.5 59.8 L 58.8 64.0 L 58.8 77.0 L 72.0 72.4 C 72.0 72.4 84.0 68.2 80.0 56.6 Z" />
    </svg>
  );
}

function XboxLogo({ className }: { className?: string }) {
  // Official Xbox sphere mark with X
  return (
    <svg className={className} viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M50 8C27 8 8 27 8 50s19 42 42 42 42-19 42-42S73 8 50 8zM35.8 19.5c4.2.9 9.6 4.9 14.2 9.5 4.6-4.6 10-8.6 14.2-9.5C73.5 23.2 81 35.8 81 50c0 4.1-.6 8-1.8 11.7C72.3 52.9 62 42.5 50 34.8 38 42.5 27.7 52.9 20.8 61.7 19.6 58 19 54.1 19 50c0-14.2 7.5-26.8 16.8-30.5zM50 90c-11 0-21-4.5-28.2-11.7 4.5-6.8 13.8-18.3 28.2-27.1 14.4 8.8 23.7 20.3 28.2 27.1C71 85.5 61 90 50 90z"/>
    </svg>
  );
}

function NintendoSwitchLogo({ className }: { className?: string }) {
  // Official Nintendo Switch console silhouette
  return (
    <svg className={className} viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M62 9H38C22.5 9 10 21.5 10 37v26c0 15.5 12.5 28 28 28h24c15.5 0 28-12.5 28-28V37C90 21.5 77.5 9 62 9zM38 15h6v70h-6C26 85 16 75 16 63V37C16 25 26 15 38 15zm12 0h12c12 0 22 10 22 22v26c0 12-10 22-22 22H50V15zM34 28c-5 0-9 4-9 9v26c0 5 4 9 9 9s9-4 9-9V37c0-5-4-9-9-9zm0 6c1.7 0 3 1.3 3 3v26c0 1.7-1.3 3-3 3s-3-1.3-3-3V37c0-1.7 1.3-3 3-3zM65 29c-3.3 0-6 2.7-6 6s2.7 6 6 6 6-2.7 6-6-2.7-6-6-6z"/>
    </svg>
  );
}

function SteamLogo({ className }: { className?: string }) {
  // Official Steam logo mark
  return (
    <svg className={className} viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M49.8 5C25.2 5 5 24.4 5 48.6c0 20.2 14 37.3 33.2 42.3l6.5-15.8c-1-.3-2-.7-2.9-1.3-3.9-2.5-5-7.6-2.5-11.5l.1-.2-13.8-5.7C24 53.8 23 49 24.5 44.7c3-8.7 12.7-13.4 21.5-10.4l14.6 5c2.1-1.6 4.6-2.6 7.4-2.6 6.7 0 12.1 5.4 12.1 12.1 0 6.7-5.4 12.1-12.1 12.1-.3 0-.6 0-.9 0L61.3 75c.7 4.3-2 8.4-6.4 9.2-.9.2-1.8.2-2.6 0L46 98.9c1.3.1 2.5.1 3.8.1 24.8 0 45-20.1 45-45S74.6 5 49.8 5zM40.3 73.4c2.2 1.4 2.9 4.3 1.5 6.5-1.4 2.2-4.3 2.9-6.5 1.5-2.2-1.4-2.9-4.3-1.5-6.5 1.4-2.2 4.4-2.9 6.5-1.5zm27.5-27c-4.3 0-7.8-3.5-7.8-7.8s3.5-7.8 7.8-7.8 7.8 3.5 7.8 7.8-3.5 7.8-7.8 7.8zm0-13.4c-3.1 0-5.6 2.5-5.6 5.6s2.5 5.6 5.6 5.6 5.6-2.5 5.6-5.6-2.5-5.6-5.6-5.6z"/>
    </svg>
  );
}

// ── Platform config ───────────────────────────────────────────────────────────

interface PlatformConfig {
  label: string;
  shortLabel: string;
  colorClass: string;
  bgGlow: string;
  Logo: React.ComponentType<{ className?: string }>;
}

export const PLATFORM_CONFIG: Record<string, PlatformConfig> = {
  "PlayStation 5": {
    label: "PlayStation 5", shortLabel: "PS5",
    colorClass: "bg-blue-600/15 text-blue-300 border-blue-500/30",
    bgGlow: "bg-gradient-to-br from-blue-900/40 to-blue-600/10",
    Logo: PlayStationLogo,
  },
  "PlayStation 4": {
    label: "PlayStation 4", shortLabel: "PS4",
    colorClass: "bg-blue-500/15 text-blue-300 border-blue-400/30",
    bgGlow: "bg-gradient-to-br from-blue-900/40 to-blue-500/10",
    Logo: PlayStationLogo,
  },
  "Xbox Series X/S": {
    label: "Xbox Series X/S", shortLabel: "Xbox",
    colorClass: "bg-green-600/15 text-green-300 border-green-500/30",
    bgGlow: "bg-gradient-to-br from-green-900/40 to-green-600/10",
    Logo: XboxLogo,
  },
  "Xbox One": {
    label: "Xbox One", shortLabel: "Xbox One",
    colorClass: "bg-green-500/15 text-green-300 border-green-400/30",
    bgGlow: "bg-gradient-to-br from-green-900/40 to-green-500/10",
    Logo: XboxLogo,
  },
  "Nintendo Switch": {
    label: "Nintendo Switch", shortLabel: "Switch",
    colorClass: "bg-red-500/15 text-red-300 border-red-400/30",
    bgGlow: "bg-gradient-to-br from-red-900/40 to-red-500/10",
    Logo: NintendoSwitchLogo,
  },
  "PC": {
    label: "PC", shortLabel: "PC",
    colorClass: "bg-indigo-500/15 text-indigo-300 border-indigo-400/30",
    bgGlow: "bg-gradient-to-br from-indigo-900/40 to-indigo-500/10",
    Logo: SteamLogo,
  },
  "Other": {
    label: "Other", shortLabel: "Other",
    colorClass: "bg-slate-500/15 text-slate-300 border-slate-400/30",
    bgGlow: "bg-gradient-to-br from-slate-800/40 to-slate-600/10",
    Logo: SteamLogo,
  },
};

const conditionStyles: Record<string, string> = {
  "Brand New":  "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
  "Like New":   "bg-teal-500/15   text-teal-300   border-teal-400/30",
  "Very Good":  "bg-amber-500/15  text-amber-300  border-amber-400/30",
  "Good":       "bg-orange-500/15 text-orange-300 border-orange-400/30",
  "Acceptable": "bg-rose-500/15   text-rose-300   border-rose-400/30",
};

// ── Exported badge components ─────────────────────────────────────────────────

export function PlatformBadge({
  platform,
  showLogo = true,
  short = false,
}: {
  platform: string;
  showLogo?: boolean;
  short?: boolean;
}) {
  const config = PLATFORM_CONFIG[platform] ?? PLATFORM_CONFIG["Other"];
  const { Logo } = config;
  return (
    <span className={cn("badge border inline-flex items-center gap-1.5", config.colorClass)}>
      {showLogo && <Logo className="w-3 h-3 flex-shrink-0" />}
      {short ? config.shortLabel : config.label}
    </span>
  );
}

export function ConditionBadge({ condition }: { condition: string }) {
  return (
    <span className={cn("badge border", conditionStyles[condition] ?? conditionStyles["Good"])}>
      {condition}
    </span>
  );
}

export function EditionBadge({ edition }: { edition?: string | null }) {
  if (!edition) return null;
  return (
    <span className="badge border bg-cyan-500/10 text-cyan-300 border-cyan-400/25 inline-flex items-center gap-1">
      <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 16 16" fill="currentColor">
        <path fillRule="evenodd" d="M4.5 2A2.5 2.5 0 002 4.5v1.708a2.5 2.5 0 00.732 1.767l5.981 5.981a2.5 2.5 0 003.536 0l1.709-1.71a2.5 2.5 0 000-3.535L7.977 2.73A2.5 2.5 0 006.21 2H4.5zm.75 4.5a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5z" clipRule="evenodd"/>
      </svg>
      {edition} Edition
    </span>
  );
}
