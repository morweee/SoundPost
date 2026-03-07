import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { SnapshotArtist, SnapshotTrack } from "@/types";
import { getRecentWeeklySnapshots } from "@/lib/weekly-snapshot";
import { getAvailableMonths } from "@/lib/monthly-snapshot";

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

interface SnapshotData {
  label: string;
  artists: SnapshotArtist[];
  tracks: SnapshotTrack[];
}

export async function getOrGenerateAnalysis(
  userId: number,
  period: "weekly" | "monthly",
  key: string
): Promise<{ content: string; cached: boolean } | null> {
  // Check cache
  const cached = await prisma.aiAnalysis.findUnique({
    where: { userId_period_key: { userId, period, key } },
  });
  if (cached) return { content: cached.content, cached: true };

  // No API key = graceful skip
  if (!anthropic) return null;

  // Gather snapshot data
  let snapshots: SnapshotData[];

  if (period === "weekly") {
    const rows = await getRecentWeeklySnapshots(userId, 4);
    snapshots = rows.map((r) => ({
      label: r.week,
      artists: JSON.parse(r.artists) as SnapshotArtist[],
      tracks: JSON.parse(r.tracks) as SnapshotTrack[],
    }));
  } else {
    const months = await getAvailableMonths(userId);
    const recent = months.slice(0, 4);
    const rows = await prisma.monthlySnapshot.findMany({
      where: { userId, month: { in: recent } },
      orderBy: { month: "desc" },
    });
    snapshots = rows.map((r) => ({
      label: r.month,
      artists: JSON.parse(r.artists) as SnapshotArtist[],
      tracks: JSON.parse(r.tracks) as SnapshotTrack[],
    }));
  }

  if (snapshots.length === 0) return null;

  const prompt = buildPrompt(period, snapshots);

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const content =
    message.content[0].type === "text" ? message.content[0].text : "";

  // Cache result
  try {
    await prisma.aiAnalysis.create({
      data: { userId, period, key, content },
    });
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === "P2002"
    ) {
      // Race condition — already cached
    } else {
      throw err;
    }
  }

  return { content, cached: false };
}

function buildPrompt(period: string, snapshots: SnapshotData[]): string {
  const dataSection = snapshots
    .map((s) => {
      const artistList = s.artists
        .slice(0, 10)
        .map(
          (a, i) =>
            `  ${i + 1}. ${a.name} (genres: ${a.genres.join(", ")}; popularity: ${a.popularity})`
        )
        .join("\n");
      const trackList = s.tracks
        .slice(0, 10)
        .map((t, i) => `  ${i + 1}. "${t.name}" by ${t.artistNames}`)
        .join("\n");
      return `### ${s.label}\nTop Artists:\n${artistList}\nTop Tracks:\n${trackList}`;
    })
    .join("\n\n");

  return `You're a chill music-loving friend who genuinely appreciates people's taste — not a critic, not a professor, just someone who gets excited about what others listen to. You notice the cool details without overthinking it.

Here's someone's ${period} Spotify listening data:

${dataSection}

Write a short, punchy take on their taste. Rules:
- Use exactly this format with these 3 sections, each with an emoji header:
  🎧 Vibe Check — one short paragraph (2-3 sentences) on the overall mood/energy of their listening
  🔥 Standouts — one short paragraph (2-3 sentences) highlighting specific artists or tracks that caught your eye and why they're cool picks
  🌀 The Pattern — one short paragraph (2-3 sentences) on any interesting genre mix, contrasts, or evolution you notice
- Talk like a real person, not an AI. No filler like "Your music taste is..." or "It's clear that..."
- Don't use fancy/pretentious music critic words (no "sonic landscape", "auditory journey", "eclectic tapestry")
- But don't be too basic either — show you actually know something about these artists
- Reference specific artist or song names naturally
- Keep the whole thing under 150 words total
- No markdown formatting besides the emoji headers above`;
}
