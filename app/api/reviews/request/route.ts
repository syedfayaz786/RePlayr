import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { listingId, buyerId } = await req.json();
  if (!listingId || !buyerId) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  // Verify the requester is the seller of this listing
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { title: true, sellerId: true },
  });
  if (!listing || listing.sellerId !== session.user.id)
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  // Check a sale exists
  const sale = await prisma.sale.findUnique({ where: { listingId } });
  if (!sale) return NextResponse.json({ error: "No confirmed sale" }, { status: 400 });

  // Send a message to the buyer with a prompt to leave a review
  const sellerName = session.user.name ?? "The seller";
  const msgContent = `📝 Review request\n${sellerName} is asking you to leave a review for "${listing.title}". Head to your messages to rate this transaction.`;

  await prisma.message.create({
    data: {
      content:    msgContent,
      senderId:   session.user.id,
      receiverId: buyerId,
      listingId,
    },
  });

  return NextResponse.json({ ok: true });
}
