"use client";

import Image from "next/image";
import { SpotifyTrack } from "@/types";

interface Props {
  tracks: SpotifyTrack[];
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function TopTracksList({ tracks }: Props) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-4">Top Tracks</h2>
      <ol className="space-y-3">
        {tracks.map((track, i) => {
          const albumImage = track.album.images[0]?.url;
          const artistNames = track.artists.map((a) => a.name).join(", ");
          return (
            <li key={track.id} className="flex items-center gap-3">
              <span className="text-slate-400 text-sm w-5 text-right flex-shrink-0">
                {i + 1}
              </span>
              {albumImage ? (
                <Image
                  src={albumImage}
                  alt={track.album.name}
                  width={48}
                  height={48}
                  className="rounded flex-shrink-0"
                  unoptimized
                />
              ) : (
                <div className="w-12 h-12 bg-slate-100 rounded flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{track.name}</p>
                <p className="text-xs text-slate-500 truncate">{artistNames}</p>
              </div>
              <span className="text-xs text-slate-400 flex-shrink-0">
                {formatDuration(track.duration_ms)}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
