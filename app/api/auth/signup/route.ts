import { NextResponse }          from "next/server";
import bcrypt                    from "bcryptjs";
import crypto                    from "crypto";
import { prisma }                from "@/lib/prisma";
import { validateEmailFull }     from "@/lib/email-validation";
import { sendVerificationEmail } from "@/lib/email-sender";
import { checkRateLimit }        from "@/lib/rate-limit";
import { headers }               from "next/headers";

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

export async function POST(req: Request) {
  try {
    const headersList = headers();
    const ip =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      headersList.get("x-real-ip") ??
      "unknown";

    const rateLimit = checkRateLimit(`signup:${ip}`, { windowMs: 15 * 60 * 1000, maxHits: 5 });
    if (!rateLimit.allowed) {
      const retryAfterSec = Math.ceil(rateLimit.retryAfterMs / 1000);
      return NextResponse.json(
        { error: `Too many signup attempts. Please try again in ${Math.ceil(retryAfterSec / 60)} minutes.`, code: "RATE_LIMITED" },
        { status: 429, headers: { "Retry-After": String(retryAfterSec) } }
      );
    }

    let body: { name?: string; email?: string; password?: string };
    try { body = await req.json(); } catch {
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

    // Multi-layer email validation (format + disposable + MX)
    const emailResult = await validateEmailFull(email);
    if (!emailResult.valid) {
      return NextResponse.json({ error: emailResult.error, code: emailResult.code }, { status: 400 });
    }
    const normalizedEmail = emailResult.email;

    const pwErrors = validatePassword(password);
    if (pwErrors.length > 0) {
      return NextResponse.json(
        { error: pwErrors[0], errors: pwErrors, code: "INVALID_PASSWORD" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (existing) {
      if (existing.emailVerified && existing.providers.length > 0 && !existing.providers.includes("email")) {
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

    const [hashedPassword] = await Promise.all([bcrypt.hash(password, 12)]);
    const verificationToken = generateToken();
    const tokenExpiry = new Date(Date.now() + 30 * 60 * 1000);

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

    sendVerificationEmail(normalizedEmail, trimmedName, verificationToken).catch((err) => {
      console.error("[Signup] Failed to send verification email:", err);
    });

    return NextResponse.json(
      { id: user.id, email: user.email, name: user.name, pending: true },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Signup] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
