"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  isConnected: boolean;
  initialPublic: boolean;
}

export default function SpotifyPublicToggle({ isConnected, initialPublic }: Props) {
  const [isPublic, setIsPublic] = useState(initialPublic);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function togglePublic() {
    setLoading(true);
    const res = await fetch("/api/spotify/toggle-public", { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setIsPublic(data.spotifyPublic);
    }
    setLoading(false);
  }

  async function disconnect() {
    if (!confirm("Disconnect your Spotify account?")) return;
    setLoading(true);
    await fetch("/api/spotify/disconnect", { method: "POST" });
    router.refresh();
    setLoading(false);
  }

  if (!isConnected) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-500">Spotify not connected.</span>
        <a
          href="/api/spotify/connect"
          className="text-sm text-[#1DB954] hover:underline font-medium"
        >
          Connect Spotify
        </a>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <button
        onClick={togglePublic}
        disabled={loading}
        className="flex items-center gap-2 text-sm text-slate-700"
        aria-label="Toggle public Spotify stats"
      >
        <span
          className={`w-10 h-6 rounded-full transition-colors relative flex-shrink-0 ${
            isPublic ? "bg-[#1DB954]" : "bg-slate-300"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              isPublic ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </span>
        Show Spotify stats on profile
      </button>

      <button
        onClick={disconnect}
        disabled={loading}
        className="text-sm text-red-500 hover:text-red-700 transition-colors"
      >
        Disconnect
      </button>
    </div>
  );
}
