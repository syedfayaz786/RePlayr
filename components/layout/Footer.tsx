import Link from "next/link";
import { Gamepad2, Github, Twitter } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-dark-600 bg-dark-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
                <Gamepad2 className="w-5 h-5 text-white" />
              </div>
              <span className="font-display font-bold text-xl text-white">
                Re<span className="text-brand-400">Playr</span>
              </span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              The local marketplace for game disc trading. Buy, sell, and trade video games with people in your community.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Marketplace</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/?platform=PlayStation+5" className="hover:text-brand-400 transition-colors">PlayStation Games</Link></li>
              <li><Link href="/?platform=Xbox+Series+X%2FS" className="hover:text-brand-400 transition-colors">Xbox Games</Link></li>
              <li><Link href="/?platform=Nintendo+Switch" className="hover:text-brand-400 transition-colors">Nintendo Games</Link></li>
              <li><Link href="/listings/new" className="hover:text-brand-400 transition-colors">Post a Listing</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Account</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/auth/signup" className="hover:text-brand-400 transition-colors">Sign Up</Link></li>
              <li><Link href="/auth/login" className="hover:text-brand-400 transition-colors">Log In</Link></li>
              <li><Link href="/profile" className="hover:text-brand-400 transition-colors">My Profile</Link></li>
              <li><Link href="/wishlist" className="hover:text-brand-400 transition-colors">Wishlist</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-dark-600 mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">© 2024 RePlayr. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="https://github.com" className="text-gray-500 hover:text-white transition-colors">
              <Github className="w-5 h-5" />
            </a>
            <a href="https://twitter.com" className="text-gray-500 hover:text-white transition-colors">
              <Twitter className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
