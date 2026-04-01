"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { Gamepad2, Mail, Lock, Eye, EyeOff, RefreshCw, CheckCircle } from "lucide-react";
import { ErrorBanner } from "@/components/ui/InlineError";
import toast from "react-hot-toast";

// Google SVG icon
function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

// Map NextAuth error codes to friendly messages
function getOAuthErrorMessage(errorCode: string | null): string {
  if (!errorCode) return "";
  const map: Record<string, string> = {
    OAuthAccountNotLinked:
      "This email is already registered with a different sign-in method. Please use the original method you signed up with.",
    OAuthNoEmail:
      "We couldn't retrieve your email from the provider. Please sign in with email/password or try a different provider.",
    NO_PASSWORD:
      "This account was created with Google. Use the Google button to sign in, or set a password from your profile.",
    NOT_VERIFIED:
      "Please verify your email address before signing in. Check your inbox for the verification link.",
    Callback:
      "There was a problem completing sign-in. Please try again.",
    Default:
      "Sign-in failed. Please try again.",
  };
  return map[errorCode] ?? map.Default;
}

function LoginContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [isUnverified, setIsUnverified] = useState(false);
  const [resending,    setResending]    = useState(false);
  const [resendDone,   setResendDone]   = useState(false);

  // Redirect if already logged in
  useEffect(() => { if (session) router.push("/"); }, [session, router]);

  // Surface NextAuth callback errors (e.g. OAuthAccountNotLinked)
  useEffect(() => {
    const err = searchParams.get("error");
    if (err) setError(getOAuthErrorMessage(err));
  }, [searchParams]);

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) {
        if (result.error === "NOT_VERIFIED") {
          setIsUnverified(true);
          setError("Please verify your email before signing in. Check your inbox for the verification link.");
        } else if (result.error === "NO_PASSWORD") {
          setError(
            "This account was created with Google. Use the Google button to sign in, or set a password from your profile."
          );
        } else {
          setIsUnverified(false);
          setError("Incorrect email or password. Please try again.");
        }
      } else {
        toast.success("Welcome back!");
        router.push("/");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email.trim()) { setError("Enter your email address first"); return; }
    setResending(true);
    try {
      const res  = await fetch("/api/auth/resend-verification", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to resend"); return; }
      setResendDone(true);
      setError("");
    } catch {
      setError("Failed to resend. Please try again.");
    } finally {
      setResending(false);
    }
  };

  const handleOAuthLogin = async (provider: "google") => {
    setError("");
    setLoading(true);
    await signIn(provider, { callbackUrl: "/" });
  };

  return (
    <div className="min-h-screen min-h-dvh flex flex-col lg:flex-row" style={{ background: "var(--bg-base)" }}>

      {/* ── Left panel (decorative, desktop only) ── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 relative overflow-hidden"
        style={{ background: "var(--bg-surface)", borderRight: "1px solid var(--border-subtle)" }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full opacity-10"
            style={{ background: "radial-gradient(ellipse, #06b6d4, transparent)", filter: "blur(60px)" }} />
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full opacity-10"
            style={{ background: "radial-gradient(ellipse, #7C3AED, transparent)", filter: "blur(60px)" }} />
        </div>
        <div className="relative text-center">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ background: "linear-gradient(135deg, #00F0FF, #7C3AED)", boxShadow: "0 0 32px rgba(0,240,255,0.2)" }}>
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
              { emoji: "📍", title: "Local Deals",   desc: "Trade within your city"  },
              { emoji: "💬", title: "Chat Directly", desc: "Message sellers instantly" },
              { emoji: "⭐", title: "Trusted Sellers",desc: "Ratings & reviews"       },
            ].map(({ emoji, title, desc }) => (
              <div key={title} className="rounded-xl p-4"
                style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)" }}>
                <div className="text-2xl mb-2">{emoji}</div>
                <div className="font-semibold text-sm text-white">{title}</div>
                <div className="text-xs text-gray-400">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel (form) ── */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 py-8 sm:py-12">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #00F0FF, #7C3AED)", boxShadow: "0 0 10px rgba(0,240,255,0.15)" }}>
              <Gamepad2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl" style={{ color: "var(--text-primary)" }}>
              Re<span className="gradient-text">Playr</span>
            </span>
          </div>

          <h2 className="font-display text-3xl font-bold text-white mb-1">Welcome back</h2>
          <p className="mb-8" style={{ color: "var(--text-secondary)" }}>Sign in to your account to continue</p>

          {/* Verified success banner */}
          {searchParams.get("verified") === "true" && !error && (
            <div className="mb-5 flex items-start gap-3 rounded-xl p-4"
              style={{ background: "rgba(16,217,138,0.08)", border: "1px solid rgba(16,217,138,0.22)" }}>
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "var(--success)" }} />
              <p className="text-sm" style={{ color: "var(--success)" }}>
                Email verified! You can now sign in.
              </p>
            </div>
          )}

          {/* Error banner */}
          {error && (
            <div className="mb-5">
              <ErrorBanner message={error} onDismiss={() => { setError(""); setIsUnverified(false); setResendDone(false); }} />
              {isUnverified && !resendDone && (
                <button
                  onClick={handleResendVerification}
                  disabled={resending}
                  className="mt-3 flex items-center gap-2 text-sm font-medium transition-colors"
                  style={{ color: "var(--accent)" }}
                >
                  {resending
                    ? <><span className="w-3.5 h-3.5 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />Sending&#8230;</>
                    : <><RefreshCw className="w-3.5 h-3.5" />Resend verification email</>
                  }
                </button>
              )}
              {isUnverified && resendDone && (
                <div className="mt-3 flex items-center gap-2 text-sm" style={{ color: "var(--success)" }}>
                  <CheckCircle className="w-3.5 h-3.5" />
                  New verification email sent! Check your inbox.
                </div>
              )}
            </div>
          )}

          {/* Social buttons */}
          <div className="mb-6">
            <button
              onClick={() => handleOAuthLogin("google")}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 rounded-xl px-4 py-3 font-medium text-sm transition-all duration-200 disabled:opacity-50"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-default)",
                color: "var(--text-primary)",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-strong)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-default)"; }}
            >
              <GoogleIcon />
              Continue with Google
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px" style={{ background: "var(--border-default)" }} />
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>or sign in with email</span>
            <div className="flex-1 h-px" style={{ background: "var(--border-default)" }} />
          </div>

          {/* Email / password form */}
          <form onSubmit={handleCredentialsLogin} className="space-y-4">
            <div>
              <label className="label-base">Email address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  className="input-base pl-11"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="label-base !mb-0">Password</label>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="input-base pl-11 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
                  style={{ color: "var(--text-muted)" }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: "var(--text-muted)" }}>
            Don&apos;t have an account?{" "}
            <Link href="/auth/signup" className="font-medium" style={{ color: "var(--accent)" }}>
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
