let cachedIds: Set<string> | null = null;
let cacheExpiresAt = 0;

async function getClientCredentialsToken(): Promise<string | null> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  if (!res.ok) return null;
  const data = await res.json();
  return data.access_token as string;
}

export async function getGlobalTopArtistIds(): Promise<Set<string>> {
  if (cachedIds && Date.now() < cacheExpiresAt) {
    return cachedIds;
  }

  try {
    const token = await getClientCredentialsToken();
    if (!token) return new Set();

    const res = await fetch(
      "https://api.spotify.com/v1/playlists/37i9dQZEVXbMDoHDwVN2tF/tracks?fields=items(track(artists(id)))&limit=50",
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }
    );

    if (!res.ok) return new Set();

    const data = await res.json();
    const ids = new Set<string>();
    for (const item of data.items ?? []) {
      for (const artist of item.track?.artists ?? []) {
        if (artist.id) ids.add(artist.id);
      }
    }

    cachedIds = ids;
    cacheExpiresAt = Date.now() + 60 * 60 * 1000; // 1 hour
    return ids;
  } catch {
    return new Set();
  }
}
