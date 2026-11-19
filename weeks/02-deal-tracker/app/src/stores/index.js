// Every store the project knows about, with an honest status.
//
//   ready        adapter works and is tested against live pages
//   needs-probe  site is reachable, but where its prices live hasn't been confirmed yet
//   blocked      site shows a bot challenge to our requests; we don't try to get around that
//
// An adapter is an object with { id, name, origin, status, notes } and, when ready,
// `async *scrape(fetcher, opts)` that yields normalized items:
//   { externalId, title, url, price, oldPrice, inStock, brand?, category?, image? }
const { productsFromHtml } = require('../parse/jsonld');

/** Helper for stores that publish schema.org Product data: give it page URLs, get items. */
function jsonLdPages(pages) {
  return async function* scrape(fetcher, { log = () => {} } = {}) {
    for (const { url, category } of pages) {
      const { text, url: finalUrl } = await fetcher.get(url);
      const items = productsFromHtml(text, finalUrl);
      log(`  ${url} → ${items.length} products`);
      for (const it of items) yield { ...it, category: it.category ?? category ?? null };
    }
  };
}

const notReady = (store) => async function* scrape() {
  throw new Error(`${store.name}: adapter status is "${store.status}". ${store.notes}`);
};

const STORES = [
  {
    id: 'texnomart',
    name: 'Texnomart',
    origin: 'https://texnomart.uz',
    status: 'needs-probe',
    notes: 'Nuxt app; product lists render client-side from gw.texnomart.uz. robots.txt disallows every URL '
      + 'with a query string ("Disallow:*?"), so pagination must use plain paths. Homepage JSON-LD is only '
      + 'Organization/Store; product pages not checked yet.',
  },
  {
    id: 'idea',
    name: 'Idea',
    origin: 'https://idea.uz',
    status: 'needs-probe',
    notes: 'Next.js app backed by api.idea.inweb.uz. Homepage has no product data or JSON-LD. Has a /sales page. '
      + 'Product pages not checked yet.',
  },
  { id: 'uzum', name: 'Uzum Market', origin: 'https://uzum.uz', status: 'blocked',
    notes: 'Cloudflare challenge on every request from our server (datacenter IP). Needs an official feed, '
      + 'a partner/affiliate API, or a test from an Uzbek connection.' },
  { id: 'mediapark', name: 'Mediapark', origin: 'https://mediapark.uz', status: 'blocked',
    notes: 'Cloudflare challenge from our server.' },
  { id: 'asaxiy', name: 'Asaxiy', origin: 'https://asaxiy.uz', status: 'blocked',
    notes: 'Cloudflare challenge from our server.' },
  { id: 'elmakon', name: 'Elmakon', origin: 'https://elmakon.uz', status: 'blocked',
    notes: 'TLS certificate check fails from our server; not investigated yet.' },
];

for (const s of STORES) if (!s.scrape) s.scrape = notReady(s);

const byId = (id) => STORES.find((s) => s.id === id);

module.exports = { STORES, byId, jsonLdPages };
