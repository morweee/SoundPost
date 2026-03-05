import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Image from "next/image";
import ProfileDescription from "@/components/ProfileDescription";
import SpotifyPublicToggle from "@/components/spotify/SpotifyPublicToggle";
import SpotifySummaryCard from "@/components/spotify/SpotifySummaryCard";
import { callSpotifyAPI } from "@/lib/spotify-user";
import { SpotifyArtist } from "@/types";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.username) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { username: session.user.username },
    select: {
      id: true,
      username: true,
      avatarUrl: true,
      memberSince: true,
      description: true,
      spotifyPublic: true,
      spotifyAccount: { select: { spotifyId: true } },
      _count: { select: { posts: true } },
    },
  });

  if (!user) {
    redirect("/login");
  }

  const memberSince = new Date(user.memberSince).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Fetch top artists for the summary card if public + connected
  let summaryArtists: SpotifyArtist[] = [];
  if (user.spotifyPublic && user.spotifyAccount) {
    try {
      const data = await callSpotifyAPI(user.id, "me/top/artists", {
        time_range: "medium_term",
        limit: "20",
      }) as { items: SpotifyArtist[] };
      summaryArtists = data.items ?? [];
    } catch {
      // silently skip if token issue
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-8">
        <div className="flex items-center gap-6">
          <Image
            src={user.avatarUrl ?? `/api/avatar/${user.username}`}
            alt={user.username}
            width={80}
            height={80}
            className="rounded-full flex-shrink-0"
            unoptimized
          />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{user.username}</h1>
            <p className="text-slate-500 text-sm mt-1">Member since {memberSince}</p>
            <p className="text-slate-500 text-sm">{user._count.posts} posts</p>
          </div>
        </div>

        <div className="mt-6">
          <ProfileDescription initialDescription={user.description} />
        </div>

        <div className="mt-6 pt-6 border-t border-slate-100">
          <p className="text-sm font-medium text-slate-700 mb-3">Spotify</p>
          <SpotifyPublicToggle
            isConnected={!!user.spotifyAccount}
            initialPublic={user.spotifyPublic}
          />
        </div>

        {summaryArtists.length > 0 && (
          <div className="mt-4">
            <SpotifySummaryCard artists={summaryArtists} />
          </div>
        )}
      </div>
    </div>
  );
}
