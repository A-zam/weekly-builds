# Week 02: Chegirma (is that discount real?)

> Tracks prices at Uzbek online stores every day, and on sale days tells you which "-50%" banners are real price cuts and which are the old price raised the week before.

**Category:** 💼 Micro-SaaS (consumer tool, data pipeline) · **Mode:** 🤖 Autopilot · **Dates:** Mon Nov 16 – Sun Nov 22, 2026 (started Thu Nov 19) · **Language:** Uzbek (Latin) UI, Russian later

**▶ Demo:** `npm run demo` (synthetic data, see below) · _live deals page: not yet_

## The problem
Around 11.11, Black Friday (Nov 27, 2026), New Year and Navruz, Uzbek stores and marketplaces are full of "-40%", "-60%" banners. Shoppers can't tell a real cut from a fake one. The crossed-out price is whatever the store says it is, and a common trick is to raise the price (or just the crossed-out price) a couple of weeks before the sale, then "discount" it back to normal.

Today people follow Telegram deal channels, which mostly repost the store's own banner, or they check prices by hand across Uzum, Texnomart, Mediapark and others.

**Chegirma** judges each discount by the product's **own price history** instead of the store's banner:

```
real discount    = how far today's price is below its 30-day median
claimed discount = how far today's price is below the store's crossed-out price
```

| Verdict | Rule (defaults) | Example |
|---|---|---|
| **REAL** | ≥ 10% below the 30-day median | was 4 200 000 all month, today 3 490 000 |
| small | 3–10% below | |
| **FAKE** | store claims ≥ 15% off, but < 5% below the median | "-40%!", but it's the same price as three weeks ago |
| UP | ≥ 3% above the median | |
| learning | fewer than 7 days of history: no verdict yet | |

Extra flags: `lowest` (cheapest in the 30-day window) and `inflated_old_price` (the crossed-out price is more than 5% above anything the store actually charged in the window).

## MVP scope (set Thursday, late start)
**In:**
- [x] Price-history database: one row per product per day (Tashkent time)
- [x] Real-discount scoring + fake-discount detection, with tests
- [x] Polite scraper core: honest user agent, robots.txt, crawl delay, backoff, request budget, stops at bot challenges
- [x] Store adapter interface + a parser for schema.org Product data (JSON-LD)
- [ ] **Working adapters for 2 stores** (Texnomart and Idea are reachable; see status below)
- [ ] Daily scheduled scrape (GitHub Actions cron), electronics categories only
- [ ] Deals page (static, mobile-first): top real deals, fake-discount list, price chart per product
- [ ] Telegram channel post: today's top real deals

**Out (on purpose):**
- Matching the same product across stores (hard; later)
- Uzum, Mediapark, Asaxiy: they show our server a Cloudflare bot challenge, and we don't try to get around that
- User accounts, price alerts for a specific product, browser extension
- Groceries and fashion (prices too noisy, too many variants)

**The deadline that matters:** Black Friday is Nov 27. A verdict needs at least 7 days of history, so a store's daily scrape has to start by **Nov 20** to have verdicts on Black Friday. Starting later means every Black Friday price shows as "learning". 12.12 and New Year are the fallback tests.

## Store status

| Store | Status | What we know |
|---|---|---|
| Texnomart | 🔍 needs probe | Reachable. Nuxt app; products load client-side from its own API gateway. robots.txt disallows **every URL with a query string**, so pagination via `?page=` is off-limits. |
| Idea | 🔍 needs probe | Reachable. Next.js app with its own API host. Has a `/sales` page. |
| Uzum Market | ⛔ blocked | Cloudflare challenge on every request from our server. Options: official/partner feed, or test from an Uzbek connection. |
| Mediapark | ⛔ blocked | Cloudflare challenge. |
| Asaxiy | ⛔ blocked | Cloudflare challenge. |
| Elmakon | ⛔ blocked | TLS certificate check fails from our server. Not investigated. |

`npm run scrape -- --status` prints the same table from the code (`app/src/stores/index.js`).

## How it works
```
stores/*.js ──(polite fetcher: robots.txt, delays, budget)──► normalized items
   │                                                            │
   │      { externalId, title, url, price, oldPrice, inStock }  ▼
   └──────────────────────────────────────────────► SQLite: products, prices (1 row/day), runs
                                                                │
                                         score.js: today vs. own 30-day history
                                                                ▼
                                              deals list → page / Telegram post
```

## Stack
- **Node.js 22**, built-in `node:sqlite` and `fetch`. **Zero dependencies**, same as Navbat.
- Tests with `node:test`. No test touches the network: the fetcher takes a fake `fetch`.
- Planned: GitHub Actions cron for the daily scrape, a static page for the deals list, the Telegram Bot API for posts.

## Run it locally
Needs Node.js 22.5+.
```bash
cd weeks/02-deal-tracker/app
npm test                     # 26 tests: scoring, parsing, robots.txt, fetcher, DB
npm run demo                 # scoring on SYNTHETIC products with invented 30-day histories
npm run scrape -- --status   # which stores are ready / blocked and why
npm run scrape               # scrape all ready stores into app/prices.db
npm run deals                # today's real deals   (--fake, --all, --day YYYY-MM-DD)
```

## Who did what
| | |
|---|---|
| **Human decisions** | The problem (seasonal sales in Uzbekistan) and the go-ahead to start this week. Still open: which stores and categories matter most. |
| **Delegated to AI** | Brief; scraper architecture; scoring rules and thresholds; DB; polite fetcher; JSON-LD parser; tests; reachability check of 6 stores. |
| **Verification** | 26 unit tests with synthetic data and a fake network. Synthetic demo checked by hand against the expected verdicts. |
| **Where AI was wrong** | The request-budget error came out labelled as a network error. A test caught it. |

## What's missing / next
- Store adapters: confirm where Texnomart and Idea publish product prices (product-page JSON-LD first, since that is data shops publish on purpose), then write and test the adapters.
- Daily cron, deals page, Telegram post.
- Thresholds (10% / 15% / 5%, 30-day window) are first guesses; tune once real histories exist.
- Ask stores or marketplaces about official feeds or partner/affiliate APIs, especially Uzum.
