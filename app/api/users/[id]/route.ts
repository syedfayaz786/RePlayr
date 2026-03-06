import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      image: true,
      bio: true,
      location: true,
      createdAt: true,
      listings: {
        where: { status: "active" },
        orderBy: { createdAt: "desc" },
        take: 12,
        select: {
          id: true, title: true, price: true, platform: true,
          condition: true, edition: true, images: true, status: true,
          createdAt: true, location: true, sellerId: true,
          _count: { select: { wishlistedBy: true } },
        },
      },
      reviewsReceived: {
        orderBy: { createdAt: "desc" },
        include: { author: { select: { id: true, name: true, image: true } } },
      },
      _count: {
        select: { listings: true, reviewsReceived: true, salesAsSeller: true },
      },
    },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json(user);
}
