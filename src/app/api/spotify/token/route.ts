import { NextResponse } from "next/server";

interface TokenCache {
  token: string;
  expiresAt: number;
}

let cache: TokenCache | null = null;

export async function GET() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: "Spotify not configured" }, { status: 503 });
  }

  // Return cached token if still valid (with 30s buffer)
  if (cache && Date.now() < cache.expiresAt - 30_000) {
    return NextResponse.json({ token: cache.token });
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Failed to get Spotify token" }, { status: 502 });
  }

  const data = await res.json();
  cache = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return NextResponse.json({ token: cache.token });
}
