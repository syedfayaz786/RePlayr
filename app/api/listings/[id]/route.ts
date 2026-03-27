import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function fuzzyCoord(exact: number): number {
  return exact + (Math.random() - 0.5) * 2 * 0.0045;
}

// GET — returns fuzzy coords to buyers; exact coords only to the seller
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    const listing = await prisma.listing.findUnique({
      where:   { id: params.id },
      include: { seller: { select: { id: true, name: true, image: true } } },
    });
    if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const isSeller = session?.user.id === listing.sellerId;

    // Strip exact coords — buyers never see them
    const { latitude, longitude, ...publicFields } = listing as any;

    return NextResponse.json({
      ...publicFields,
      // Seller gets exact coords back so the edit form can pre-populate them
      ...(isSeller ? { latitude, longitude } : {}),
    });
  } catch (err) {
    console.error("GET /api/listings/[id] error:", err);
    return NextResponse.json({ error: "Failed to fetch listing" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.listing.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.sellerId !== session.user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const { title, description, price, platform, edition,
            condition, location, images, status,
            latitude, longitude } = body;

    const lat = latitude  !== undefined ? (latitude  ? parseFloat(latitude)  : null) : undefined;
    const lng = longitude !== undefined ? (longitude ? parseFloat(longitude) : null) : undefined;

    const data: any = {
      ...(title       !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(price       !== undefined && { price: parseFloat(String(price)) }),
      ...(platform    !== undefined && { platform }),
      ...(edition     !== undefined && { edition }),
      ...(condition   !== undefined && { condition }),
      ...(location    !== undefined && { location }),
      ...(images      !== undefined && { images: JSON.stringify(images) }),
      ...(status      !== undefined && { status }),
      ...(lat !== undefined && { latitude: lat }),
      ...(lng !== undefined && { longitude: lng }),
    };

    // Add fuzzy coords if we have exact ones
    if (lat !== undefined && lat != null) data.fuzzyLat = fuzzyCoord(lat);
    if (lng !== undefined && lng != null) data.fuzzyLng = fuzzyCoord(lng);
    if (lat !== undefined && lat == null) data.fuzzyLat = null;
    if (lng !== undefined && lng == null) data.fuzzyLng = null;

    // When re-activating a sold/pending listing, remove the Sale record
    if (data.status === "active" || data.status === "available" || data.status === "pending") {
      // Map "available" UI value → "active" DB value for backward compat
      if (data.status === "available") data.status = "active";
      if (data.status !== "pending") {
        await prisma.sale.deleteMany({ where: { listingId: params.id } }).catch(() => {});
      }
    }

    let updated;
    try {
      updated = await prisma.listing.update({ where: { id: params.id }, data });
    } catch (dbErr: any) {
      // Retry without fuzzy coords if columns don't exist yet
      if (dbErr?.message?.includes("fuzzy") || dbErr?.code === "P2022") {
        delete data.fuzzyLat;
        delete data.fuzzyLng;
        updated = await prisma.listing.update({ where: { id: params.id }, data });
      } else {
        throw dbErr;
      }
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error("PATCH /api/listings/[id] error:", err);
    return NextResponse.json({ error: "Failed to update listing" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const listing = await prisma.listing.findUnique({ where: { id: params.id } });
  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (listing.sellerId !== session.user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.listing.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
