import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { targetId, rating, comment } = await req.json();

  if (!targetId || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Invalid review data" }, { status: 400 });
  }

  if (targetId === session.user.id) {
    return NextResponse.json({ error: "Cannot review yourself" }, { status: 400 });
  }

  const review = await prisma.review.create({
    data: {
      rating: parseInt(rating),
      comment: comment?.trim() || null,
      authorId: session.user.id,
      targetId,
    },
  });

  return NextResponse.json(review);
}
