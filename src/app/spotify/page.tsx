import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { callSpotifyAPI } from "@/lib/spotify-user";
import { Suspense } from "react";
import { SpotifyArtist, SpotifyTrack } from "@/types";
import ConnectSpotifyButton from "@/components/spotify/ConnectSpotifyButton";
import TimeRangeSelector from "@/components/spotify/TimeRangeSelector";
import TopArtistsChart from "@/components/spotify/TopArtistsChart";
import GenrePieChart from "@/components/spotify/GenrePieChart";
import TopTracksList from "@/components/spotify/TopTracksList";
import MonthlyRewind from "@/components/spotify/MonthlyRewind";
import { ensureCurrentMonthSnapshot } from "@/lib/monthly-snapshot";
import { getGlobalTopArtistIds } from "@/lib/spotify-global";

interface PageProps {
  searchParams: { range?: string };
}

export default async function SpotifyPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.username) {
    redirect("/login");
  }

  const range = ["short_term", "medium_term", "long_term"].includes(
    searchParams.range ?? ""
  )
    ? searchParams.range!
    : "short_term";

  const user = await prisma.user.findUnique({
    where: { username: session.user.username },
    select: { id: true, spotifyAccount: { select: { spotifyId: true } } },
  });

  if (!user) {
    redirect("/login");
  }

  if (!user.spotifyAccount) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-24">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Your Listening Dashboard
          </h1>
          <p className="text-slate-500">
            Connect your Spotify account to see your top artists and tracks.
          </p>
        </div>
        <ConnectSpotifyButton />
      </div>
    );
  }

  let artists: SpotifyArtist[] = [];
  let tracks: SpotifyTrack[] = [];

  try {
    const [artistsData, tracksData] = await Promise.all([
      callSpotifyAPI(user.id, "me/top/artists", { time_range: range, limit: "20" }) as Promise<{ items: SpotifyArtist[] }>,
      callSpotifyAPI(user.id, "me/top/tracks", { time_range: range, limit: "20" }) as Promise<{ items: SpotifyTrack[] }>,
    ]);
    artists = artistsData.items ?? [];
    tracks = tracksData.items ?? [];
    try { await ensureCurrentMonthSnapshot(user.id); } catch {}
  } catch {
    // Token issue — show reconnect prompt
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-24">
        <p className="text-slate-500">
          Could not load Spotify data. Try reconnecting.
        </p>
        <ConnectSpotifyButton />
      </div>
    );
  }

  const globalArtistIds = await getGlobalTopArtistIds();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Listening Dashboard</h1>
        <Suspense>
          <TimeRangeSelector />
        </Suspense>
      </div>

      {artists.length === 0 && tracks.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
          No listening data found for this time range yet.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {artists.length > 0 && <TopArtistsChart artists={artists} globalArtistIds={Array.from(globalArtistIds)} />}
            {artists.length > 0 && <GenrePieChart artists={artists} />}
          </div>
          <MonthlyRewind />
          {tracks.length > 0 && <TopTracksList tracks={tracks} />}
        </>
      )}
    </div>
  );
}
