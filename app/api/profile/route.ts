import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      listings: { orderBy: { createdAt: "desc" } },
      reviewsReceived: {
        include: { author: { select: { name: true, image: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return NextResponse.json(user);
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, bio, location } = await req.json();

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { name, bio, location },
  });

  return NextResponse.json(user);
}
