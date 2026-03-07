"use client";

import { useState, useCallback } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Sector } from "recharts";
import type { PieLabelRenderProps } from "recharts";
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

const RADIAN = Math.PI / 180;

function renderLabel(props: PieLabelRenderProps) {
  const cx = Number(props.cx ?? 0);
  const cy = Number(props.cy ?? 0);
  const midAngle = props.midAngle ?? 0;
  const outerRadius = Number(props.outerRadius ?? 0);
  const percent = props.percent ?? 0;
  if (percent < 0.05) return null;
  const radius = outerRadius + 18;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="#64748b"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      fontSize={11}
      fontWeight={500}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function renderActiveShape(props: any) {
  const {
    cx, cy, midAngle, innerRadius, outerRadius,
    startAngle, endAngle, fill, payload, value, percent,
  } = props;
  const cos = Math.cos(-RADIAN * midAngle);
  const mx = cx + (outerRadius + 14) * cos;
  const my = cy + (outerRadius + 14) * Math.sin(-RADIAN * midAngle);

  return (
    <g>
      {/* center text on hover */}
      <text x={cx} y={cy - 8} textAnchor="middle" fill="#1e293b" fontSize={15} fontWeight={600}>
        {payload.name.length > 14 ? payload.name.slice(0, 12) + "…" : payload.name}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="#94a3b8" fontSize={12}>
        {value} artist{value !== 1 ? "s" : ""} · {(percent * 100).toFixed(0)}%
      </text>
      {/* enlarged slice */}
      <Sector
        cx={cx} cy={cy}
        innerRadius={innerRadius - 2}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        stroke={fill}
        strokeWidth={2}
        opacity={0.95}
      />
      {/* outer highlight ring */}
      <Sector
        cx={cx} cy={cy}
        innerRadius={outerRadius + 8}
        outerRadius={outerRadius + 10}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={0.3}
      />
      {/* percentage label */}
      <text
        x={mx} y={my}
        textAnchor={cos >= 0 ? "start" : "end"}
        fill="#1e293b"
        fontSize={12}
        fontWeight={600}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    </g>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */

interface TooltipPayload {
  name: string;
  value: number;
  payload: { name: string; value: number };
}

function CustomTooltip({
  active,
  payload,
  total,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  total: number;
}) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  const pct = ((d.value / total) * 100).toFixed(0);
  return (
    <div className="bg-white border border-slate-200 shadow-lg rounded-lg px-3 py-2 text-xs">
      <p className="font-medium text-slate-800">{d.name}</p>
      <p className="text-slate-500">
        {d.value} artist{d.value !== 1 ? "s" : ""} · {pct}%
      </p>
    </div>
  );
}

export default function GenrePieChart({ artists }: Props) {
  const [activeIndex, setActiveIndex] = useState(-1);

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

  const total = data.reduce((s, d) => s + d.value, 0);

  const onEnter = useCallback((_: unknown, index: number) => setActiveIndex(index), []);
  const onLeave = useCallback(() => setActiveIndex(-1), []);

  if (data.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 flex items-center justify-center h-full">
        <p className="text-slate-400 text-sm">No genre data available</p>
      </div>
    );
  }

  const hovered = activeIndex >= 0;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-1">Genre Distribution</h2>
      <p className="text-xs text-slate-400 mb-4">Hover a slice to explore</p>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={95}
            paddingAngle={2}
            dataKey="value"
            activeShape={renderActiveShape}
            label={!hovered ? renderLabel : false}
            labelLine={false}
            onMouseEnter={onEnter}
            onMouseLeave={onLeave}
          >
            {data.map((_, i) => (
              <Cell
                key={i}
                fill={COLORS[i % COLORS.length]}
                fillOpacity={hovered && activeIndex !== i ? 0.35 : 1}
              />
            ))}
          </Pie>
          {/* center text when nothing is hovered */}
          {!hovered && (
            <>
              <text
                x="50%"
                y="47%"
                textAnchor="middle"
                dominantBaseline="central"
                fill="#1e293b"
                fontSize={22}
                fontWeight={700}
              >
                {data.length}
              </text>
              <text
                x="50%"
                y="56%"
                textAnchor="middle"
                dominantBaseline="central"
                fill="#94a3b8"
                fontSize={12}
              >
                genres
              </text>
            </>
          )}
          <Tooltip content={<CustomTooltip total={total} />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Custom legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2">
        {data.map((d, i) => (
          <button
            key={d.name}
            className="flex items-center gap-1.5 text-xs transition-opacity"
            style={{ opacity: hovered && activeIndex !== i ? 0.4 : 1 }}
            onMouseEnter={() => setActiveIndex(i)}
            onMouseLeave={onLeave}
          >
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
            <span className="text-slate-600 truncate max-w-[120px]">{d.name}</span>
            <span className="text-slate-400">{d.value}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
