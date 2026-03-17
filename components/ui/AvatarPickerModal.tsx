"use client";

import { useState } from "react";
import { X, Check } from "lucide-react";

// Each avatar is an SVG string (data URL) — 20 gaming-themed animated avatars
export const PRESET_AVATARS: { id: string; label: string; svg: string }[] = [
  {
    id: "cyber-knight",
    label: "Cyber Knight",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <defs>
        <radialGradient id="bg1" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#0f172a"/>
          <stop offset="100%" stop-color="#1e1b4b"/>
        </radialGradient>
        <filter id="glow1"><feGaussianBlur stdDeviation="1.5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <circle cx="50" cy="50" r="50" fill="url(#bg1)"/>
      <!-- Helmet -->
      <path d="M25 55 Q25 25 50 22 Q75 25 75 55 L72 70 Q60 78 50 78 Q40 78 28 70 Z" fill="#334155" stroke="#60a5fa" stroke-width="1.5" filter="url(#glow1)"/>
      <!-- Visor -->
      <path d="M33 48 Q33 38 50 36 Q67 38 67 48 L65 56 Q57 62 50 62 Q43 62 35 56 Z" fill="#0ea5e9" opacity="0.85"/>
      <animateTransform attributeName="transform" type="scale" values="1;1.02;1" dur="3s" repeatCount="indefinite" additive="sum" origin="50 50"/>
      <!-- Visor shine -->
      <ellipse cx="43" cy="44" rx="6" ry="3" fill="white" opacity="0.25" transform="rotate(-15 43 44)"/>
      <!-- Antenna -->
      <line x1="50" y1="22" x2="50" y2="12" stroke="#60a5fa" stroke-width="1.5" filter="url(#glow1)"/>
      <circle cx="50" cy="10" r="3" fill="#60a5fa" filter="url(#glow1)">
        <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite"/>
      </circle>
      <!-- Side panels -->
      <path d="M25 55 L18 60 L18 72 L25 70" fill="#1e293b" stroke="#60a5fa" stroke-width="1"/>
      <path d="M75 55 L82 60 L82 72 L75 70" fill="#1e293b" stroke="#60a5fa" stroke-width="1"/>
    </svg>`,
  },
  {
    id: "fire-mage",
    label: "Fire Mage",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <defs>
        <radialGradient id="bg2" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#1c0a00"/>
          <stop offset="100%" stop-color="#7c2d12"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="50" fill="url(#bg2)"/>
      <!-- Robe -->
      <path d="M28 75 Q30 55 50 52 Q70 55 72 75 Q60 82 50 83 Q40 82 28 75Z" fill="#7c2d12"/>
      <!-- Head -->
      <ellipse cx="50" cy="42" rx="16" ry="18" fill="#fed7aa"/>
      <!-- Hat -->
      <path d="M34 40 Q36 25 50 18 Q64 25 66 40 Z" fill="#1c0a00"/>
      <path d="M30 40 L70 40 Q68 44 50 44 Q32 44 30 40Z" fill="#292524"/>
      <!-- Eyes -->
      <circle cx="44" cy="42" r="3" fill="#ef4444">
        <animate attributeName="r" values="3;3.5;3" dur="2s" repeatCount="indefinite"/>
      </circle>
      <circle cx="56" cy="42" r="3" fill="#ef4444">
        <animate attributeName="r" values="3;3.5;3" dur="2s" repeatCount="indefinite"/>
      </circle>
      <!-- Flames on hat -->
      <path d="M44 18 Q42 10 46 8 Q44 14 48 12 Q46 18 50 15 Q54 18 52 12 Q56 14 54 8 Q58 10 56 18" fill="#f97316" opacity="0.9">
        <animateTransform attributeName="transform" type="translate" values="0,0;0,-3;0,0" dur="0.8s" repeatCount="indefinite"/>
      </path>
    </svg>`,
  },
  {
    id: "space-pilot",
    label: "Space Pilot",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <defs>
        <radialGradient id="bg3" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#0c1445"/>
          <stop offset="100%" stop-color="#060918"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="50" fill="url(#bg3)"/>
      <!-- Stars -->
      <circle cx="15" cy="20" r="1" fill="white" opacity="0.6"><animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite"/></circle>
      <circle cx="80" cy="15" r="1" fill="white" opacity="0.4"><animate attributeName="opacity" values="0.4;0.9;0.4" dur="3s" repeatCount="indefinite"/></circle>
      <circle cx="85" cy="70" r="1" fill="white" opacity="0.5"><animate attributeName="opacity" values="0.5;1;0.5" dur="1.5s" repeatCount="indefinite"/></circle>
      <!-- Suit body -->
      <path d="M30 75 Q30 58 50 55 Q70 58 70 75 Q60 83 50 84 Q40 83 30 75Z" fill="#e2e8f0"/>
      <!-- Helmet -->
      <circle cx="50" cy="42" r="20" fill="#cbd5e1" stroke="#94a3b8" stroke-width="1.5"/>
      <!-- Visor -->
      <path d="M36 40 Q36 30 50 28 Q64 30 64 40 L62 50 Q56 56 50 56 Q44 56 38 50 Z" fill="#0ea5e9" opacity="0.7"/>
      <ellipse cx="44" cy="37" rx="5" ry="3" fill="white" opacity="0.3" transform="rotate(-20 44 37)"/>
      <!-- Suit details -->
      <circle cx="50" cy="65" r="4" fill="#64748b"/>
      <rect x="46" y="63" width="8" height="4" rx="1" fill="#475569"/>
      <!-- Antenna -->
      <line x1="65" y1="30" x2="75" y2="18" stroke="#94a3b8" stroke-width="1.5"/>
      <circle cx="76" cy="17" r="2" fill="#22d3ee"><animate attributeName="opacity" values="1;0.2;1" dur="1s" repeatCount="indefinite"/></circle>
    </svg>`,
  },
  {
    id: "ninja",
    label: "Shadow Ninja",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <defs>
        <radialGradient id="bg4" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#0f0f0f"/>
          <stop offset="100%" stop-color="#1a1a2e"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="50" fill="url(#bg4)"/>
      <!-- Body -->
      <path d="M28 78 Q30 58 50 55 Q70 58 72 78 Q60 85 50 86 Q40 85 28 78Z" fill="#111827"/>
      <!-- Head wrap -->
      <ellipse cx="50" cy="42" rx="17" ry="19" fill="#111827"/>
      <!-- Eye slit -->
      <path d="M34 42 Q34 38 50 37 Q66 38 66 42 Q66 46 50 47 Q34 46 34 42Z" fill="#111827" stroke="#111827" stroke-width="1"/>
      <path d="M36 42 Q42 39 50 39 Q58 39 64 42" fill="none" stroke="#10b981" stroke-width="1.5">
        <animate attributeName="stroke" values="#10b981;#34d399;#10b981" dur="2s" repeatCount="indefinite"/>
      </path>
      <!-- Eyes glow -->
      <circle cx="43" cy="42" r="2.5" fill="#10b981" opacity="0.9">
        <animate attributeName="opacity" values="0.9;0.4;0.9" dur="3s" repeatCount="indefinite"/>
      </circle>
      <circle cx="57" cy="42" r="2.5" fill="#10b981" opacity="0.9">
        <animate attributeName="opacity" values="0.9;0.4;0.9" dur="3s" repeatCount="indefinite"/>
      </circle>
      <!-- Headband -->
      <path d="M33 38 Q50 33 67 38" fill="none" stroke="#ef4444" stroke-width="3"/>
      <!-- Shuriken on side -->
      <g transform="translate(76,50)">
        <polygon points="0,-6 2,-2 6,0 2,2 0,6 -2,2 -6,0 -2,-2" fill="#6b7280">
          <animateTransform attributeName="transform" type="rotate" values="0;360" dur="4s" repeatCount="indefinite"/>
        </polygon>
      </g>
    </svg>`,
  },
  {
    id: "robot",
    label: "Retro Robot",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <defs>
        <radialGradient id="bg5" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#0f2027"/>
          <stop offset="100%" stop-color="#203a43"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="50" fill="url(#bg5)"/>
      <!-- Body -->
      <rect x="32" y="58" width="36" height="22" rx="4" fill="#374151"/>
      <!-- Head -->
      <rect x="30" y="28" width="40" height="32" rx="5" fill="#4b5563"/>
      <rect x="32" y="30" width="36" height="28" rx="4" fill="#374151"/>
      <!-- Eyes -->
      <rect x="36" y="37" width="10" height="7" rx="2" fill="#1d4ed8"/>
      <rect x="54" y="37" width="10" height="7" rx="2" fill="#1d4ed8"/>
      <rect x="38" y="39" width="6" height="3" rx="1" fill="#60a5fa">
        <animate attributeName="fill" values="#60a5fa;#93c5fd;#60a5fa" dur="1.5s" repeatCount="indefinite"/>
      </rect>
      <rect x="56" y="39" width="6" height="3" rx="1" fill="#60a5fa">
        <animate attributeName="fill" values="#60a5fa;#93c5fd;#60a5fa" dur="1.5s" repeatCount="indefinite"/>
      </rect>
      <!-- Mouth -->
      <rect x="38" y="50" width="24" height="4" rx="2" fill="#1f2937"/>
      <rect x="40" y="51" width="4" height="2" rx="1" fill="#22d3ee"/>
      <rect x="48" y="51" width="4" height="2" rx="1" fill="#22d3ee"/>
      <rect x="56" y="51" width="4" height="2" rx="1" fill="#22d3ee"/>
      <!-- Antenna -->
      <line x1="50" y1="28" x2="50" y2="18" stroke="#9ca3af" stroke-width="2"/>
      <circle cx="50" cy="16" r="3" fill="#ef4444"><animate attributeName="opacity" values="1;0;1" dur="0.8s" repeatCount="indefinite"/></circle>
      <!-- Ears -->
      <rect x="23" y="35" width="7" height="12" rx="2" fill="#374151"/>
      <rect x="70" y="35" width="7" height="12" rx="2" fill="#374151"/>
      <!-- Body light -->
      <circle cx="50" cy="68" r="4" fill="#065f46"><animate attributeName="fill" values="#065f46;#10b981;#065f46" dur="2s" repeatCount="indefinite"/></circle>
    </svg>`,
  },
  {
    id: "dragon",
    label: "Dragon Lord",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <defs>
        <radialGradient id="bg6" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#1c0533"/>
          <stop offset="100%" stop-color="#4a0e0e"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="50" fill="url(#bg6)"/>
      <!-- Dragon head -->
      <ellipse cx="50" cy="50" rx="24" ry="20" fill="#166534"/>
      <!-- Snout -->
      <ellipse cx="50" cy="58" rx="12" ry="8" fill="#15803d"/>
      <!-- Eyes -->
      <ellipse cx="40" cy="46" rx="6" ry="5" fill="#fef08a"/>
      <ellipse cx="60" cy="46" rx="6" ry="5" fill="#fef08a"/>
      <ellipse cx="40" cy="46" rx="2" ry="4" fill="#1a0000">
        <animateTransform attributeName="transform" type="scale" values="1,1;0.5,1;1,1" dur="3s" repeatCount="indefinite" origin="40 46"/>
      </ellipse>
      <ellipse cx="60" cy="46" rx="2" ry="4" fill="#1a0000">
        <animateTransform attributeName="transform" type="scale" values="1,1;0.5,1;1,1" dur="3s" repeatCount="indefinite" origin="60 46"/>
      </ellipse>
      <!-- Horns -->
      <path d="M38 35 L32 18 L40 30" fill="#14532d"/>
      <path d="M62 35 L68 18 L60 30" fill="#14532d"/>
      <!-- Nostrils -->
      <circle cx="46" cy="60" r="2" fill="#14532d"/>
      <circle cx="54" cy="60" r="2" fill="#14532d"/>
      <!-- Fire breath -->
      <path d="M44 65 Q50 72 56 65" fill="none" stroke="#f97316" stroke-width="2">
        <animate attributeName="stroke" values="#f97316;#fbbf24;#ef4444;#f97316" dur="1s" repeatCount="indefinite"/>
      </path>
      <!-- Scales texture -->
      <path d="M35 48 Q38 45 41 48" fill="none" stroke="#15803d" stroke-width="1"/>
      <path d="M59 48 Q62 45 65 48" fill="none" stroke="#15803d" stroke-width="1"/>
    </svg>`,
  },
  {
    id: "wizard",
    label: "Pixel Wizard",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <defs>
        <radialGradient id="bg7" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#1e1b4b"/>
          <stop offset="100%" stop-color="#312e81"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="50" fill="url(#bg7)"/>
      <!-- Robe -->
      <path d="M26 80 Q28 58 50 54 Q72 58 74 80 Q62 87 50 88 Q38 87 26 80Z" fill="#4338ca"/>
      <!-- Stars on robe -->
      <text x="38" y="72" font-size="8" fill="#fbbf24">✦</text>
      <text x="54" y="68" font-size="6" fill="#a78bfa">✦</text>
      <!-- Head -->
      <ellipse cx="50" cy="43" rx="15" ry="17" fill="#fde68a"/>
      <!-- Beard -->
      <path d="M38 52 Q40 62 50 64 Q60 62 62 52 Q56 58 50 58 Q44 58 38 52Z" fill="white"/>
      <!-- Eyes -->
      <circle cx="44" cy="42" r="2.5" fill="#1e1b4b"/>
      <circle cx="56" cy="42" r="2.5" fill="#1e1b4b"/>
      <circle cx="45" cy="41" r="1" fill="white"/>
      <circle cx="57" cy="41" r="1" fill="white"/>
      <!-- Eyebrows -->
      <path d="M41 38 Q44 36 47 38" fill="none" stroke="#92400e" stroke-width="1.5"/>
      <path d="M53 38 Q56 36 59 38" fill="none" stroke="#92400e" stroke-width="1.5"/>
      <!-- Hat -->
      <path d="M35 40 Q38 22 50 15 Q62 22 65 40Z" fill="#3730a3"/>
      <path d="M32 42 L68 42 Q66 46 50 46 Q34 46 32 42Z" fill="#4338ca"/>
      <!-- Star on hat -->
      <text x="46" y="36" font-size="10" fill="#fbbf24">
        ★
        <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite"/>
      </text>
    </svg>`,
  },
  {
    id: "hacker",
    label: "Ghost Hacker",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <defs>
        <radialGradient id="bg8" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#001a00"/>
          <stop offset="100%" stop-color="#002600"/>
        </radialGradient>
        <filter id="glow8"><feGaussianBlur stdDeviation="2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <circle cx="50" cy="50" r="50" fill="url(#bg8)"/>
      <!-- Matrix rain -->
      <text x="12" y="30" font-size="7" fill="#00ff41" opacity="0.3" font-family="monospace">01</text>
      <text x="75" y="45" font-size="7" fill="#00ff41" opacity="0.3" font-family="monospace">10</text>
      <text x="20" y="75" font-size="7" fill="#00ff41" opacity="0.2" font-family="monospace">11</text>
      <!-- Hoodie -->
      <path d="M22 80 Q25 55 50 52 Q75 55 78 80 Q63 88 50 89 Q37 88 22 80Z" fill="#111"/>
      <!-- Hood -->
      <path d="M30 50 Q28 30 50 26 Q72 30 70 50 Q68 58 50 60 Q32 58 30 50Z" fill="#1a1a1a"/>
      <!-- Face shadow under hood -->
      <ellipse cx="50" cy="46" rx="14" ry="12" fill="#0a0a0a"/>
      <!-- Glowing eyes -->
      <circle cx="44" cy="45" r="3" fill="#00ff41" filter="url(#glow8)">
        <animate attributeName="opacity" values="1;0.6;1" dur="2s" repeatCount="indefinite"/>
      </circle>
      <circle cx="56" cy="45" r="3" fill="#00ff41" filter="url(#glow8)">
        <animate attributeName="opacity" values="1;0.6;1" dur="2s" repeatCount="indefinite"/>
      </circle>
      <!-- Glasses reflection -->
      <path d="M38 43 L50 43 L50 43 L62 43" fill="none" stroke="#00ff41" stroke-width="0.5" opacity="0.5"/>
    </svg>`,
  },
  {
    id: "samurai",
    label: "Cyber Samurai",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <defs>
        <radialGradient id="bg9" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#1a0000"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="50" fill="url(#bg9)"/>
      <!-- Armor body -->
      <path d="M26 78 Q28 56 50 53 Q72 56 74 78 Q62 86 50 87 Q38 86 26 78Z" fill="#1e293b"/>
      <!-- Armor plates -->
      <path d="M35 60 L32 75 L50 78 L68 75 L65 60 Q50 63 35 60Z" fill="#ef4444" opacity="0.8"/>
      <path d="M38 60 L41 75 L50 76 L59 75 L62 60 Q50 62 38 60Z" fill="#b91c1c"/>
      <!-- Head/helmet -->
      <ellipse cx="50" cy="43" rx="18" ry="19" fill="#1e293b"/>
      <!-- Face mask -->
      <path d="M35 45 Q35 32 50 30 Q65 32 65 45 L63 56 Q56 62 50 62 Q44 62 37 56 Z" fill="#ef4444"/>
      <!-- Eye slits -->
      <path d="M38 43 L46 41" stroke="#fbbf24" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M54 41 L62 43" stroke="#fbbf24" stroke-width="2.5" stroke-linecap="round"/>
      <!-- Helm crest -->
      <path d="M42 30 Q50 18 58 30" fill="#ef4444" stroke="#dc2626" stroke-width="1"/>
      <!-- Shoulder guards -->
      <path d="M26 58 L18 52 L20 66 L26 68" fill="#1e293b" stroke="#ef4444" stroke-width="1"/>
      <path d="M74 58 L82 52 L80 66 L74 68" fill="#1e293b" stroke="#ef4444" stroke-width="1"/>
    </svg>`,
  },
  {
    id: "alien",
    label: "Space Alien",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <defs>
        <radialGradient id="bg10" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#0a0a1a"/>
          <stop offset="100%" stop-color="#0f2a1a"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="50" fill="url(#bg10)"/>
      <!-- Body -->
      <path d="M32 76 Q33 58 50 55 Q67 58 68 76 Q60 83 50 84 Q40 83 32 76Z" fill="#14532d" opacity="0.9"/>
      <!-- Head — large alien cranium -->
      <ellipse cx="50" cy="40" rx="20" ry="24" fill="#16a34a"/>
      <ellipse cx="50" cy="30" rx="18" ry="16" fill="#15803d"/>
      <!-- Big black eyes -->
      <ellipse cx="41" cy="42" rx="8" ry="6" fill="#0a0a0a"/>
      <ellipse cx="59" cy="42" rx="8" ry="6" fill="#0a0a0a"/>
      <!-- Eye shine/pupils -->
      <ellipse cx="41" cy="42" rx="5" ry="4" fill="#7eca9c">
        <animate attributeName="fill" values="#7eca9c;#4ade80;#7eca9c" dur="3s" repeatCount="indefinite"/>
      </ellipse>
      <ellipse cx="59" cy="42" rx="5" ry="4" fill="#7eca9c">
        <animate attributeName="fill" values="#7eca9c;#4ade80;#7eca9c" dur="3s" repeatCount="indefinite"/>
      </ellipse>
      <circle cx="39" cy="40" r="2" fill="white" opacity="0.6"/>
      <circle cx="57" cy="40" r="2" fill="white" opacity="0.6"/>
      <!-- Slit mouth -->
      <path d="M43 54 Q50 57 57 54" fill="none" stroke="#14532d" stroke-width="2"/>
      <!-- Antennae -->
      <line x1="44" y1="18" x2="38" y2="6" stroke="#22c55e" stroke-width="1.5"/>
      <circle cx="37" cy="5" r="2.5" fill="#4ade80"><animate attributeName="opacity" values="1;0.3;1" dur="1.2s" repeatCount="indefinite"/></circle>
      <line x1="56" y1="18" x2="62" y2="6" stroke="#22c55e" stroke-width="1.5"/>
      <circle cx="63" cy="5" r="2.5" fill="#4ade80"><animate attributeName="opacity" values="1;0.3;1" dur="1.8s" repeatCount="indefinite"/></circle>
    </svg>`,
  },
  {
    id: "pirate",
    label: "Pixel Pirate",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <defs>
        <radialGradient id="bg11" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#1c1209"/>
          <stop offset="100%" stop-color="#0c1a2e"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="50" fill="url(#bg11)"/>
      <!-- Coat -->
      <path d="M25 78 Q28 56 50 53 Q72 56 75 78 Q63 86 50 87 Q37 86 25 78Z" fill="#1e3a5f"/>
      <!-- Head -->
      <ellipse cx="50" cy="44" rx="16" ry="17" fill="#f5cba7"/>
      <!-- Beard -->
      <path d="M38 53 Q40 62 50 64 Q60 62 62 53 Q56 59 50 59 Q44 59 38 53Z" fill="#4a3728"/>
      <!-- Mustache -->
      <path d="M42 51 Q46 49 50 50 Q54 49 58 51" fill="none" stroke="#4a3728" stroke-width="2"/>
      <!-- Eye patch -->
      <ellipse cx="57" cy="42" rx="7" ry="5" fill="#111"/>
      <path d="M50 40 Q57 37 64 40" fill="none" stroke="#111" stroke-width="2"/>
      <!-- Good eye -->
      <circle cx="42" cy="42" r="3" fill="#1d4ed8"/>
      <circle cx="42" cy="42" r="1.5" fill="#0f172a"/>
      <circle cx="41" cy="41" r="0.8" fill="white"/>
      <!-- Hat -->
      <path d="M33 38 L35 25 Q50 18 65 25 L67 38Z" fill="#111827"/>
      <path d="M30 40 L70 40 Q68 44 50 44 Q32 44 30 40Z" fill="#1f2937"/>
      <!-- Skull on hat -->
      <text x="46" y="36" font-size="10" fill="white">☠</text>
      <!-- Earring -->
      <circle cx="34" cy="48" r="2" fill="#f59e0b" stroke="#d97706" stroke-width="0.5"/>
    </svg>`,
  },
  {
    id: "wolf",
    label: "Moon Wolf",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <defs>
        <radialGradient id="bg12" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#0f1729"/>
          <stop offset="100%" stop-color="#1a0f2e"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="50" fill="url(#bg12)"/>
      <!-- Moon -->
      <circle cx="75" cy="20" r="10" fill="#fef9c3" opacity="0.4"/>
      <!-- Wolf body/fur -->
      <path d="M28 78 Q30 58 50 55 Q70 58 72 78 Q60 86 50 87 Q40 86 28 78Z" fill="#374151"/>
      <!-- Wolf head -->
      <ellipse cx="50" cy="43" rx="18" ry="17" fill="#4b5563"/>
      <!-- Ears -->
      <path d="M36 32 L30 14 L42 28" fill="#4b5563"/>
      <path d="M37 31 L32 17 L41 28" fill="#e879a0" opacity="0.6"/>
      <path d="M64 32 L70 14 L58 28" fill="#4b5563"/>
      <path d="M63 31 L68 17 L59 28" fill="#e879a0" opacity="0.6"/>
      <!-- Snout -->
      <ellipse cx="50" cy="53" rx="10" ry="7" fill="#6b7280"/>
      <!-- Nose -->
      <ellipse cx="50" cy="49" rx="4" ry="2.5" fill="#1f2937"/>
      <!-- Eyes -->
      <ellipse cx="42" cy="42" rx="4" ry="3" fill="#fef08a"/>
      <ellipse cx="58" cy="42" rx="4" ry="3" fill="#fef08a"/>
      <ellipse cx="42" cy="42" rx="1.5" ry="2.5" fill="#1a1a1a"/>
      <ellipse cx="58" cy="42" rx="1.5" ry="2.5" fill="#1a1a1a"/>
      <!-- Eye shine -->
      <circle cx="41" cy="41" r="1" fill="white" opacity="0.8"/>
      <circle cx="57" cy="41" r="1" fill="white" opacity="0.8"/>
      <!-- Mouth -->
      <path d="M44 56 Q50 59 56 56" fill="none" stroke="#374151" stroke-width="1.5"/>
    </svg>`,
  },
  {
    id: "viking",
    label: "Iron Viking",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <defs>
        <radialGradient id="bg13" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#1a0f00"/>
          <stop offset="100%" stop-color="#2d1a00"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="50" fill="url(#bg13)"/>
      <!-- Furs/body -->
      <path d="M24 80 Q26 56 50 53 Q74 56 76 80 Q63 88 50 89 Q37 88 24 80Z" fill="#78350f"/>
      <!-- Helmet -->
      <path d="M28 45 Q28 22 50 19 Q72 22 72 45 L70 52 Q60 58 50 58 Q40 58 30 52 Z" fill="#94a3b8"/>
      <path d="M26 46 L74 46" stroke="#cbd5e1" stroke-width="3"/>
      <!-- Horns -->
      <path d="M28 42 Q18 32 15 20 Q22 28 30 38" fill="#f5f5f4"/>
      <path d="M72 42 Q82 32 85 20 Q78 28 70 38" fill="#f5f5f4"/>
      <!-- Face -->
      <ellipse cx="50" cy="48" rx="16" ry="14" fill="#fed7aa"/>
      <!-- Eyes -->
      <circle cx="43" cy="46" r="3" fill="#1e40af"/>
      <circle cx="57" cy="46" r="3" fill="#1e40af"/>
      <circle cx="44" cy="45" r="1" fill="white"/>
      <circle cx="58" cy="45" r="1" fill="white"/>
      <!-- Beard -->
      <path d="M38 54 Q40 65 50 68 Q60 65 62 54 Q56 62 50 62 Q44 62 38 54Z" fill="#d4a574"/>
      <!-- Braids -->
      <path d="M38 60 Q36 68 38 74" stroke="#b45309" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M62 60 Q64 68 62 74" stroke="#b45309" stroke-width="3" fill="none" stroke-linecap="round"/>
      <!-- Scar -->
      <path d="M54 43 L58 50" stroke="#dc2626" stroke-width="1" opacity="0.7"/>
    </svg>`,
  },
  {
    id: "witch",
    label: "Dark Witch",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <defs>
        <radialGradient id="bg14" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#0f001a"/>
          <stop offset="100%" stop-color="#1a0033"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="50" fill="url(#bg14)"/>
      <!-- Stars -->
      <text x="15" y="25" font-size="8" fill="#a855f7" opacity="0.6">✦</text>
      <text x="78" y="30" font-size="6" fill="#c084fc" opacity="0.5">✦</text>
      <!-- Dress -->
      <path d="M24 80 Q28 58 50 54 Q72 58 76 80 Q62 88 50 89 Q38 88 24 80Z" fill="#1a003a"/>
      <!-- Head -->
      <ellipse cx="50" cy="44" rx="15" ry="17" fill="#fce7f3"/>
      <!-- Hair -->
      <path d="M35 42 Q32 55 36 65" stroke="#1a003a" stroke-width="5" fill="none"/>
      <path d="M65 42 Q68 55 64 65" stroke="#1a003a" stroke-width="5" fill="none"/>
      <path d="M35 38 Q50 30 65 38 Q60 44 50 44 Q40 44 35 38Z" fill="#1a003a"/>
      <!-- Eyes -->
      <circle cx="44" cy="44" r="3" fill="#7c3aed"/>
      <circle cx="56" cy="44" r="3" fill="#7c3aed"/>
      <circle cx="44" cy="44" r="1.5" fill="#1a003a"/>
      <circle cx="56" cy="44" r="1.5" fill="#1a003a"/>
      <circle cx="43" cy="43" r="0.8" fill="white" opacity="0.8"/>
      <!-- Eyebrows arched -->
      <path d="M40 40 Q44 37 48 40" fill="none" stroke="#1a003a" stroke-width="1.5"/>
      <path d="M52 40 Q56 37 60 40" fill="none" stroke="#1a003a" stroke-width="1.5"/>
      <!-- Smile -->
      <path d="M44 52 Q50 56 56 52" fill="none" stroke="#c084fc" stroke-width="1.5"/>
      <!-- Hat -->
      <path d="M36 40 Q40 24 50 18 Q60 24 64 40Z" fill="#1a003a"/>
      <path d="M33 42 L67 42 Q65 46 50 46 Q35 46 33 42Z" fill="#2d0057"/>
      <!-- Hat band -->
      <rect x="34" y="40" width="32" height="3" fill="#7c3aed" opacity="0.7"/>
      <!-- Moon on hat -->
      <text x="46" y="34" font-size="10" fill="#e879f9">
        ☽
        <animate attributeName="opacity" values="1;0.5;1" dur="2.5s" repeatCount="indefinite"/>
      </text>
    </svg>`,
  },
  {
    id: "pharaoh",
    label: "Gold Pharaoh",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <defs>
        <radialGradient id="bg15" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#1a1200"/>
          <stop offset="100%" stop-color="#2d1f00"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="50" fill="url(#bg15)"/>
      <!-- Collar -->
      <path d="M28 62 Q30 72 50 75 Q70 72 72 62 Q60 68 50 68 Q40 68 28 62Z" fill="#d97706"/>
      <!-- Striped headdress -->
      <path d="M30 42 Q30 24 50 20 Q70 24 70 42 L68 55 Q60 62 50 62 Q40 62 32 55Z" fill="#0ea5e9"/>
      <path d="M30 42 L70 42" stroke="#d97706" stroke-width="3"/>
      <path d="M31 36 L69 36" stroke="#d97706" stroke-width="3"/>
      <path d="M33 30 L67 30" stroke="#d97706" stroke-width="3"/>
      <!-- Face -->
      <ellipse cx="50" cy="46" rx="14" ry="13" fill="#fde68a"/>
      <!-- Eyes — Egyptian style -->
      <ellipse cx="43" cy="44" rx="4.5" ry="3" fill="white"/>
      <ellipse cx="57" cy="44" rx="4.5" ry="3" fill="white"/>
      <circle cx="43" cy="44" r="2" fill="#1a0000"/>
      <circle cx="57" cy="44" r="2" fill="#1a0000"/>
      <!-- Kohl liner -->
      <path d="M38 44 L42 42" stroke="#1a0000" stroke-width="1"/>
      <path d="M48 42 L52 44" stroke="#1a0000" stroke-width="1"/>
      <path d="M62 44 L66 42" stroke="#1a0000" stroke-width="1"/>
      <!-- Cobra on forehead -->
      <path d="M46 22 Q50 18 54 22 Q52 26 50 24 Q48 26 46 22Z" fill="#10b981"/>
      <circle cx="50" cy="20" r="2" fill="#10b981"/>
      <!-- Beard -->
      <path d="M46 56 Q50 64 54 56" fill="none" stroke="#d97706" stroke-width="3" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: "catgirl",
    label: "Neon Catgirl",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <defs>
        <radialGradient id="bg16" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#0f0020"/>
          <stop offset="100%" stop-color="#1a0030"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="50" fill="url(#bg16)"/>
      <!-- Hair -->
      <path d="M32 50 Q30 35 50 28 Q70 35 68 50 Q62 42 50 42 Q38 42 32 50Z" fill="#ec4899"/>
      <path d="M32 48 Q28 60 32 70" stroke="#ec4899" stroke-width="6" fill="none" stroke-linecap="round"/>
      <path d="M68 48 Q72 60 68 70" stroke="#ec4899" stroke-width="6" fill="none" stroke-linecap="round"/>
      <!-- Body -->
      <path d="M28 78 Q30 58 50 55 Q70 58 72 78 Q60 86 50 87 Q40 86 28 78Z" fill="#1e1b4b"/>
      <!-- Head -->
      <ellipse cx="50" cy="46" rx="16" ry="16" fill="#fce7f3"/>
      <!-- Cat ears -->
      <path d="M36 34 L30 18 L42 30" fill="#ec4899"/>
      <path d="M37 33 L32 20 L42 30" fill="#fda4af"/>
      <path d="M64 34 L70 18 L58 30" fill="#ec4899"/>
      <path d="M63 33 L68 20 L58 30" fill="#fda4af"/>
      <!-- Eyes — big anime -->
      <ellipse cx="43" cy="46" rx="6" ry="7" fill="#7c3aed"/>
      <ellipse cx="57" cy="46" rx="6" ry="7" fill="#7c3aed"/>
      <ellipse cx="43" cy="46" rx="4" ry="5" fill="#1a003a"/>
      <ellipse cx="57" cy="46" rx="4" ry="5" fill="#1a003a"/>
      <circle cx="41" cy="43" r="2" fill="white" opacity="0.9"/>
      <circle cx="55" cy="43" r="2" fill="white" opacity="0.9"/>
      <!-- Blush -->
      <ellipse cx="37" cy="52" rx="5" ry="3" fill="#f9a8d4" opacity="0.5"/>
      <ellipse cx="63" cy="52" rx="5" ry="3" fill="#f9a8d4" opacity="0.5"/>
      <!-- Cat nose + mouth -->
      <ellipse cx="50" cy="54" rx="2" ry="1.5" fill="#fda4af"/>
      <path d="M47 56 Q50 58 53 56" fill="none" stroke="#ec4899" stroke-width="1"/>
      <!-- Whiskers -->
      <line x1="52" y1="54" x2="66" y2="51" stroke="#fda4af" stroke-width="0.8" opacity="0.7"/>
      <line x1="52" y1="55" x2="66" y2="56" stroke="#fda4af" stroke-width="0.8" opacity="0.7"/>
      <line x1="48" y1="54" x2="34" y2="51" stroke="#fda4af" stroke-width="0.8" opacity="0.7"/>
      <line x1="48" y1="55" x2="34" y2="56" stroke="#fda4af" stroke-width="0.8" opacity="0.7"/>
    </svg>`,
  },
  {
    id: "dwarf",
    label: "Battle Dwarf",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <defs>
        <radialGradient id="bg17" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#1a0f00"/>
          <stop offset="100%" stop-color="#1f1000"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="50" fill="url(#bg17)"/>
      <!-- Armor body (wide dwarf) -->
      <path d="M20 78 Q22 54 50 50 Q78 54 80 78 Q65 87 50 88 Q35 87 20 78Z" fill="#374151"/>
      <!-- Shoulder plates -->
      <ellipse cx="26" cy="60" rx="10" ry="7" fill="#4b5563"/>
      <ellipse cx="74" cy="60" rx="10" ry="7" fill="#4b5563"/>
      <!-- Belt buckle -->
      <rect x="44" y="72" width="12" height="8" rx="2" fill="#d97706"/>
      <rect x="46" y="74" width="8" height="4" rx="1" fill="#fbbf24"/>
      <!-- Head (wide short) -->
      <ellipse cx="50" cy="44" rx="20" ry="17" fill="#b45309"/>
      <!-- Big beard -->
      <path d="M32 52 Q34 70 50 74 Q66 70 68 52 Q60 62 50 62 Q40 62 32 52Z" fill="#92400e"/>
      <!-- Beard braids -->
      <path d="M42 68 Q40 76 42 82" stroke="#78350f" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M50 70 Q50 78 50 84" stroke="#78350f" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M58 68 Q60 76 58 82" stroke="#78350f" stroke-width="4" fill="none" stroke-linecap="round"/>
      <!-- Eyes under bushy brows -->
      <path d="M36 41 Q40 38 44 41" fill="#92400e" stroke="#92400e" stroke-width="3"/>
      <path d="M56 41 Q60 38 64 41" fill="#92400e" stroke="#92400e" stroke-width="3"/>
      <circle cx="40" cy="44" r="3" fill="#1e3a5f"/>
      <circle cx="60" cy="44" r="3" fill="#1e3a5f"/>
      <!-- Helmet -->
      <path d="M30 42 Q30 24 50 20 Q70 24 70 42Z" fill="#6b7280"/>
      <path d="M28 44 L72 44 Q70 48 50 48 Q30 48 28 44Z" fill="#9ca3af"/>
    </svg>`,
  },
  {
    id: "oracle",
    label: "Time Oracle",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <defs>
        <radialGradient id="bg18" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#0a1628"/>
          <stop offset="100%" stop-color="#0d2040"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="50" fill="url(#bg18)"/>
      <!-- Orbit rings -->
      <ellipse cx="50" cy="50" rx="38" ry="12" fill="none" stroke="#7dd3fc" stroke-width="0.8" opacity="0.3" transform="rotate(-30 50 50)"/>
      <ellipse cx="50" cy="50" rx="38" ry="12" fill="none" stroke="#c084fc" stroke-width="0.8" opacity="0.3" transform="rotate(30 50 50)"/>
      <!-- Robe -->
      <path d="M26 80 Q28 56 50 52 Q72 56 74 80 Q62 88 50 89 Q38 88 26 80Z" fill="#0c2340"/>
      <!-- Robe stars -->
      <circle cx="36" cy="68" r="1" fill="#7dd3fc" opacity="0.8"/>
      <circle cx="64" cy="70" r="1" fill="#c084fc" opacity="0.8"/>
      <circle cx="45" cy="74" r="0.8" fill="#7dd3fc" opacity="0.6"/>
      <!-- Head -->
      <ellipse cx="50" cy="43" rx="16" ry="18" fill="#e2e8f0"/>
      <!-- Third eye -->
      <ellipse cx="50" cy="37" rx="5" ry="4" fill="#7c3aed">
        <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite"/>
      </ellipse>
      <ellipse cx="50" cy="37" rx="3" ry="2.5" fill="#a78bfa"/>
      <circle cx="50" cy="37" r="1.5" fill="#ddd6fe"/>
      <!-- Normal eyes -->
      <circle cx="43" cy="45" r="3" fill="#0f172a"/>
      <circle cx="57" cy="45" r="3" fill="#0f172a"/>
      <circle cx="42" cy="44" r="1" fill="white"/>
      <circle cx="56" cy="44" r="1" fill="white"/>
      <!-- Serene mouth -->
      <path d="M45 52 Q50 54 55 52" fill="none" stroke="#94a3b8" stroke-width="1.2"/>
      <!-- Clock symbol on forehead -->
      <circle cx="50" cy="29" r="5" fill="none" stroke="#7dd3fc" stroke-width="1">
        <animate attributeName="opacity" values="0.8;0.3;0.8" dur="3s" repeatCount="indefinite"/>
      </circle>
      <line x1="50" y1="26" x2="50" y2="29" stroke="#7dd3fc" stroke-width="1"/>
      <line x1="50" y1="29" x2="53" y2="31" stroke="#7dd3fc" stroke-width="1"/>
    </svg>`,
  },
  {
    id: "hunter",
    label: "Bounty Hunter",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <defs>
        <radialGradient id="bg19" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#0a0a0a"/>
          <stop offset="100%" stop-color="#1a1000"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="50" fill="url(#bg19)"/>
      <!-- Duster coat -->
      <path d="M22 82 Q24 55 50 52 Q76 55 78 82 Q65 90 50 91 Q35 90 22 82Z" fill="#44311e"/>
      <!-- Coat lapels -->
      <path d="M38 60 L42 80 L50 78 L58 80 L62 60 Q56 65 50 64 Q44 65 38 60Z" fill="#5c4025"/>
      <!-- Neck/chin -->
      <ellipse cx="50" cy="58" rx="8" ry="5" fill="#fde68a"/>
      <!-- Hat brim -->
      <path d="M26 44 L74 44 Q72 48 50 48 Q28 48 26 44Z" fill="#292524"/>
      <!-- Hat crown -->
      <rect x="32" y="22" width="36" height="23" rx="4" fill="#1c1917"/>
      <!-- Hat band -->
      <rect x="32" y="40" width="36" height="4" fill="#b45309"/>
      <!-- Face under brim -->
      <ellipse cx="50" cy="48" rx="14" ry="10" fill="#fde68a"/>
      <!-- Shadow under hat -->
      <ellipse cx="50" cy="46" rx="12" ry="4" fill="#d4a574" opacity="0.5"/>
      <!-- Eyes — squinting -->
      <path d="M40 47 Q43 45 46 47" fill="none" stroke="#1a0a00" stroke-width="2" stroke-linecap="round"/>
      <path d="M54 47 Q57 45 60 47" fill="none" stroke="#1a0a00" stroke-width="2" stroke-linecap="round"/>
      <!-- Stubble -->
      <ellipse cx="50" cy="54" rx="8" ry="4" fill="#d4a574" opacity="0.7"/>
      <path d="M44 52 Q50 55 56 52" fill="none" stroke="#92400e" stroke-width="1"/>
      <!-- Sheriff badge -->
      <polygon points="50,60 52,64 56,64 53,67 54,71 50,69 46,71 47,67 44,64 48,64" fill="#d97706" transform="translate(8,-2) scale(0.6)"/>
    </svg>`,
  },
  {
    id: "golem",
    label: "Stone Golem",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <defs>
        <radialGradient id="bg20" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#0f0f0f"/>
          <stop offset="100%" stop-color="#1a1a0f"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="50" fill="url(#bg20)"/>
      <!-- Stone body -->
      <path d="M22 80 Q24 55 50 51 Q76 55 78 80 Q65 89 50 90 Q35 89 22 80Z" fill="#44403c"/>
      <!-- Stone cracks on body -->
      <path d="M40 62 L44 70 L42 76" fill="none" stroke="#292524" stroke-width="1.5"/>
      <path d="M58 64 L56 72" fill="none" stroke="#292524" stroke-width="1.5"/>
      <!-- Stone head — angular/blocky -->
      <rect x="30" y="26" width="40" height="36" rx="6" fill="#57534e"/>
      <!-- Forehead ridge -->
      <rect x="30" y="26" width="40" height="10" rx="4" fill="#6b7280"/>
      <!-- Glowing crystal eyes -->
      <rect x="36" y="38" width="10" height="8" rx="2" fill="#0a0a0a"/>
      <rect x="54" y="38" width="10" height="8" rx="2" fill="#0a0a0a"/>
      <rect x="38" y="40" width="6" height="4" rx="1" fill="#3b82f6">
        <animate attributeName="fill" values="#3b82f6;#60a5fa;#1d4ed8;#3b82f6" dur="2s" repeatCount="indefinite"/>
      </rect>
      <rect x="56" y="40" width="6" height="4" rx="1" fill="#3b82f6">
        <animate attributeName="fill" values="#3b82f6;#60a5fa;#1d4ed8;#3b82f6" dur="2s" repeatCount="indefinite"/>
      </rect>
      <!-- Stone mouth/crack -->
      <path d="M36 54 L42 56 L46 54 L50 57 L54 54 L58 56 L64 54" fill="none" stroke="#1c1917" stroke-width="2.5" stroke-linecap="round"/>
      <!-- Rune on forehead -->
      <path d="M46 28 L50 33 L54 28" fill="none" stroke="#60a5fa" stroke-width="1.5" opacity="0.7">
        <animate attributeName="opacity" values="0.7;0.2;0.7" dur="3s" repeatCount="indefinite"/>
      </path>
      <!-- Stone shoulder lumps -->
      <circle cx="28" cy="58" r="8" fill="#57534e"/>
      <circle cx="72" cy="58" r="8" fill="#57534e"/>
    </svg>`,
  },
];

function AvatarTile({
  avatar,
  selected,
  onSelect,
}: {
  avatar: (typeof PRESET_AVATARS)[0];
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      title={avatar.label}
      className={`relative rounded-xl overflow-hidden border-2 transition-all hover:scale-105 aspect-square ${
        selected
          ? "border-brand-500 shadow-lg shadow-brand-500/30"
          : "border-dark-600 hover:border-brand-500/50"
      }`}
    >
      <div
        className="w-full h-full"
        dangerouslySetInnerHTML={{ __html: avatar.svg }}
      />
      {selected && (
        <div className="absolute inset-0 bg-brand-500/20 flex items-center justify-center">
          <div className="w-6 h-6 bg-brand-500 rounded-full flex items-center justify-center">
            <Check className="w-4 h-4 text-white" />
          </div>
        </div>
      )}
    </button>
  );
}

interface Props {
  currentImage: string | null;
  onSelect: (svgDataUrl: string) => void;
  onClose: () => void;
}

export function AvatarPickerModal({ currentImage, onSelect, onClose }: Props) {
  const svgToDataUrl = (svg: string) =>
    `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;

  const selectedId = PRESET_AVATARS.find(
    (a) => currentImage === svgToDataUrl(a.svg)
  )?.id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-dark-800 border border-dark-600 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-600 flex-shrink-0">
          <div>
            <h3 className="text-white font-semibold text-base">Choose an Avatar</h3>
            <p className="text-xs text-gray-400 mt-0.5">20 animated gaming avatars</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Grid */}
        <div className="overflow-y-auto flex-1 p-4">
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
            {PRESET_AVATARS.map((avatar) => (
              <AvatarTile
                key={avatar.id}
                avatar={avatar}
                selected={selectedId === avatar.id}
                onSelect={() => {
                  onSelect(svgToDataUrl(avatar.svg));
                  onClose();
                }}
              />
            ))}
          </div>
        </div>

        <div className="px-6 py-3 border-t border-dark-600 flex-shrink-0">
          <p className="text-xs text-gray-500 text-center">Click any avatar to select it · Don't forget to Save Profile</p>
        </div>
      </div>
    </div>
  );
}
