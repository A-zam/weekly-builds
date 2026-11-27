# Habit Arena

> Every habit you keep adds a square of land to a living island. Keep going and it grows into a kingdom full of creatures and secrets. Bring friends and race them in habit rooms.

An installable web app (PWA) for Gen Z and Gen Alpha. The goal is to swap doomscrolling for doing the habit, then logging it in under 10 seconds.

Started as [Week 02 of weekly-builds](https://github.com/a-zam/weekly-builds/tree/main/weeks/02-habit-arena) (a claude.ai artifact MVP). The design research is in `docs/RESEARCH.md`.

## Features
- **My island:** one square of land per completed habit, placed by you; 8 terrains; growth over days; wilting after skipped days (always revivable); rest days instead of streak resets; 11 discoveries that unlock perks; named regions; chronicle; day and night on your clock
- **Chests:** 18 collectibles in 4 rarities that live on the island; odds shown in-app and built from the same table as the roll
- **Pip,** the island keeper, with new lines each day based on your island
- **Habit rooms:** shared and personal habits, XP with streak multipliers, perfect-day bonus, levels, badges, live leaderboard, activity feed with cheers, optional photo/note proof
- **Social:** opt-in island sharing; visit friends' islands from a room
- **Installable:** works offline for the app shell, home-screen icon, shortcuts

## Stack
- Vite + vanilla JS (the game engine is `src/game.js`; Canvas 2D isometric renderer, Web Audio synth)
- Supabase: Postgres with row-level security, Auth (guest + Google), Realtime, Storage
- `vite-plugin-pwa` (Workbox) for the service worker and manifest
- Vitest for unit tests; GitHub Pages for hosting

## How it is built
`src/game.js` only talks to a small document API (`doc(path).get/set/delete/onSnapshot`). Two platforms implement it:

| Platform | When | Storage |
|---|---|---|
| `src/platform/supabase.js` | `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set | Postgres tables, kept live with Realtime |
| `src/platform/local.js` | nothing configured, or `?demo` in the URL | this browser's localStorage |

The path → table mapping is at the top of `src/platform/supabase.js`; the schema and security rules are in `supabase/migrations/0001_init.sql`.

## Run locally
```bash
npm install
npm run dev        # uses the live project from .env.production; add ?demo for local-only play
npm test
npm run build && npm run preview
```

## Set up the backend (one time)
1. **Supabase project:** create one at supabase.com (free tier). In **SQL Editor**, paste and run `supabase/migrations/0001_init.sql`.
2. **Auth → Sign In / Providers:**
   - enable **Anonymous sign-ins** (guest play)
   - enable **Manual linking** (lets a guest connect Google later and keep their island)
   - enable **Google**: create an OAuth client in Google Cloud Console (Web application). Add `https://<project-ref>.supabase.co/auth/v1/callback` as an authorized redirect URI. Paste the client ID and secret into Supabase.
3. **Auth → URL Configuration:** set Site URL to the app URL (e.g. `https://<user>.github.io/habit-arena/`) and add it, plus `http://localhost:5173/`, to Redirect URLs.
4. **Keys:** put the Project URL and the **publishable** key (Project Settings → API Keys) in `.env.production`, which is committed because both are public client values. `.env.local` overrides it for local work. Never put the secret or `service_role` key in this repo.
5. **Hosting:** GitHub → Settings → Pages → Source: **GitHub Actions**. Every push to `main` tests, builds and deploys.

## Security model
- Each player writes only their own rows (`profiles`, their `room_members` row, `islands`, `island_public`); room creators can edit their room and remove players.
- Room check-ins are visible only to players in the same room.
- Your island is private; the shared copy (`island_public`) has no habit names and is readable only by people you share a room with.
- Proof photos go to a public bucket under `<user-id>/`, with unguessable file names; only the owner can upload or delete them.

## What's next
- Push reminders (Web Push + a scheduled Supabase Edge Function)
- Offline write queue (log a habit with no signal; sync later)
- Funnel analytics for onboarding
- Split `src/game.js` into modules (engine, renderer, rooms, UI)
