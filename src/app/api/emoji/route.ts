import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const apiKey = process.env.EMOJI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Emoji API not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";

  const url = search
    ? `https://emoji-api.com/emojis?search=${encodeURIComponent(search)}&access_key=${apiKey}`
    : `https://emoji-api.com/categories/smileys-emotion?access_key=${apiKey}`;

  const res = await fetch(url);
  if (!res.ok) {
    return NextResponse.json({ error: "Failed to fetch emojis" }, { status: 502 });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
