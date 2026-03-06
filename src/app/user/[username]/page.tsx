import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import PostList from "@/components/PostList";
import SpotifySummaryCard from "@/components/spotify/SpotifySummaryCard";
import { callSpotifyAPI } from "@/lib/spotify-user";
import { PostWithLiked, SpotifyArtist } from "@/types";

interface PageProps {
  params: { username: string };
}

export default async function UserProfilePage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  const { username } = params;

  const user = await prisma.user.findUnique({
    where: { username },
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
    notFound();
  }

  // If viewing your own profile, redirect to /profile
  const isOwnProfile = session?.user?.username === user.username;

  const memberSince = new Date(user.memberSince).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Fetch this user's posts
  const posts = await prisma.post.findMany({
    where: { username: user.username },
    orderBy: { timestamp: "desc" },
  });

  // Determine which posts the viewer has liked
  let likedPostIds = new Set<number>();
  if (session?.user?.googleId) {
    const viewer = await prisma.user.findUnique({
      where: { googleId: session.user.googleId },
      select: { id: true },
    });
    if (viewer) {
      const likes = await prisma.postLike.findMany({
        where: { userId: viewer.id },
        select: { postId: true },
      });
      likedPostIds = new Set(likes.map((l) => l.postId));
    }
  }

  const postsWithLiked: PostWithLiked[] = posts.map((p) => ({
    ...p,
    liked: likedPostIds.has(p.id),
  }));

  // Fetch Spotify summary if the user has it set to public
  let summaryArtists: SpotifyArtist[] = [];
  if (user.spotifyPublic && user.spotifyAccount) {
    try {
      const data = (await callSpotifyAPI(user.id, "me/top/artists", {
        time_range: "medium_term",
        limit: "20",
      })) as { items: SpotifyArtist[] };
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
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{user.username}</h1>
              {isOwnProfile && (
                <a
                  href="/profile"
                  className="text-xs text-sky-500 hover:text-sky-600 font-medium transition-colors"
                >
                  Edit Profile
                </a>
              )}
            </div>
            <p className="text-slate-500 text-sm mt-1">Member since {memberSince}</p>
            <p className="text-slate-500 text-sm">
              {user._count.posts} {user._count.posts === 1 ? "post" : "posts"}
            </p>
          </div>
        </div>

        {user.description && (
          <div className="mt-5 pt-5 border-t border-slate-100">
            <p className="text-slate-600 text-sm whitespace-pre-wrap">{user.description}</p>
          </div>
        )}

        {summaryArtists.length > 0 && (
          <div className="mt-5 pt-5 border-t border-slate-100">
            <SpotifySummaryCard artists={summaryArtists} />
          </div>
        )}
      </div>

      {postsWithLiked.length > 0 && (
        <>
          <h2 className="text-slate-900 font-semibold text-lg">
            Posts by {user.username}
          </h2>
          <PostList posts={postsWithLiked} currentUsername={session?.user?.username} />
        </>
      )}
    </div>
  );
}
