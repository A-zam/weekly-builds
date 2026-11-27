# Habit Arena: engagement research

**The goal (from the PO):** make the personal island compelling enough that people, mostly Gen Z and Gen Alpha (born 2006 or later), open it *instead of* doomscrolling, and then actually go and do their habits.

**The line we hold:** the island should pull you in to *log a real habit*, then let you go. It has no infinite feed, no paid currency, no shame and no punishment you can't undo. The end of each day's loop is a screen that says "go live your day."

## What the research says, and what we built from it

| Finding | Source | Mechanic in Habit Arena |
|---|---|---|
| Game feel ("juice") makes the core action satisfying, but effects shown all the time become noise | [itch.io](https://itch.io/blog/1059831/making-a-game-feel-juicy-with-simple-effects), [arXiv 2011.09201](https://arxiv.org/pdf/2011.09201) | Painting a square makes a synthesized sound whose pitch climbs with each square you paint that day, a particle burst, a brief screen shake and a floating "+1"; a perfect day adds confetti. Effects fire only on real events. |
| Variable-ratio rewards roughly doubled playtime and persistence in lab studies; the effect depends on the ratio | [APS 2017](https://www.psychologicalscience.org/conventions/archive/2017annual/paper/4033/), [Princeton TR](https://www.cs.princeton.edu/techreports/2012/931.pdf) | Each painted square has a 20% chance of a chest. A perfect day always gives one, with better odds. |
| Unlocking exclusive content and personalising are the top reasons Gen Z and Gen Alpha spend in games | [PocketGamer.biz (Newzoo)](https://www.pocketgamer.biz/50-of-gen-z-and-gen-alpha-make-in-game-purchases) | 18 collectibles in 4 rarities (common → legendary); they appear and live on *your* island; collection book. |
| Finch (self-care pet) reportedly has D1/D7 retention of 54%/37%; its loop is care tasks → rewards → the pet visibly progresses | [Deconstructor of Fun](https://www.deconstructoroffun.com/blog/x0hd2ssr80y5n7gv0w967pg7hwd7tl) | Creatures move around (sheep, deer, fox, ducks, a whale circling the island, a baby dragon flying overhead); the land itself grows as it ages. |
| Broken streaks reduce later engagement; a single missed day barely affects habit formation (Lally 2010) | [Decision Lab](https://thedecisionlab.com/insights/consumer-insights/streak-creep-the-perils-of-too-much-gamification), [BPS on Lally](https://bps.org.uk/research-digest/how-form-habit) | **Rest days:** each 7-day run earns one (hold up to 2); a missed day spends one and the run continues. **Wilting** land always revives, and reviving gives a guaranteed chest. |
| Duolingo: learners with a 7-day streak are 2.4× as likely to come back the next day; streak experiments move D7/D14 retention | [Duolingo blog](https://blog.duolingo.com/how-duolingo-streak-builds-habit), [Duolingo engineering](https://making.duolingo.com/how-streaks-keep-duolingo-learners-committed-to-their-language-goals) | Days-in-a-row counter with rest-day protection; growth accelerates on a 5+ day streak ("Growing fast"). |
| Endowed progress: a pre-stamped loyalty card got 34% redemption vs 19% for an empty one (Nunes & Drèze 2006) | [Nunes & Drèze](https://msbfile03.usc.edu/digitalmeasures/jnunes/intellcont/Endowed%20Progress%20Effect-1.pdf) | Your first square always gives a chest; "next discovery" bar (e.g. *Lighthouse 43/50*); realm progress bar; today's progress pips counting toward the chest. |
| Cozy games: people play to decompress; daily rhythm and change that happens overnight | [Sago](https://sago.com/en/resources/insights/the-rise-of-cozy-gaming-across-borders/) | Morning report ("overnight, 18 squares grew"); "tomorrow, N squares will have grown"; day/night on your real clock (dusk tint, stars, lit windows, lighthouse beam). |
| Gen Z daily rituals live on the home screen and with close friends (Locket, BeReal) | [TechCrunch](https://techcrunch.com/2025/11/03/lockets-social-app-is-picking-up-steam-with-gen-alpha) | Opt-in: share your island with friends in your rooms and visit theirs. |
| Self-determination theory: autonomy, competence and relatedness predict enjoyment and continued play | [Ryan, Rigby & Przybylski 2006](https://link.springer.com/content/pdf/10.1007%2Fs11031-006-9051-8.pdf) | Autonomy: you choose where every square goes. Competence: realms, discoveries, regions. Relatedness: rooms and island visits. |
| Friction breaks are what actually reduce compulsive app opening; replacing scrolling needs something worth doing | [CHI '24, one sec](https://www.medien.ifi.lmu.de/pubdb/publications/pub/haliburton2024chi/haliburton2024chi.pdf) | The session *ends*: "All painted for today. Now go live your day." There's nothing to scroll. |

## Open-source audit (skills read in full)
Public repos turned out to be cloneable read-only from the session, so these were read in full: `rondorkerin/gamestack` (pacing, game feel, onboarding checklists), `rshankras/claude-code-apple-skills` (feedback audit, sound design) and `gamedev-skills/awesome-gamedev-agent-skills` (simulator economy). Habit Arena audited against them:

| Rule from the skills | Before | Change |
|---|---|---|
| Signature events need ≥2 feedback channels; climaxes must be unmistakably the biggest (feedback audit) | Realm-ups and discoveries were toasts only | Full-screen reveals for realms and discoveries, with their own sound and art; chests keep the shake-and-open sequence |
| Mid-game sag: schedule novelty; don't front-load everything (pacing) | Nothing new after 100 squares | 3 later discoveries: Harbor (150 squares), Lantern festival (25 perfect days), Observatory (300 squares) |
| Layer one-time arc payoffs over loops (pacing §D) | No story | **Chronicle**: timeline of founding, realms, discoveries, rare finds and run milestones (7/21/66/100/365 days; 66 = Lally's average) |
| Ethics test: missing 3 days should lose nothing concrete, only a bonus (pacing §D) | Passed (rest days, revivable wilting) | Kept |
| Personalisation before the first setback (onboarding §D) | Naming the island was hidden behind a button | Name-your-island prompt right after the first chest |
| Don't fire one fixed-pitch sample per repeated action (game feel §C) | Pitch ladder only | ±1.75% pitch variation; soft UI clicks |
| Build the odds panel and the roll from the same list (economy) | "1 in 5" stated, rarity odds hidden | Odds table generated from `RARITY`, the same table `rollItem` uses |

## Round 2: the full guides
After the checklists, the full GUIDE.md files were read too: pacing and player journey, game feel and juice, onboarding and teaching, UI/UX and feedback (gamestack), plus feedback recipes and audio design (awesome-gamedev-agent-skills).

| Guide rule | Change |
|---|---|
| **Pacing §C.3:** a reskin alone keeps interest for about 10 minutes; novelty has to change gameplay | Every discovery now unlocks a **perk**: Fishing boat → 35% chest chance on your first square of the day; Lighthouse → save 3 rest days; Old ruins → epic and legendary twice as likely; Standing stones → better perfect-day chests; Ancient tree → faster growth; Waterfall → lakes and peaks grow faster; Lagoon → wilting starts at 5 days instead of 3; Balloon → bonus chest every 7-day run; Harbor → duplicates become new items; Lantern festival → two chests on perfect days; Observatory → 50% chest chance after 7 pm. Locked cards say "Unlocks a perk" (*show the lock before the key*). |
| **Pacing §D.2 (Hades):** every session needs a story payoff, like fresh dialogue | **Pip, the island keeper**: a companion with new lines each day. Lines are chosen from your island's state (overnight growth, rest days used, wilting habits, how close the next discovery is, today's progress) plus a daily-shuffled pool of lore and habit-science lines. Pip also reacts to your first square, a revived habit, a perfect day and a new region. |
| **Pacing §D.3, ethics:** reward showing up, never punish absence | Perks only add bonuses; the Lagoon perk makes wilting gentler still |
| **Game feel §C.5 / feedback recipes §1:** trauma-based shake (`trauma²`, smooth layered sines, linear decay), never random per-frame noise | Shake builds when you paint quickly and decays smoothly |
| **Game feel §C.7, §F:** never animate a value linearly; buttons squish on press | Count-up animation on the square total; buttons squish to 0.94× when pressed |
| **Game feel §C.9:** rarity ladder; save the top effects for the rarest events | Confetti only on perfect days, epic or legendary finds, new realms and discoveries |
| **UI §C.4:** success and failure need separate signal vocabularies | Distinct low "nope" sound on an invalid tap |
| **UI §E.4 / feedback recipes §4:** shake and flashing effects must be optional | **Calm effects** toggle (less shake, particles and confetti), separate from sound; still follows the system reduce-motion setting |
| **Audio design:** don't let stacked sounds clip; quiet ambience carries the calm moments | Master gain with a compressor/limiter; a very quiet ocean ambience on the island that starts after your first tap, stops when you leave, and follows the mute button |

## Claude skills found on GitHub
- `rshankras/claude-code-apple-skills`: *game-feel* (celebration choreography, haptic/SFX layers, auditing that every event gives feedback)
- `rondorkerin/gamestack`: *pacing-and-the-player-journey* (appointment mechanics, compulsion loops, retention ethics), *onboarding-and-teaching*
- `gamedev-skills/awesome-gamedev-agent-skills`: genre and discipline skills (reward loops, UI/UX)
- `MoJuiceX/wojak-ink`: *game-juice* for canvas games (tones, haptics, tweens)

Worth installing if this graduates to a real app: the game-feel and pacing skills.

## Not built yet (ideas, ranked)
1. **"Do it now" 2-minute timer**: start a habit right from the island (the two-minute rule), so the app triggers doing as well as logging.
2. **Home-screen presence** (PWA or native widget showing today's island): the Locket lesson.
3. **Daily bounty**: one small random goal per day ("paint 2 touching squares") for novelty.
4. **Island visits with reactions** (leave a 👏 on a friend's island).
5. **Seasonal events** (winter snow, spring blossoms) for novelty over months.
