"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onRate?: (rating: number) => void;
}

export function StarRating({
  rating,
  maxRating = 5,
  size = "md",
  interactive = false,
  onRate,
}: StarRatingProps) {
  const sizes = { sm: "w-3 h-3", md: "w-4 h-4", lg: "w-6 h-6" };

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: maxRating }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            sizes[size],
            i < rating ? "fill-brand-400 text-brand-400" : "text-gray-600",
            interactive && "cursor-pointer hover:text-brand-300 transition-colors"
          )}
          onClick={() => interactive && onRate?.(i + 1)}
        />
      ))}
    </div>
  );
}
