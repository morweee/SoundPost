"use client";

import { useState } from "react";
import Image from "next/image";
import { SpotifyAlbum } from "@/types";

interface AlbumSearchProps {
  onSelect: (album: SpotifyAlbum | null) => void;
  selectedAlbum: SpotifyAlbum | null;
}

export default function AlbumSearch({ onSelect, selectedAlbum }: AlbumSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SpotifyAlbum[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  async function search() {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    try {
      const tokenRes = await fetch("/api/spotify/token");
      if (!tokenRes.ok) {
        setError("Spotify not available");
        return;
      }
      const { token } = await tokenRes.json();

      const searchRes = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=album&limit=8`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await searchRes.json();

      const albums: SpotifyAlbum[] = (data.albums?.items ?? []).map((a: {
        id: string;
        name: string;
        artists: { name: string }[];
        images: { url: string }[];
        external_urls: { spotify: string };
      }) => ({
        id: a.id,
        name: a.name,
        artist: a.artists[0]?.name ?? "Unknown",
        imageUrl: a.images[0]?.url ?? "",
        url: a.external_urls.spotify,
      }));
      setResults(albums);
    } catch {
      setError("Search failed");
    } finally {
      setLoading(false);
    }
  }

  if (selectedAlbum) {
    return (
      <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3">
        <Image
          src={selectedAlbum.imageUrl}
          alt={selectedAlbum.name}
          width={48}
          height={48}
          className="rounded-lg flex-shrink-0"
          unoptimized
        />
        <div className="flex-1 overflow-hidden">
          <p className="text-slate-900 text-sm font-medium truncate">{selectedAlbum.name}</p>
          <p className="text-slate-500 text-xs truncate">{selectedAlbum.artist}</p>
        </div>
        <button
          type="button"
          onClick={() => onSelect(null)}
          className="text-slate-400 hover:text-slate-700 transition-colors flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="text-slate-500 hover:text-sky-500 text-sm flex items-center gap-1.5 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
        Attach Album
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-72 bg-white border border-slate-200 shadow-xl rounded-xl overflow-hidden z-10">
          <div className="flex gap-2 p-3 border-b border-slate-200">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search()}
              placeholder="Search albums..."
              className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
            <button
              type="button"
              onClick={search}
              disabled={loading}
              className="bg-sky-500 hover:bg-sky-600 text-white text-sm px-3 py-2 rounded-lg disabled:opacity-50 transition-colors"
            >
              {loading ? "..." : "Go"}
            </button>
          </div>
          {error && <p className="text-red-500 text-xs px-3 py-2">{error}</p>}
          <div className="max-h-64 overflow-y-auto">
            {results.map((album) => (
              <button
                key={album.id}
                type="button"
                onClick={() => {
                  onSelect(album);
                  setOpen(false);
                  setResults([]);
                  setQuery("");
                }}
                className="flex items-center gap-3 w-full p-3 hover:bg-slate-50 transition-colors text-left"
              >
                <Image
                  src={album.imageUrl}
                  alt={album.name}
                  width={40}
                  height={40}
                  className="rounded flex-shrink-0"
                  unoptimized
                />
                <div className="overflow-hidden">
                  <p className="text-slate-900 text-sm font-medium truncate">{album.name}</p>
                  <p className="text-slate-500 text-xs truncate">{album.artist}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
