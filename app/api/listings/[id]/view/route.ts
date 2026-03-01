import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    select: { sellerId: true },
  });

  if (!listing) return NextResponse.json({ ok: false }, { status: 404 });

  // Don't count the seller's own views
  if (session?.user?.id === listing.sellerId) {
    return NextResponse.json({ ok: false, reason: "seller" });
  }

  await prisma.listing.update({
    where: { id: params.id },
    data: { views: { increment: 1 } },
  });

  return NextResponse.json({ ok: true });
}
