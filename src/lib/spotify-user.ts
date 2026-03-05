import { prisma } from "@/lib/prisma";

export async function getValidToken(userId: number): Promise<string> {
  const account = await prisma.spotifyAccount.findUnique({
    where: { userId },
  });

  if (!account) {
    throw new Error("No Spotify account linked");
  }

  // Return existing token if still valid (30s buffer)
  if (account.expiresAt > new Date(Date.now() + 30_000)) {
    return account.accessToken;
  }

  // Refresh the token
  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: account.refreshToken,
    }),
  });

  if (!res.ok) {
    throw new Error("Failed to refresh Spotify token");
  }

  const data = await res.json();
  const newExpiry = new Date(Date.now() + data.expires_in * 1000);

  await prisma.spotifyAccount.update({
    where: { userId },
    data: {
      accessToken: data.access_token,
      expiresAt: newExpiry,
      ...(data.refresh_token ? { refreshToken: data.refresh_token } : {}),
    },
  });

  return data.access_token;
}

export async function callSpotifyAPI(
  userId: number,
  path: string,
  params?: Record<string, string>
): Promise<unknown> {
  const token = await getValidToken(userId);
  const url = new URL(`https://api.spotify.com/v1/${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Spotify API error: ${res.status}`);
  }

  return res.json();
}
