import { Navbar } from "@/components/layout/Navbar";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { formatRelativeTime } from "@/lib/utils";
import { MessageThread } from "@/components/messaging/MessageThread";
import { MessageSquare, Package, MapPin, Tag, Star } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { DeleteChatButton } from "@/components/messaging/DeleteChatButton";
import { MessagesSidebar } from "@/components/messaging/MessagesSidebar";
import { MessagesLayout } from "@/components/messaging/MessagesLayout";
import Image from "next/image";
import Link from "next/link";

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: { with?: string; listing?: string; q?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");

  const activePartnerId = searchParams.with ?? null;
  const activeListingId = searchParams.listing ?? null;
  const searchQuery     = searchParams.q ?? null;

  // ── 1. All messages involving the current user (for sidebar) ──────────────
  const allMessages = await prisma.message.findMany({
    where: { OR: [{ senderId: session.user.id }, { receiverId: session.user.id }] },
    include: {
      sender:   { select: { id: true, name: true, image: true } },
      receiver: { select: { id: true, name: true, image: true } },
      listing:  { select: { id: true, title: true, price: true, images: true, platform: true, condition: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // ── 2. Group sidebar by partnerId + listingId ─────────────────────────────
  type ConvEntry = {
    partner:     { id: string; name: string | null; image: string | null };
    lastMessage: typeof allMessages[0];
    unread:      number;
    listingId:   string | null;
    listing:     { id: string; title: string } | null;
    allContents: string[];
  };
  const convMap = new Map<string, ConvEntry>();

  for (const msg of allMessages) {
    const partnerId = msg.senderId === session.user.id ? msg.receiverId : msg.senderId;
    const partner   = msg.senderId === session.user.id ? msg.receiver   : msg.sender;
    const listingId = msg.listing?.id ?? msg.listingId ?? null;
    const key       = `${partnerId}::${listingId ?? "none"}`;

    if (!convMap.has(key)) {
      convMap.set(key, { partner, lastMessage: msg, unread: 0, listingId, listing: msg.listing ? { id: msg.listing.id, title: msg.listing.title } : null, allContents: [] });
    }
    convMap.get(key)!.allContents.push(msg.content);
    if (msg.receiverId === session.user.id && !msg.read) {
      convMap.get(key)!.unread++;
    }
  }
  const convList = Array.from(convMap.values());
  const activeKey = activePartnerId ? `${activePartnerId}::${activeListingId ?? "none"}` : null;
  const activeConv = activeKey ? convMap.get(activeKey) : null;
  const activePartner = activeConv?.partner ?? null;

  // ── 3. Thread messages (all between the pair, scoped to listing) ──────────
  let thread: typeof allMessages = [];
  if (activePartnerId) {
    thread = await prisma.message.findMany({
      where: {
        AND: [
          { OR: [
            { senderId: session.user.id, receiverId: activePartnerId },
            { senderId: activePartnerId, receiverId: session.user.id },
          ]},
          // Include messages with this listingId OR null listingId (seller replies)
          ...(activeListingId
            ? [{ OR: [{ listingId: activeListingId }, { listingId: null }] }]
            : [{ listingId: null }]),
        ],
      },
      include: {
        sender:   { select: { id: true, name: true, image: true } },
        receiver: { select: { id: true, name: true, image: true } },
        listing:  { select: { id: true, title: true, price: true, images: true, platform: true, condition: true, location: true, edition: true, description: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    // Mark as read — split into two calls since updateMany doesn't support OR
    if (activeListingId) {
      await prisma.message.updateMany({
        where: { senderId: activePartnerId, receiverId: session.user.id, read: false, listingId: activeListingId },
        data: { read: true },
      }).catch(() => {});
      await prisma.message.updateMany({
        where: { senderId: activePartnerId, receiverId: session.user.id, read: false, listingId: null },
        data: { read: true },
      }).catch(() => {});
    } else {
      await prisma.message.updateMany({
        where: { senderId: activePartnerId, receiverId: session.user.id, read: false, listingId: null },
        data: { read: true },
      }).catch(() => {});
    }
  }

  // ── 4. Active listing details (fetch direct from DB) ─────────────────────
  const activeListing = activeListingId
    ? await prisma.listing.findUnique({
        where: { id: activeListingId },
        select: { id: true, title: true, price: true, platform: true, condition: true, location: true, edition: true, description: true, images: true, sellerId: true },
      })
    : null;

  const listingImages: string[] = (() => {
    try { return activeListing ? JSON.parse(activeListing.images) : []; } catch { return []; }
  })();

  const isSeller         = !!(activeListing && activeListing.sellerId === session.user.id);
  const pinnedListing    = activeListing ? {
    id: activeListing.id, title: activeListing.title, price: activeListing.price,
    platform: activeListing.platform, condition: activeListing.condition, images: listingImages,
  } : null;

  // ── 5. Sale + review ──────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let sale: any = null;
  if (activeListing) {
    try {
      sale = await prisma.sale.findUnique({
        where: { listingId: activeListing.id },
        include: {
          buyer:  { select: { id: true, name: true, image: true } },
          seller: { select: { id: true, name: true, image: true } },
        },
      });
    } catch { /* ignore */ }
  }

  const isConfirmedBuyer = !!(sale && sale.buyerId === session.user.id);

  // Fetch my own review for this listing (buyer OR seller) — includes strengths
  let myExistingReview: { rating: number; comment: string | null; strengths: string[] } | null = null;
  const saleConfirmed = !!(sale && (sale.buyerId === session.user.id || sale.sellerId === session.user.id));
  try {
    if (saleConfirmed && activeListing) {
      const r = await prisma.review.findUnique({
        where: { authorId_listingId: { authorId: session.user.id, listingId: activeListing.id } },
        select: { rating: true, comment: true, strengths: true },
      });
      if (r) {
        myExistingReview = {
          rating: r.rating,
          comment: r.comment,
          strengths: (() => { try { return JSON.parse(r.strengths ?? "[]"); } catch { return []; } })(),
        };
      }
    }
  } catch { /* Review table may not exist yet */ }

  // ── 6. Render ─────────────────────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Navbar />
      <PageHeader crumbs={[{ label: "Messages" }]} />
      <main className="flex-1 min-h-0 max-w-screen-2xl mx-auto w-full px-2 sm:px-4 lg:px-8 pt-3 sm:pt-4 flex flex-col">
        <h1 className="font-display text-xl sm:text-2xl font-bold text-white mb-3 md:mb-5">Messages</h1>

        <MessagesLayout
          hasActiveConv={!!(activePartnerId && activePartner)}
          hasActiveListing={!!activeListing}
          sidebar={
            <MessagesSidebar
              conversations={convList.map(({ partner, lastMessage, unread, listingId, listing, allContents }) => ({
                partnerId:          partner.id,
                partnerName:        partner.name,
                partnerImage:       partner.image,
                lastMessageContent: lastMessage.content,
                lastMessageAt:      lastMessage.createdAt.toISOString(),
                unread,
                listingId,
                listingTitle:       listing?.title ?? null,
                allContents,
              }))}
              activeKey={activeKey}
            />
          }
          thread={
            activePartnerId && activePartner ? (
              <MessageThread
                thread={thread.map((m) => ({ ...m, createdAt: m.createdAt.toISOString(), listing: m.listing ? { ...m.listing, price: m.listing.price } : null }))}
                currentUserId={session.user.id}
                partnerId={activePartnerId}
                listingId={activeListingId}
                partnerName={activePartner.name ?? "User"}
                partnerImage={activePartner.image}
                deleteButton={<DeleteChatButton partnerId={activePartnerId} listingId={activeListingId} variant="full" />}
                pinnedListing={pinnedListing}
                saleConfirmed={saleConfirmed}
                isSeller={isSeller}
                sellerId={sale?.sellerId ?? activeListing?.sellerId}
                sellerName={sale ? (isSeller ? session.user.name ?? "You" : activePartner.name ?? "Seller") : undefined}
                sellerImage={sale ? (isSeller ? undefined : activePartner.image) : undefined}
                listingTitle={activeListing?.title}
                myExistingReview={myExistingReview}
                searchQuery={searchQuery}
                soldToListingId={activeListing?.id}
                soldToBuyerId={activePartnerId}
                soldToBuyerName={activePartner.name ?? "this buyer"}
                alreadySold={!!(sale?.buyerId === activePartnerId)}
                sellerDisplayName={session.user.name ?? "You"}
                buyerDisplayName={activePartner.name ?? "the buyer"}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <MessageSquare className="w-16 h-16 text-gray-600 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Your Messages</h3>
                <p className="text-gray-400 text-sm">Select a conversation to get started</p>
              </div>
            )
          }
          info={
            activeListing ? (
              <div className="p-5 flex flex-col gap-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">About this listing</h3>
                <Link href={`/listings/${activeListing.id}`} className="block group">
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-dark-700 border border-dark-600 group-hover:border-brand-500/50 transition-colors">
                    {listingImages[0] ? (
                      listingImages[0].startsWith("data:") ? (
                        <img src={listingImages[0]} alt={activeListing.title} className="w-full h-full object-contain" />
                      ) : (
                        <Image src={listingImages[0]} alt={activeListing.title} fill className="object-contain" quality={90} />
                      )
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center"><Package className="w-10 h-10 text-gray-600" /></div>
                    )}
                  </div>
                </Link>
                <div>
                  <Link href={`/listings/${activeListing.id}`} className="font-semibold text-white hover:text-brand-300 transition-colors leading-snug block">
                    {activeListing.title}
                  </Link>
                  <p className="text-2xl font-bold text-brand-400 mt-1">${Number(activeListing.price).toFixed(2)}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Tag className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                    <span className="text-gray-400">Platform</span>
                    <span className="text-white ml-auto font-medium">{activeListing.platform}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Star className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                    <span className="text-gray-400">Condition</span>
                    <span className="text-white ml-auto font-medium">{activeListing.condition}</span>
                  </div>
                  {activeListing.location && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                      <span className="text-gray-400">Location</span>
                      <span className="text-white ml-auto font-medium text-right max-w-[120px] truncate">{activeListing.location}</span>
                    </div>
                  )}
                </div>
                <Link href={`/listings/${activeListing.id}`} className="btn-primary text-center text-sm py-2.5">
                  View Full Listing
                </Link>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <Package className="w-10 h-10 text-gray-600 mb-3" />
                <p className="text-sm text-gray-500">Listing details appear here</p>
              </div>
            )
          }
        />
      </main>
    </div>
  );
}
