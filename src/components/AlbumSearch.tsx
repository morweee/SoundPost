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
  const [expanded, setExpanded] = useState(false);

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
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=album&limit=6`,
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
      <div className="flex items-center gap-4 bg-gradient-to-r from-slate-50 to-green-50 border border-slate-200 rounded-xl p-4">
        <Image
          src={selectedAlbum.imageUrl}
          alt={selectedAlbum.name}
          width={56}
          height={56}
          className="rounded-lg flex-shrink-0 shadow-sm"
          unoptimized
        />
        <div className="flex-1 overflow-hidden">
          <p className="text-slate-900 font-medium truncate">{selectedAlbum.name}</p>
          <p className="text-slate-500 text-sm truncate mt-0.5">{selectedAlbum.artist}</p>
        </div>
        <button
          type="button"
          onClick={() => onSelect(null)}
          className="text-slate-400 hover:text-red-500 transition-colors flex-shrink-0 p-1"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="text-slate-500 hover:text-[#1DB954] text-sm flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
        Attach Album
        <svg
          className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="mt-2 border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
          <div className="flex gap-2 p-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  search();
                }
              }}
              placeholder="Search Spotify albums..."
              className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1DB954]/20 focus:border-[#1DB954] transition-colors"
            />
            <button
              type="button"
              onClick={search}
              disabled={loading}
              className="bg-[#1DB954] hover:bg-[#1aa34a] text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50 transition-colors"
            >
              {loading ? "..." : "Search"}
            </button>
          </div>

          {error && <p className="text-red-500 text-xs px-3 pb-2">{error}</p>}

          {results.length > 0 && (
            <div className="grid grid-cols-3 gap-2 p-3 pt-0">
              {results.map((album) => (
                <button
                  key={album.id}
                  type="button"
                  onClick={() => {
                    onSelect(album);
                    setExpanded(false);
                    setResults([]);
                    setQuery("");
                  }}
                  className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-white transition-colors text-center group"
                >
                  <Image
                    src={album.imageUrl}
                    alt={album.name}
                    width={80}
                    height={80}
                    className="rounded-lg shadow-sm group-hover:shadow-md transition-shadow w-full aspect-square object-cover"
                    unoptimized
                  />
                  <div className="w-full overflow-hidden">
                    <p className="text-slate-900 text-xs font-medium truncate">{album.name}</p>
                    <p className="text-slate-500 text-[10px] truncate">{album.artist}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
