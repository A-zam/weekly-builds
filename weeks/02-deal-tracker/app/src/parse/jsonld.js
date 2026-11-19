// Reads schema.org Product data from a page's <script type="application/ld+json"> blocks.
// This is the structured data shops publish on purpose (for Google Shopping and the like),
// so it's the most stable thing to scrape: it survives redesigns that break CSS selectors.
const { parsePrice } = require('../money');

function jsonLdBlocks(html) {
  const out = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (const m of String(html).matchAll(re)) {
    try { out.push(JSON.parse(m[1].trim())); } catch { /* skip broken blocks, keep the rest */ }
  }
  return out;
}

const hasType = (node, type) => {
  const t = node && node['@type'];
  return Array.isArray(t) ? t.includes(type) : t === type;
};

// Walks @graph, arrays, ItemList.itemListElement[].item, etc.
function findProducts(node, acc = []) {
  if (Array.isArray(node)) { node.forEach((n) => findProducts(n, acc)); return acc; }
  if (!node || typeof node !== 'object') return acc;
  if (hasType(node, 'Product')) acc.push(node);
  for (const key of ['@graph', 'itemListElement', 'item', 'mainEntity']) {
    if (node[key]) findProducts(node[key], acc);
  }
  return acc;
}

const first = (x) => (Array.isArray(x) ? x[0] : x);
const text = (x) => (typeof x === 'string' ? x : x?.name ?? null);

function offerPrices(offers) {
  const list = (Array.isArray(offers) ? offers : [offers]).filter(Boolean);
  for (const o of list) {
    const currency = o.priceCurrency || o.priceSpecification?.priceCurrency;
    if (currency && !/^(UZS|SUM|СУМ)$/i.test(currency)) continue;
    const price = parsePrice(o.price ?? o.lowPrice ?? first(o.priceSpecification)?.price);
    if (!price) continue;

    // Google's convention for the crossed-out price: a StrikethroughPrice/ListPrice spec.
    let oldPrice = null;
    for (const spec of [].concat(o.priceSpecification || [])) {
      if (/(Strikethrough|List)Price$/.test(spec.priceType || '')) oldPrice = parsePrice(spec.price);
    }
    const availability = String(o.availability || '');
    return { price, oldPrice, inStock: availability ? /InStock|LimitedAvailability|PreOrder/i.test(availability) : true };
  }
  return null;
}

/** All products on the page, normalized to the shape the DB expects. Skips anything without a usable price. */
function productsFromHtml(html, pageUrl) {
  const items = [];
  for (const p of findProducts(jsonLdBlocks(html))) {
    const offer = offerPrices(p.offers);
    if (!offer) continue;
    const url = p.url || first(p.offers)?.url || pageUrl;
    if (!p.name || !url) continue;
    items.push({
      externalId: String(p.sku || p.productID || p.mpn || url),
      title: String(p.name).trim(),
      url: new URL(url, pageUrl).href,
      brand: text(first(p.brand)),
      image: typeof first(p.image) === 'string' ? first(p.image) : first(p.image)?.url ?? null,
      ...offer,
    });
  }
  return items;
}

module.exports = { productsFromHtml, jsonLdBlocks };
