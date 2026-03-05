"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function SortDropdown() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("sort") ?? "recent";

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    router.push(val === "recent" ? "/" : `/?sort=${val}`);
  }

  return (
    <select
      value={current}
      onChange={handleChange}
      className="bg-white border border-slate-300 text-slate-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 cursor-pointer"
    >
      <option value="recent" className="text-gray-800">Most Recent</option>
      <option value="likes" className="text-gray-800">Most Liked</option>
    </select>
  );
}
