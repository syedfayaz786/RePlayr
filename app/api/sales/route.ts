import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { listingId, buyerId } = await req.json();
  if (!listingId) return NextResponse.json({ error: "Missing listingId" }, { status: 400 });

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  if (listing.sellerId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (!buyerId) {
    // Sold outside RePlayr — delete any existing Sale record and just mark sold
    await prisma.$transaction([
      prisma.sale.deleteMany({ where: { listingId } }),
      prisma.listing.update({ where: { id: listingId }, data: { status: "sold" } }),
    ]);
    return NextResponse.json({ ok: true });
  }

  const [sale] = await prisma.$transaction([
    prisma.sale.upsert({
      where:  { listingId },
      update: { buyerId },
      create: { listingId, sellerId: session.user.id, buyerId },
    }),
    prisma.listing.update({
      where: { id: listingId },
      data:  { status: "sold" },
    }),
  ]);

  // Send a system notification message so the navbar badge fires for the buyer.
  const sellerName = session.user.name ?? "The seller";
  const buyer = await prisma.user.findUnique({ where: { id: buyerId }, select: { name: true } }).catch(() => null);
  const buyerName = buyer?.name ?? "the buyer";
  await prisma.message.create({
    data: {
      content:    `🎉 SALE_CONFIRMED|seller:${sellerName}|buyer:${buyerName}`,
      senderId:   session.user.id,
      receiverId: buyerId,
      listingId:  listingId,
    },
  }).catch(() => {}); // non-fatal

  return NextResponse.json(sale);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const listingId = searchParams.get("listingId");
  if (!listingId) return NextResponse.json({ error: "Missing listingId" }, { status: 400 });

  const sale = await prisma.sale.findUnique({
    where: { listingId },
    include: {
      buyer:  { select: { id: true, name: true, image: true } },
      seller: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(sale ?? null);
}
