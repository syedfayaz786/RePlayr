import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// ─── Password validation (mirrors frontend rules) ─────────────────────────────

function validatePassword(password: string): string[] {
  const trimmed = password.trim();
  const errors: string[] = [];

  if (trimmed.length === 0) {
    errors.push("Password cannot be only spaces");
    return errors;
  }
  if (trimmed.length < 8)                  errors.push("Password must be at least 8 characters");
  if (!/[a-zA-Z]/.test(trimmed))           errors.push("Include at least one letter");
  if (!/[0-9]/.test(trimmed))              errors.push("Include at least one number");
  if (!/[^a-zA-Z0-9\s]/.test(trimmed))    errors.push("Include at least one special character");
  if (password.length > 128)               errors.push("Password must be 128 characters or fewer");

  return errors;
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    // ── Required field check ──────────────────────────────────────────────────
    if (!name || !email || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    // ── Password rules ────────────────────────────────────────────────────────
    const pwErrors = validatePassword(password);
    if (pwErrors.length > 0) {
      return NextResponse.json(
        { error: pwErrors[0], errors: pwErrors, code: "INVALID_PASSWORD" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // ── Duplicate email check ─────────────────────────────────────────────────
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (existing) {
      const hasSocial = existing.providers.some((p) => p === "google");
      const hasEmail  = existing.providers.includes("email");

      if (hasSocial && !hasEmail) {
        const socialList = existing.providers
          .filter((p) => p !== "email")
          .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
          .join(" or ");
        return NextResponse.json(
          {
            error:     `An account with this email already exists. Please sign in with ${socialList}.`,
            code:      "SOCIAL_ACCOUNT_EXISTS",
            providers: existing.providers,
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: "An account with this email already exists. Please sign in.", code: "EMAIL_EXISTS" },
        { status: 409 }
      );
    }

    // ── Hash & create ─────────────────────────────────────────────────────────
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name:      name.trim(),
        email:     normalizedEmail,
        password:  hashedPassword,
        providers: ["email"],
      },
    });

    return NextResponse.json({ id: user.id, email: user.email, name: user.name });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
