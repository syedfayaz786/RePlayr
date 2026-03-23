import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { BlockedUsersList } from "@/components/safety/BlockedUsersList";

export default async function BlockedUsersPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");

  const blocks = await prisma.block.findMany({
    where: { blockerId: session.user.id },
    include: {
      blocked: { select: { id: true, name: true, image: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const blockedUsers = blocks.map(b => ({
    id: b.blocked.id,
    name: b.blocked.name,
    image: b.blocked.image,
    blockedAt: b.createdAt.toISOString(),
  }));

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-base)" }}>
      <Navbar />
      <main style={{ maxWidth: 640, margin: "0 auto", padding: "48px 24px", width: "100%" }}>

        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display font-bold text-white mb-1"
            style={{ fontSize: 24, letterSpacing: "-0.03em" }}>
            Blocked Users
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-muted)", letterSpacing: "-0.01em" }}>
            Users you've blocked won't appear in your listings feed and can't message you.
          </p>
        </div>

        <BlockedUsersList initialUsers={blockedUsers} />
      </main>
    </div>
  );
}
