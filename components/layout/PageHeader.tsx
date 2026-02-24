"use client";

import Link from "next/link";
import { ChevronRight, Home, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface Crumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  crumbs: Crumb[];
}

export function PageHeader({ crumbs }: PageHeaderProps) {
  const router = useRouter();
  return (
    <div className="border-b border-dark-600 bg-dark-800/60 backdrop-blur-sm">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-8 py-3 flex items-center gap-3">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-gray-400 hover:text-brand-300 transition-colors text-sm flex-shrink-0"
          aria-label="Go back"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back</span>
        </button>

        <div className="w-px h-4 bg-dark-600 flex-shrink-0" />

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm min-w-0">
          <Link
            href="/"
            className="flex items-center gap-1 text-gray-400 hover:text-brand-300 transition-colors flex-shrink-0"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
          {crumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1.5 min-w-0">
              <ChevronRight className="w-3.5 h-3.5 text-dark-400 flex-shrink-0" />
              {crumb.href ? (
                <Link href={crumb.href} className="text-gray-400 hover:text-brand-300 transition-colors truncate">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-white font-medium truncate">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      </div>
    </div>
  );
}
