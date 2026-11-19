const test = require('node:test');
const assert = require('node:assert/strict');
const { openDb, recordObservation, history, deals, tashkentDay } = require('../src/db');
const { scrapeStore } = require('../src/scrape');
const { jsonLdPages } = require('../src/stores');

const item = (over = {}) => ({ externalId: 'p1', title: 'Phone', url: 'https://s.example/p1', price: 1_000_000, oldPrice: null, ...over });
const day = (n) => new Date(Date.parse('2026-11-27T00:00:00Z') + n * 86_400_000).toISOString().slice(0, 10);

test('Tashkent day is UTC+5', () => {
  assert.equal(tashkentDay(Date.parse('2026-11-26T19:30:00Z')), '2026-11-27');
  assert.equal(tashkentDay(Date.parse('2026-11-26T18:30:00Z')), '2026-11-26');
});

test('one price row per product per day; a second scrape the same day overwrites', () => {
  const db = openDb();
  recordObservation(db, 's', item(), { day: day(0) });
  const id = recordObservation(db, 's', item({ price: 900_000, oldPrice: 1_200_000, title: 'Phone v2' }), { day: day(0) });
  const h = history(db, id);
  assert.equal(h.length, 1);
  assert.equal(h[0].price, 900_000);
  assert.equal(h[0].oldPrice, 1_200_000);
  assert.equal(db.prepare('SELECT title FROM products').get().title, 'Phone v2');
});

test('same external id in two stores = two products', () => {
  const db = openDb();
  recordObservation(db, 'a', item(), { day: day(0) });
  recordObservation(db, 'b', item(), { day: day(0) });
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM products').get().n, 2);
});

test('crossed-out price not above the price is stored as NULL; bad items are rejected', () => {
  const db = openDb();
  const id = recordObservation(db, 's', item({ oldPrice: 900_000 }), { day: day(0) });
  assert.equal(history(db, id)[0].oldPrice, null);
  assert.throws(() => recordObservation(db, 's', item({ price: 0 })));
  assert.throws(() => recordObservation(db, 's', item({ title: '' })));
});

test('deals(): scores today against history and sorts best first, skipping out-of-stock', () => {
  const db = openDb();
  for (let d = -30; d <= -1; d++) {
    recordObservation(db, 's', item({ externalId: 'cut', price: 1_000_000 }), { day: day(d) });
    recordObservation(db, 's', item({ externalId: 'bigcut', price: 1_000_000 }), { day: day(d) });
    recordObservation(db, 's', item({ externalId: 'fake', price: 1_000_000 }), { day: day(d) });
    recordObservation(db, 's', item({ externalId: 'gone', price: 1_000_000 }), { day: day(d) });
  }
  recordObservation(db, 's', item({ externalId: 'cut', price: 880_000 }), { day: day(0) });
  recordObservation(db, 's', item({ externalId: 'bigcut', price: 700_000 }), { day: day(0) });
  recordObservation(db, 's', item({ externalId: 'fake', price: 990_000, oldPrice: 1_800_000 }), { day: day(0) });
  recordObservation(db, 's', item({ externalId: 'gone', price: 500_000, inStock: false }), { day: day(0) });

  const real = deals(db, { day: day(0), verdicts: ['real'] });
  assert.deepEqual(real.map((d) => d.title && d.verdict), ['real', 'real']);
  assert.ok(real[0].price === 700_000 && real[1].price === 880_000);
  assert.equal(deals(db, { day: day(0), verdicts: ['fake'] }).length, 1);
  assert.equal(deals(db, { day: day(0) }).length, 3);
});

test('scrapeStore(): end to end with a JSON-LD store and a fake network', async () => {
  const page = `<script type="application/ld+json">${JSON.stringify({
    '@type': 'Product', name: 'Kettle', sku: 'K1', url: 'https://s.example/k1',
    offers: { price: 289000, priceCurrency: 'UZS' },
  })}</script>`;
  const fetchImpl = async (url) => (url.endsWith('/robots.txt')
    ? new Response('User-agent: *\nDisallow:', { status: 200 })
    : new Response(page, { status: 200 }));
  const store = { id: 'test', name: 'Test', scrape: jsonLdPages([{ url: 'https://s.example/c/kettles', category: 'kettles' }]) };

  const db = openDb();
  const n = await scrapeStore(db, store, { fetcherOpts: { fetchImpl, sleepImpl: async () => {} }, log: () => {}, day: day(0) });
  assert.equal(n, 1);
  assert.equal(db.prepare('SELECT category FROM products').get().category, 'kettles');
  const run = db.prepare('SELECT ok, items, requests FROM runs').get();
  assert.deepEqual({ ...run }, { ok: 1, items: 1, requests: 2 });
});

test('scrapeStore(): a failing store is logged as a failed run, not a crash', async () => {
  const db = openDb();
  const store = { id: 'bad', name: 'Bad', scrape: async function* () { throw new Error('boom'); } };
  await scrapeStore(db, store, { log: () => {} });
  const run = db.prepare('SELECT ok, error FROM runs').get();
  assert.equal(run.ok, 0);
  assert.equal(run.error, 'boom');
});
