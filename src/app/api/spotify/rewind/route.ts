import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAvailableMonths } from "@/lib/monthly-snapshot";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.username) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { username: session.user.username },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");

  if (!month) {
    const months = await getAvailableMonths(user.id);
    return NextResponse.json({ months });
  }

  // Validate YYYY-MM format
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: "Invalid month format" }, { status: 400 });
  }

  const snapshot = await prisma.monthlySnapshot.findUnique({
    where: { userId_month: { userId: user.id, month } },
  });

  if (!snapshot) {
    return NextResponse.json({ error: "Snapshot not found" }, { status: 404 });
  }

  return NextResponse.json({
    month: snapshot.month,
    artists: JSON.parse(snapshot.artists),
    tracks: JSON.parse(snapshot.tracks),
  });
}
