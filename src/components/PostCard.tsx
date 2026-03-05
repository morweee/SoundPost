"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { PostWithLiked, SpotifyAlbum } from "@/types";

interface PostCardProps {
  post: PostWithLiked;
  currentUsername: string | null | undefined;
}

export default function PostCard({ post, currentUsername }: PostCardProps) {
  const router = useRouter();
  const [liked, setLiked] = useState(post.liked);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [loading, setLoading] = useState(false);

  const isOwner = currentUsername === post.username;

  async function handleLike() {
    if (isOwner || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/like`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setLiked(data.liked);
        setLikeCount((prev) => (data.liked ? prev + 1 : prev - 1));
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this post?")) return;
    const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
    if (res.ok) {
      router.refresh();
    }
  }

  let album: SpotifyAlbum | null = null;
  if (post.album) {
    try {
      album = JSON.parse(post.album);
    } catch {
      // ignore malformed
    }
  }

  const timestamp = new Date(post.timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <article className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Image
            src={post.avatarUrl || `/api/avatar/${post.username}`}
            alt={post.username}
            width={40}
            height={40}
            className="rounded-full flex-shrink-0"
            unoptimized
          />
          <div>
            <span className="font-semibold text-slate-900 text-sm">{post.username}</span>
            <p className="text-slate-400 text-xs">{timestamp}</p>
          </div>
        </div>
      </div>

      <h2 className="text-slate-900 font-bold text-lg mt-3">{post.title}</h2>
      <p className="text-slate-700 mt-1 whitespace-pre-wrap">{post.content}</p>

      {album && (
        <a
          href={album.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3 hover:bg-slate-100 transition-colors group"
        >
          <Image
            src={album.imageUrl}
            alt={album.name}
            width={56}
            height={56}
            className="rounded-lg flex-shrink-0"
            unoptimized
          />
          <div className="overflow-hidden">
            <p className="text-slate-900 font-medium text-sm truncate group-hover:underline">
              {album.name}
            </p>
            <p className="text-slate-500 text-xs truncate">{album.artist}</p>
            <p className="text-slate-400 text-xs mt-0.5">Spotify Album</p>
          </div>
        </a>
      )}

      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-4">
          {!isOwner ? (
            <button
              onClick={handleLike}
              disabled={loading}
              className="flex items-center gap-1.5 text-sm transition-colors disabled:opacity-50"
              title={liked ? "Unlike" : "Like"}
            >
              <svg
                className={`w-5 h-5 transition-colors ${liked ? "fill-sky-500 text-sky-500" : "fill-none text-slate-400 hover:text-sky-500"}`}
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              <span className={liked ? "text-sky-500" : "text-slate-400"}>{likeCount}</span>
            </button>
          ) : (
            <span className="flex items-center gap-1.5 text-sm text-slate-400">
              <svg className="w-5 h-5 fill-slate-300" viewBox="0 0 24 24">
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {likeCount}
            </span>
          )}
        </div>

        {isOwner && (
          <button
            onClick={handleDelete}
            className="text-slate-400 hover:text-red-500 transition-colors text-sm flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>
        )}
      </div>
    </article>
  );
}
