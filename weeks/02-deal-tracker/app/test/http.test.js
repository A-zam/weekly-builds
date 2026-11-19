const test = require('node:test');
const assert = require('node:assert/strict');
const { parseRobots, isAllowed, crawlDelay } = require('../src/robots');
const { createFetcher } = require('../src/http');

const UA = 'ChegirmaBot/0.1';

test('robots.txt: query strings blocked by "Disallow:*?" (as one store uses)', () => {
  const g = parseRobots('User-agent: *\nDisallow:*?\nDisallow:*search\n');
  assert.equal(isAllowed(g, UA, '/ru/katalog/smartfony/'), true);
  assert.equal(isAllowed(g, UA, '/ru/katalog/smartfony/?page=2'), false);
  assert.equal(isAllowed(g, UA, '/product/search'), false);
});

test('robots.txt: longest match wins, Allow wins ties, specific agent group beats *', () => {
  const g = parseRobots([
    'User-agent: *', 'Disallow: /', '',
    'User-agent: chegirmabot', 'Disallow: /cabinet/', 'Allow: /cabinet/public', 'Crawl-delay: 5',
  ].join('\n'));
  assert.equal(isAllowed(g, UA, '/catalog/tv'), true);
  assert.equal(isAllowed(g, UA, '/cabinet/cart'), false);
  assert.equal(isAllowed(g, UA, '/cabinet/public/x'), true);
  assert.equal(isAllowed(g, 'OtherBot/1', '/catalog/tv'), false);
  assert.equal(crawlDelay(g, UA), 5);
  assert.equal(isAllowed(parseRobots('User-agent: *\nDisallow:\n'), UA, '/anything'), true);
  assert.equal(isAllowed(parseRobots('User-agent: *\nDisallow: /*.pdf$\n'), UA, '/a.pdf'), false);
  assert.equal(isAllowed(parseRobots('User-agent: *\nDisallow: /*.pdf$\n'), UA, '/a.pdf.html'), true);
});

// A fake fetch that serves canned responses and records calls.
function fakeFetch(routes) {
  const calls = [];
  const impl = async (url, init) => {
    calls.push({ url, ua: init.headers['user-agent'] });
    const r = routes[url];
    const next = Array.isArray(r) ? r.shift() : r;
    if (!next) return new Response('not found', { status: 404 });
    if (next instanceof Error) throw next;
    return new Response(next.body ?? '', { status: next.status ?? 200, headers: next.headers ?? {} });
  };
  return { impl, calls };
}

function clock() {
  let t = 1_000_000;
  const slept = [];
  return { now: () => t, sleep: async (ms) => { slept.push(ms); t += ms; }, slept };
}

test('fetcher: obeys robots, identifies itself, spaces out requests per host', async () => {
  const c = clock();
  const f = fakeFetch({
    'https://s.example/robots.txt': { body: 'User-agent: *\nDisallow:*?\nCrawl-delay: 4' },
    'https://s.example/a': { body: 'A' },
    'https://s.example/b': { body: 'B' },
  });
  const fetcher = createFetcher({ fetchImpl: f.impl, sleepImpl: c.sleep, now: c.now, minDelayMs: 1000 });

  assert.equal((await fetcher.get('https://s.example/a')).text, 'A');
  assert.equal((await fetcher.get('https://s.example/b')).text, 'B');
  await assert.rejects(fetcher.get('https://s.example/a?page=2'), { code: 'robots' });

  assert.ok(f.calls.every((x) => x.ua.startsWith('ChegirmaBot/')));
  assert.equal(f.calls.filter((x) => x.url.endsWith('robots.txt')).length, 1);   // cached
  assert.deepEqual(c.slept, [4000]);                                              // Crawl-delay beats minDelay
  assert.equal(fetcher.requests, 3);
});

test('fetcher: missing robots.txt means allowed; robots server error means stay away', async () => {
  const ok = createFetcher({ fetchImpl: fakeFetch({ 'https://a.example/x': { body: 'x' } }).impl, sleepImpl: async () => {} });
  assert.equal((await ok.get('https://a.example/x')).text, 'x');

  const down = createFetcher({
    fetchImpl: fakeFetch({ 'https://b.example/robots.txt': { status: 503 } }).impl, sleepImpl: async () => {},
  });
  await assert.rejects(down.get('https://b.example/x'), { code: 'robots' });
});

test('fetcher: retries 429 using Retry-After, then succeeds', async () => {
  const c = clock();
  const f = fakeFetch({
    'https://r.example/p': [{ status: 429, headers: { 'retry-after': '7' } }, { body: 'ok' }],
  });
  const fetcher = createFetcher({ fetchImpl: f.impl, sleepImpl: c.sleep, now: c.now, minDelayMs: 0 });
  assert.equal((await fetcher.get('https://r.example/p')).text, 'ok');
  assert.ok(c.slept.includes(7000));
});

test('fetcher: stops at a bot challenge instead of retrying', async () => {
  const f = fakeFetch({
    'https://cf.example/p': { status: 403, headers: { 'cf-mitigated': 'challenge' }, body: 'Just a moment...' },
  });
  const fetcher = createFetcher({ fetchImpl: f.impl, sleepImpl: async () => {} });
  await assert.rejects(fetcher.get('https://cf.example/p'), { code: 'challenge' });
  assert.equal(f.calls.filter((x) => x.url === 'https://cf.example/p').length, 1);
});

test('fetcher: hard request budget per run', async () => {
  const f = fakeFetch({ 'https://q.example/1': { body: '1' }, 'https://q.example/2': { body: '2' } });
  const fetcher = createFetcher({ fetchImpl: f.impl, sleepImpl: async () => {}, maxRequests: 2 });
  await fetcher.get('https://q.example/1');                       // robots.txt + page = 2
  await assert.rejects(fetcher.get('https://q.example/2'), { code: 'budget' });
});
