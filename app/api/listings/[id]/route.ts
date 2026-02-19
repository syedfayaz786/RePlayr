import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function fuzzyCoord(exact: number): number {
  return exact + (Math.random() - 0.5) * 2 * 0.0045;
}

// GET — returns fuzzy coords to buyers, exact coords only to the seller
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    include: { seller: { select: { id: true, name: true, image: true } } },
  });
  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isSeller = session?.user.id === listing.sellerId;

  // Strip private exact coords from the response — buyers never see them
  const { latitude, longitude, ...publicFields } = listing;

  return NextResponse.json({
    ...publicFields,
    // Seller gets exact coords back (needed by edit form to pre-populate)
    ...(isSeller ? { latitude, longitude } : {}),
    // fuzzyLat / fuzzyLng are already in publicFields and always safe to expose
  });
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

    const updated = await prisma.listing.update({
      where: { id: params.id },
      data: {
        ...(title       !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(price       !== undefined && { price: parseFloat(String(price)) }),
        ...(platform    !== undefined && { platform }),
        ...(edition     !== undefined && { edition }),
        ...(condition   !== undefined && { condition }),
        ...(location    !== undefined && { location }),
        ...(images      !== undefined && { images: JSON.stringify(images) }),
        ...(status      !== undefined && { status }),
        ...(lat !== undefined && {
          latitude: lat,
          fuzzyLat: lat != null ? fuzzyCoord(lat) : null,
        }),
        ...(lng !== undefined && {
          longitude: lng,
          fuzzyLng:  lng != null ? fuzzyCoord(lng) : null,
        }),
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
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
