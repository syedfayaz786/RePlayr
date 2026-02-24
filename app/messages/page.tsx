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
import { SoldToBuyerButton } from "@/components/messaging/SoldToBuyerButton";
import { RateSellerWidget } from "@/components/ui/RateSellerWidget";
import Image from "next/image";
import Link from "next/link";

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: { with?: string; listing?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");

  const activePartnerId = searchParams.with ?? null;
  const activeListingId = searchParams.listing ?? null;

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
  };
  const convMap = new Map<string, ConvEntry>();

  for (const msg of allMessages) {
    const partnerId = msg.senderId === session.user.id ? msg.receiverId : msg.senderId;
    const partner   = msg.senderId === session.user.id ? msg.receiver   : msg.sender;
    const listingId = msg.listing?.id ?? msg.listingId ?? null;
    const key       = `${partnerId}::${listingId ?? "none"}`;

    if (!convMap.has(key)) {
      convMap.set(key, { partner, lastMessage: msg, unread: 0, listingId, listing: msg.listing ? { id: msg.listing.id, title: msg.listing.title } : null });
    }
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
          activeListingId
            ? { OR: [{ listingId: activeListingId }, { listingId: null }] }
            : { listingId: null },
        ],
      },
      include: {
        sender:   { select: { id: true, name: true, image: true } },
        receiver: { select: { id: true, name: true, image: true } },
        listing:  { select: { id: true, title: true, price: true, images: true, platform: true, condition: true, location: true, edition: true, description: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    // Mark as read
    await prisma.message.updateMany({
      where: {
        senderId: activePartnerId, receiverId: session.user.id, read: false,
        ...(activeListingId ? { OR: [{ listingId: activeListingId }, { listingId: null }] } : { listingId: null }),
      },
      data: { read: true },
    });
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
  const sale = activeListing
    ? await prisma.sale.findUnique({
        where: { listingId: activeListing.id },
        include: {
          buyer:  { select: { id: true, name: true, image: true } },
          seller: { select: { id: true, name: true, image: true } },
        },
      })
    : null;

  const isConfirmedBuyer = !!(sale && sale.buyerId === session.user.id);

  const existingReview = isConfirmedBuyer && activeListing
    ? await prisma.review.findUnique({
        where: { authorId_listingId: { authorId: session.user.id, listingId: activeListing.id } },
        select: { rating: true, comment: true },
      })
    : null;

  // ── 6. Render ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <PageHeader crumbs={[{ label: "Messages" }]} />
      <main className="flex-1 max-w-screen-2xl mx-auto px-4 sm:px-8 w-full py-8">
        <h1 className="font-display text-2xl font-bold text-white mb-6">Messages</h1>

        <div className="card flex h-[680px] overflow-hidden">

          {/* ── Col 1: Sidebar ── */}
          <div className="w-72 border-r border-dark-600 flex-shrink-0 overflow-y-auto">
            {convList.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <MessageSquare className="w-10 h-10 text-gray-500 mb-3" />
                <p className="text-sm text-gray-400">No messages yet</p>
                <p className="text-xs text-gray-500 mt-1">Find a listing and message the seller</p>
              </div>
            ) : (
              convList.map(({ partner, lastMessage, unread, listingId, listing }) => {
                const href    = `/messages?with=${partner.id}${listingId ? `&listing=${listingId}` : ""}`;
                const key     = `${partner.id}::${listingId ?? "none"}`;
                const isActive = activeKey === key;
                return (
                  <a key={key} href={href}
                    className={`flex items-center gap-3 p-4 hover:bg-dark-700 transition-colors border-b border-dark-600 ${isActive ? "bg-dark-700 border-l-2 border-l-brand-500" : ""}`}
                  >
                    <div className="relative flex-shrink-0">
                      {partner.image ? (
                        <Image src={partner.image} alt={partner.name ?? ""} width={40} height={40} className="rounded-full" />
                      ) : (
                        <div className="w-10 h-10 bg-brand-500/20 rounded-full flex items-center justify-center text-brand-400 font-bold">
                          {partner.name?.[0]?.toUpperCase() ?? "?"}
                        </div>
                      )}
                      {unread > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-500 rounded-full text-xs flex items-center justify-center text-white font-bold">{unread}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={`text-sm font-medium truncate ${unread > 0 ? "text-white" : "text-gray-300"}`}>{partner.name}</span>
                        <span className="text-xs text-gray-500 flex-shrink-0 ml-2">{formatRelativeTime(lastMessage.createdAt)}</span>
                      </div>
                      {listing && <p className="text-xs text-brand-400 truncate mb-0.5 font-medium">🎮 {listing.title}</p>}
                      <p className="text-xs text-gray-500 truncate">{lastMessage.content}</p>
                    </div>
                    <DeleteChatButton partnerId={partner.id} listingId={listingId} variant="icon" />
                  </a>
                );
              })
            )}
          </div>

          {/* ── Col 2: Thread ── */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            {activePartnerId && activePartner ? (
              <MessageThread
                thread={thread.map((m) => ({ ...m, createdAt: m.createdAt.toISOString(), listing: m.listing ? { ...m.listing, price: m.listing.price } : null }))}
                currentUserId={session.user.id}
                partnerId={activePartnerId}
                listingId={activeListingId}
                partnerName={activePartner.name ?? "User"}
                partnerImage={activePartner.image}
                deleteButton={<DeleteChatButton partnerId={activePartnerId} listingId={activeListingId} variant="full" />}
                pinnedListing={pinnedListing}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <MessageSquare className="w-16 h-16 text-gray-600 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Your Messages</h3>
                <p className="text-gray-400 text-sm">Select a conversation or start a new one from a listing</p>
              </div>
            )}
          </div>

          {/* ── Col 3: Listing info ── */}
          <div className="w-72 border-l border-dark-600 flex-shrink-0 overflow-y-auto bg-dark-800/50">
            {activeListing ? (
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
                    <Tag  className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
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

                {activeListing.description && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Description</p>
                    <p className="text-sm text-gray-300 leading-relaxed line-clamp-4">{activeListing.description}</p>
                  </div>
                )}

                <Link href={`/listings/${activeListing.id}`} className="btn-primary text-center text-sm py-2.5">
                  View Full Listing
                </Link>

                {/* Seller: mark sold to this buyer */}
                {isSeller && activePartnerId && (
                  <SoldToBuyerButton
                    listingId={activeListing.id}
                    buyerId={activePartnerId}
                    buyerName={activePartner?.name ?? "this buyer"}
                    alreadySold={sale?.buyerId === activePartnerId}
                  />
                )}

                {/* Buyer: rate the seller */}
                {isConfirmedBuyer && sale && (
                  <RateSellerWidget
                    sellerId={sale.sellerId}
                    sellerName={sale.seller?.name ?? "Seller"}
                    sellerImage={sale.seller?.image}
                    listingId={activeListing.id}
                    listingTitle={activeListing.title}
                    existingReview={existingReview ?? null}
                  />
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <Package className="w-10 h-10 text-gray-600 mb-3" />
                <p className="text-sm text-gray-500">Listing details will appear here when you select a conversation</p>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
