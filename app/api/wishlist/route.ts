import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { listingId } = await req.json();
  if (!listingId) return NextResponse.json({ error: "Missing listingId" }, { status: 400 });

  try {
    const entry = await prisma.wishlist.create({
      data: { userId: session.user.id, listingId },
    });
    return NextResponse.json(entry);
  } catch {
    return NextResponse.json({ error: "Already in wishlist" }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { listingId } = await req.json();

  await prisma.wishlist.deleteMany({
    where: { userId: session.user.id, listingId },
  });

  return NextResponse.json({ ok: true });
}
