"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Gamepad2, Mail, Lock, Eye, EyeOff, Github } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) router.push("/");
  }, [session, router]);

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        toast.error("Invalid email or password");
      } else {
        toast.success("Welcome back!");
        router.push("/");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: string) => {
    setLoading(true);
    await signIn(provider, { callbackUrl: "/" });
  };

  return (
    <div className="min-h-screen min-h-dvh bg-dark-900 flex flex-col lg:flex-row">
      {/* Left - decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-dark-800 border-r border-dark-600 flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl" />
        </div>
        <div className="relative text-center">
          <div className="w-20 h-20 bg-brand-500 rounded-2xl flex items-center justify-center mx-auto mb-6 glow-orange">
            <Gamepad2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="font-display text-4xl font-bold text-white mb-4">
            Re<span className="gradient-text">Playr</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-sm">
            The local marketplace for video game disc trading. Find deals near you.
          </p>

          <div className="mt-12 grid grid-cols-2 gap-4 text-left max-w-sm">
            {[
              { emoji: "🎮", title: "All Platforms", desc: "PS5, Xbox, Switch & more" },
              { emoji: "📍", title: "Local Deals", desc: "Trade within your city" },
              { emoji: "💬", title: "Chat Directly", desc: "Message sellers instantly" },
              { emoji: "⭐", title: "Trusted Sellers", desc: "Ratings & reviews" },
            ].map(({ emoji, title, desc }) => (
              <div key={title} className="bg-dark-700/50 rounded-xl p-4 border border-dark-500">
                <div className="text-2xl mb-2">{emoji}</div>
                <div className="font-semibold text-sm text-white">{title}</div>
                <div className="text-xs text-gray-400">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right - form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 py-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <Gamepad2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl text-white">
              Re<span className="gradient-text">Playr</span>
            </span>
          </div>

          <h2 className="font-display text-3xl font-bold text-white mb-2">Welcome back</h2>
          <p className="text-gray-400 mb-8">Sign in to your account to continue</p>

          {/* OAuth buttons */}
          <div className="space-y-3 mb-6">
            <button
              onClick={() => handleOAuthLogin("google")}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-dark-700 hover:bg-dark-600 border border-dark-500 hover:border-gray-400 rounded-xl px-4 py-3 transition-all font-medium"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <button
              onClick={() => handleOAuthLogin("github")}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-dark-700 hover:bg-dark-600 border border-dark-500 hover:border-gray-400 rounded-xl px-4 py-3 transition-all font-medium"
            >
              <Github className="w-5 h-5" />
              Continue with GitHub
            </button>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-dark-500" />
            <span className="text-sm text-gray-500">or sign in with email</span>
            <div className="flex-1 h-px bg-dark-500" />
          </div>

          {/* Credentials form */}
          <form onSubmit={handleCredentialsLogin} className="space-y-4">
            <div>
              <label className="label-base">Email address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="input-base pl-11"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="label-base !mb-0">Password</label>
                <Link href="#" className="text-xs text-brand-400 hover:text-brand-300">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="input-base pl-11 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/auth/signup" className="text-brand-400 hover:text-brand-300 font-medium">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
