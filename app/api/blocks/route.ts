import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST — block a user
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { blockedId } = await req.json();
  if (!blockedId) return NextResponse.json({ error: "Missing blockedId" }, { status: 400 });
  if (blockedId === session.user.id) return NextResponse.json({ error: "Cannot block yourself" }, { status: 400 });

  await prisma.block.upsert({
    where: { blockerId_blockedId: { blockerId: session.user.id, blockedId } },
    create: { blockerId: session.user.id, blockedId },
    update: {},
  });

  return NextResponse.json({ ok: true });
}

// GET — check if current user has blocked a specific user (or is blocked by them)
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ blocked: false, blockedBy: false });

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({ blocked: false, blockedBy: false });

  const [blocked, blockedBy] = await Promise.all([
    prisma.block.findUnique({
      where: { blockerId_blockedId: { blockerId: session.user.id, blockedId: userId } },
    }),
    prisma.block.findUnique({
      where: { blockerId_blockedId: { blockerId: userId, blockedId: session.user.id } },
    }),
  ]);

  return NextResponse.json({ blocked: !!blocked, blockedBy: !!blockedBy });
}

// DELETE — unblock
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { blockedId } = await req.json();
  await prisma.block.deleteMany({
    where: { blockerId: session.user.id, blockedId },
  });

  return NextResponse.json({ ok: true });
}
