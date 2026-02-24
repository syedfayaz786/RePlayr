import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST — seller marks a listing as sold to a specific buyer
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { listingId, buyerId } = await req.json();
  if (!listingId || !buyerId) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  // Verify the caller is the seller of this listing
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  if (listing.sellerId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Create sale record + mark listing as sold
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

  return NextResponse.json(sale);
}

// GET — check if a listing has a sale record
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
