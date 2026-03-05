"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { SpotifyArtist } from "@/types";

interface Props {
  artists: SpotifyArtist[];
}

export default function TopArtistsChart({ artists }: Props) {
  const data = artists.slice(0, 10).map((a) => ({
    name: a.name.length > 18 ? a.name.slice(0, 16) + "…" : a.name,
    popularity: a.popularity,
  }));

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-4">Top Artists</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
          <YAxis
            type="category"
            dataKey="name"
            width={110}
            tick={{ fontSize: 11 }}
          />
          <Tooltip
            formatter={(v) => [`${v}`, "Popularity"]}
            cursor={{ fill: "rgba(99,102,241,0.05)" }}
          />
          <Bar dataKey="popularity" fill="#6366f1" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
