import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { receiverId, content, listingId } = await req.json();

  if (!receiverId || !content?.trim()) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (receiverId === session.user.id) {
    return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 });
  }

  const message = await prisma.message.create({
    data: {
      content: content.trim(),
      senderId: session.user.id,
      receiverId,
      listingId: listingId ?? null,
    },
    include: {
      sender: { select: { id: true, name: true, image: true } },
      listing: { select: { id: true, title: true } },
    },
  });

  return NextResponse.json(message);
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const partnerId = searchParams.get("with");

  if (!partnerId) {
    return NextResponse.json({ error: "Missing partner id" }, { status: 400 });
  }

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: session.user.id, receiverId: partnerId },
        { senderId: partnerId, receiverId: session.user.id },
      ],
    },
    include: {
      sender: { select: { id: true, name: true, image: true } },
      listing: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(messages);
}
