import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — buyer checks their own request status for a specific listing
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ request: null });

  const { searchParams } = new URL(req.url);
  const listingId = searchParams.get("listingId");
  if (!listingId) return NextResponse.json({ error: "Missing listingId" }, { status: 400 });

  const request = await prisma.locationRequest.findUnique({
    where: { listingId_requesterId: { listingId, requesterId: session.user.id } },
  });

  return NextResponse.json({ request: request ?? null });
}

// POST — buyer submits a new address request
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { listingId } = await req.json();
  if (!listingId) return NextResponse.json({ error: "Missing listingId" }, { status: 400 });

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: { seller: { select: { id: true, name: true } } },
  });
  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  if (listing.sellerId === session.user.id)
    return NextResponse.json({ error: "Cannot request your own listing location" }, { status: 400 });

  // Upsert — idempotent; re-requesting returns existing
  const existing = await prisma.locationRequest.findUnique({
    where: { listingId_requesterId: { listingId, requesterId: session.user.id } },
  });
  if (existing) return NextResponse.json(existing);

  const request = await prisma.locationRequest.create({
    data: { listingId, requesterId: session.user.id, status: "pending" },
  });

  // Notify the seller via message
  const buyer = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true },
  });
  await prisma.message.create({
    data: {
      content: `📍 Address Request\n\n${buyer?.name ?? "A buyer"} is interested in "${listing.title}" and would like your pickup location. Open the listing to approve or deny the request.`,
      senderId:   session.user.id,
      receiverId: listing.sellerId,
      listingId,
    },
  });

  return NextResponse.json(request);
}

// PATCH — seller approves or denies a request
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { requestId, status } = await req.json();
  if (!requestId || !["approved", "denied"].includes(status))
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

  const request = await prisma.locationRequest.findUnique({
    where: { id: requestId },
    include: { listing: true, requester: { select: { id: true, name: true } } },
  });
  if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (request.listing.sellerId !== session.user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const updated = await prisma.locationRequest.update({
    where: { id: requestId },
    data:  { status },
  });

  const seller = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true },
  });

  if (status === "approved") {
    // Send the pickup area label (city / postal code) — not a street address
    const area = request.listing.location ?? "their area";
    await prisma.message.create({
      data: {
        content: `✅ Address Request Approved\n\n${seller?.name ?? "The seller"} approved your request for "${request.listing.title}".\n\n📍 Pickup area: ${area}\n\nTo arrange the exact meetup spot, continue chatting with the seller. Always meet in a public place and stay safe!`,
        senderId:   session.user.id,
        receiverId: request.requester.id,
        listingId:  request.listingId,
      },
    });
  } else {
    await prisma.message.create({
      data: {
        content: `Your address request for "${request.listing.title}" wasn't approved at this time. Feel free to message the seller to ask about a meetup location.`,
        senderId:   session.user.id,
        receiverId: request.requester.id,
        listingId:  request.listingId,
      },
    });
  }

  return NextResponse.json(updated);
}
