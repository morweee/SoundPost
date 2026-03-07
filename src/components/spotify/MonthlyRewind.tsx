"use client";

import { useEffect, useState, useCallback } from "react";
import TopArtistsChart from "@/components/spotify/TopArtistsChart";
import TopTracksList from "@/components/spotify/TopTracksList";
import { SpotifyArtist, SpotifyTrack, SnapshotArtist, SnapshotTrack } from "@/types";

type View = "artists" | "tracks";

function formatMonth(month: string): string {
  const [y, m] = month.split("-");
  const date = new Date(Number(y), Number(m) - 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function toSpotifyArtists(items: SnapshotArtist[]): SpotifyArtist[] {
  return items.map((a) => ({
    id: a.id,
    name: a.name,
    popularity: a.popularity,
    genres: a.genres,
    images: a.imageUrl ? [{ url: a.imageUrl }] : [],
  }));
}

function toSpotifyTracks(items: SnapshotTrack[]): SpotifyTrack[] {
  return items.map((t) => ({
    id: t.id,
    name: t.name,
    artists: t.artistNames.split(", ").map((name) => ({ name })),
    album: {
      name: t.albumName,
      images: t.albumImageUrl ? [{ url: t.albumImageUrl }] : [],
    },
    duration_ms: t.duration_ms,
  }));
}

export default function MonthlyRewind() {
  const [months, setMonths] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [view, setView] = useState<View>("artists");
  const [artists, setArtists] = useState<SnapshotArtist[]>([]);
  const [tracks, setTracks] = useState<SnapshotTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    fetch("/api/spotify/rewind")
      .then((r) => r.json())
      .then((data) => {
        const m: string[] = data.months ?? [];
        setMonths(m);
        if (m.length > 0) setSelectedMonth(m[0]);
      })
      .finally(() => setLoading(false));
  }, []);

  const fetchMonth = useCallback((month: string) => {
    setDataLoading(true);
    fetch(`/api/spotify/rewind?month=${month}`)
      .then((r) => r.json())
      .then((data) => {
        setArtists(data.artists ?? []);
        setTracks(data.tracks ?? []);
      })
      .finally(() => setDataLoading(false));
  }, []);

  useEffect(() => {
    if (selectedMonth) fetchMonth(selectedMonth);
  }, [selectedMonth, fetchMonth]);

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <div className="h-6 w-48 bg-slate-100 rounded animate-pulse mb-4" />
        <div className="h-10 w-full bg-slate-100 rounded animate-pulse mb-4" />
        <div className="h-64 w-full bg-slate-100 rounded animate-pulse" />
      </div>
    );
  }

  if (months.length === 0) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <svg
          className="w-5 h-5 text-indigo-500"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
          />
        </svg>
        <h2 className="text-lg font-semibold text-slate-800">Monthly Rewind</h2>
      </div>

      {/* Month pills */}
      <div className="flex gap-1 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        {months.map((m) => (
          <button
            key={m}
            onClick={() => setSelectedMonth(m)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedMonth === m
                ? "bg-indigo-500 text-white shadow-sm"
                : "bg-slate-100 text-slate-500 hover:text-slate-700"
            }`}
          >
            {formatMonth(m)}
          </button>
        ))}
      </div>

      {/* Artists / Tracks toggle */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-full w-fit mb-4">
        <button
          onClick={() => setView("artists")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            view === "artists"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Artists
        </button>
        <button
          onClick={() => setView("tracks")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            view === "tracks"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Tracks
        </button>
      </div>

      {/* Content */}
      {dataLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-5 h-4 bg-slate-100 rounded animate-pulse" />
              <div className="w-12 h-12 bg-slate-100 rounded animate-pulse" />
              <div className="flex-1 space-y-1">
                <div className="h-4 w-3/4 bg-slate-100 rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-slate-100 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : view === "artists" && artists.length > 0 ? (
        <TopArtistsChart artists={toSpotifyArtists(artists)} />
      ) : view === "tracks" && tracks.length > 0 ? (
        <TopTracksList tracks={toSpotifyTracks(tracks)} />
      ) : (
        <p className="text-sm text-slate-400 text-center py-8">
          No data for this month.
        </p>
      )}
    </div>
  );
}
