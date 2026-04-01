import { NextResponse }          from "next/server";
import crypto                    from "crypto";
import { prisma }                from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email-sender";
import { checkRateLimit }        from "@/lib/rate-limit";
import { validateEmailFull }     from "@/lib/email-validation";
import { headers }               from "next/headers";

export async function POST(req: Request) {
  try {
    const headersList = headers();
    const ip =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      headersList.get("x-real-ip") ??
      "unknown";

    // Rate limit: 3 resend attempts per email per hour
    const rateLimit = checkRateLimit(`resend:${ip}`, { windowMs: 60 * 60 * 1000, maxHits: 3 });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many resend attempts. Please wait before trying again.", code: "RATE_LIMITED" },
        { status: 429 }
      );
    }

    let body: { email?: string };
    try { body = await req.json(); } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { email } = body;
    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

    const emailResult = await validateEmailFull(email);
    if (!emailResult.valid) {
      return NextResponse.json({ error: emailResult.error }, { status: 400 });
    }
    const normalizedEmail = emailResult.email;

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    // Always return success — never reveal whether the email exists (security)
    if (!user || user.emailVerified || !user.providers.includes("email")) {
      return NextResponse.json({ success: true });
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const tokenExpiry       = new Date(Date.now() + 30 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data:  { verificationToken, verificationExpiry: tokenExpiry },
    });

    sendVerificationEmail(normalizedEmail, user.name ?? "there", verificationToken).catch((err) => {
      console.error("[ResendVerification] Email send failed:", err);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ResendVerification] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
