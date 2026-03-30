import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { password, currentPassword } = await req.json();

    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true, providers: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If they already have a password, require current password for change
    if (user.password) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Current password is required to set a new one" },
          { status: 400 }
        );
      }
      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
      }
    }

    const hashed = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        password:  hashed,
        providers: user.providers.includes("email")
          ? user.providers
          : { push: "email" },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Set-password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
