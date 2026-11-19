const test = require('node:test');
const assert = require('node:assert/strict');
const { scoreDeal } = require('../src/score');

const TODAY = '2026-11-27';
const day = (n) => new Date(Date.parse(`${TODAY}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
// price(d) for d = -30..-1
const hist = (price, from = -30) => Array.from({ length: -from }, (_, i) => from + i)
  .map((d) => ({ day: day(d), price: typeof price === 'function' ? price(d) : price }))
  .filter((h) => h.price);

test('a real price cut is a real deal, and the lowest price in the window gets flagged', () => {
  const r = scoreDeal({ price: 3_490_000, oldPrice: 4_990_000, history: hist(4_200_000), today: TODAY });
  assert.equal(r.verdict, 'real');
  assert.equal(r.median, 4_200_000);
  assert.ok(r.realPct > 0.16 && r.realPct < 0.17);
  assert.ok(r.flags.includes('lowest'));
  assert.ok(r.score >= 26);
});

test('price raised two weeks before the sale, then "cut" back: fake', () => {
  const r = scoreDeal({
    price: 5_390_000, oldPrice: 8_990_000,
    history: hist((d) => (d > -14 ? 6_900_000 : 5_400_000)), today: TODAY,
  });
  assert.equal(r.verdict, 'fake');
  assert.ok(r.claimedPct > 0.39);
  assert.ok(r.flags.includes('inflated_old_price'));
  assert.equal(r.score, 0);
});

test('a big claimed discount with a tiny real drop is fake', () => {
  const r = scoreDeal({ price: 7_600_000, oldPrice: 11_400_000, history: hist(7_800_000), today: TODAY });
  assert.equal(r.verdict, 'fake');
});

test('a real drop with no banner still counts', () => {
  assert.equal(scoreDeal({ price: 900_000, history: hist(1_000_000), today: TODAY }).verdict, 'real');
  assert.equal(scoreDeal({ price: 950_000, history: hist(1_000_000), today: TODAY }).verdict, 'small');
});

test('price increases and flat prices', () => {
  assert.equal(scoreDeal({ price: 1_100_000, history: hist(1_000_000), today: TODAY }).verdict, 'up');
  assert.equal(scoreDeal({ price: 1_000_000, history: hist(1_000_000), today: TODAY }).verdict, 'none');
});

test('not enough history → "learning", never a verdict', () => {
  const r = scoreDeal({ price: 500_000, oldPrice: 990_000, history: hist(690_000, -5), today: TODAY });
  assert.equal(r.verdict, 'learning');
  assert.equal(r.days, 5);
  assert.equal(r.score, 0);
});

test('only the 30 days before today count: older history and today itself are ignored', () => {
  const history = [
    ...hist(1_000_000),
    { day: day(-60), price: 10 },          // ancient outlier
    { day: TODAY, price: 1 },              // today's own row
  ];
  const r = scoreDeal({ price: 1_000_000, history, today: TODAY });
  assert.equal(r.days, 30);
  assert.equal(r.median, 1_000_000);
  assert.equal(r.verdict, 'none');
});

test('crossed-out price at or below the real price is not a claimed discount', () => {
  assert.equal(scoreDeal({ price: 1_000_000, oldPrice: 1_000_000, history: hist(1_000_000), today: TODAY }).claimedPct, 0);
  assert.equal(scoreDeal({ price: 1_000_000, oldPrice: 900_000, history: hist(1_000_000), today: TODAY }).claimedPct, 0);
});
