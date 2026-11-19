// A deliberately polite HTTP client for scraping:
// - identifies itself honestly (no browser disguise)
// - obeys robots.txt and its Crawl-delay
// - at most one request at a time per host, with a minimum gap between them
// - backs off on 429/5xx and honours Retry-After
// - stops when a store answers with a bot challenge, instead of trying to get around it
const { parseRobots, isAllowed, crawlDelay } = require('./robots');

const USER_AGENT = 'ChegirmaBot/0.1 (price-history research; +https://github.com/a-zam/weekly-builds)';

class FetchError extends Error {
  constructor(code, message, extra = {}) {
    super(message);
    this.code = code;
    Object.assign(this, extra);
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function createFetcher({
  userAgent = USER_AGENT,
  minDelayMs = 3000,
  timeoutMs = 20000,
  retries = 2,
  maxRequests = 200,          // hard cap per run, per fetcher
  fetchImpl = globalThis.fetch,
  sleepImpl = sleep,
  now = () => Date.now(),
} = {}) {
  const robotsCache = new Map();   // origin → parsed groups
  const lastHit = new Map();       // host → epoch ms
  let requests = 0;

  async function raw(url, headers = {}) {
    if (requests >= maxRequests) throw new FetchError('budget', `request budget of ${maxRequests} used up`);
    requests++;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      return await fetchImpl(url, { headers: { 'user-agent': userAgent, ...headers }, signal: ctrl.signal, redirect: 'follow' });
    } finally {
      clearTimeout(timer);
    }
  }

  async function robotsFor(origin) {
    if (robotsCache.has(origin)) return robotsCache.get(origin);
    let groups;
    try {
      const res = await raw(`${origin}/robots.txt`);
      if (res.ok) groups = parseRobots(await res.text());
      else if (res.status >= 400 && res.status < 500) groups = [];   // no robots.txt → allowed
      else groups = parseRobots('User-agent: *\nDisallow: /');       // server error → stay away
    } catch (e) {
      if (e.code === 'budget') throw e;
      groups = parseRobots('User-agent: *\nDisallow: /');
    }
    robotsCache.set(origin, groups);
    return groups;
  }

  async function throttle(host, groups) {
    const delay = Math.max(minDelayMs, (crawlDelay(groups, userAgent) ?? 0) * 1000);
    const last = lastHit.get(host);
    if (last !== undefined) {
      const wait = last + delay - now();
      if (wait > 0) await sleepImpl(wait);
    }
    lastHit.set(host, now());
  }

  async function get(url, { accept = 'text/html,application/json' } = {}) {
    const u = new URL(url);
    const groups = await robotsFor(u.origin);
    if (!isAllowed(groups, userAgent, u.pathname + u.search)) {
      throw new FetchError('robots', `robots.txt disallows ${u.pathname}${u.search}`, { url });
    }

    for (let attempt = 0; ; attempt++) {
      await throttle(u.host, groups);
      let res;
      try {
        res = await raw(url, { accept });
      } catch (e) {
        if (e.code === 'budget') throw e;
        if (attempt >= retries) throw new FetchError('network', `${url}: ${e.message}`, { url });
        await sleepImpl(2000 * 2 ** attempt);
        continue;
      }
      if (res.headers.get('cf-mitigated') === 'challenge') {
        throw new FetchError('challenge', `${u.host} answered with a bot challenge; not scraping it from here`, { url, status: res.status });
      }
      if (res.ok) return { url: res.url || url, status: res.status, text: await res.text() };
      if ((res.status === 429 || res.status >= 500) && attempt < retries) {
        const retryAfter = Number(res.headers.get('retry-after'));
        await sleepImpl(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 5000 * 2 ** attempt);
        continue;
      }
      throw new FetchError('http', `${url}: HTTP ${res.status}`, { url, status: res.status });
    }
  }

  async function getJson(url) {
    const { text, ...rest } = await get(url, { accept: 'application/json' });
    return { ...rest, json: JSON.parse(text) };
  }

  return { get, getJson, get requests() { return requests; } };
}

module.exports = { createFetcher, FetchError, USER_AGENT };
