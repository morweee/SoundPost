"use client";

import { SpotifyArtist } from "@/types";

interface Props {
  artists: SpotifyArtist[];
}

export default function SpotifySummaryCard({ artists }: Props) {
  const topThree = artists.slice(0, 3);

  const genreCount: Record<string, number> = {};
  for (const artist of artists) {
    for (const genre of artist.genres) {
      genreCount[genre] = (genreCount[genre] ?? 0) + 1;
    }
  }
  const topGenre = Object.entries(genreCount).sort((a, b) => b[1] - a[1])[0]?.[0];

  return (
    <div className="border border-slate-200 rounded-2xl p-5 bg-gradient-to-br from-[#1DB954]/5 to-purple-50">
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-4 h-4 text-[#1DB954]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.371-.721.49-1.101.24-3.021-1.858-6.832-2.271-11.322-1.241-.418.1-.848-.16-.948-.58-.1-.418.16-.848.58-.948 4.91-1.121 9.12-.63 12.521 1.41.37.241.49.721.27 1.119zm1.47-3.27c-.301.459-.939.601-1.4.3-3.459-2.131-8.73-2.75-12.82-1.51-.521.16-1.07-.141-1.23-.66-.16-.521.141-1.07.66-1.23 4.68-1.42 10.49-.721 14.44 1.76.43.25.57.9.35 1.34zm.13-3.4c-4.15-2.461-11.001-2.691-14.97-1.49-.63.19-1.29-.159-1.48-.79-.19-.63.16-1.29.79-1.48 4.56-1.38 12.14-1.11 16.931 1.721.57.34.76 1.07.42 1.641-.34.57-1.07.76-1.641.42l-.05-.021z" />
        </svg>
        <h3 className="text-sm font-semibold text-slate-700">Spotify Listening</h3>
      </div>

      {topThree.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-slate-500 mb-1">Top Artists</p>
          <div className="flex flex-wrap gap-1">
            {topThree.map((a) => (
              <span
                key={a.id}
                className="bg-white border border-slate-200 text-slate-700 text-xs font-medium px-2 py-0.5 rounded-full"
              >
                {a.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {topGenre && (
        <div>
          <p className="text-xs text-slate-500 mb-1">Top Genre</p>
          <span className="bg-[#1DB954]/10 text-[#1DB954] text-xs font-medium px-2 py-0.5 rounded-full capitalize">
            {topGenre}
          </span>
        </div>
      )}
    </div>
  );
}
