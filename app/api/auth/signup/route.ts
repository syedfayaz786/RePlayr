import { NextResponse }          from "next/server";
import bcrypt                    from "bcryptjs";
import crypto                    from "crypto";
import { prisma }                from "@/lib/prisma";
import { validateEmailFull }     from "@/lib/email-validation";
import { sendVerificationEmail } from "@/lib/email-sender";
import { checkRateLimit }        from "@/lib/rate-limit";
import { headers }               from "next/headers";

// ─── Password validation ──────────────────────────────────────────────────────

function validatePassword(password: string): string[] {
  const trimmed = password?.trim() ?? "";
  const errors: string[] = [];
  if (trimmed.length === 0) { errors.push("Password cannot be only spaces"); return errors; }
  if (trimmed.length < 8)                  errors.push("Password must be at least 8 characters");
  if (!/[a-zA-Z]/.test(trimmed))           errors.push("Include at least one letter");
  if (!/[0-9]/.test(trimmed))              errors.push("Include at least one number");
  if (!/[^a-zA-Z0-9\s]/.test(trimmed))    errors.push("Include at least one special character");
  if (password.length > 128)               errors.push("Password must be 128 characters or fewer");
  return errors;
}

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// ─── POST /api/auth/signup ────────────────────────────────────────────────────

export async function POST(req: Request) {
  const startTime = Date.now();
  console.log("[signup] ── Request received ──────────────────────────────────");

  try {
    // ── Rate limiting ───────────────────────────────────────────────────────
    const headersList = headers();
    const ip =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      headersList.get("x-real-ip") ??
      "unknown";

    console.log(`[signup] IP: ${ip}`);

    const rateLimit = checkRateLimit(`signup:${ip}`, { windowMs: 15 * 60 * 1000, maxHits: 5 });
    if (!rateLimit.allowed) {
      const retryAfterSec = Math.ceil(rateLimit.retryAfterMs / 1000);
      console.warn(`[signup] Rate limited: ip=${ip}`);
      return NextResponse.json(
        { error: `Too many signup attempts. Please try again in ${Math.ceil(retryAfterSec / 60)} minutes.`, code: "RATE_LIMITED" },
        { status: 429, headers: { "Retry-After": String(retryAfterSec) } }
      );
    }

    // ── Parse body ──────────────────────────────────────────────────────────
    let body: { name?: string; email?: string; password?: string };
    try { body = await req.json(); } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const trimmedName = name.trim().slice(0, 100);
    console.log(`[signup] Name: "${trimmedName}" | Email: "${email}"`);

    // ── Email validation (format + disposable + MX) ─────────────────────────
    console.log("[signup] Validating email...");
    const emailResult = await validateEmailFull(email);
    if (!emailResult.valid) {
      console.warn(`[signup] Email rejected: code=${emailResult.code} email=${email}`);
      return NextResponse.json({ error: emailResult.error, code: emailResult.code }, { status: 400 });
    }
    const normalizedEmail = emailResult.email;
    console.log(`[signup] Email valid: ${normalizedEmail}`);

    // ── Password validation ─────────────────────────────────────────────────
    const pwErrors = validatePassword(password);
    if (pwErrors.length > 0) {
      return NextResponse.json(
        { error: pwErrors[0], errors: pwErrors, code: "INVALID_PASSWORD" },
        { status: 400 }
      );
    }

    // ── Duplicate check ─────────────────────────────────────────────────────
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (existing) {
      if (existing.emailVerified && !existing.providers.includes("email")) {
        const socialList = existing.providers.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" or ");
        return NextResponse.json(
          { error: `An account with this email already exists. Please sign in with ${socialList}.`, code: "SOCIAL_ACCOUNT_EXISTS", providers: existing.providers },
          { status: 409 }
        );
      }
      if (!existing.emailVerified && existing.providers.includes("email")) {
        return NextResponse.json(
          { error: "An account with this email exists but is not verified yet.", code: "EMAIL_UNVERIFIED" },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "An account with this email already exists. Please sign in.", code: "EMAIL_EXISTS" },
        { status: 409 }
      );
    }

    // ── Hash password & generate token ──────────────────────────────────────
    console.log("[signup] Hashing password & generating verification token...");
    const hashedPassword    = await bcrypt.hash(password, 12);
    const verificationToken = generateToken();
    const tokenExpiry       = new Date(Date.now() + 30 * 60 * 1000); // 30 min

    // ── Create user (unverified) ────────────────────────────────────────────
    console.log("[signup] Creating user in database...");
    const user = await prisma.user.create({
      data: {
        name:               trimmedName,
        email:              normalizedEmail,
        password:           hashedPassword,
        providers:          ["email"],
        verificationToken,
        verificationExpiry: tokenExpiry,
      },
    });
    console.log(`[signup] User created: id=${user.id}`);

    // ── Send verification email (AWAITED — not fire-and-forget) ────────────
    // Must await before returning on Vercel — serverless context closes after
    // response is sent, killing any in-flight async work.
    console.log("[signup] Sending verification email...");
    const emailResult2 = await sendVerificationEmail(normalizedEmail, trimmedName, verificationToken);

    const elapsed = Date.now() - startTime;

    if (!emailResult2.success) {
      // User is created but email failed — still return 201 so they get the
      // "check your email" screen, but flag the failure for debugging.
      // They can use "Resend" to retry.
      console.error(`[signup] Email send FAILED after ${elapsed}ms: ${emailResult2.error}`);
      return NextResponse.json(
        {
          id:        user.id,
          email:     user.email,
          name:      user.name,
          pending:   true,
          emailSent: false,
          emailError: emailResult2.error, // visible in response during dev/debug
        },
        { status: 201 }
      );
    }

    console.log(`[signup] Complete in ${elapsed}ms — emailSent=true messageId=${emailResult2.messageId}`);
    return NextResponse.json(
      {
        id:        user.id,
        email:     user.email,
        name:      user.name,
        pending:   true,
        emailSent: true,
        messageId: emailResult2.messageId,
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error("[signup] UNEXPECTED ERROR:", error?.message ?? error);
    console.error("[signup] Stack:", error?.stack);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
