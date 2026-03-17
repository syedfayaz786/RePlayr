import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function fuzzyCoord(exact: number): number {
  const delta = (Math.random() - 0.5) * 0.009; // ~500m
  return parseFloat((exact + delta).toFixed(6));
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q         = searchParams.get("q");
  const platform  = searchParams.get("platform");
  const condition = searchParams.get("condition");
  const minPrice  = searchParams.get("minPrice");
  const maxPrice  = searchParams.get("maxPrice");
  const perPage   = Math.min(parseInt(searchParams.get("perPage") ?? "50") || 50, 2000);
  const page      = Math.max(1, parseInt(searchParams.get("page") ?? "1") || 1);
  const skip      = (page - 1) * perPage;
  const userLat   = parseFloat(searchParams.get("userLat") ?? "");
  const userLng   = parseFloat(searchParams.get("userLng") ?? "");
  const radiusRaw = searchParams.get("radius");
  const radius    = radiusRaw !== null ? parseFloat(radiusRaw) : null;
  const sort      = searchParams.get("sort") ?? "newest";
  const hasUserCoords = !isNaN(userLat) && !isNaN(userLng);

  // Use AND so every filter is required simultaneously —
  // prevents OR(text search) from swallowing platform/condition filters
  const AND: any[] = [{ status: "active" }];

  if (q) AND.push({
    OR: [
      { title:       { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ],
  });

  if (platform) {
    const platformList = platform.split(",").map((p: string) => p.trim()).filter(Boolean);
    if (platformList.length === 1)    AND.push({ platform: platformList[0] });
    else if (platformList.length > 1) AND.push({ platform: { in: platformList } });
  }

  if (condition) AND.push({ condition });

  if (minPrice || maxPrice) {
    const priceFilter: any = {};
    if (minPrice) priceFilter.gte = parseFloat(minPrice);
    if (maxPrice) priceFilter.lte = parseFloat(maxPrice);
    AND.push({ price: priceFilter });
  }

  const where: any = { AND };

  try {
    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: {
          seller: { select: { id: true, name: true, image: true } },
          _count:  { select: { wishlistedBy: true } },
        },
        orderBy: sort === "oldest" ? { createdAt: "asc" } : { createdAt: "desc" },
        take: perPage,
        skip,
      }),
      prisma.listing.count({ where }),
    ]);

    // Strip exact coords; expose fuzzy only (distance computed client-side)
    const safe = listings.map((l: any) => {
      const { latitude, longitude, ...rest } = l;
      return rest;
    });

    // Price sorts handled client-side too
    if (sort === "price_asc") safe.sort((a: any, b: any) => a.price - b.price);
    else if (sort === "price_desc") safe.sort((a: any, b: any) => b.price - a.price);

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

    if (!title || !price || !platform || !condition) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const data: any = {
      title,
      description: description ?? "",
      price:       parseFloat(price),
      platform,
      edition:     edition ?? null,
      condition,
      location:    location ?? null,
      images:      JSON.stringify(images ?? []),
      sellerId:    session.user.id,
    };

    if (latitude && longitude) {
      try {
        data.latitude  = parseFloat(latitude);
        data.longitude = parseFloat(longitude);
        data.fuzzyLat  = fuzzyCoord(data.latitude);
        data.fuzzyLng  = fuzzyCoord(data.longitude);
      } catch {}
    }

    const listing = await prisma.listing.create({ data });
    return NextResponse.json(listing, { status: 201 });
  } catch (err) {
    console.error("POST /api/listings error:", err);
    return NextResponse.json({ error: "Failed to create listing" }, { status: 500 });
  }
}
