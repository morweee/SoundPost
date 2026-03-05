"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { SpotifyArtist } from "@/types";

interface Props {
  artists: SpotifyArtist[];
}

// Spotify returns /me/top/artists sorted by the user's personal listening
// frequency. We keep that order (most-listened first) and use the artist's
// global popularity score (0–100) to size the bars, giving a meaningful
// visual weight.
export default function TopArtistsChart({ artists }: Props) {
  const data = artists.slice(0, 10).map((a, i) => ({
    name: a.name.length > 18 ? a.name.slice(0, 16) + "…" : a.name,
    score: a.popularity,
    rank: i + 1,
  }));

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-1">Top Artists</h2>
      <p className="text-xs text-slate-400 mb-4">
        Ranked by your listening. Bar = global artist hotness (0–100).
      </p>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={110}
            tick={{ fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(99,102,241,0.05)" }}
            content={({ active, payload }) => {
              if (!active || !payload?.[0]) return null;
              const d = payload[0].payload as { name: string; score: number; rank: number };
              return (
                <div className="bg-white border border-slate-200 shadow-lg rounded-lg px-3 py-2 text-xs">
                  <p className="font-medium text-slate-800">{d.name}</p>
                  <p className="text-slate-500">#{d.rank} in your listening</p>
                  <p className="text-slate-500">Hotness: {d.score}/100</p>
                </div>
              );
            }}
          />
          <Bar dataKey="score" radius={[0, 6, 6, 0]}>
            {data.map((_, i) => (
              <Cell
                key={i}
                fill="url(#barGradient)"
                fillOpacity={1 - i * 0.06}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
