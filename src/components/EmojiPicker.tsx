"use client";

import { useState, useEffect } from "react";

interface EmojiData {
  slug: string;
  character: string;
  unicodeName: string;
}

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
}

export default function EmojiPicker({ onSelect }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const [emojis, setEmojis] = useState<EmojiData[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    loadEmojis();
  }, [open]);

  async function loadEmojis(q = "") {
    setLoading(true);
    try {
      const res = await fetch(`/api/emoji${q ? `?search=${encodeURIComponent(q)}` : ""}`);
      if (res.ok) {
        const data = await res.json();
        setEmojis(Array.isArray(data) ? data.slice(0, 48) : []);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setSearch(val);
    if (val.length > 1) loadEmojis(val);
    else if (val.length === 0) loadEmojis();
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="text-slate-400 hover:text-sky-500 transition-colors text-xl leading-none"
        title="Add emoji"
      >
        😊
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-64 bg-white border border-slate-200 shadow-xl rounded-xl overflow-hidden z-10">
          <div className="p-2 border-b border-slate-200">
            <input
              type="text"
              value={search}
              onChange={handleSearch}
              placeholder="Search emojis..."
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
          </div>
          <div className="grid grid-cols-8 gap-0.5 p-2 max-h-48 overflow-y-auto">
            {loading ? (
              <div className="col-span-8 text-center text-slate-400 py-4 text-sm">Loading...</div>
            ) : emojis.length === 0 ? (
              <div className="col-span-8 text-center text-slate-400 py-4 text-sm">No emojis found</div>
            ) : (
              emojis.map((e) => (
                <button
                  key={e.slug}
                  type="button"
                  onClick={() => {
                    onSelect(e.character);
                    setOpen(false);
                  }}
                  title={e.unicodeName}
                  className="text-xl hover:bg-slate-100 rounded p-0.5 transition-colors"
                >
                  {e.character}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
