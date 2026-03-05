import PostCard from "@/components/PostCard";
import { PostWithLiked } from "@/types";

interface PostListProps {
  posts: PostWithLiked[];
  currentUsername: string | null | undefined;
}

export default function PostList({ posts, currentUsername }: PostListProps) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-slate-500">No posts yet.</p>
        <p className="text-sm mt-1 text-slate-400">Be the first to share something!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} currentUsername={currentUsername} />
      ))}
    </div>
  );
}
