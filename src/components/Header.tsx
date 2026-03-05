"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";

export default function Header() {
  const { data: session, status } = useSession();

  return (
    <header className="bg-white border-b border-slate-200">
      <div className="container mx-auto px-4 max-w-3xl flex items-center justify-between h-16">
        <Link href="/" className="text-slate-900 font-bold text-xl tracking-tight hover:opacity-80 transition-opacity">
          iBlog
        </Link>

        <nav className="flex items-center gap-4">
          {status === "loading" ? null : session?.user ? (
            <>
              <Link
                href="/profile"
                className="flex items-center gap-2 text-slate-700 hover:text-slate-900 transition-colors"
              >
                <Image
                  src={session.user.image ?? `/api/avatar/${session.user.username ?? "user"}`}
                  alt="Avatar"
                  width={32}
                  height={32}
                  className="rounded-full"
                  unoptimized
                />
                <span className="font-medium">{session.user.username}</span>
              </Link>
              <Link
                href="/spotify"
                className="text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors"
              >
                Spotify
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="border border-slate-300 text-slate-600 hover:bg-slate-50 text-sm font-medium px-4 py-2 rounded-full transition-colors"
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="bg-sky-500 text-white rounded-lg px-4 py-1.5 text-sm font-medium hover:bg-sky-600 transition-colors"
            >
              Sign In
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
