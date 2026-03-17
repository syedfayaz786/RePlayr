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
    const sale = await prisma.sale.findUnique({ where: { listingId } }).catch(() => null);
    if (!sale) return NextResponse.json({ error: "No confirmed sale found for this listing" }, { status: 403 });
    const isBuyer  = sale.buyerId  === session.user.id;
    const isSeller = sale.sellerId === session.user.id;
    if (!isBuyer && !isSeller) {
      return NextResponse.json({ error: "Only the buyer or seller can review this sale" }, { status: 403 });
    }
  }

  const strengthsJson = JSON.stringify(Array.isArray(strengths) ? strengths : []);
  const roleVal = role ?? "buyer";

  try {
    // Check if a review already exists for this author+listing combo
    const existing = listingId
      ? await prisma.review.findUnique({
          where: { authorId_listingId: { authorId: session.user.id, listingId } },
        })
      : null;

    const isNew = !existing;
    let review;
    if (existing) {
      // Update existing — no new message sent to avoid duplicates
      review = await prisma.review.update({
        where: { id: existing.id },
        data: {
          rating,
          comment: comment ?? null,
          ...(await hasColumn("strengths") ? { strengths: strengthsJson } : {}),
          ...(await hasColumn("role")      ? { role: roleVal }              : {}),
        },
      });
    } else {
      // Create new
      review = await prisma.review.create({
        data: {
          authorId:  session.user.id,
          targetId,
          listingId: listingId ?? null,
          rating,
          comment:   comment ?? null,
          ...(await hasColumn("strengths") ? { strengths: strengthsJson } : {}),
          ...(await hasColumn("role")      ? { role: roleVal }              : {}),
        },
      });
    }

    // Only send rating message on first submission — never on updates
    if (isNew) {
      const LABELS: Record<number, string> = { 1:"Poor", 2:"Fair", 3:"Good", 4:"Great", 5:"Excellent!" };
      const stars = "★".repeat(rating) + "☆".repeat(5 - rating);
      // roleVal is the AUTHOR's role; message says "rated you as X" where X = TARGET's role (opposite)
      const roleLabel = roleVal === "seller" ? "buyer" : "seller";
      const strengthsList = Array.isArray(strengths) && strengths.length > 0
        ? `\n✨ ${strengths.join(" · ")}`
        : "";
      const commentPart = comment ? `\n"${comment}"` : "";

      const msgContent = `⭐ Rating received\n${stars} ${LABELS[rating]} — rated you as a ${roleLabel}${strengthsList}${commentPart}`;

      await prisma.message.create({
        data: {
          content:    msgContent,
          senderId:   session.user.id,
          receiverId: targetId,
          listingId:  listingId ?? null,
        },
      }).catch(() => {});
    }

    return NextResponse.json({ review });
  } catch (err) {
    console.error("Review POST error:", err);
    return NextResponse.json({ error: "Failed to save review", detail: String(err) }, { status: 500 });
  }
}

// Check if a column exists in Review table (graceful degradation before migration runs)
async function hasColumn(col: string): Promise<boolean> {
  try {
    const result = await prisma.$queryRaw<{ count: number }[]>`
      SELECT COUNT(*) as count FROM information_schema.columns
      WHERE table_name = 'Review' AND column_name = ${col}
    `;
    return Number(result[0]?.count ?? 0) > 0;
  } catch {
    return false;
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const targetId  = searchParams.get("targetId");
  const listingId = searchParams.get("listingId");
  const role      = searchParams.get("role");

  if (listingId) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json(null);
    const review = await prisma.review.findUnique({
      where: { authorId_listingId: { authorId: session.user.id, listingId } },
    }).catch(() => null);
    return NextResponse.json(review ?? null);
  }

  if (targetId) {
    const reviews = await prisma.review.findMany({
      where: { targetId, ...(role ? { role } : {}) },
      include: { author: { select: { id: true, name: true, image: true } } },
      orderBy: { createdAt: "desc" },
    }).catch(() => []);
    return NextResponse.json(reviews);
  }

  return NextResponse.json([]);
}
