const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { parsePrice, formatSum, cleanOldPrice } = require('../src/money');
const { productsFromHtml } = require('../src/parse/jsonld');

test('parsePrice handles the ways stores print so\'m', () => {
  assert.equal(parsePrice('12 499 000 so\'m'), 12_499_000);
  assert.equal(parsePrice('12 499 000 сум'), 12_499_000);
  assert.equal(parsePrice('12 499 000'), 12_499_000);
  assert.equal(parsePrice('12,499,000'), 12_499_000);
  assert.equal(parsePrice('12499000.00'), 12_499_000);
  assert.equal(parsePrice('1 290 000 UZS'), 1_290_000);
  assert.equal(parsePrice(3490000), 3_490_000);
  for (const bad of [null, undefined, '', 'narxi so\'rang', '0', -5, NaN]) assert.equal(parsePrice(bad), null);
});

test('formatSum and cleanOldPrice', () => {
  assert.equal(formatSum(12_499_000), '12 499 000 so\'m');
  assert.equal(cleanOldPrice(100, 150), 150);
  assert.equal(cleanOldPrice(100, 100), null);
  assert.equal(cleanOldPrice(100, null), null);
});

test('reads schema.org products, skips non-UZS, unpriced and broken blocks', () => {
  const html = fs.readFileSync(path.join(__dirname, 'fixtures', 'product-jsonld.html'), 'utf8');
  const items = productsFromHtml(html, 'https://shop.example/catalog/phones');
  assert.deepEqual(items.map((i) => i.externalId), ['EX-128', 'K-1']);

  const [phone, kettle] = items;
  assert.equal(phone.title, 'Example Phone X 128GB');
  assert.equal(phone.price, 3_490_000);
  assert.equal(phone.oldPrice, 4_990_000);
  assert.equal(phone.brand, 'ExampleBrand');
  assert.equal(phone.url, 'https://shop.example/p/example-phone-x');   // relative offer URL resolved
  assert.equal(phone.image, 'https://shop.example/img/x.jpg');
  assert.equal(phone.inStock, true);

  assert.equal(kettle.price, 289_000);
  assert.equal(kettle.oldPrice, null);
  assert.equal(kettle.inStock, false);
});

test('a page with no JSON-LD gives no products', () => {
  assert.deepEqual(productsFromHtml('<html><body>hi</body></html>', 'https://x.example/'), []);
});
