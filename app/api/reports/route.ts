import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { type, targetId, reason, message } = await req.json();

  if (!type || !targetId || !reason) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (!["user", "listing"].includes(type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  // Prevent self-report
  if (type === "user" && targetId === session.user.id) {
    return NextResponse.json({ error: "Cannot report yourself" }, { status: 400 });
  }

  // Deduplicate — one report per user per target
  const existing = await prisma.report.findFirst({
    where: { reportedBy: session.user.id, targetId, type },
  });
  if (existing) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  await prisma.report.create({
    data: { type, targetId, reportedBy: session.user.id, reason, message: message || null },
  });

  return NextResponse.json({ ok: true });
}
