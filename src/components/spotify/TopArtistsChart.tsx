"use client";

import Image from "next/image";
import { SpotifyArtist } from "@/types";

interface Props {
  artists: SpotifyArtist[];
  globalArtistIds?: string[];
}

export default function TopArtistsChart({ artists, globalArtistIds = [] }: Props) {
  const globalSet = new Set(globalArtistIds);
  const top = artists.slice(0, 10);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-1">Top Artists</h2>
      <p className="text-xs text-slate-400 mb-4">Ranked by your listening</p>
      <ol className="space-y-3">
        {top.map((artist, i) => {
          const percentile = 100 - artist.popularity;
          const isTrending = globalSet.has(artist.id);
          const image = artist.images[artist.images.length - 1]?.url; // smallest image

          return (
            <li key={artist.id} className="flex items-center gap-3">
              {/* Rank number */}
              <span
                className="text-lg font-bold w-7 text-right flex-shrink-0"
                style={{
                  color: `rgba(99, 102, 241, ${1 - i * 0.07})`,
                }}
              >
                {i + 1}
              </span>

              {/* Artist image */}
              {image ? (
                <Image
                  src={image}
                  alt={artist.name}
                  width={48}
                  height={48}
                  className="rounded-full flex-shrink-0 object-cover w-12 h-12"
                  unoptimized
                />
              ) : (
                <div className="w-12 h-12 bg-slate-100 rounded-full flex-shrink-0" />
              )}

              {/* Name + badges + progress bar */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {artist.name}
                  </p>
                  {isTrending && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold bg-orange-50 text-orange-600 border border-orange-200 rounded-full px-1.5 py-0.5 flex-shrink-0">
                      🔥 Top 50
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500"
                      style={{ width: `${artist.popularity}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 flex-shrink-0">
                    Top {percentile}%
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
