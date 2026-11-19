# Journal: Week 02 (Chegirma)

Keep it to 2–4 lines a day: what moved, what's stuck, what got decided.

## Mon: Pick
- No pick on Monday: week 01 (Navbat) ran over. Picked Thursday Nov 19.
- Candidates considered: a seasonal-bargain hunter for Uzbekistan (PO's idea, not in the backlog), Bank CSV → Budget, Typing Racer.
- Picked because: it's the PO's own idea, it's timely (Black Friday Nov 27), and a data pipeline plus scraping adds range after a CRUD + real-time app.
- MVP in one line: track daily prices at 2 Uzbek stores and call out which sale "discounts" are real and which are fake, by comparing each price to its own 30-day history.
- **Rotation break:** by the playbook this week should be 📐 Blueprint. Stayed 🤖 Autopilot because of the late start and the Black Friday deadline. Blueprint moves to week 03.
- Category: 💼 Micro-SaaS, not 🏙️ Real-life, to keep the "no repeat" rule.

## Tue
-

## Wed
-

## Thu
- Brief written. Reachability check of 6 stores from the build server: Uzum, Mediapark and Asaxiy return a Cloudflare bot challenge; Elmakon fails TLS; Texnomart and Idea respond.
- Decision: no getting around bot challenges. Blocked stores need an official feed or a partner API.
- Texnomart's robots.txt disallows every URL with a query string. The scraper enforces robots.txt, so its pagination will have to use plain paths.
- Built the store-independent core: SQLite price history, real/fake discount scoring, polite fetcher (robots.txt, Crawl-delay, backoff, request budget, stops at challenges), JSON-LD product parser, store registry, CLI, synthetic demo. 26 tests, all offline.
- A test caught a bug: a used-up request budget was reported as a network error.
- Blocked: working out where Texnomart and Idea serve their prices needs the PO's go-ahead (see open questions).
- **Open questions for PO:** which categories matter most? OK to look at the stores' product pages and APIs to build adapters? Anyone with an Uzbek connection who can test Uzum?

## Fri
-

## Sat
-

## Sun: Ship
-

---

## Retro
- **Shipped vs. planned:** what made it, what got cut
- **Best decision:**
- **Worst decision:**
- **Where the AI helped most / least:**
- **Something I can now do or explain that I couldn't on Monday:**
- **Score (1–5):** fun ☐ · usefulness ☐ · portfolio value ☐
