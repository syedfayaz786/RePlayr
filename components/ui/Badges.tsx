"use client";

import { cn } from "@/lib/utils";

// ── Official platform SVG logos ──────────────────────────────────────────────

function PlayStationLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M62.5 20.8s-9.3-3.2-16.5-3.7C38.8 16.6 31.3 18 31.3 18v64.8l13.5 4.4V38.5c0-2.2 1.1-3.5 2.9-2.9 2.4.8 2.9 3.1 2.9 5.3v19.6l13.5-4.4V26.4c0-2.9-.7-4.8-1.6-5.6z"/>
      <path d="M65 72.9l-22.5 7.5v11.7l34.4-11.5V69.3L65 72.9z"/>
      <path d="M76.9 57.1c-3.5-2-8.2-2.7-12.4-2.2l-18.9 6.2v11.3l18.2-6.1c2.3-.8 4.7-.6 6.4.5 1.7 1.1 1.7 2.7 0 3.9l-24.6 8.2v11.3l31.4-10.5c5.1-1.7 8.6-7.2 8.6-12.5-.1-4.5-4-9.2-8.7-10.1z"/>
    </svg>
  );
}

function XboxLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 5C25.1 5 5 25.1 5 50s20.1 45 45 45 45-20.1 45-45S74.9 5 50 5zm-14.5 11.8c4.5.6 10.5 4.8 14.5 8.2 4-3.4 10-7.6 14.5-8.2C75.5 20.6 87 32.6 89.6 45.1 87.5 32.5 76.3 22 61.4 22c-4.8 0-8.9 2.4-11.4 4.5C47.5 24.4 43.4 22 38.6 22 23.7 22 12.5 32.5 10.4 45.1 13 32.6 24.5 20.6 35.5 16.8zM50 73.5c-10.2-8.6-19-21.7-19-31 0-7.2 3.1-13.8 8-18.5 5.2 1.9 10.4 6.5 11 7 .6-.5 5.8-5.1 11-7 4.9 4.7 8 11.3 8 18.5 0 9.3-8.8 22.4-19 31zM18.5 47.5c0 13.3 10.4 25.1 24.7 30.8-7.3-8.1-12.7-17.5-12.7-25.3 0-5.8 2.1-11.2 5.6-15.4-8.6 0-15 4.9-17.6 9.9zm63 0c-2.6-5-9-9.9-17.6-9.9 3.5 4.2 5.6 9.6 5.6 15.4 0 7.8-5.4 17.2-12.7 25.3C70.1 72.6 81.5 60.8 81.5 47.5z"/>
    </svg>
  );
}

function NintendoSwitchLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M28.5 10h43C84.9 10 93 18.1 93 31.5v37C93 81.9 84.9 90 71.5 90h-43C15.1 90 7 81.9 7 68.5v-37C7 18.1 15.1 10 28.5 10zm-2.3 13C17.8 23 12 29.4 12 37.5v25C12 70.6 17.8 77 26.2 77s14.2-6.4 14.2-14.5v-25C40.4 29.4 34.6 23 26.2 23zm47.6 0c-8.4 0-14.2 6.4-14.2 14.5v25c0 8.1 5.8 14.5 14.2 14.5 8.4 0 14.2-6.4 14.2-14.5v-25C87.8 29.4 82 23 73.8 23zM26.2 32c3.1 0 5.5 2.6 5.5 5.7v25c0 3.1-2.4 5.7-5.5 5.7s-5.5-2.6-5.5-5.7v-25c0-3.1 2.4-5.7 5.5-5.7zm47.6 0c3.1 0 5.5 2.6 5.5 5.7v25c0 3.1-2.4 5.7-5.5 5.7s-5.5-2.6-5.5-5.7v-25c0-3.1 2.4-5.7 5.5-5.7zM44 40h12l10 20V40h8v20H62L52 40h-8z"/>
    </svg>
  );
}

function SteamLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 5C25.1 5 4.9 23.5 4 47l24.8 10.2c2.1-1.4 4.6-2.3 7.3-2.3.2 0 .5 0 .7.01l11-15.9v-.2c0-9.9 8.1-18 18-18s18 8.1 18 18-8.1 18-18 18c-.1 0-.3 0-.4 0L50.2 68c0 .2 0 .4 0 .6 0 7.5-6.1 13.5-13.5 13.5-6.6 0-12.2-4.8-13.3-11.2L5.2 63.1C10.3 81.2 28.7 95 50 95c27.6 0 50-22.4 50-50S77.6 5 50 5zM30.3 71.9l-5.6-2.3c1 2 2.7 3.7 4.9 4.6 4.8 2 10.2-.3 12.2-5.1 1-2.3 1-4.8 0-7.1-1-2.3-2.8-4-5.1-5-2.3-1-4.8-1-7 .1l5.8 2.4c3.5 1.5 5.2 5.5 3.7 9.1-1.5 3.5-5.5 5.2-9 3.7l.1-.4zm35.5-29.1c-6.6 0-12-5.4-12-12s5.4-12 12-12 12 5.4 12 12-5.4 12-12 12zm0-22c-5.5 0-10 4.5-10 10s4.5 10 10 10 10-4.5 10-10-4.5-10-10-10z"/>
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
    label: "PlayStation 5",
    shortLabel: "PS5",
    colorClass: "bg-blue-600/20 text-blue-400 border-blue-600/30",
    bgGlow: "bg-blue-600/10",
    Logo: PlayStationLogo,
  },
  "PlayStation 4": {
    label: "PlayStation 4",
    shortLabel: "PS4",
    colorClass: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    bgGlow: "bg-blue-500/10",
    Logo: PlayStationLogo,
  },
  "Xbox Series X/S": {
    label: "Xbox Series X/S",
    shortLabel: "Xbox",
    colorClass: "bg-green-600/20 text-green-400 border-green-600/30",
    bgGlow: "bg-green-600/10",
    Logo: XboxLogo,
  },
  "Xbox One": {
    label: "Xbox One",
    shortLabel: "Xbox",
    colorClass: "bg-green-500/20 text-green-300 border-green-500/30",
    bgGlow: "bg-green-500/10",
    Logo: XboxLogo,
  },
  "Nintendo Switch": {
    label: "Nintendo Switch",
    shortLabel: "Switch",
    colorClass: "bg-red-500/20 text-red-400 border-red-500/30",
    bgGlow: "bg-red-500/10",
    Logo: NintendoSwitchLogo,
  },
  "PC": {
    label: "PC",
    shortLabel: "PC",
    colorClass: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    bgGlow: "bg-purple-500/10",
    Logo: SteamLogo,
  },
  "Other": {
    label: "Other",
    shortLabel: "Other",
    colorClass: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    bgGlow: "bg-gray-500/10",
    Logo: SteamLogo,
  },
};

const conditionStyles: Record<string, string> = {
  "Brand New":  "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "Like New":   "bg-teal-500/20   text-teal-400   border-teal-500/30",
  "Very Good":  "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  "Good":       "bg-orange-500/20 text-orange-400 border-orange-500/30",
  "Acceptable": "bg-red-500/20    text-red-400    border-red-500/30",
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
    <span
      className={cn(
        "badge border inline-flex items-center gap-1.5",
        config.colorClass
      )}
    >
      {showLogo && <Logo className="w-3 h-3 flex-shrink-0" />}
      {short ? config.shortLabel : config.label}
    </span>
  );
}

export function ConditionBadge({ condition }: { condition: string }) {
  return (
    <span
      className={cn(
        "badge border",
        conditionStyles[condition] ?? conditionStyles["Good"]
      )}
    >
      {condition}
    </span>
  );
}

export function EditionBadge({ edition }: { edition?: string | null }) {
  if (!edition) return null;
  return (
    <span className="badge border bg-amber-500/10 text-amber-400 border-amber-500/25 inline-flex items-center gap-1">
      <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 16 16" fill="currentColor">
        <path fillRule="evenodd" d="M4.5 2A2.5 2.5 0 002 4.5v1.708a2.5 2.5 0 00.732 1.767l5.981 5.981a2.5 2.5 0 003.536 0l1.709-1.71a2.5 2.5 0 000-3.535L7.977 2.73A2.5 2.5 0 006.21 2H4.5zm.75 4.5a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5z" clipRule="evenodd"/>
      </svg>
      {edition} Edition
    </span>
  );
}
