"use client";

import { useEffect, useState } from "react";

type Period = "weekly" | "monthly";

interface Section {
  emoji: string;
  title: string;
  body: string;
}

function parseSections(content: string): Section[] {
  const sectionPattern = /(🎧|🔥|🌀)\s*(.+?)(?:\s*[—–-]\s*|\s+)([\s\S]*?)(?=(?:🎧|🔥|🌀)|\s*$)/g;
  const sections: Section[] = [];
  let match;
  while ((match = sectionPattern.exec(content)) !== null) {
    sections.push({
      emoji: match[1],
      title: match[2].trim().replace(/[—–-]\s*$/, "").trim(),
      body: match[3].trim(),
    });
  }
  return sections;
}

export default function ListeningAnalysis() {
  const [period, setPeriod] = useState<Period>("weekly");
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    setContent(null);
    fetch(`/api/spotify/analysis?period=${period}`)
      .then((r) => r.json())
      .then((data) => {
        setContent(data.content ?? null);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [period]);

  const sections = content ? parseSections(content) : [];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <svg
          className="w-5 h-5 text-violet-500"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"
          />
        </svg>
        <h2 className="text-lg font-semibold text-slate-800">
          AI Listening Analysis
        </h2>
      </div>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-full w-fit mb-4">
        <button
          onClick={() => setPeriod("weekly")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            period === "weekly"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          This Week
        </button>
        <button
          onClick={() => setPeriod("monthly")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            period === "monthly"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          This Month
        </button>
      </div>

      {loading ? (
        <div className="space-y-3 py-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-slate-50 rounded-xl p-4 space-y-2">
              <div className="h-4 w-1/3 bg-slate-100 rounded animate-pulse" />
              <div className="h-3 w-full bg-slate-100 rounded animate-pulse" />
              <div className="h-3 w-4/5 bg-slate-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : error ? (
        <p className="text-sm text-red-400 text-center py-8">
          Something went wrong generating your analysis.
        </p>
      ) : sections.length > 0 ? (
        <div className="space-y-3">
          {sections.map((section, i) => (
            <div
              key={i}
              className="bg-slate-50 rounded-xl p-4"
            >
              <p className="text-sm font-semibold text-slate-800 mb-1">
                {section.emoji} {section.title}
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">
                {section.body}
              </p>
            </div>
          ))}
        </div>
      ) : content ? (
        <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
          {content}
        </div>
      ) : (
        <p className="text-sm text-slate-400 text-center py-8">
          Not enough listening data to generate an analysis yet.
        </p>
      )}
    </div>
  );
}
