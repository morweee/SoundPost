"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import AlbumSearch from "@/components/AlbumSearch";
import EmojiPicker from "@/components/EmojiPicker";
import { SpotifyAlbum } from "@/types";

export default function CreatePostForm() {
  const { data: session } = useSession();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [album, setAlbum] = useState<SpotifyAlbum | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const contentRef = useRef<HTMLTextAreaElement>(null);

  function insertEmoji(emoji: string) {
    const el = contentRef.current;
    if (!el) {
      setContent((prev) => prev + emoji);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const newContent = content.slice(0, start) + emoji + content.slice(end);
    setContent(newContent);
    // Restore cursor position after state update
    setTimeout(() => {
      el.selectionStart = start + emoji.length;
      el.selectionEnd = start + emoji.length;
      el.focus();
    }, 0);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          album: album ? JSON.stringify(album) : null,
        }),
      });
      if (res.ok) {
        setTitle("");
        setContent("");
        setAlbum(null);
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create post");
      }
    } finally {
      setLoading(false);
    }
  }

  if (!session?.user) return null;

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6"
    >
      <h2 className="text-slate-900 font-semibold text-base mb-4">Create a Post</h2>

      <div className="flex flex-col gap-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          required
          maxLength={100}
          className="bg-white border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
        />

        <div className="relative">
          <textarea
            ref={contentRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            required
            maxLength={2000}
            rows={3}
            className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
          />
          <span className="absolute bottom-2 right-3 text-slate-400 text-xs">{content.length}/2000</span>
        </div>

        <AlbumSearch onSelect={setAlbum} selectedAlbum={album} />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <EmojiPicker onSelect={insertEmoji} />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-sky-500 hover:bg-sky-600 text-white font-semibold px-5 py-2 rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? "Posting..." : "Post"}
          </button>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
    </form>
  );
}
