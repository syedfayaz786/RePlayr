"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Gamepad2, Mail, Lock, User, Eye, EyeOff, Check, X, AlertCircle } from "lucide-react";
import { ErrorBanner } from "@/components/ui/InlineError";
import toast from "react-hot-toast";

// ─── Password rules ────────────────────────────────────────────────────────────

const PASSWORD_RULES = [
  { id: "length",  label: "At least 8 characters",       test: (p: string) => p.length >= 8              },
  { id: "letter",  label: "Contains a letter",            test: (p: string) => /[a-zA-Z]/.test(p)        },
  { id: "number",  label: "Contains a number",            test: (p: string) => /[0-9]/.test(p)           },
  { id: "special", label: "Contains a special character", test: (p: string) => /[^a-zA-Z0-9\s]/.test(p) },
];

// ─── Email format validation (client-side, matches backend regex) ──────────────
const EMAIL_REGEX = /^[a-zA-Z0-9](?:[a-zA-Z0-9._%+\-]*[a-zA-Z0-9])?@[a-zA-Z0-9](?:[a-zA-Z0-9\-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9\-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

function isValidEmailFormat(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return normalized.length > 0 && normalized.length <= 254 && EMAIL_REGEX.test(normalized);
}

function getPasswordErrors(password: string): string[] {
  const trimmed = password.trim();
  const errors: string[] = [];
  if (trimmed.length === 0 && password.length > 0) {
    errors.push("Password cannot be only spaces");
    return errors;
  }
  if (trimmed.length < 8)                 errors.push("Password must be at least 8 characters");
  if (!/[a-zA-Z]/.test(trimmed))          errors.push("Include at least one letter");
  if (!/[0-9]/.test(trimmed))             errors.push("Include at least one number");
  if (!/[^a-zA-Z0-9\s]/.test(trimmed))   errors.push("Include at least one special character");
  return errors;
}

function isPasswordValid(password: string): boolean {
  return getPasswordErrors(password).length === 0;
}

// ─── Google icon ───────────────────────────────────────────────────────────────

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

// ─── Inline field error ────────────────────────────────────────────────────────

function FieldError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="flex items-center gap-1.5 mt-2 px-1">
      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#f87171" }} />
      <p className="text-xs" style={{ color: "#f87171" }}>{message}</p>
    </div>
  );
}

// ─── Error border helper ───────────────────────────────────────────────────────

