#!/usr/bin/env node
// Daily scrape: run each ready store, save today's prices.
//   npm run scrape                 → all stores with status "ready"
//   npm run scrape -- texnomart     → one store (fails clearly if it isn't ready)
//   npm run scrape -- --status      → list stores and their status
// Meant to run once a day (cron / GitHub Actions). Running twice in a day just overwrites today's row.
const path = require('node:path');
const { openDb, recordObservation, startRun, finishRun, tashkentDay } = require('./db');
const { createFetcher } = require('./http');
const { STORES, byId } = require('./stores');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'prices.db');

async function scrapeStore(db, store, { fetcherOpts = {}, log = console.log, day = tashkentDay() } = {}) {
  const fetcher = createFetcher(fetcherOpts);
  const runId = startRun(db, store.id);
  let items = 0;
  try {
    for await (const item of store.scrape(fetcher, { log })) {
      try {
        recordObservation(db, store.id, item, { day });
        items++;
      } catch (e) {
        log(`  skipped item: ${e.message}`);
      }
    }
    finishRun(db, runId, { ok: true, items, requests: fetcher.requests });
    log(`${store.name}: ${items} prices saved (${fetcher.requests} requests)`);
  } catch (e) {
    finishRun(db, runId, { ok: false, items, requests: fetcher.requests, error: e.message });
    log(`${store.name}: FAILED after ${items} items: ${e.message}`);
  }
  return items;
}

async function main(argv) {
  if (argv.includes('--status')) {
    for (const s of STORES) console.log(`${s.status.padEnd(12)} ${s.id.padEnd(10)} ${s.notes}`);
    return;
  }
  const wanted = argv.filter((a) => !a.startsWith('--'));
  const stores = wanted.length ? wanted.map((id) => byId(id) || die(`unknown store: ${id}`))
    : STORES.filter((s) => s.status === 'ready');
  if (!stores.length) {
    console.log('No store adapters are ready yet. See `npm run scrape -- --status`.');
    return;
  }
  const db = openDb(DB_PATH);
  for (const s of stores) await scrapeStore(db, s);
}

function die(msg) { console.error(msg); process.exit(1); }

if (require.main === module) main(process.argv.slice(2));

module.exports = { scrapeStore };
