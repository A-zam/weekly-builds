// Prices are stored as whole so'm (UZS integers). Stores print them many ways:
// "12 499 000 so'm", "12 499 000 сум", "12,499,000", 12499000, "12499000.00".

function parsePrice(raw) {
  if (raw === null || raw === undefined || raw === '') return null;
  if (typeof raw === 'number') return Number.isFinite(raw) && raw > 0 ? Math.round(raw) : null;

  let s = String(raw).replace(/[\s  ]/g, '');
  s = s.replace(/(so['ʻ`’]?m|сум|uzs|sum)$/i, '');
  // A trailing ".00" / ",00" is tiyin, not thousands.
  s = s.replace(/[.,]\d{1,2}$/, '');
  s = s.replace(/[.,]/g, '');
  if (!/^\d+$/.test(s)) return null;
  const n = Number(s);
  return n > 0 ? n : null;
}

// Display: 12499000 → "12 499 000 so'm"
function formatSum(n) {
  if (n === null || n === undefined) return '—';
  return `${String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} so'm`;
}

// A crossed-out price only means something if it is above the selling price.
function cleanOldPrice(price, oldPrice) {
  if (!price || !oldPrice) return null;
  return oldPrice > price ? oldPrice : null;
}

module.exports = { parsePrice, formatSum, cleanOldPrice };
