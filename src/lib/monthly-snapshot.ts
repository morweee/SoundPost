import { prisma } from "@/lib/prisma";
import { callSpotifyAPI } from "@/lib/spotify-user";
import { SpotifyArtist, SpotifyTrack, SnapshotArtist, SnapshotTrack } from "@/types";

function getCurrentMonth(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export async function ensureCurrentMonthSnapshot(userId: number): Promise<void> {
  const month = getCurrentMonth();

  const existing = await prisma.monthlySnapshot.findUnique({
    where: { userId_month: { userId, month } },
    select: { id: true },
  });

  if (existing) return;

  const [artistsData, tracksData] = await Promise.all([
    callSpotifyAPI(userId, "me/top/artists", { time_range: "short_term", limit: "20" }) as Promise<{ items: SpotifyArtist[] }>,
    callSpotifyAPI(userId, "me/top/tracks", { time_range: "short_term", limit: "20" }) as Promise<{ items: SpotifyTrack[] }>,
  ]);

  const artists: SnapshotArtist[] = (artistsData.items ?? []).map((a) => ({
    id: a.id,
    name: a.name,
    popularity: a.popularity,
    genres: a.genres,
    imageUrl: a.images[0]?.url ?? null,
  }));

  const tracks: SnapshotTrack[] = (tracksData.items ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    artistNames: t.artists.map((a) => a.name).join(", "),
    albumName: t.album.name,
    albumImageUrl: t.album.images[0]?.url ?? null,
    duration_ms: t.duration_ms,
  }));

  try {
    await prisma.monthlySnapshot.create({
      data: {
        userId,
        month,
        artists: JSON.stringify(artists),
        tracks: JSON.stringify(tracks),
      },
    });
  } catch (err: unknown) {
    // P2002 = unique constraint violation (race condition)
    if (
      typeof err === "object" && err !== null &&
      "code" in err && (err as { code: string }).code === "P2002"
    ) {
      return;
    }
    throw err;
  }
}

export async function getAvailableMonths(userId: number): Promise<string[]> {
  const snapshots = await prisma.monthlySnapshot.findMany({
    where: { userId },
    select: { month: true },
    orderBy: { month: "desc" },
    take: 12,
  });
  return snapshots.map((s) => s.month);
}
