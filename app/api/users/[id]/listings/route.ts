import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const listings = await prisma.listing.findMany({
    where: { sellerId: params.id, status: "active" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      price: true,
      platform: true,
      condition: true,
      edition: true,
      location: true,
      images: true,
      status: true,
      views: true,
      createdAt: true,
      seller: { select: { id: true, name: true, image: true } },
      _count: { select: { wishlistedBy: true } },
    },
  });

  return NextResponse.json({
    listings: listings.map((l) => ({ ...l, createdAt: l.createdAt.toISOString() })),
  });
}
