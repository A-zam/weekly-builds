// Shared helpers for all pages.
const TZ = 'Asia/Tashkent';

async function api(path, { method = 'GET', body, pin } = {}) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (pin) headers['X-Staff-Pin'] = pin;
  try {
    const res = await fetch(path, { method, headers, body: body ? JSON.stringify(body) : undefined });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: { error: 'network' } };
  }
}

// Calls refresh() now, on every server update (SSE), every 30 s (wait times tick down),
// and when the tab becomes visible again (phones suspend background tabs).
function live(refresh) {
  let timer;
  const soon = () => { clearTimeout(timer); timer = setTimeout(refresh, 120); };
  const es = new EventSource('/api/events');
  es.addEventListener('update', soon);
  setInterval(refresh, 30_000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  return es;
}

function fmtWait(m) {
  if (m == null) return '—';
  if (m <= 1) return 'hozir';
  if (m < 60) return `~${m} daqiqa`;
  const h = Math.floor(m / 60), r = m % 60;
  return `~${h} soat${r ? ` ${r} daq` : ''}`;
}

function fmtClock(ms) {
  return new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false })
    .format(new Date(ms));
}
const clockIn = (minutes) => fmtClock(Date.now() + minutes * 60_000);

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// "+998905608875" → "+998 90 560 88 75" (easier to read aloud when calling a patient)
function fmtPhone(p) {
  const m = String(p || '').match(/^\+998(\d{2})(\d{3})(\d{2})(\d{2})$/);
  return m ? `+998 ${m[1]} ${m[2]} ${m[3]} ${m[4]}` : String(p || '');
}

const $ = (sel, root = document) => root.querySelector(sel);

const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
  del(k) { try { localStorage.removeItem(k); } catch {} },
};

async function loadClinicName() {
  const { ok, data } = await api('/api/clinic');
  if (ok) {
    document.querySelectorAll('[data-clinic]').forEach((el) => (el.textContent = data.name));
    if (!document.title.startsWith(data.name)) document.title = `${data.name} · ${document.title}`;
  }
  return ok ? data : null;
}
