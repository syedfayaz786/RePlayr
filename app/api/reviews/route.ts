import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST — buyer submits a review for a seller after a confirmed sale
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { targetId, listingId, rating, comment } = await req.json();
  if (!targetId || !rating) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  // Verify a confirmed sale exists and the reviewer is the confirmed buyer
  if (listingId) {
    const sale = await prisma.sale.findUnique({ where: { listingId } });
    if (!sale || sale.buyerId !== session.user.id) {
      return NextResponse.json({ error: "Only the confirmed buyer can review this sale" }, { status: 403 });
    }
  }

  const review = await prisma.review.upsert({
    where:  { authorId_listingId: { authorId: session.user.id, listingId: listingId ?? "" } },
    update: { rating, comment },
    create: { authorId: session.user.id, targetId, listingId: listingId ?? null, rating, comment },
  });

  return NextResponse.json(review);
}

// GET — fetch reviews for a seller, or check if current user has reviewed a listing
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const targetId  = searchParams.get("targetId");
  const listingId = searchParams.get("listingId");

  if (listingId) {
    // Check if the current user has already reviewed this listing
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json(null);
    const review = await prisma.review.findUnique({
      where: { authorId_listingId: { authorId: session.user.id, listingId } },
    });
    return NextResponse.json(review ?? null);
  }

  if (targetId) {
    const reviews = await prisma.review.findMany({
      where:   { targetId },
      include: { author: { select: { id: true, name: true, image: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(reviews);
  }

  return NextResponse.json([]);
}
