import { NextRequest, NextResponse } from "next/server";

// Spotify redirects here on 127.0.0.1 — but the NextAuth session cookie
// lives on localhost. So we just forward the query params to /api/spotify/complete
// on localhost where the session is available.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const target = new URL("/api/spotify/complete", process.env.NEXTAUTH_URL);

  // Forward all query params (code, state, error)
  searchParams.forEach((value, key) => target.searchParams.set(key, value));

  return NextResponse.redirect(target.toString());
}
