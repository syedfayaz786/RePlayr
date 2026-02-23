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
import Image from "next/image";
import Link from "next/link";

interface ThreadListing {
  id: string;
  title: string;
  price: number;
  platform: string;
  condition: string;
  images: string;
  location?: string | null;
  edition?: string | null;
  description?: string | null;
}

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: { with?: string; listing?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");

  const messages = await prisma.message.findMany({
    where: {
      OR: [{ senderId: session.user.id }, { receiverId: session.user.id }],
    },
    include: {
      sender:   { select: { id: true, name: true, image: true } },
      receiver: { select: { id: true, name: true, image: true } },
      listing:  { select: { id: true, title: true, price: true, images: true, platform: true, condition: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Group by partnerId + listingId so same person × different game = separate threads
  type ConvKey = string; // `${partnerId}::${listingId ?? "none"}`
  const conversations = new Map<
    ConvKey,
    {
      partner: { id: string; name: string | null; image: string | null };
      lastMessage: (typeof messages)[0];
      unread: number;
      listing: { id: string; title: string; price: number; images: string; platform: string; condition: string } | null;
      listingId: string | null;
    }
  >();

  for (const msg of messages) {
    const partnerId = msg.senderId === session.user.id ? msg.receiverId : msg.senderId;
    const partner   = msg.senderId === session.user.id ? msg.receiver   : msg.sender;
    // Use listing.id as the canonical key — more reliable than msg.listingId
    // which might be null on replies. Falls back to msg.listingId, then "none".
    const listingId = msg.listing?.id ?? msg.listingId ?? null;
    const key: ConvKey = `${partnerId}::${listingId ?? "none"}`;

    if (!conversations.has(key)) {
      conversations.set(key, {
        partner,
        lastMessage: msg,
        unread: 0,
        listing: msg.listing ?? null,
        listingId,
      });
    } else {
      // Update last message if this one is more recent (messages are ordered desc so first = latest)
      // already set on first encounter
    }
    if (msg.receiverId === session.user.id && !msg.read) {
      conversations.get(key)!.unread++;
    }
  }

  const convList       = Array.from(conversations.values());
  const activePartnerId = searchParams.with;
  const activeListingId = searchParams.listing ?? null;
  const activeKey       = activePartnerId
    ? `${activePartnerId}::${activeListingId ?? "none"}`
    : null;

  // Load active thread — scoped to partner + listing
  let thread: typeof messages = [];
  if (activePartnerId) {
    thread = await prisma.message.findMany({
      where: {
        AND: [
          {
            OR: [
              { senderId: session.user.id, receiverId: activePartnerId },
              { senderId: activePartnerId, receiverId: session.user.id },
            ],
          },
          activeListingId
            ? { listingId: activeListingId }
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

    await prisma.message.updateMany({
      where: {
        senderId:   activePartnerId,
        receiverId: session.user.id,
        read:       false,
        ...(activeListingId ? { listingId: activeListingId } : { listingId: null }),
      },
      data: { read: true },
    });
  }

  const activeConv    = activeKey ? conversations.get(activeKey) : null;
  const activePartner = activeConv?.partner ?? null;
  const threadListing: ThreadListing | null = (thread.find((m) => m.listing)?.listing ?? null) as ThreadListing | null;

  let listingImages: string[] = [];
  if (threadListing?.images) {
    try { listingImages = JSON.parse(threadListing.images); } catch {}
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <PageHeader crumbs={[{ label: "Messages" }]} />
      <main className="flex-1 max-w-screen-2xl mx-auto px-4 sm:px-8 w-full py-8">
        <h1 className="font-display text-2xl font-bold text-white mb-6">Messages</h1>

        <div className="card flex h-[680px] overflow-hidden">

          {/* ── Col 1: Conversation list ── */}
          <div className="w-72 border-r border-dark-600 flex-shrink-0 overflow-y-auto">
            {convList.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <MessageSquare className="w-10 h-10 text-gray-500 mb-3" />
                <p className="text-sm text-gray-400">No messages yet</p>
                <p className="text-xs text-gray-500 mt-1">Find a listing and message the seller</p>
              </div>
            ) : (
              convList.map(({ partner, lastMessage, unread, listing, listingId }) => {
                const href  = `/messages?with=${partner.id}${listingId ? `&listing=${listingId}` : ""}`;
                const key   = `${partner.id}::${listingId ?? "none"}`;
                const isActive = activeKey === key;
                return (
                  <a
                    key={key}
                    href={href}
                    className={`flex items-center gap-3 p-4 hover:bg-dark-700 transition-colors border-b border-dark-600 ${
                      isActive ? "bg-dark-700 border-l-2 border-l-brand-500" : ""
                    }`}
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
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-500 rounded-full text-xs flex items-center justify-center text-white font-bold">
                          {unread}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={`text-sm font-medium truncate ${unread > 0 ? "text-white" : "text-gray-300"}`}>
                          {partner.name}
                        </span>
                        <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                          {formatRelativeTime(lastMessage.createdAt)}
                        </span>
                      </div>
                      {listing && (
                        <p className="text-xs text-brand-400 truncate mb-0.5 font-medium">🎮 {listing.title}</p>
                      )}
                      <p className="text-xs text-gray-500 truncate">{lastMessage.content}</p>
                    </div>
                    <DeleteChatButton partnerId={partner.id} listingId={listingId} variant="icon" />
                  </a>
                );
              })
            )}
          </div>

          {/* ── Col 2: Message thread ── */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            {activePartnerId && activePartner ? (
              <MessageThread
                thread={thread.map((m) => ({
                  ...m,
                  createdAt: m.createdAt.toISOString(),
                  listing: m.listing ? { ...m.listing, price: m.listing.price } : null,
                }))}
                currentUserId={session.user.id}
                partnerId={activePartnerId}
                listingId={activeListingId}
                partnerName={activePartner.name ?? "User"}
                partnerImage={activePartner.image}
                deleteButton={<DeleteChatButton partnerId={activePartnerId} listingId={activeListingId} variant="full" />}
                pinnedListing={threadListing ? {
                  id:        threadListing.id,
                  title:     threadListing.title,
                  price:     threadListing.price,
                  platform:  threadListing.platform,
                  condition: threadListing.condition,
                  images:    listingImages,
                } : null}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <MessageSquare className="w-16 h-16 text-gray-600 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Your Messages</h3>
                <p className="text-gray-400 text-sm">Select a conversation or start a new one from a listing</p>
              </div>
            )}
          </div>

          {/* ── Col 3: Listing info panel ── */}
          <div className="w-72 border-l border-dark-600 flex-shrink-0 overflow-y-auto bg-dark-800/50">
            {threadListing ? (
              <div className="p-5 flex flex-col gap-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">About this listing</h3>

                <Link href={`/listings/${threadListing.id}`} className="block group">
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-dark-700 border border-dark-600 group-hover:border-brand-500/50 transition-colors">
                    {listingImages[0] ? (
                      listingImages[0].startsWith("data:") ? (
                        <img src={listingImages[0]} alt={threadListing.title} className="w-full h-full object-cover" />
                      ) : (
                        <Image src={listingImages[0]} alt={threadListing.title} fill className="object-cover" quality={90} />
                      )
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Package className="w-10 h-10 text-gray-600" />
                      </div>
                    )}
                  </div>
                </Link>

                <div>
                  <Link href={`/listings/${threadListing.id}`} className="font-semibold text-white hover:text-brand-300 transition-colors leading-snug block">
                    {threadListing.title}
                  </Link>
                  <p className="text-2xl font-bold text-brand-400 mt-1">
                    ${Number(threadListing.price).toFixed(2)}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Tag     className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                    <span className="text-gray-400">Platform</span>
                    <span className="text-white ml-auto font-medium">{threadListing.platform}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Star    className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                    <span className="text-gray-400">Condition</span>
                    <span className="text-white ml-auto font-medium">{threadListing.condition}</span>
                  </div>
                  {threadListing.location && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin  className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                      <span className="text-gray-400">Location</span>
                      <span className="text-white ml-auto font-medium text-right max-w-[120px] truncate">{threadListing.location}</span>
                    </div>
                  )}
                </div>

                {threadListing.description && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Description</p>
                    <p className="text-sm text-gray-300 leading-relaxed line-clamp-4">{threadListing.description}</p>
                  </div>
                )}

                <Link href={`/listings/${threadListing.id}`} className="btn-primary text-center text-sm py-2.5">
                  View Full Listing
                </Link>
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
