#!/usr/bin/env node
// Shows the scoring on SYNTHETIC data: made-up products in a made-up "demo" store,
// with 30 days of invented price history each. No real store's prices are used here.
const { openDb, recordObservation, deals } = require('./db');
const { printDeals } = require('./deals');

const TODAY = '2026-11-27'; // Black Friday 2026
const shift = (n) => new Date(Date.parse(`${TODAY}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);

// Each scenario: price for days -30..-1, then today's price and crossed-out price.
const SCENARIOS = [
  { title: 'Smartfon A, 128 GB',      past: (d) => 4_200_000,                          today: 3_490_000, old: 4_990_000 }, // real cut
  { title: 'Kir yuvish mashinasi B',  past: (d) => (d > -14 ? 6_900_000 : 5_400_000),  today: 5_390_000, old: 8_990_000 }, // raised then "cut" = fake
  { title: 'Televizor C, 55"',        past: (d) => 7_800_000,                          today: 7_600_000, old: 11_400_000 }, // huge claim, tiny real drop
  { title: 'Changyutgich D',          past: (d) => 1_450_000 + (d % 3) * 20_000,       today: 1_360_000, old: null },       // small real drop, no banner
  { title: 'Noutbuk E, 16 GB',        past: (d) => 9_990_000,                          today: 8_490_000, old: 9_990_000 },  // real, honest old price
  { title: 'Muzlatgich F',            past: (d) => 5_200_000,                          today: 5_490_000, old: null },       // price went up
  { title: 'Quloqchin G',             past: (d) => (d > -5 ? 690_000 : null),          today: 590_000,   old: 990_000 },    // too new to judge
];

const db = openDb(':memory:');
SCENARIOS.forEach((s, i) => {
  const base = { externalId: `demo-${i}`, title: s.title, url: `https://example.com/demo/${i}` };
  for (let d = -30; d <= -1; d++) {
    const price = s.past(d);
    if (price) recordObservation(db, 'demo', { ...base, price, oldPrice: null }, { day: shift(d) });
  }
  recordObservation(db, 'demo', { ...base, price: s.today, oldPrice: s.old }, { day: TODAY });
});

console.log(`SYNTHETIC DEMO, "today" = ${TODAY}\n`);
console.log('Real deals:'); printDeals(deals(db, { day: TODAY, verdicts: ['real', 'small'] }));
console.log('\nFake discounts:'); printDeals(deals(db, { day: TODAY, verdicts: ['fake'] }));
console.log('\nEverything else:'); printDeals(deals(db, { day: TODAY, verdicts: ['none', 'up', 'learning'] }));
