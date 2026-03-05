import "next-auth";
import "next-auth/jwt";

export interface SpotifyAlbum {
  id: string;
  name: string;
  artist: string;
  imageUrl: string;
  url: string;
}

export interface PostWithLiked {
  id: number;
  title: string;
  content: string;
  username: string;
  timestamp: Date;
  likes: number;
  avatarUrl: string;
  album: string | null;
  liked: boolean;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  popularity: number;
  genres: string[];
  images: { url: string }[];
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  album: { name: string; images: { url: string }[] };
  duration_ms: number;
}

declare module "next-auth" {
  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      id?: string;
      username?: string | null;
      googleId?: string | null;
      needsUsername?: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    googleId?: string;
    username?: string | null;
    needsUsername?: boolean;
  }
}
