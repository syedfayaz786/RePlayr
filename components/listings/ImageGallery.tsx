"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ImageGalleryProps {
  images: string[];
  title: string;
}

function GalleryImg({ src, alt }: { src: string; alt: string }) {
  if (src.startsWith("data:")) {
    return <img src={src} alt={alt} className="absolute inset-0 w-full h-full object-contain" />;
  }
  return <Image src={src} alt={alt} fill quality={95} className="object-contain" sizes="(max-width: 768px) 100vw, 60vw" />;
}

function ThumbImg({ src, alt }: { src: string; alt: string }) {
  if (src.startsWith("data:")) {
    return <img src={src} alt={alt} className="w-full h-full object-cover" />;
  }
  return <Image src={src} alt={alt} fill quality={80} className="object-cover" sizes="80px" />;
}

export function ImageGallery({ images, title }: ImageGalleryProps) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="card overflow-hidden">
        <div className="w-full bg-dark-900 flex items-center justify-center" style={{ height: 420 }}>
          <span className="text-6xl">🎮</span>
        </div>
      </div>
    );
  }

  const prev = () => setActive((i) => (i - 1 + images.length) % images.length);
  const next = () => setActive((i) => (i + 1) % images.length);

  return (
    <div className="card overflow-hidden">
      {/* ── Main viewer ── */}
      <div
        className="relative w-full bg-dark-900 group"
        style={{ minHeight: 320, maxHeight: 560, height: "56vw" }}
      >
        {/* Images — fade between them */}
        {images.map((src, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-300 ${i === active ? "opacity-100" : "opacity-0 pointer-events-none"}`}
          >
            <GalleryImg src={src} alt={`${title} — photo ${i + 1}`} />
          </div>
        ))}

        {/* Arrows — only if multiple images */}
        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-dark-900/80 backdrop-blur-sm border border-dark-600 flex items-center justify-center text-white hover:bg-dark-700 transition-all z-10 shadow-lg opacity-0 group-hover:opacity-100"
              aria-label="Previous photo"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-dark-900/80 backdrop-blur-sm border border-dark-600 flex items-center justify-center text-white hover:bg-dark-700 transition-all z-10 shadow-lg opacity-0 group-hover:opacity-100"
              aria-label="Next photo"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Counter + dots */}
            <div className="absolute bottom-3 left-0 right-0 flex flex-col items-center gap-1.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex gap-1.5">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActive(i)}
                    className={`rounded-full transition-all duration-200 ${
                      i === active ? "w-5 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/50 hover:bg-white/80"
                    }`}
                    aria-label={`Go to photo ${i + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Always-visible counter badge */}
            <div className="absolute top-3 right-3 bg-dark-900/80 backdrop-blur-sm rounded-full px-2.5 py-1 text-xs text-gray-300 font-medium z-10 border border-dark-600">
              {active + 1} / {images.length}
            </div>
          </>
        )}
      </div>

      {/* ── Thumbnail strip — clickable ── */}
      {images.length > 1 && (
        <div className="flex gap-2 p-2 sm:p-3 overflow-x-auto border-t border-dark-600 bg-dark-800/50 pb-2">
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                i === active
                  ? "border-brand-500 shadow-md shadow-brand-500/30 scale-105"
                  : "border-dark-600 hover:border-brand-500/50 hover:scale-105 opacity-70 hover:opacity-100"
              }`}
              aria-label={`Select photo ${i + 1}`}
            >
              <ThumbImg src={src} alt={`${title} thumbnail ${i + 1}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
