import { NextResponse }          from "next/server";
import bcrypt                    from "bcryptjs";
import crypto                    from "crypto";
import { prisma }                from "@/lib/prisma";
import {
  normalizeEmail,
  isValidEmailFormat,
  isDisposableEmail,
  validateEmailDomain,
} from "@/lib/email-validation";
import { sendVerificationEmail } from "@/lib/email-sender";
// import { checkRateLimit }        from "@/lib/rate-limit"; // RATE LIMITING ON HOLD — re-enable after testing
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
  console.log("[signup] ── New request ──────────────────────────────────────");

  try {
    // ── Rate limiting — ON HOLD FOR TESTING, re-enable when done ──────────
    const headersList = headers();
    const ip =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      headersList.get("x-real-ip") ??
      "unknown";

    console.log(`[signup] IP: ${ip}`);

    // const rateLimit = checkRateLimit(`signup:${ip}`, { windowMs: 15 * 60 * 1000, maxHits: 5 });
    // if (!rateLimit.allowed) {
    //   const retryAfterSec = Math.ceil(rateLimit.retryAfterMs / 1000);
    //   console.warn(`[signup] Rate limited — ip=${ip}`);
    //   return NextResponse.json(
    //     { error: `Too many signup attempts. Please try again in ${Math.ceil(retryAfterSec / 60)} minutes.`, code: "RATE_LIMITED" },
    //     { status: 429, headers: { "Retry-After": String(retryAfterSec) } }
    //   );
    // }

    // ── Parse body ──────────────────────────────────────────────────────────
    let body: { name?: string; email?: string; password?: string };
    try { body = await req.json(); }
    catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const trimmedName = name.trim().slice(0, 100);
    if (trimmedName.length < 1) {
      return NextResponse.json({ error: "Please enter your name", code: "INVALID_NAME" }, { status: 400 });
    }

    // ── Step 1: Normalize email ─────────────────────────────────────────────
    // Trim whitespace + lowercase. Must happen before any other check.
    const normalizedEmail = normalizeEmail(email);
    const domain          = normalizedEmail.split("@")[1] ?? "";
    console.log(`[signup] Email normalized: "${normalizedEmail}" | domain: "${domain}"`);

    // ── Step 2: Format validation ───────────────────────────────────────────
    if (!isValidEmailFormat(normalizedEmail)) {
      console.warn(`[signup] Invalid email format: "${normalizedEmail}"`);
      return NextResponse.json(
        { error: "Enter a valid email address", code: "INVALID_FORMAT" },
        { status: 400 }
      );
    }
    console.log(`[signup] Format: OK`);

    // ── Step 3: Disposable email check ──────────────────────────────────────
    if (isDisposableEmail(normalizedEmail)) {
      console.warn(`[signup] Disposable email rejected: "${domain}"`);
      return NextResponse.json(
        { error: "Temporary email addresses are not allowed. Please use a real email.", code: "DISPOSABLE_EMAIL" },
        { status: 400 }
      );
    }
    console.log(`[signup] Disposable check: OK`);

    // ── Step 4: DNS MX domain validation ───────────────────────────────────
    // Runs AFTER format + disposable checks to avoid unnecessary DNS lookups.
    // Uses Promise.race() with a 2500ms timeout internally.
    // Fails open on transient DNS errors (ETIMEOUT, EAI_AGAIN, etc).
    console.log(`[signup] Starting DNS MX lookup for domain: "${domain}"...`);
    const mxStart  = Date.now();
    const mxResult = await validateEmailDomain(domain);
    const mxMs     = Date.now() - mxStart;
    console.log(`[signup] DNS MX lookup completed in ${mxMs}ms — valid=${mxResult.valid} reason=${!mxResult.valid ? mxResult.reason : "n/a"}`);

    if (!mxResult.valid) {
      return NextResponse.json(
        { error: "Email domain is not valid", code: "INVALID_DOMAIN" },
        { status: 400 }
      );
    }

    // ── Step 5: Password validation ─────────────────────────────────────────
    const pwErrors = validatePassword(password);
    if (pwErrors.length > 0) {
      return NextResponse.json(
        { error: pwErrors[0], errors: pwErrors, code: "INVALID_PASSWORD" },
        { status: 400 }
      );
    }
    console.log(`[signup] Password: OK`);

    // ── Step 6: Duplicate email check ───────────────────────────────────────
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (existing) {
      if (existing.emailVerified && !existing.providers.includes("email")) {
        const socialList = existing.providers
          .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
          .join(" or ");
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
    console.log(`[signup] Duplicate check: OK — no existing account`);

    // ── Step 7: Hash password & generate verification token ────────────────
    console.log(`[signup] Hashing password & generating token...`);
    const hashedPassword    = await bcrypt.hash(password, 12);
    const verificationToken = generateToken();
    const tokenExpiry       = new Date(Date.now() + 30 * 60 * 1000); // 30 min

    // ── Step 8: Create user (emailVerified = null until link is clicked) ────
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
    console.log(`[signup] User created — id=${user.id}`);

    // ── Step 9: Send verification email (awaited — must complete before return)
    // On Vercel, the execution context closes when the response is sent.
    // Never use .catch() alone here — the promise will be abandoned.
    console.log(`[signup] Sending verification email to "${normalizedEmail}"...`);
    const emailResult = await sendVerificationEmail(normalizedEmail, trimmedName, verificationToken);
    const elapsed     = Date.now() - startTime;

    if (!emailResult.success) {
      // User was created but email failed — they can use "Resend" on the verify page.
      console.error(`[signup] Email send FAILED in ${elapsed}ms — error: ${emailResult.error}`);
      return NextResponse.json(
        {
          id:         user.id,
          email:      user.email,
          name:       user.name,
          pending:    true,
          emailSent:  false,
          emailError: emailResult.error,
        },
        { status: 201 }
      );
    }

    console.log(`[signup] ✓ Complete in ${elapsed}ms — emailSent=true messageId=${emailResult.messageId}`);
    return NextResponse.json(
      {
        id:        user.id,
        email:     user.email,
        name:      user.name,
        pending:   true,
        emailSent: true,
        messageId: emailResult.messageId,
      },
      { status: 201 }
    );

  } catch (error: any) {
    const elapsed = Date.now() - startTime;
    console.error(`[signup] UNEXPECTED ERROR after ${elapsed}ms:`, error?.message ?? error);
    console.error(`[signup] Stack:`, error?.stack);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
