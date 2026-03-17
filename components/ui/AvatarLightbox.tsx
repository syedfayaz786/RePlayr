"use client";

import { useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";

interface Props {
  src: string;
  name: string;
}

export function AvatarLightbox({ src, name }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex-shrink-0 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-500 hover:opacity-90 transition-opacity"
        title="View photo"
      >
        <Image
          src={src}
          alt={name}
          width={80}
          height={80}
          className="rounded-full object-cover w-20 h-20"
        />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setOpen(false)}
        >
          <button
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <div
            className="relative max-w-sm w-full aspect-square"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={src}
              alt={name}
              fill
              className="rounded-2xl object-contain"
              sizes="(max-width: 640px) 100vw, 384px"
            />
          </div>
          <p className="absolute bottom-6 text-white/60 text-sm">{name}</p>
        </div>
      )}
    </>
  );
}
