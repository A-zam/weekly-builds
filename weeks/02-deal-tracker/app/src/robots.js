// Minimal robots.txt support (RFC 9309): user-agent groups, Allow/Disallow,
// "*" and "$" wildcards, longest match wins, Allow wins a tie.
// The scraper refuses any URL a store's robots.txt disallows.

function parseRobots(text) {
  const groups = [];
  let current = null;
  let lastWasAgent = false;
  for (const rawLine of String(text || '').split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, '').trim();
    const m = line.match(/^([a-zA-Z-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const key = m[1].toLowerCase();
    const value = m[2].trim();
    if (key === 'user-agent') {
      if (!lastWasAgent) { current = { agents: [], rules: [] }; groups.push(current); }
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
    } else {
      lastWasAgent = false;
      if (!current) continue;
      if (key === 'allow' || key === 'disallow') {
        if (key === 'disallow' && value === '') continue;    // "Disallow:" = allow everything
        current.rules.push({ allow: key === 'allow', pattern: value });
      } else if (key === 'crawl-delay') {
        const n = Number(value);
        if (Number.isFinite(n)) current.crawlDelay = n;
      }
    }
  }
  return groups;
}

function groupFor(groups, userAgent) {
  const ua = userAgent.toLowerCase();
  const token = ua.split('/')[0];
  return groups.find((g) => g.agents.some((a) => a !== '*' && token.includes(a)))
    || groups.find((g) => g.agents.includes('*'))
    || null;
}

function patternToRegex(pattern) {
  // Patterns are matched against path + query. Some stores write "Disallow:*?" with no leading slash.
  const anchoredEnd = pattern.endsWith('$');
  const body = (anchoredEnd ? pattern.slice(0, -1) : pattern)
    .split('*').map((s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*');
  return new RegExp(`^${body}${anchoredEnd ? '$' : ''}`);
}

function isAllowed(groups, userAgent, pathAndQuery) {
  const g = groupFor(groups, userAgent);
  if (!g) return true;
  let best = null;
  for (const r of g.rules) {
    const re = patternToRegex(r.pattern.startsWith('/') || r.pattern.startsWith('*') ? r.pattern : `/${r.pattern}`);
    if (!re.test(pathAndQuery)) continue;
    const len = r.pattern.length;
    if (!best || len > best.len || (len === best.len && r.allow)) best = { len, allow: r.allow };
  }
  return best ? best.allow : true;
}

function crawlDelay(groups, userAgent) {
  return groupFor(groups, userAgent)?.crawlDelay ?? null;
}

module.exports = { parseRobots, isAllowed, crawlDelay };
