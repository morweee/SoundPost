import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PostWithLiked } from "@/types";
import PostList from "@/components/PostList";
import SortDropdown from "@/components/SortDropdown";
import CreatePostForm from "@/components/CreatePostForm";
import { Suspense } from "react";

interface HomeProps {
  searchParams: { sort?: string };
}

export default async function HomePage({ searchParams }: HomeProps) {
  const session = await getServerSession(authOptions);
  const sortBy = searchParams.sort === "likes" ? "likes" : "timestamp";

  const posts = await prisma.post.findMany({
    orderBy: { [sortBy]: "desc" },
  });

  let likedPostIds = new Set<number>();
  if (session?.user?.googleId) {
    const user = await prisma.user.findUnique({
      where: { googleId: session.user.googleId },
      select: { id: true },
    });
    if (user) {
      const likes = await prisma.postLike.findMany({
        where: { userId: user.id },
        select: { postId: true },
      });
      likedPostIds = new Set(likes.map((l) => l.postId));
    }
  }

  const postsWithLiked: PostWithLiked[] = posts.map((p) => ({
    ...p,
    liked: likedPostIds.has(p.id),
  }));

  return (
    <div className="flex flex-col gap-6">
      <CreatePostForm />

      <div className="flex items-center justify-between">
        <h2 className="text-slate-900 font-semibold text-lg">Posts</h2>
        <Suspense>
          <SortDropdown />
        </Suspense>
      </div>

      <PostList posts={postsWithLiked} currentUsername={session?.user?.username} />
    </div>
  );
}
