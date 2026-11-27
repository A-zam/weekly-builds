# Journal: Week 02 (Habit Arena)

Keep it to 2–4 lines a day: what moved, what's stuck, what got decided.

## Mon: Pick
- Idea from PO: a *shareable* habit tracker. Create a room, add friends, compete on habits for XP.
- **PO answers:** shared + personal habits · XP from check-ins, streak bonuses, perfect days, levels and badges · custom challenge length · honor system by default, proof as a room setting.
- Decision: build the MVP as a claude.ai artifact first (sharing, sign-in and storage come free), and graduate to an app only if it gets used.

## Tue
- MVP published. Rooms + codes, XP engine, lane leaderboard, feed with cheers, proof notes and photos, levels and badges.
- Access rule verified live: a player can't write into another player's check-ins.
- Open question: how many friends are outside the owner's org? They need Editor access, which is the main friction.

## Wed
- PO asked for a personal tracker that makes people stick, instead of a dull dashboard. The reference was "paint a square per completed habit until it gets huge".
- Built **My map**: one check-in = one painted square, placed by hand next to your land; terrain per habit; houses for perfect days; realm names as milestones; replay; save as image. Lobby gets a live map preview card.
- Kept it private (per-user subtree); sharing your map into rooms is a possible next step.

## Thu
- PO: "enrich the visuals so it doesn't become the next default habit tracker." Picked a 3D isometric island + world evolves + discoveries + named regions (skipped ambient animation).
- Rewrote the map renderer as isometric blocks with objects. Discoveries are derived by replaying history, so no extra writes and positions never jump.
- Built a crafted test island to check the waterfall and lagoon render; first pass had mountains too tall and labels too crowded, fixed.

## Fri
- PO: make it as compelling as possible, so people swap doomscrolling for doing and logging habits; research attention and retention for Gen Z and Alpha.
- Research → RESEARCH.md. Biggest takeaways: variable rewards + collection, forgiveness beats punishment (rest days), overnight change as the reason to return, and a clear end to each session.
- Built juice (Web Audio, particles, shake), chests and 18 collectibles, living world, day/night, rest days, morning report, island sharing and visits.
- Test caught: clouds too big (covered the island), item icons too small, Today buried under the collection on phones. All fixed.
- **Where AI was wrong:** I told the PO I couldn't read other GitHub repos. Wrong: public repos clone read-only from the session. After cloning three skill repos and auditing against them: reveals for big moments, three late-game discoveries, a Chronicle, a naming prompt, an odds table.

## Sat
- Read the full GUIDE.md files, not just the checklists. Biggest finds: cosmetic-only discoveries are reskins (novelty that fades in about 10 minutes), and loops need story payoffs.
- Built discovery perks, Pip (a daily companion with lines that react to the island), trauma-based shake, the Calm effects toggle, count-ups, button squish, a "nope" sound, a master limiter and the ocean ambience.
- Test caught Pip grammar ("a observatory", "the dunes is") and Pip staying quiet after the first habit was added. Fixed.

## Sun: Ship
- PO: turn it into a real app. Decisions: installable web app (PWA), Supabase, Google + guest sign-in, its own repo.
- Kept the game engine untouched: it already spoke a small document API, so I wrote a Supabase adapter (paths → Postgres tables + Realtime) and a localStorage demo adapter behind the same interface.
- Migration with row-level security for every table; the shared island copy excludes habit names; room check-ins are visible only to members.
- Verified: 7 adapter unit tests against a fake Supabase client; built-app browser run in demo mode (island → chest → name → reload persists → room → check-in → service worker + manifest); sign-in screen with placeholder Supabase settings. Not verified: a live Supabase project (needs the PO's project; supabase.com is blocked by this environment's network rules).

---

## Retro
- **Shipped vs. planned:**
- **Best decision:**
- **Worst decision:**
- **Where the AI helped most / least:**
- **Something I can now do or explain that I couldn't on Monday:**
- **Score (1–5):** fun ☐ · usefulness ☐ · portfolio value ☐
