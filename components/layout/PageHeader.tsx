import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

interface Crumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  crumbs: Crumb[];
}

export function PageHeader({ crumbs }: PageHeaderProps) {
  return (
    <div className="border-b border-dark-600 bg-dark-800/60 backdrop-blur-sm">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-8 py-3">
        <nav className="flex items-center gap-1.5 text-sm">
          <Link
            href="/"
            className="flex items-center gap-1 text-gray-400 hover:text-brand-300 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
          {crumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <ChevronRight className="w-3.5 h-3.5 text-dark-400" />
              {crumb.href ? (
                <Link href={crumb.href} className="text-gray-400 hover:text-brand-300 transition-colors">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-white font-medium">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      </div>
    </div>
  );
}
