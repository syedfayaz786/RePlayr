import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Offset coordinates by a random amount up to ~500 m.
 * Prevents buyers from triangulating exact address via multiple listings.
 * 1° latitude ≈ 111 km, so 0.0045° ≈ 500 m.
 */
function fuzzyCoord(exact: number): number {
  return exact + (Math.random() - 0.5) * 2 * 0.0045;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q         = searchParams.get("q");
  const platform  = searchParams.get("platform");
  const condition = searchParams.get("condition");
  const minPrice  = searchParams.get("minPrice");
  const maxPrice  = searchParams.get("maxPrice");

  const where: any = { status: "active" };
  if (q) where.OR = [
    { title:       { contains: q, mode: "insensitive" } },
    { description: { contains: q, mode: "insensitive" } },
  ];
  if (platform)  where.platform  = platform;
  if (condition) where.condition = condition;
  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = parseFloat(minPrice);
    if (maxPrice) where.price.lte = parseFloat(maxPrice);
  }

  const listings = await prisma.listing.findMany({
    where,
    select: {
      id: true, title: true, price: true, platform: true,
      edition: true, condition: true, images: true,
      location: true, status: true, createdAt: true,
      // Only fuzzy coords go to the client — exact coords are never selected
      fuzzyLat: true,
      fuzzyLng: true,
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
    const { title, description, price, platform, edition,
            condition, location, images, latitude, longitude } = body;

    if (!title || !price || !platform || !condition || !location) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const lat = latitude  ? parseFloat(latitude)  : null;
    const lng = longitude ? parseFloat(longitude) : null;

    const listing = await prisma.listing.create({
      data: {
        title, description,
        price:    parseFloat(price),
        platform, edition, condition, location,
        // Private exact coords
        latitude:  lat,
        longitude: lng,
        // Fuzzy coords for buyer map — generated server-side only
        fuzzyLat: lat != null ? fuzzyCoord(lat) : null,
        fuzzyLng: lng != null ? fuzzyCoord(lng) : null,
        images: JSON.stringify(images ?? []),
        sellerId: session.user.id,
      },
    });

    return NextResponse.json(listing);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create listing" }, { status: 500 });
  }
}
