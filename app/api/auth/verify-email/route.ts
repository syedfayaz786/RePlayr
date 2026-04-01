import { NextResponse } from "next/server";
import { prisma }       from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token")?.trim();

  const appUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  if (!token) {
    return NextResponse.redirect(`${appUrl}/auth/verify?error=missing_token`);
  }

  const user = await prisma.user.findUnique({ where: { verificationToken: token } });

  if (!user) {
    return NextResponse.redirect(`${appUrl}/auth/verify?error=invalid_token`);
  }

  if (user.emailVerified) {
    // Already verified — just redirect to login
    return NextResponse.redirect(`${appUrl}/auth/login?verified=already`);
  }

  if (!user.verificationExpiry || new Date() > user.verificationExpiry) {
    return NextResponse.redirect(`${appUrl}/auth/verify?error=expired_token&email=${encodeURIComponent(user.email ?? "")}`);
  }

  // Mark as verified and clear the token (single-use)
  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified:      new Date(),
      verificationToken:  null,
      verificationExpiry: null,
    },
  });

  return NextResponse.redirect(`${appUrl}/auth/login?verified=true`);
}
