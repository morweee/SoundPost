import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrGenerateAnalysis } from "@/lib/ai-analysis";
import { getCurrentWeek } from "@/lib/weekly-snapshot";

export const dynamic = "force-dynamic";

function getCurrentMonth(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

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
  const period = searchParams.get("period");

  if (period !== "weekly" && period !== "monthly") {
    return NextResponse.json({ error: "Invalid period" }, { status: 400 });
  }

  const key = period === "weekly" ? getCurrentWeek() : getCurrentMonth();

  try {
    const result = await getOrGenerateAnalysis(user.id, period, key);
    if (!result) {
      return NextResponse.json({ content: null, reason: "unavailable" });
    }
    return NextResponse.json({ content: result.content, cached: result.cached });
  } catch {
    return NextResponse.json({ content: null, reason: "error" });
  }
}
