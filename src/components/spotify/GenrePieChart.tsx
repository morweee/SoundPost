"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { SpotifyArtist } from "@/types";

interface Props {
  artists: SpotifyArtist[];
}

const COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#ef4444",
  "#14b8a6",
];

export default function GenrePieChart({ artists }: Props) {
  const genreCount: Record<string, number> = {};
  for (const artist of artists) {
    for (const genre of artist.genres) {
      genreCount[genre] = (genreCount[genre] ?? 0) + 1;
    }
  }

  const data = Object.entries(genreCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, value]) => ({ name, value }));

  if (data.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 flex items-center justify-center h-full">
        <p className="text-slate-400 text-sm">No genre data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-4">Genre Distribution</h2>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => [v, "artists"]} />
          <Legend
            formatter={(value: string) =>
              value.length > 20 ? value.slice(0, 18) + "…" : value
            }
            wrapperStyle={{ fontSize: 11 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
