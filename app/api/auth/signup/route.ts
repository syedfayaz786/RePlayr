import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (existing) {
      // Tell the frontend which providers this account already uses
      const hasSocial = existing.providers.some((p) => p === "google");
      const hasEmail  = existing.providers.includes("email");

      if (hasSocial && !hasEmail) {
        // Social-only — block email signup, surface provider list
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

      // Email already registered
      return NextResponse.json(
        { error: "An account with this email already exists. Please sign in.", code: "EMAIL_EXISTS" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
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
