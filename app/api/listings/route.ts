import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const platform = searchParams.get("platform");
  const condition = searchParams.get("condition");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");

  const where: any = { status: "active" };
  if (q) where.OR = [
    { title: { contains: q, mode: "insensitive" } },
    { description: { contains: q, mode: "insensitive" } },
  ];
  if (platform) where.platform = platform;
  if (condition) where.condition = condition;
  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = parseFloat(minPrice);
    if (maxPrice) where.price.lte = parseFloat(maxPrice);
  }

  const listings = await prisma.listing.findMany({
    where,
    include: {
      seller: { select: { id: true, name: true, image: true } },
      _count: { select: { wishlistedBy: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 48,
  });

  return NextResponse.json(listings);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const {
      title, description, price, platform, edition,
      condition, location, images,
      latitude, longitude,  // ← sent by the form when user picks a location result
    } = body;

    if (!title || !price || !platform || !condition || !location) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const listing = await prisma.listing.create({
      data: {
        title,
        description,
        price: parseFloat(price),
        platform,
        edition,
        condition,
        location,
        latitude:  latitude  ? parseFloat(latitude)  : null,
        longitude: longitude ? parseFloat(longitude) : null,
        images: JSON.stringify(images ?? []),
        sellerId: session.user.id,
      },
    });

    return NextResponse.json(listing);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create listing" }, { status: 500 });
  }
}
