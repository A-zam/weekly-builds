// The core idea of the project: judge a discount by the product's own price
// history, not by the crossed-out "old price" the store prints next to it.
//
//   real discount    = how far today's price is below the 30-day median
//   claimed discount = how far today's price is below the store's crossed-out price
//
// A big claimed discount with no real discount is the classic pre-sale trick:
// raise the price (or just the crossed-out price) a few weeks before 11.11 or
// Black Friday, then "cut" it back to where it was.

const DEFAULTS = {
  windowDays: 30,      // how far back "normal price" looks
  minDays: 7,          // fewer observed days than this → not enough history to judge
  realPct: 0.10,       // ≥10% under the median counts as a real deal
  smallPct: 0.03,      // 3–10% is a small real drop
  fakeClaimPct: 0.15,  // store claims ≥15% off...
  fakeRealPct: 0.05,   // ...but it's <5% under the median → fake
  inflatedOld: 1.05,   // crossed-out price >5% above anything actually charged in the window
};

const DAY_MS = 86_400_000;
const dayNum = (day) => Date.parse(`${day}T00:00:00Z`) / DAY_MS;

function median(sorted) {
  const m = sorted.length >> 1;
  return sorted.length % 2 ? sorted[m] : (sorted[m - 1] + sorted[m]) / 2;
}

/**
 * @param {object} p
 * @param {number} p.price      today's price, so'm
 * @param {number|null} p.oldPrice  the store's crossed-out price, if any
 * @param {{day:string, price:number}[]} p.history  past daily prices (today is ignored if present)
 * @param {string} p.today      'YYYY-MM-DD'
 */
function scoreDeal({ price, oldPrice = null, history = [], today }, opts = {}) {
  const o = { ...DEFAULTS, ...opts };
  const t = dayNum(today);
  const prior = history
    .filter((h) => h.price > 0 && dayNum(h.day) < t && dayNum(h.day) >= t - o.windowDays)
    .map((h) => h.price)
    .sort((a, b) => a - b);

  const claimedPct = oldPrice && oldPrice > price ? (oldPrice - price) / oldPrice : 0;
  const base = { price, oldPrice, claimedPct: round(claimedPct), days: prior.length };

  if (prior.length < o.minDays) {
    return { ...base, verdict: 'learning', realPct: null, score: 0, flags: [] };
  }

  const med = median(prior);
  const min = prior[0];
  const max = prior[prior.length - 1];
  const realPct = (med - price) / med;

  const flags = [];
  if (price < min) flags.push('lowest');                 // cheapest in the whole window
  if (oldPrice && oldPrice > max * o.inflatedOld) flags.push('inflated_old_price');

  let verdict;
  if (realPct >= o.realPct) verdict = 'real';
  else if (claimedPct >= o.fakeClaimPct && realPct < o.fakeRealPct) verdict = 'fake';
  else if (realPct >= o.smallPct) verdict = 'small';
  else if (realPct <= -o.smallPct) verdict = 'up';
  else verdict = 'none';

  // Rank by real saving; being the lowest price in the window is a small bonus.
  const score = verdict === 'real' || verdict === 'small'
    ? Math.min(100, Math.round(realPct * 100 + (flags.includes('lowest') ? 10 : 0)))
    : 0;

  return { ...base, verdict, realPct: round(realPct), median: Math.round(med), min, max, score, flags };
}

const round = (x) => Math.round(x * 1000) / 1000;

module.exports = { scoreDeal, DEFAULTS };
