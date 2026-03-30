"use client";

import { useState } from "react";
import { Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { ErrorBanner, FieldError, SuccessBanner } from "@/components/ui/InlineError";
import { useSession } from "next-auth/react";

interface SetPasswordFormProps {
  /** Pass true if the user already has a password set */
  hasPassword?: boolean;
}

export function SetPasswordForm({ hasPassword = false }: SetPasswordFormProps) {
  const { update } = useSession();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword,     setNewPassword]      = useState("");
  const [confirmPassword, setConfirmPassword]  = useState("");
  const [showCurrent,     setShowCurrent]      = useState(false);
  const [showNew,         setShowNew]          = useState(false);
  const [loading,         setLoading]          = useState(false);
  const [error,           setError]            = useState("");
  const [confirmError,    setConfirmError]      = useState("");
  const [success,         setSuccess]          = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setConfirmError("");
    setSuccess(false);

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setConfirmError("Passwords don't match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/set-password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          password:        newPassword,
          currentPassword: hasPassword ? currentPassword : undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }

      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      // Refresh session so providers list updates
      await update();
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-3">
        <SuccessBanner message="Password set successfully! You can now sign in with email and password." />
        <button
          onClick={() => setSuccess(false)}
          className="text-sm transition-colors"
          style={{ color: "var(--accent)" }}
        >
          Change password again
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <ErrorBanner message={error} onDismiss={() => setError("")} />}

      {/* Current password — only shown when changing an existing password */}
      {hasPassword && (
        <div>
          <label className="label-base">Current Password</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
            <input
              type={showCurrent ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className="input-base pl-11 pr-12"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-4 top-1/2 -translate-y-1/2 hover:opacity-70 transition-opacity"
              style={{ color: "var(--text-muted)" }}
            >
              {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      <div>
        <label className="label-base">{hasPassword ? "New Password" : "Set Password"}</label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
          <input
            type={showNew ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Min. 8 characters"
            required
            autoComplete="new-password"
            className="input-base pl-11 pr-12"
          />
          <button
            type="button"
            onClick={() => setShowNew(!showNew)}
            className="absolute right-4 top-1/2 -translate-y-1/2 hover:opacity-70 transition-opacity"
            style={{ color: "var(--text-muted)" }}
          >
            {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div>
        <label className="label-base">Confirm Password</label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); setConfirmError(""); }}
            placeholder="••••••••"
            required
            autoComplete="new-password"
            className={`input-base pl-11 ${confirmError ? "border-red-500/50" : ""}`}
          />
        </div>
        <FieldError message={confirmError} />
      </div>

      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? "Saving…" : hasPassword ? "Update Password" : "Set Password"}
      </button>
    </form>
  );
}
