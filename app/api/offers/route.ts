import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { listingId, amount, message } = await req.json();

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  if (listing.sellerId === session.user.id) {
    return NextResponse.json({ error: "Cannot make offer on your own listing" }, { status: 400 });
  }

  const offer = await prisma.offer.create({
    data: {
      amount: parseFloat(amount),
      message: message?.trim() || null,
      listingId,
      buyerId: session.user.id,
      sellerId: listing.sellerId,
    },
  });

  // Send a message to the seller about the offer
  await prisma.message.create({
    data: {
      content: `💰 New offer: $${amount} for "${listing.title}"${message ? `\n"${message}"` : ""}`,
      senderId: session.user.id,
      receiverId: listing.sellerId,
      listingId,
    },
  });

  return NextResponse.json(offer);
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { offerId, status } = await req.json();

  const offer = await prisma.offer.findUnique({ where: { id: offerId } });
  if (!offer || offer.sellerId !== session.user.id) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const updated = await prisma.offer.update({
    where: { id: offerId },
    data: { status },
  });

  return NextResponse.json(updated);
}
