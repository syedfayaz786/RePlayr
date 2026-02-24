import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — returns whether the partner has read my latest message
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ seen: false });

  const { searchParams } = new URL(req.url);
  const partnerId = searchParams.get("partnerId");
  const listingId = searchParams.get("listingId");
  if (!partnerId) return NextResponse.json({ seen: false });

  // Find my most recent message to the partner
  const lastMsg = await prisma.message.findFirst({
    where: {
      senderId:   session.user.id,
      receiverId: partnerId,
      ...(listingId ? { OR: [{ listingId }, { listingId: null }] } : { listingId: null }),
    },
    orderBy: { createdAt: "desc" },
    select:  { id: true, read: true, createdAt: true },
  });

  return NextResponse.json({ seen: lastMsg?.read ?? false, messageId: lastMsg?.id ?? null });
}

// POST — mark messages from partner as read (called when user opens/focuses thread)
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ ok: false });

  const { partnerId, listingId } = await req.json();
  if (!partnerId) return NextResponse.json({ ok: false });

  await prisma.message.updateMany({
    where: {
      senderId:   partnerId,
      receiverId: session.user.id,
      read:       false,
      ...(listingId ? { OR: [{ listingId }, { listingId: null }] } : { listingId: null }),
    },
    data: { read: true },
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
