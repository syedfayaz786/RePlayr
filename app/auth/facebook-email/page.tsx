"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { Gamepad2, Mail, AlertTriangle } from "lucide-react";
import { ErrorBanner } from "@/components/ui/InlineError";

function FacebookEmailContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const providerAccountId = searchParams.get("providerAccountId") ?? "";
  const name              = searchParams.get("name")              ?? "";
  const image             = searchParams.get("image")             ?? "";

  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  // If somehow already signed in, send home
  useEffect(() => { if (session) router.push("/"); }, [session, router]);

  // Guard: if no providerAccountId in URL, this page was reached incorrectly
  if (!providerAccountId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--bg-base)" }}>
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Invalid request</h2>
          <p className="text-gray-400 mb-6">This page can only be accessed during a Facebook sign-in flow.</p>
          <Link href="/auth/login" className="btn-primary inline-flex">Back to Sign In</Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Step 1: Link the Facebook account to this email in our DB
      const res = await fetch("/api/auth/facebook-link", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, providerAccountId, name, image }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      // Step 2: Now trigger the Facebook OAuth flow again —
      // this time the Account row exists, so NextAuth will sign them in cleanly.
      await signIn("facebook", { callbackUrl: "/" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen min-h-dvh flex items-center justify-center p-4 sm:p-6"
      style={{ background: "var(--bg-base)" }}>
      <div className="w-full max-w-md">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #00F0FF, #7C3AED)", boxShadow: "0 0 10px rgba(0,240,255,0.15)" }}>
            <Gamepad2 className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-xl" style={{ color: "var(--text-primary)" }}>
            Re<span className="gradient-text">Playr</span>
          </span>
        </Link>

        <div className="rounded-2xl p-6 sm:p-8"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}>

          {/* Facebook icon */}
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
            style={{ background: "rgba(24,119,242,0.15)", border: "1px solid rgba(24,119,242,0.3)" }}>
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none">
              <rect width="24" height="24" rx="6" fill="#1877F2" />
              <path d="M16.5 8H14.5C13.948 8 13.5 8.448 13.5 9V11H16.5L16 14H13.5V22H10.5V14H8V11H10.5V9C10.5 6.791 12.291 5 14.5 5H16.5V8Z" fill="white" />
            </svg>
          </div>

          <h2 className="font-display text-2xl font-bold text-white mb-2">One more step</h2>
          <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
            Facebook didn&apos;t share your email address with us. Please enter it below so we can
            create or link your account.
          </p>

          {error && (
            <div className="mb-4">
              <ErrorBanner message={error} onDismiss={() => setError("")} />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
              <p className="text-xs mt-1.5" style={{ color: "var(--text-muted)" }}>
                If this email is already registered, your Facebook account will be linked to it automatically.
              </p>
            </div>

            <button type="submit" disabled={loading || !email} className="btn-primary w-full">
              {loading ? "Linking account…" : "Continue with Facebook"}
            </button>
          </form>

          <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--border-subtle)" }}>
            <Link
              href="/auth/login"
              className="text-sm transition-colors"
              style={{ color: "var(--text-muted)" }}
            >
              ← Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FacebookEmailPage() {
  return (
    <Suspense>
      <FacebookEmailContent />
    </Suspense>
  );
}
