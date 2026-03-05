# SoundPost

A music-forward micro-blogging platform built with Next.js 14. Sign in with Google, share posts with Spotify album attachments, and connect your Spotify account to visualize your listening habits on a personal dashboard.

## Features

- **Post Feed** — Create, like, and delete short-form posts with rich text and emoji support
- **Spotify Album Attachment** — Search and attach Spotify albums to posts
- **Spotify Listening Dashboard** — Connect your Spotify account to visualize your top artists (bar chart), genre distribution (donut chart), and top tracks, with time-range filtering (4 weeks / 6 months / all time)
- **Public Spotify Summary** — Toggle a summary card on your profile showing your top 3 artists and top genre
- **Google OAuth** — Sign in with Google; first-time users pick a unique username
- **Auto-generated Avatars** — SVG avatars generated from usernames
- **Editable Profile** — Bio/description with live save

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router, React Server Components) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | SQLite via Prisma 5 |
| Auth | NextAuth.js v4 (Google provider) |
| Charts | Recharts |
| Validation | Zod |

## Prerequisites

- **Node.js** 18+
- **npm** (comes with Node)
- A [Google Cloud](https://console.cloud.google.com/apis/credentials) OAuth 2.0 client
- A [Spotify Developer](https://developer.spotify.com/dashboard) app

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/morweee/SoundPost.git
cd SoundPost
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in your credentials:

| Variable | Where to get it |
|----------|----------------|
| `NEXTAUTH_SECRET` | Run `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) — create an OAuth 2.0 Client ID (Web application) |
| `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` | [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) — create an app |
| `EMOJI_API_KEY` | *(Optional)* [emoji-api.com](https://emoji-api.com) |

### 3. Set up OAuth redirect URIs

**Google Cloud Console** — add this Authorized Redirect URI:
```
http://localhost:3000/api/auth/callback/google
```

**Spotify Developer Dashboard** — add this Redirect URI:
```
http://127.0.0.1:3000/api/spotify/callback
```

> Spotify requires `127.0.0.1` instead of `localhost` for loopback redirect URIs.

### 4. Initialize the database

```bash
npx prisma migrate dev
```

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> When testing the Spotify connect flow, the app handles the `localhost` / `127.0.0.1` domain difference automatically — just keep browsing on `localhost:3000`.

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/          # NextAuth.js handler
│   │   ├── posts/         # CRUD + likes
│   │   ├── spotify/       # Connect, callback, top artists/tracks
│   │   ├── avatar/        # SVG avatar generation
│   │   ├── emoji/         # Emoji search proxy
│   │   ├── profile/       # Bio update
│   │   └── register/      # Username registration
│   ├── login/             # Sign-in page
│   ├── profile/           # User profile page
│   ├── register/          # Username setup
│   ├── spotify/           # Listening dashboard
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home feed
├── components/
│   ├── spotify/           # Chart & dashboard components
│   └── ...                # Post, header, profile components
├── lib/
│   ├── auth.ts            # NextAuth config
│   ├── prisma.ts          # Prisma client singleton
│   ├── spotify-user.ts    # Spotify token refresh + API helper
│   └── validators.ts      # Zod schemas
└── types/                 # TypeScript interfaces + NextAuth augmentation
```

## License

MIT
