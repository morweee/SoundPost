"use client";

import { useRouter, useSearchParams } from "next/navigation";

const RANGES = [
  { label: "4 Weeks", value: "short_term" },
  { label: "6 Months", value: "medium_term" },
  { label: "All Time", value: "long_term" },
] as const;

export default function TimeRangeSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("range") ?? "short_term";

  function select(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", value);
    router.push(`/spotify?${params.toString()}`);
  }

  return (
    <div className="flex gap-1 bg-slate-100 p-1 rounded-full w-fit">
      {RANGES.map(({ label, value }) => (
        <button
          key={value}
          onClick={() => select(value)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            current === value
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
