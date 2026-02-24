import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { targetId, listingId, rating, comment, strengths, role } = await req.json();
  if (!targetId || !rating) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  // Verify a confirmed sale exists and reviewer is either the confirmed buyer OR the seller
  if (listingId) {
    const sale = await prisma.sale.findUnique({ where: { listingId } });
    if (!sale) return NextResponse.json({ error: "No sale found for this listing" }, { status: 403 });
    const isBuyer  = sale.buyerId  === session.user.id;
    const isSeller = sale.sellerId === session.user.id;
    if (!isBuyer && !isSeller) {
      return NextResponse.json({ error: "Only the buyer or seller can review this sale" }, { status: 403 });
    }
  }

  const strengthsJson = JSON.stringify(Array.isArray(strengths) ? strengths : []);

  const review = await prisma.review.upsert({
    where:  { authorId_listingId: { authorId: session.user.id, listingId: listingId ?? "" } },
    update: { rating, comment, strengths: strengthsJson, role: role ?? "buyer" },
    create: { authorId: session.user.id, targetId, listingId: listingId ?? null, rating, comment, strengths: strengthsJson, role: role ?? "buyer" },
  });

  return NextResponse.json(review);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const targetId  = searchParams.get("targetId");
  const listingId = searchParams.get("listingId");
  const role      = searchParams.get("role"); // optional filter

  if (listingId) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json(null);
    const review = await prisma.review.findUnique({
      where: { authorId_listingId: { authorId: session.user.id, listingId } },
    });
    return NextResponse.json(review ?? null);
  }

  if (targetId) {
    const where: Record<string, unknown> = { targetId };
    if (role) where.role = role;
    const reviews = await prisma.review.findMany({
      where,
      include: { author: { select: { id: true, name: true, image: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(reviews);
  }

  return NextResponse.json([]);
}
