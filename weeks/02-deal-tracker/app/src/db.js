// Price history in SQLite (Node's built-in node:sqlite, no dependencies).
// One row per product per Tashkent day: if a store is scraped twice in a day,
// the later observation wins.
const { DatabaseSync } = require('node:sqlite');
const { scoreDeal } = require('./score');
const { cleanOldPrice } = require('./money');

const TZ = 'Asia/Tashkent';

function tashkentDay(ms = Date.now()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date(ms));
}

function openDb(path = ':memory:') {
  const db = new DatabaseSync(path);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS products (
      id          INTEGER PRIMARY KEY,
      store       TEXT NOT NULL,
      external_id TEXT NOT NULL,          -- the store's own id/SKU, or the URL when it has none
      title       TEXT NOT NULL,
      url         TEXT NOT NULL,
      category    TEXT,
      brand       TEXT,
      image       TEXT,
      first_seen  TEXT NOT NULL,          -- Tashkent day
      last_seen   TEXT NOT NULL,
      UNIQUE (store, external_id)
    );
    CREATE TABLE IF NOT EXISTS prices (
      product_id INTEGER NOT NULL REFERENCES products(id),
      day        TEXT NOT NULL,           -- Tashkent day, YYYY-MM-DD
      price      INTEGER NOT NULL CHECK (price > 0),
      old_price  INTEGER,                 -- store's crossed-out price; NULL if none or not above price
      in_stock   INTEGER NOT NULL DEFAULT 1,
      seen_at    INTEGER NOT NULL,        -- epoch ms
      PRIMARY KEY (product_id, day)
    );
    CREATE TABLE IF NOT EXISTS runs (
      id          INTEGER PRIMARY KEY,
      store       TEXT NOT NULL,
      started_at  INTEGER NOT NULL,
      finished_at INTEGER,
      ok          INTEGER,
      items       INTEGER NOT NULL DEFAULT 0,
      requests    INTEGER NOT NULL DEFAULT 0,
      error       TEXT
    );
    CREATE INDEX IF NOT EXISTS prices_day ON prices(day);
  `);
  return db;
}

/** Save one observed item. `item` is the normalized shape every store adapter returns. */
function recordObservation(db, store, item, { day = tashkentDay(), now = Date.now() } = {}) {
  if (!item || !item.externalId || !item.title || !item.url || !(item.price > 0)) {
    throw new Error(`invalid item from ${store}: ${JSON.stringify(item)}`);
  }
  db.prepare(`
    INSERT INTO products (store, external_id, title, url, category, brand, image, first_seen, last_seen)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT (store, external_id) DO UPDATE SET
      title = excluded.title, url = excluded.url,
      category = COALESCE(excluded.category, category),
      brand = COALESCE(excluded.brand, brand),
      image = COALESCE(excluded.image, image),
      last_seen = excluded.last_seen
  `).run(store, String(item.externalId), item.title, item.url, item.category ?? null,
    item.brand ?? null, item.image ?? null, day, day);

  const { id } = db.prepare('SELECT id FROM products WHERE store = ? AND external_id = ?')
    .get(store, String(item.externalId));

  db.prepare(`
    INSERT INTO prices (product_id, day, price, old_price, in_stock, seen_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT (product_id, day) DO UPDATE SET
      price = excluded.price, old_price = excluded.old_price,
      in_stock = excluded.in_stock, seen_at = excluded.seen_at
  `).run(id, day, item.price, cleanOldPrice(item.price, item.oldPrice),
    item.inStock === false ? 0 : 1, now);
  return id;
}

function history(db, productId) {
  return db.prepare('SELECT day, price, old_price AS oldPrice FROM prices WHERE product_id = ? ORDER BY day')
    .all(productId);
}

/**
 * Every in-stock product seen on `day`, scored against its own history.
 * Sorted best real deal first. `verdicts` filters, e.g. ['real'] or ['fake'].
 */
function deals(db, { day = tashkentDay(), verdicts = null, store = null, limit = 50 } = {}) {
  const rows = db.prepare(`
    SELECT p.id, p.store, p.title, p.url, p.category, p.brand, x.price, x.old_price AS oldPrice
    FROM prices x JOIN products p ON p.id = x.product_id
    WHERE x.day = ? AND x.in_stock = 1 AND (? IS NULL OR p.store = ?)
  `).all(day, store, store);

  const scored = rows.map((r) => ({
    ...r,
    ...scoreDeal({ price: r.price, oldPrice: r.oldPrice, history: history(db, r.id), today: day }),
  }));
  return scored
    .filter((d) => !verdicts || verdicts.includes(d.verdict))
    .sort((a, b) => b.score - a.score || b.claimedPct - a.claimedPct)
    .slice(0, limit);
}

function startRun(db, store, now = Date.now()) {
  return Number(db.prepare('INSERT INTO runs (store, started_at) VALUES (?, ?)').run(store, now).lastInsertRowid);
}

function finishRun(db, runId, { ok, items = 0, requests = 0, error = null }, now = Date.now()) {
  db.prepare('UPDATE runs SET finished_at = ?, ok = ?, items = ?, requests = ?, error = ? WHERE id = ?')
    .run(now, ok ? 1 : 0, items, requests, error, runId);
}

module.exports = { openDb, tashkentDay, recordObservation, history, deals, startRun, finishRun };