function errorInputStyle(hasError: boolean): React.CSSProperties {
  if (!hasError) return {};
  return {
    borderColor: "rgba(248,113,113,0.5)",
    boxShadow: "0 0 0 3px rgba(248,113,113,0.07)",
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SignupPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [name,         setName]         = useState("");
  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");

  // Errors are only revealed after the first submit attempt
  const [submitted,    setSubmitted]    = useState(false);
  // Show checklist once the user starts typing in the password field
  const [passwordFocused, setPasswordFocused] = useState(false);

  const [socialHint,        setSocialHint]        = useState<{ providers: string[] } | null>(null);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [signedUpEmail,       setSignedUpEmail]       = useState("");

  useEffect(() => { if (session) router.push("/"); }, [session, router]);

  // ─── Derived validation (computed, not stored) ─────────────────────────────

  const nameError  = submitted && name.trim()  === "" ? "Please fill out Full Name" : "";
  const emailError = submitted
    ? email.trim() === ""
      ? "Please fill out Email address"
      : !isValidEmailFormat(email)
        ? "Enter a valid email address"
        : ""
    : "";

  const pwErrors     = getPasswordErrors(password);
  const pwValid      = isPasswordValid(password);
  const showPwErrors = submitted && pwErrors.length > 0;
  // Checklist visible once user types or focuses the password field
  const showChecklist = passwordFocused || password.length > 0;

  // Clear a field's error as soon as the user corrects it
  const resolvedNameError  = nameError  && name.trim()  !== "" ? "" : nameError;
  // For email: only clear the "empty" error once they start typing.
  // Keep the format error visible until the email is actually valid.
  const resolvedEmailError = emailError === "Please fill out Email address" && email.trim() !== ""
    ? ""
    : emailError;
  const resolvedPwErrors   = showPwErrors && pwValid ? false : showPwErrors;

  // ─── Submit ────────────────────────────────────────────────────────────────

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSocialHint(null);
    setSubmitted(true);

    if (name.trim() === "" || email.trim() === "" || !isValidEmailFormat(email) || !pwValid) return;

    setLoading(true);
    try {
      const res  = await fetch("/api/auth/signup", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.code === "SOCIAL_ACCOUNT_EXISTS") {
          setSocialHint({ providers: data.providers });
          setError(data.error);
        } else if (data.code === "EMAIL_UNVERIFIED") {
          // Account exists but unverified — redirect to verify page
          setSignedUpEmail(email.trim());
          setPendingVerification(true);
        } else {
          setError(data.error ?? "Something went wrong. Please try again.");
        }
        return;
      }

      // Account created — user must verify email before logging in
      setSignedUpEmail(email.trim());
      setPendingVerification(true);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignup = async (provider: "google") => {
    setError("");
    setLoading(true);
    await signIn(provider, { callbackUrl: "/" });
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  // Show "check your email" screen after successful signup
  if (pendingVerification) {
    return (
      <div className="min-h-screen min-h-dvh flex items-center justify-center p-4" style={{ background: "var(--bg-base)" }}>
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #00F0FF, #7C3AED)", boxShadow: "0 0 16px rgba(0,240,255,0.2)" }}>
                <Gamepad2 className="w-5 h-5 text-white" />
              </div>
              <span className="font-display font-bold text-xl gradient-text">RePlayr</span>
            </Link>
          </div>
          <div className="rounded-2xl p-8 text-center" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}>
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "rgba(6,182,212,0.12)", border: "1px solid rgba(6,182,212,0.25)" }}>
                <Mail className="w-8 h-8 text-brand-400" />
              </div>
            </div>
            <h2 className="font-display text-2xl font-bold text-white mb-3" style={{ letterSpacing: "-0.03em" }}>Check your email</h2>
            <p className="text-sm leading-relaxed mb-6" style={{ color: "var(--text-secondary)" }}>
              We sent a verification link to{" "}
              <strong className="text-white">{signedUpEmail}</strong>.
              Click it to activate your account.
            </p>
            <div className="rounded-xl p-4 text-left text-sm mb-6" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}>
              <ul className="space-y-2" style={{ color: "var(--text-secondary)" }}>
                <li className="flex items-start gap-2"><span className="text-brand-400">•</span>Check your spam or junk folder</li>
                <li className="flex items-start gap-2"><span className="text-brand-400">•</span>The link expires in 30 minutes</li>
                <li className="flex items-start gap-2"><span className="text-brand-400">•</span>Each link can only be used once</li>
              </ul>
            </div>
            <Link href="/auth/verify" className="btn-secondary inline-flex items-center gap-2 text-sm">
              Resend or troubleshoot →
            </Link>
            <p className="text-xs mt-4" style={{ color: "var(--text-muted)" }}>
              Already verified?{" "}
              <Link href="/auth/login" style={{ color: "var(--accent)" }} className="hover:underline">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen min-h-dvh flex items-center justify-center p-4 sm:p-6 py-8 sm:py-12"
      style={{ background: "var(--bg-base)" }}
    >
      <div className="w-full max-w-md">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mb-8">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #00F0FF, #7C3AED)", boxShadow: "0 0 10px rgba(0,240,255,0.15)" }}
          >
            <Gamepad2 className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-xl" style={{ color: "var(--text-primary)" }}>
            Re<span className="gradient-text">Playr</span>
          </span>
        </Link>

        <div
          className="rounded-2xl p-6 sm:p-8"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
        >
          <h2 className="font-display text-3xl font-bold text-white mb-1">Create account</h2>
          <p className="mb-8" style={{ color: "var(--text-secondary)" }}>Join the local gamer community</p>

          {/* Google */}
          <div className="mb-6">
            <button
              onClick={() => handleOAuthSignup("google")}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 rounded-xl px-4 py-3 font-medium text-sm transition-all duration-200 disabled:opacity-50"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-strong)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-default)"; }}
            >
              <GoogleIcon /> Sign up with Google
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px" style={{ background: "var(--border-default)" }} />
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>or create with email</span>
            <div className="flex-1 h-px" style={{ background: "var(--border-default)" }} />
          </div>

          {/* Top-level error banner */}
          {error && (
            <div className="mb-4">
              <ErrorBanner message={error} onDismiss={() => { setError(""); setSocialHint(null); }} />
              {socialHint && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {socialHint.providers.includes("google") && (
                    <button
                      onClick={() => handleOAuthSignup("google")}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                      style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
                    >
                      <GoogleIcon /> Sign in with Google
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Form — noValidate kills browser default popups */}
          <form onSubmit={handleSignup} noValidate className="space-y-4">

            {/* Full Name */}
            <div>
              <label className="label-base">Full Name</label>
              <div className="relative">
                <User
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: resolvedNameError ? "#f87171" : "var(--text-muted)" }}
                />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  autoComplete="name"
                  className="input-base pl-11"
                  style={errorInputStyle(!!resolvedNameError)}
                />
              </div>
              <FieldError message={resolvedNameError} />
            </div>

            {/* Email */}
            <div>
              <label className="label-base">Email address</label>
              <div className="relative">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: resolvedEmailError ? "#f87171" : "var(--text-muted)" }}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); setSocialHint(null); }}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="input-base pl-11"
                  style={errorInputStyle(!!resolvedEmailError)}
                />
              </div>
              <FieldError message={resolvedEmailError} />
            </div>

            {/* Password */}
            <div>
              <label className="label-base">Password</label>
              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: resolvedPwErrors ? "#f87171" : "var(--text-muted)" }}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                  maxLength={128}
                  className="input-base pl-11 pr-12"
                  style={errorInputStyle(!!resolvedPwErrors)}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 hover:opacity-70 transition-opacity"
                  style={{ color: "var(--text-muted)" }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>

                {/* Tooltip popup — floats to the right of the input */}
                {showChecklist && (
                  <div
                    className="absolute left-full top-0 ml-3 z-50 w-56 rounded-xl px-4 py-3 space-y-2"
                    style={{
                      background: "var(--bg-overlay)",
                      border: "1px solid var(--border-default)",
                      boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                    }}
                  >
                    {/* Arrow pointing left toward the input */}
                    <div
                      className="absolute -left-[7px] top-4 w-3 h-3 rotate-45"
                      style={{
                        background: "var(--bg-overlay)",
                        borderLeft: "1px solid var(--border-default)",
                        borderBottom: "1px solid var(--border-default)",
                      }}
                    />
                    <p className="text-xs font-semibold mb-1" style={{ color: "var(--text-muted)" }}>
                      Password requirements
                    </p>
                    {PASSWORD_RULES.map((rule) => {
                      const passed = rule.test(password.trim());
                      return (
                        <div key={rule.id} className="flex items-center gap-2">
                          <span
                            className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center transition-all duration-200"
                            style={{
                              background: passed ? "rgba(34,197,94,0.18)" : "rgba(255,255,255,0.06)",
                              border: `1px solid ${passed ? "rgba(34,197,94,0.5)" : "rgba(255,255,255,0.12)"}`,
                            }}
                          >
                            {passed
                              ? <Check className="w-2.5 h-2.5" style={{ color: "#22c55e" }} />
                              : <X     className="w-2.5 h-2.5" style={{ color: "var(--text-muted)" }} />
                            }
                          </span>
                          <span
                            className="text-xs transition-colors duration-200"
                            style={{ color: passed ? "#22c55e" : "var(--text-muted)" }}
                          >
                            {rule.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Error message shown only after submit */}
              {resolvedPwErrors && <FieldError message={pwErrors[0]} />}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2"
            >
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </form>

          <p className="text-xs text-center mt-4" style={{ color: "var(--text-muted)" }}>
            By creating an account you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>

        <p className="text-center text-sm mt-6" style={{ color: "var(--text-muted)" }}>
          Already have an account?{" "}
          <Link href="/auth/login" className="font-medium" style={{ color: "var(--accent)" }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
