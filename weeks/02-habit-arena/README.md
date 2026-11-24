# Week 02: Habit Arena (competitive habit rooms)

> Make a room, invite friends with a code, and compete on shared habits. Every check-in earns XP, streaks multiply it, and a leaderboard shows who's keeping their promises.

**Category:** Micro-SaaS / Social · **Mode:** 🤖 Autopilot · **Dates:** Mon Nov 23 – Sun Nov 29, 2026

**▶ Demo (MVP):** [Habit Arena on claude.ai](https://claude.ai/artifact/MD1PZZPu6CS3P5RrfcNRL5): private until shared from its Share menu

## The problem
Habit trackers are lonely. You tick boxes for a week and then stop, because nobody notices. Friend groups already try to fix this with group chats ("did everyone work out today?"), but there's no score, no streaks, and no record.

## MVP scope (set on Monday)
The plan is to ship it as a **claude.ai artifact** first, because sharing, sign-in and storage come built in. If people actually use it, it becomes a real app.

**In:**
- [x] Rooms with a 6-character join code and an invite link (`…#CODE`)
- [x] Shared room habits (up to 8) plus up to 3 personal habits per member (creator can turn these off)
- [x] Custom challenge length (start/end dates; upcoming → active → finished states)
- [x] XP: +10 per check-in, streak multiplier (×1.5 from day 3, ×2 from day 7, ×2.5 from day 14), +25 for a perfect day
- [x] Levels (Rookie → Mythic) and 10 badges
- [x] Honor system by default; the creator can require proof (a note or a photo)
- [x] Live leaderboard drawn as running lanes, activity feed, cheers
- [x] Check in for today or yesterday (forgot-to-log grace)

**Out (on purpose):**
- Push reminders and notifications (needs a real app)
- Friend verification or voting on proof
- Cross-room profile or global level
- Weekly sub-seasons inside a long challenge

## How it works
One page; all data lives in the artifact's document store.

| Path | Who writes | What's in it |
|------|-----------|--------------|
| `rooms/<CODE>` | any player (UI: creator only) | name, dates, shared habits, proof/personal toggles |
| `rooms/<CODE>/members/<uid>` | the player | membership index, so the room can list who's in |
| `people/<uid>` | **only that player** (access rule) | player name |
| `people/<uid>/rooms/<CODE>` | **only that player** (access rule) | personal habits, check-in log, cheers given |

XP, streaks, levels and badges are **never stored**. They're recomputed from the check-in log by one pure `score()` function, so they can't drift and anyone can audit them. The leaderboard subscribes to each member's log doc live.

Access rules: `people` is readable by everyone, and each `people/<uid>` subtree is writable only by its owner (`{self}` rule). Checked after publishing: a write into someone else's subtree is refused.

## Stack
- Single HTML file, vanilla JS, no build
- claude.ai artifact capabilities: `db` (document store and access rules), `user` (identity and names), `assets` (proof photos)

## Run it
Open the demo link. To edit: change `artifact/habit-arena.html` and republish it.

## Who did what
| | |
|---|---|
| **Human decisions** | The idea (social, shareable habit competition with XP); shared + personal habits; all XP mechanics; custom challenge length; honor system with optional proof as a room setting; artifact-first, app later |
| **Delegated to AI** | Data model and access rules, XP formula numbers, badge set, UI and visual design, full implementation |
| **Verification** | Headless-browser run against an in-memory mock store (create room, join, check in today and yesterday, cheer, phone width, dark mode, no console errors); live check that the access rule blocks cross-player writes |
| **Where AI was wrong** | First render leaked a literal "null" text node into the room view (`replaceChildren` doesn't skip nulls the way the element helper does); caught in the screenshot and fixed |

## What's missing / next
- Friends outside your claude.ai organization must be added as **Editors** in the Share menu to check in (Viewers can only watch). This sharing friction is the main argument for turning it into a standalone app.
- No reminders. A daily nudge is the first feature an app version needs.
