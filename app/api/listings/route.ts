import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Offset coordinates by a random amount up to ~500 m.
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
  const perPage   = Math.min(parseInt(searchParams.get("perPage") ?? "50") || 50, 200);
  const page      = Math.max(1, parseInt(searchParams.get("page") ?? "1") || 1);
  const skip      = (page - 1) * perPage;
  const maxPrice  = searchParams.get("maxPrice");

  const where: any = { status: "active" };
  if (q) where.OR = [
    { title:       { contains: q, mode: "insensitive" } },
    { description: { contains: q, mode: "insensitive" } },
  ];
  if (platform) {
    // Support comma-separated multi-platform filter e.g. "PS5,Xbox One"
    const platformList = platform.split(",").map((p: string) => p.trim()).filter(Boolean);
    if (platformList.length === 1) {
      where.platform = platformList[0];
    } else if (platformList.length > 1) {
      where.platform = { in: platformList };
    }
  }
  if (condition) where.condition = condition;
  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = parseFloat(minPrice);
    if (maxPrice) where.price.lte = parseFloat(maxPrice);
  }

  try {
    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: {
          seller: { select: { id: true, name: true, image: true } },
          _count:  { select: { wishlistedBy: true } },
        },
        orderBy: { createdAt: "desc" },
        take: perPage,
        skip,
      }),
      prisma.listing.count({ where }),
    ]);

    // Strip exact coords; pass through fuzzyLat/fuzzyLng only if they exist
    const safe = listings.map((l: any) => {
      const { latitude, longitude, ...rest } = l;
      return rest;
    });

    return NextResponse.json({
      listings: safe,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    });
  } catch (err) {
    console.error("GET /api/listings error:", err);
    return NextResponse.json({ error: "Failed to fetch listings" }, { status: 500 });
  }
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

    // Build data object — only include fuzzy coords if columns exist in DB
    const data: any = {
      title,
      description,
      price:     parseFloat(price),
      platform,
      edition,
      condition,
      location,
      latitude:  lat,
      longitude: lng,
      images:    JSON.stringify(images ?? []),
      sellerId:  session.user.id,
    };

    // Attempt to add fuzzy coords — silently skip if columns don't exist yet
    if (lat != null) data.fuzzyLat = fuzzyCoord(lat);
    if (lng != null) data.fuzzyLng = fuzzyCoord(lng);

    let listing;
    try {
      listing = await prisma.listing.create({ data });
    } catch (dbErr: any) {
      // If fuzzyLat/fuzzyLng columns don't exist yet, retry without them
      if (dbErr?.message?.includes("fuzzy") || dbErr?.code === "P2022") {
        delete data.fuzzyLat;
        delete data.fuzzyLng;
        listing = await prisma.listing.create({ data });
      } else {
        throw dbErr;
      }
    }

    return NextResponse.json(listing);
  } catch (err) {
    console.error("POST /api/listings error:", err);
    return NextResponse.json({ error: "Failed to create listing" }, { status: 500 });
  }
}
