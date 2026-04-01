"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense }         from "react";
import Link                           from "next/link";
import { Gamepad2, Mail, AlertCircle, CheckCircle, RefreshCw, Clock } from "lucide-react";

function VerifyContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  const errorCode = searchParams.get("error");
  const email     = searchParams.get("email") ?? "";

  const [resending,    setResending]    = useState(false);
  const [resendDone,   setResendDone]   = useState(false);
  const [resendError,  setResendError]  = useState("");
  const [emailInput,   setEmailInput]   = useState(email);

  const handleResend = async () => {
    if (!emailInput.trim()) { setResendError("Please enter your email address"); return; }
    setResending(true);
    setResendError("");
    try {
      const res  = await fetch("/api/auth/resend-verification", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: emailInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setResendError(data.error ?? "Something went wrong"); return; }
      setResendDone(true);
    } catch {
      setResendError("Failed to resend. Please try again.");
    } finally {
      setResending(false);
    }
  };

  // ── Expired token screen ────────────────────────────────────────────────────
  if (errorCode === "expired_token") {
    return (
      <Screen
        icon={<Clock className="w-8 h-8 text-amber-400" />}
        iconBg="rgba(245,158,11,0.12)"
        iconBorder="rgba(245,158,11,0.25)"
        title="Link expired"
        subtitle="Your verification link has expired (links are valid for 30 minutes). Request a new one below."
      >
        {resendDone ? (
          <ResendSuccess />
        ) : (
          <ResendForm
            email={emailInput}
            onChange={setEmailInput}
            onSubmit={handleResend}
            loading={resending}
            error={resendError}
          />
        )}
      </Screen>
    );
  }

  // ── Invalid / missing token screen ──────────────────────────────────────────
  if (errorCode === "invalid_token" || errorCode === "missing_token") {
    return (
      <Screen
        icon={<AlertCircle className="w-8 h-8 text-red-400" />}
        iconBg="rgba(248,113,113,0.12)"
        iconBorder="rgba(248,113,113,0.25)"
        title="Invalid verification link"
        subtitle="This link is not valid or has already been used. If you need a new link, enter your email below."
      >
        {resendDone ? (
          <ResendSuccess />
        ) : (
          <ResendForm
            email={emailInput}
            onChange={setEmailInput}
            onSubmit={handleResend}
            loading={resending}
            error={resendError}
          />
        )}
      </Screen>
    );
  }

  // ── Default: "check your email" screen (after signup) ───────────────────────
  return (
    <Screen
      icon={<Mail className="w-8 h-8 text-brand-400" />}
      iconBg="rgba(6,182,212,0.12)"
      iconBorder="rgba(6,182,212,0.25)"
      title="Check your email"
      subtitle={
        <>
          We&apos;ve sent a verification link to{" "}
          {email ? (
            <strong className="text-white">{email}</strong>
          ) : (
            "your email address"
          )}
          . Click it to activate your account.
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl p-4 text-sm" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}>
          <ul className="space-y-2" style={{ color: "var(--text-secondary)" }}>
            <li className="flex items-start gap-2"><span className="text-brand-400 mt-0.5">•</span>Check your spam or junk folder</li>
            <li className="flex items-start gap-2"><span className="text-brand-400 mt-0.5">•</span>The link expires in 30 minutes</li>
            <li className="flex items-start gap-2"><span className="text-brand-400 mt-0.5">•</span>Each link can only be used once</li>
          </ul>
        </div>

        {resendDone ? (
          <ResendSuccess />
        ) : (
          <div className="text-center">
            <p className="text-sm mb-3" style={{ color: "var(--text-muted)" }}>Didn&apos;t receive it?</p>
            <button
              onClick={handleResend}
              disabled={resending}
              className="btn-secondary flex items-center gap-2 mx-auto text-sm"
            >
              {resending
                ? <><span className="w-4 h-4 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />Sending…</>
                : <><RefreshCw className="w-4 h-4" />Resend verification email</>
              }
            </button>
            {resendError && (
              <p className="text-xs mt-2" style={{ color: "#f87171" }}>{resendError}</p>
            )}
          </div>
        )}

        <p className="text-center text-sm" style={{ color: "var(--text-muted)" }}>
          Wrong email?{" "}
          <Link href="/auth/signup" style={{ color: "var(--accent)" }} className="font-medium hover:underline">
            Sign up again
          </Link>
        </p>
      </div>
    </Screen>
  );
}

// ── Shared screen wrapper ──────────────────────────────────────────────────────

function Screen({
  icon, iconBg, iconBorder, title, subtitle, children,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconBorder: string;
  title: string;
  subtitle: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen min-h-dvh flex items-center justify-center p-4" style={{ background: "var(--bg-base)" }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #00F0FF, #7C3AED)", boxShadow: "0 0 16px rgba(0,240,255,0.2)" }}>
              <Gamepad2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl" style={{ color: "var(--text-primary)", letterSpacing: "-0.03em" }}>
              Re<span className="gradient-text">Playr</span>
            </span>
          </Link>
        </div>

        <div className="rounded-2xl p-8" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}>
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: iconBg, border: `1px solid ${iconBorder}` }}>
              {icon}
            </div>
          </div>

          <h1 className="font-display text-2xl font-bold text-white text-center mb-3" style={{ letterSpacing: "-0.03em" }}>
            {title}
          </h1>
          <p className="text-sm text-center mb-6 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {subtitle}
          </p>

          {children}
        </div>

        <p className="text-center text-sm mt-6" style={{ color: "var(--text-muted)" }}>
          Already verified?{" "}
          <Link href="/auth/login" style={{ color: "var(--accent)" }} className="font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

function ResendSuccess() {
  return (
    <div className="flex items-center gap-3 rounded-xl p-4" style={{ background: "rgba(16,217,138,0.08)", border: "1px solid rgba(16,217,138,0.2)" }}>
      <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: "var(--success)" }} />
      <p className="text-sm" style={{ color: "var(--success)" }}>
        New verification email sent! Check your inbox.
      </p>
    </div>
  );
}

function ResendForm({
  email, onChange, onSubmit, loading, error,
}: {
  email: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  loading: boolean;
  error: string;
}) {
  return (
    <div className="space-y-3">
      <input
        type="email"
        value={email}
        onChange={(e) => onChange(e.target.value)}
        placeholder="your@email.com"
        className="input-base"
      />
      {error && <p className="text-xs" style={{ color: "#f87171" }}>{error}</p>}
      <button
        onClick={onSubmit}
        disabled={loading}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        {loading
          ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Sending…</>
          : <><RefreshCw className="w-4 h-4" />Send new verification email</>
        }
      </button>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyContent />
    </Suspense>
  );
}
