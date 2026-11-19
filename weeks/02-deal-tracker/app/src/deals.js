#!/usr/bin/env node
// Print today's deals from the price database.
//   npm run deals                       → best real deals today
//   npm run deals -- --fake             → "discounts" that aren't real
//   npm run deals -- --all --day 2026-11-27
const path = require('node:path');
const { openDb, deals, tashkentDay } = require('./db');
const { formatSum } = require('./money');

const LABEL = {
  real: 'REAL', small: 'small', fake: 'FAKE', none: '-', up: 'UP', learning: 'learning',
};

function printDeals(list) {
  if (!list.length) { console.log('(nothing)'); return; }
  for (const d of list) {
    const claimed = d.claimedPct ? `store says -${Math.round(d.claimedPct * 100)}%` : 'no claimed discount';
    const pct = d.realPct === null ? null : Math.round(d.realPct * 100);
    const real = pct === null ? `only ${d.days} days of history`
      : `vs 30-day median ${formatSum(d.median)}: ${pct > 0 ? '-' : pct < 0 ? '+' : '±'}${Math.abs(pct)}%`;
    const flags = d.flags?.length ? `  [${d.flags.join(', ')}]` : '';
    console.log(`${LABEL[d.verdict].padEnd(8)} ${d.store.padEnd(10)} ${d.title}`);
    console.log(`         ${formatSum(d.price)}  ·  ${claimed}  ·  ${real}${flags}`);
  }
}

function main(argv) {
  const arg = (name) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : null; };
  const db = openDb(process.env.DB_PATH || path.join(__dirname, '..', 'prices.db'));
  const day = arg('--day') || tashkentDay();
  const verdicts = argv.includes('--all') ? null : argv.includes('--fake') ? ['fake'] : ['real', 'small'];
  printDeals(deals(db, { day, verdicts, limit: Number(arg('--limit')) || 30 }));
}

if (require.main === module) main(process.argv.slice(2));

module.exports = { printDeals };
