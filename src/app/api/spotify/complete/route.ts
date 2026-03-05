import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.username) {
    return NextResponse.redirect(new URL("/login", process.env.NEXTAUTH_URL));
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL("/spotify?error=denied", process.env.NEXTAUTH_URL));
  }

  const savedState = req.cookies.get("spotify_oauth_state")?.value;
  if (!state || state !== savedState) {
    return NextResponse.redirect(new URL("/spotify?error=state_mismatch", process.env.NEXTAUTH_URL));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/spotify?error=no_code", process.env.NEXTAUTH_URL));
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  // redirect_uri must match what was sent to Spotify in /api/spotify/connect
  const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.SPOTIFY_REDIRECT_URI!,
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(new URL("/spotify?error=token_exchange", process.env.NEXTAUTH_URL));
  }

  const tokenData = await tokenRes.json();

  // Fetch Spotify user profile to get spotifyId
  const profileRes = await fetch("https://api.spotify.com/v1/me", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });

  if (!profileRes.ok) {
    return NextResponse.redirect(new URL("/spotify?error=profile_fetch", process.env.NEXTAUTH_URL));
  }

  const profile = await profileRes.json();

  const user = await prisma.user.findUnique({
    where: { username: session.user.username },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.redirect(new URL("/login", process.env.NEXTAUTH_URL));
  }

  const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

  await prisma.spotifyAccount.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      spotifyId: profile.id,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt,
    },
    update: {
      spotifyId: profile.id,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt,
    },
  });

  const response = NextResponse.redirect(new URL("/spotify", process.env.NEXTAUTH_URL));
  response.cookies.delete("spotify_oauth_state");
  return response;
}
