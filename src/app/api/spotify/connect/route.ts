import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { randomBytes } from "crypto";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.username) {
    return NextResponse.redirect(new URL("/login", process.env.NEXTAUTH_URL));
  }

  const state = randomBytes(16).toString("hex");

  const redirectUri = process.env.SPOTIFY_REDIRECT_URI!;

  console.log("[spotify/connect] redirect_uri:", redirectUri);
  console.log("[spotify/connect] client_id:", process.env.SPOTIFY_CLIENT_ID);

  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.SPOTIFY_CLIENT_ID!,
    scope: "user-top-read",
    redirect_uri: redirectUri,
    state,
  });

  const spotifyAuthUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;
  console.log("[spotify/connect] full auth URL:", spotifyAuthUrl);

  const response = NextResponse.redirect(spotifyAuthUrl);

  response.cookies.set("spotify_oauth_state", state, {
    httpOnly: true,
    maxAge: 600,
    path: "/",
  });

  return response;
}
