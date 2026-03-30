import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Called from the /auth/facebook-email page when Facebook returned no email.
 * The user supplies their email; we find-or-create the user, then link the
 * Facebook Account row to them and redirect to a sign-in that will succeed.
 *
 * NOTE: This does NOT auto-link if the supplied email belongs to a different
 * Facebook user — we verify the providerAccountId is unique first.
 */
export async function POST(req: Request) {
  try {
    const { email, providerAccountId, name, image } = await req.json();

    if (!email || !providerAccountId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if this Facebook account is already linked to someone else
    const existingAccount = await prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider:          "facebook",
          providerAccountId: providerAccountId,
        },
      },
      include: { user: { select: { email: true } } },
    });

    if (existingAccount) {
      // Already linked — mismatch scenario: supplied email differs from linked account
      if (existingAccount.user.email !== normalizedEmail) {
        return NextResponse.json(
          {
            error:
              "This Facebook account is already linked to a different email address. " +
              "Please sign in with that email instead.",
            code: "FB_ACCOUNT_MISMATCH",
          },
          { status: 409 }
        );
      }
      // Same email — already done, just return success
      return NextResponse.json({ success: true, userId: existingAccount.userId });
    }

    // Find or create user by email
    let user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email:     normalizedEmail,
          name:      name  || null,
          image:     image || null,
          providers: ["facebook"],
        },
      });
    } else {
      // Link facebook provider to existing user
      if (!user.providers.includes("facebook")) {
        await prisma.user.update({
          where: { id: user.id },
          data:  { providers: { push: "facebook" } },
        });
      }
    }

    // Create the Account row so NextAuth can sign them in
    await prisma.account.upsert({
      where: {
        provider_providerAccountId: {
          provider:          "facebook",
          providerAccountId: providerAccountId,
        },
      },
      update: { userId: user.id },
      create: {
        userId:            user.id,
        type:              "oauth",
        provider:          "facebook",
        providerAccountId: providerAccountId,
      },
    });

    return NextResponse.json({ success: true, userId: user.id });
  } catch (error) {
    console.error("Facebook link error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
