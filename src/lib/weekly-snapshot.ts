import { prisma } from "@/lib/prisma";
import { callSpotifyAPI } from "@/lib/spotify-user";
import { SpotifyArtist, SpotifyTrack, SnapshotArtist, SnapshotTrack } from "@/types";

/** Returns ISO week string like "2026-W10" */
export function getCurrentWeek(): string {
  const now = new Date();
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

export async function ensureCurrentWeekSnapshot(userId: number): Promise<void> {
  const week = getCurrentWeek();

  const existing = await prisma.weeklySnapshot.findUnique({
    where: { userId_week: { userId, week } },
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
    await prisma.weeklySnapshot.create({
      data: {
        userId,
        week,
        artists: JSON.stringify(artists),
        tracks: JSON.stringify(tracks),
      },
    });
  } catch (err: unknown) {
    if (
      typeof err === "object" && err !== null &&
      "code" in err && (err as { code: string }).code === "P2002"
    ) {
      return;
    }
    throw err;
  }
}

export async function getRecentWeeklySnapshots(userId: number, count = 4) {
  return prisma.weeklySnapshot.findMany({
    where: { userId },
    orderBy: { week: "desc" },
    take: count,
  });
}
