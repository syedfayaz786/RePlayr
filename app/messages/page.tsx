import { Navbar } from "@/components/layout/Navbar";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { formatRelativeTime } from "@/lib/utils";
import { MessageThread } from "@/components/messaging/MessageThread";
import { MessageSquare } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import Image from "next/image";

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: { with?: string; listing?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");

  // Get all conversation partners
  const messages = await prisma.message.findMany({
    where: {
      OR: [{ senderId: session.user.id }, { receiverId: session.user.id }],
    },
    include: {
      sender: { select: { id: true, name: true, image: true } },
      receiver: { select: { id: true, name: true, image: true } },
      listing: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Group by conversation partner
  const conversations = new Map<
    string,
    {
      partner: { id: string; name: string | null; image: string | null };
      lastMessage: (typeof messages)[0];
      unread: number;
    }
  >();

  for (const msg of messages) {
    const partnerId =
      msg.senderId === session.user.id ? msg.receiverId : msg.senderId;
    const partner =
      msg.senderId === session.user.id ? msg.receiver : msg.sender;

    if (!conversations.has(partnerId)) {
      conversations.set(partnerId, {
        partner,
        lastMessage: msg,
        unread: 0,
      });
    }
    if (msg.receiverId === session.user.id && !msg.read) {
      conversations.get(partnerId)!.unread++;
    }
  }

  const convList = Array.from(conversations.values());
  const activePartnerId = searchParams.with;

  // Load active thread
  let thread: typeof messages = [];
  if (activePartnerId) {
    thread = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: session.user.id, receiverId: activePartnerId },
          { senderId: activePartnerId, receiverId: session.user.id },
        ],
      },
      include: {
        sender: { select: { id: true, name: true, image: true } },
        receiver: { select: { id: true, name: true, image: true } },
        listing: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    // Mark as read
    await prisma.message.updateMany({
      where: { senderId: activePartnerId, receiverId: session.user.id, read: false },
      data: { read: true },
    });
  }

  const activePartner = activePartnerId
    ? convList.find((c) => c.partner.id === activePartnerId)?.partner
    : null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <PageHeader crumbs={[{ label: "Messages" }]} />
      <main className="flex-1 max-w-screen-2xl mx-auto px-4 sm:px-8 w-full py-8">
        <h1 className="font-display text-2xl font-bold text-white mb-6">Messages</h1>

        <div className="card flex h-[600px] overflow-hidden">
          {/* Conversation list */}
          <div className="w-72 border-r border-dark-600 flex-shrink-0 overflow-y-auto">
            {convList.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <MessageSquare className="w-10 h-10 text-gray-500 mb-3" />
                <p className="text-sm text-gray-400">No messages yet</p>
                <p className="text-xs text-gray-500 mt-1">
                  Find a listing and message the seller
                </p>
              </div>
            ) : (
              convList.map(({ partner, lastMessage, unread }) => (
                <a
                  key={partner.id}
                  href={`/messages?with=${partner.id}`}
                  className={`flex items-center gap-3 p-4 hover:bg-dark-700 transition-colors border-b border-dark-600 ${
                    activePartnerId === partner.id ? "bg-dark-700" : ""
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    {partner.image ? (
                      <Image
                        src={partner.image}
                        alt={partner.name ?? ""}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
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
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium truncate ${unread > 0 ? "text-white" : "text-gray-300"}`}>
                        {partner.name}
                      </span>
                      <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                        {formatRelativeTime(lastMessage.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{lastMessage.content}</p>
                  </div>
                </a>
              ))
            )}
          </div>

          {/* Message thread */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {activePartnerId && activePartner ? (
              <MessageThread
                thread={thread.map((m) => ({
                  ...m,
                  createdAt: m.createdAt.toISOString(),
                }))}
                currentUserId={session.user.id}
                partnerId={activePartnerId}
                partnerName={activePartner.name ?? "User"}
                partnerImage={activePartner.image}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <MessageSquare className="w-16 h-16 text-gray-600 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Your Messages</h3>
                <p className="text-gray-400 text-sm">
                  Select a conversation or start a new one from a listing
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
