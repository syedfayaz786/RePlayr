import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";

  const users = await prisma.user.findMany({
    where: {
      id: { not: session.user.id }, // exclude self
      ...(q.length > 0 ? {
        OR: [
          { name:  { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      } : {}),
    },
    select: {
      id:        true,
      name:      true,
      image:     true,
      location:  true,
      createdAt: true,
      _count: { select: { listings: true, salesAsBuyer: true } },
    },
    orderBy: { name: "asc" },
    take: 20,
  });

  return NextResponse.json(users);
}
