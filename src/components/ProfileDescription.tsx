"use client";

import { useState } from "react";

interface ProfileDescriptionProps {
  initialDescription: string;
}

export default function ProfileDescription({ initialDescription }: ProfileDescriptionProps) {
  const [description, setDescription] = useState(initialDescription);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initialDescription);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/profile/description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: draft }),
      });
      if (res.ok) {
        setDescription(draft);
        setEditing(false);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to save");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-slate-900 font-semibold">About Me</h2>
        {!editing && (
          <button
            onClick={() => {
              setDraft(description);
              setEditing(true);
            }}
            className="text-sky-500 hover:text-sky-600 text-sm font-medium transition-colors"
          >
            Edit
          </button>
        )}
      </div>

      {editing ? (
        <div className="flex flex-col gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={500}
            rows={4}
            placeholder="Tell the world about yourself..."
            className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
          />
          <div className="flex justify-between items-center">
            <span className="text-slate-400 text-xs">{draft.length}/500</span>
            <div className="flex gap-2">
              <button
                onClick={() => setEditing(false)}
                className="text-slate-500 hover:text-slate-700 text-sm px-3 py-1.5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-sky-500 hover:bg-sky-600 text-white font-semibold text-sm px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
      ) : (
        <p className="text-slate-700 whitespace-pre-wrap">
          {description || <span className="italic text-slate-400">No description yet. Click Edit to add one.</span>}
        </p>
      )}
    </div>
  );
}
