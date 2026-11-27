/* Habit Arena game: UI, rooms, island engine. Talks to storage only through `platform`. */
export function startApp(platform) {
"use strict";

/* ---------- constants ---------- */
const ARTIFACT_URL = platform.appUrl || "";
const BASE_XP = 10, PERFECT_XP = 25, MAX_SHARED = 8, MAX_PERSONAL = 3, MAX_TRACKED = 40;
const ICONS = ["💧","📚","🏃","🧘","🥗","😴","✍️","💪","🚭","🌅","🧠","🎸","🚶","🧹","💊","📵","🍎","🚴"];
const SUGGEST = [["💧","Drink 2L of water"],["📚","Read 20 pages"],["🏃","Move for 30 min"],["🧘","Meditate 10 min"],["😴","In bed by 23:00"],["📵","No phone first hour"],["🥗","No sugar"],["✍️","Journal"]];
const LEVEL_NAMES = ["Rookie","Regular","Committed","Disciplined","Relentless","Machine","Legend","Mythic"];
const BADGES = [
  { id: "first", icon: "👣", name: "First step", desc: "Check in once", test: s => s.checkins >= 1 },
  { id: "fire3", icon: "🔥", name: "On fire", desc: "3-day streak on a habit", test: s => s.bestStreak >= 3 },
  { id: "week7", icon: "🗓️", name: "Week warrior", desc: "7-day streak on a habit", test: s => s.bestStreak >= 7 },
  { id: "iron14", icon: "🛡️", name: "Unbreakable", desc: "14-day streak on a habit", test: s => s.bestStreak >= 14 },
  { id: "perfect", icon: "⭐", name: "Perfect day", desc: "Every habit done in one day", test: s => s.perfectDays >= 1 },
  { id: "perfect7", icon: "🌟", name: "Perfect week", desc: "7 perfect days in a row", test: s => s.bestPerfectRun >= 7 },
  { id: "early", icon: "🌅", name: "Early bird", desc: "Check in before 7:00", test: s => s.early },
  { id: "owl", icon: "🌙", name: "Night owl", desc: "Check in after 23:00", test: s => s.owl },
  { id: "proof5", icon: "📸", name: "Receipts", desc: "Post 5 proofs", test: s => s.proofs >= 5 },
  { id: "fifty", icon: "💯", name: "Half-century", desc: "50 check-ins", test: s => s.checkins >= 50 },
];
const SVG = {
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  flame: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2.5 1.2-4 2.5-5 .2 1.6 1 2.6 2 3C11 8 11 5 12 2z"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
  copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>',
  gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  crown: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5L3 8z"/></svg>',
  soundOn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>',
  soundOff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 9l5 6M22 9l-5 6"/></svg>',
  camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
};

/* ---------- tiny helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const put = (el, ...kids) => el.replaceChildren(...kids.flat(Infinity).filter(k => k != null && k !== false));
function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  if (attrs) for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k === "svg") el.innerHTML = v; // constant markup only
    else if (k === "style") el.style.cssText = v;
    else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else if (k === "value") el.value = v;
    else if (k === "checked") el.checked = !!v;
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const c of kids.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}
const icon = (name, cls) => h("span", { class: cls || null, svg: SVG[name], "aria-hidden": "true", style: "display:inline-grid" });
const pad = n => String(n).padStart(2, "0");
const ymd = d => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
const parseYmd = s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const addDays = (s, n) => { const d = parseYmd(s); d.setDate(d.getDate() + n); return ymd(d); };
const daysBetween = (a, b) => Math.round((parseYmd(b) - parseYmd(a)) / 864e5);
const todayStr = () => ymd(new Date());
const fmtDate = s => parseYmd(s).toLocaleDateString(undefined, { month: "short", day: "numeric" });
const fmtNum = n => n.toLocaleString();
const rid = (n = 8) => Array.from(crypto.getRandomValues(new Uint8Array(n)), b => "abcdefghijkmnopqrstuvwxyz23456789"[b % 33]).join("");
const newCode = () => Array.from(crypto.getRandomValues(new Uint8Array(6)), b => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[b % 32]).join("");
const clone = o => JSON.parse(JSON.stringify(o || {}));
const isCode = s => /^[A-Z2-9]{6}$/.test(s);
function ago(t) {
  const s = (Date.now() - t) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return Math.floor(s / 60) + " min ago";
  if (s < 86400) return Math.floor(s / 3600) + " h ago";
  if (s < 172800) return "yesterday";
  return new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
function toast(msg, gold) {
  const t = h("div", { class: "toast" + (gold ? " gold" : "") }, msg);
  $("#toasts").append(t);
  setTimeout(() => t.remove(), gold ? 3200 : 2600);
}

/* ---------- scoring (pure) ---------- */
const mult = s => s >= 14 ? 2.5 : s >= 7 ? 2 : s >= 3 ? 1.5 : 1;
function habitList(room, m) {
  const shared = (room && room.habits) || [];
  const personal = room && room.allowPersonal && m && m.personal ? m.personal : [];
  return [...shared.map(x => ({ ...x, kind: "shared" })), ...personal.map(x => ({ ...x, kind: "personal" }))];
}
function score(room, m, asOf) {
  const r = { xp: 0, checkins: 0, perfectDays: 0, bestPerfectRun: 0, bestStreak: 0, proofs: 0, early: false, owl: false, streak: {}, todayDone: 0, todayTotal: 0, days: {} };
  if (!room || !room.start) return r;
  const habits = habitList(room, m), log = (m && m.log) || {};
  const last = room.end < asOf ? room.end : asOf;
  let run = 0;
  for (let d = room.start; d <= last; d = addDays(d, 1)) {
    const day = log[d] || {};
    let dx = 0, active = 0, done = 0;
    for (const hb of habits) {
      if (hb.since && d < hb.since) continue;
      active++;
      const e = day[hb.id];
      if (e) {
        const s = (r.streak[hb.id] || 0) + 1;
        r.streak[hb.id] = s;
        if (s > r.bestStreak) r.bestStreak = s;
        done++; r.checkins++;
        dx += Math.round(BASE_XP * mult(s));
        if (e.note || e.photo) r.proofs++;
        if (e.t) { const hr = new Date(e.t).getHours(); if (hr < 7) r.early = true; if (hr >= 23) r.owl = true; }
      } else if (d < asOf) r.streak[hb.id] = 0;
    }
    const perfect = active > 0 && done === active;
    if (perfect) { dx += PERFECT_XP; r.perfectDays++; run++; if (run > r.bestPerfectRun) r.bestPerfectRun = run; }
    else if (d < asOf) run = 0;
    r.days[d] = { xp: dx, done, active, perfect };
    r.xp += dx;
    if (d === asOf) { r.todayDone = done; r.todayTotal = active; }
  }
  return r;
}
function levelOf(xp) {
  let L = 1;
  while (xp >= 50 * L * (L + 1)) L++;
  const floor = 50 * (L - 1) * L, next = 50 * L * (L + 1);
  const name = LEVEL_NAMES[Math.min(L, LEVEL_NAMES.length) - 1] + (L > LEVEL_NAMES.length ? " " + (L - LEVEL_NAMES.length + 1) : "");
  return { L, name, into: xp - floor, span: next - floor, next };
}
function phase(room, t) {
  if (!room) return "none";
  if (t < room.start) return "upcoming";
  if (t > room.end) return "ended";
  return "active";
}

/* ---------- state ---------- */
const S = {
  status: "loading", db: null, user: null, assets: null, me: null, meInfo: null, canWrite: null, isOwner: false,
  myProfile: {}, myRooms: new Map(), myRoomsLoaded: false, roomCache: new Map(), profiles: {}, room: null,
  day: "today", loadTimedOut: false, feedLimit: 12,
};
const readOnly = () => S.canWrite === false;
const myNick = () => (S.myProfile && S.myProfile.nick) || (S.meInfo && S.meInfo.name) || "";

function nameOf(uid) {
  if (uid === S.me) return myNick() || "You";
  const R = S.room, nick = R && R.nicks.get(uid);
  return nick || (S.profiles[uid] && S.profiles[uid].name) || "Player";
}
function avatarOf(uid, cls) {
  const p = S.profiles[uid] || (uid === S.me && S.meInfo);
  if (p && p.avatarUrl) return h("img", { class: "avatar " + (cls || ""), src: p.avatarUrl, alt: "" });
  return h("span", { class: "avatar " + (cls || ""), style: "display:grid;place-items:center;font-weight:700;font-size:12px;color:var(--muted)" }, (nameOf(uid)[0] || "?").toUpperCase());
}
let profTimer = null;
function wantProfiles(ids) {
  if (!S.user || !ids.length) return;
  const missing = ids.filter(id => !S.profiles[id]);
  clearTimeout(profTimer);
  profTimer = setTimeout(async () => {
    try {
      const ps = await S.user.profiles(ids);
      let changed = missing.length > 0;
      for (const id of ids) { if (!S.profiles[id] || S.profiles[id].name !== ps[id].name) changed = true; S.profiles[id] = ps[id]; }
      if (changed) refresh();
    } catch (_) {}
  }, 30);
}

/* ---------- rendering ---------- */
let raf = 0;
function refresh() { if (!raf) raf = requestAnimationFrame(() => { raf = 0; update(); }); }
function route() {
  const hsh = decodeURIComponent(location.hash.slice(1)).trim().toUpperCase();
  if (hsh === "NEW") return { view: "create" };
  if (hsh === "MAP") return { view: "map" };
  if (isCode(hsh)) return { view: "room", code: hsh };
  return { view: "lobby" };
}
let current = null;
function renderRoute() {
  closeSheet();
  const r = route();
  const view = $("#view");
  view.replaceChildren();
  if (TR.map) { TR.map.destroy(); TR.map = null; SFX.ocean(false); }
  if (TR.thumb) { TR.thumb.destroy(); TR.thumb = null; }
  TR.brush = null;
  if (r.view !== "room" && S.room) leaveRoomSubs();
  const navMap = r.view === "map";
  $("#nav-map").setAttribute("aria-current", navMap ? "page" : "false");
  $("#nav-rooms").setAttribute("aria-current", navMap ? "false" : "page");
  current = r;
  renderMeChip();
  if (S.status === "loading") { view.append(h("div", { class: "center-state" }, h("div", { class: "skeleton", style: "width:min(420px,100%)" }), h("div", { class: "skeleton", style: "width:min(420px,100%)" }), "Opening the arena…")); return; }
  if (S.status === "nodb") { view.append(stateBox("Can't reach your saved data", "Check your connection and reload the app.")); return; }
  if (S.status === "noid") { view.append(stateBox("Sign in to play", "Reload the app and sign in to keep your island and rooms.")); return; }
  if (r.view === "lobby") renderLobby(view);
  else if (r.view === "create") renderCreate(view);
  else if (r.view === "map") renderMapView(view);
  else renderRoom(view, r.code);
  update();
}
function update() {
  renderMeChip();
  if (!current) return;
  if (current.view === "lobby") { updateLobby(); updateMapTeaser(); }
  else if (current.view === "room") updateRoom();
  else if (current.view === "map") updateMapView();
}
function stateBox(title, text, ...extra) { return h("div", { class: "center-state" }, h("h2", null, title), h("p", { style: "max-width:46ch;margin:0" }, text), ...extra); }

function renderMeChip() {
  const slot = $("#me-slot");
  if (!S.me) { slot.replaceChildren(); return; }
  slot.replaceChildren(h("button", { class: "me-chip", onclick: openNickSheet, "aria-label": "Change your player name" }, avatarOf(S.me), h("span", null, myNick() || "Set your name")));
}

/* ----- lobby ----- */
function renderLobby(view) {
  const codeIn = h("input", { type: "text", id: "join-code", maxlength: "6", placeholder: "K7QF2X", "aria-label": "Room code", autocomplete: "off" });
  const join = e => {
    e.preventDefault();
    const c = codeIn.value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!isCode(c)) { toast("Room codes are 6 letters and digits"); return; }
    location.hash = c;
  };
  view.append(
    h("section", { class: "hero" },
      h("h1", null, "Build habits. Beat your friends."),
      h("p", null, "Open a room, invite friends with a code, and earn XP for every habit you keep. Streaks multiply it, perfect days top it up, and the leaderboard settles the argument.")),
    mapTeaser(),
    h("div", { class: "lobby" },
      h("section", { class: "card panel" },
        h("div", { class: "panel-head" }, h("h2", { style: "font-size:20px" }, "Your rooms"),
          h("a", { class: "btn primary" + (readOnly() ? " disabled" : ""), href: "#new", "aria-disabled": readOnly() ? "true" : null, onclick: e => { if (readOnly()) { e.preventDefault(); toast("You need edit access to this page to create rooms"); } } }, icon("plus"), "New room")),
        h("div", { id: "lobby-rooms", class: "rooms" })),
      h("aside", { class: "side" },
        h("form", { class: "card panel", onsubmit: join },
          h("h2", { style: "font-size:18px" }, "Join with a code"),
          h("div", { class: "join-row" }, codeIn, h("button", { class: "btn primary", type: "submit" }, "Join")),
          h("p", { class: "muted", style: "margin:0;font-size:13px" }, "Ask the room creator for the code, or open their invite link.")),
        h("div", { class: "card panel" },
          h("h2", { style: "font-size:18px" }, "How it works"),
          h("ol", { class: "steps" },
            h("li", null, h("span", { class: "n" }, "1"), h("span", null, h("b", null, "Create a room"), " with shared habits and a start and end date.")),
            h("li", null, h("span", { class: "n" }, "2"), h("span", null, h("b", null, "Send the code"), " to friends. Everyone can add up to 3 personal habits.")),
            h("li", null, h("span", { class: "n" }, "3"), h("span", null, h("b", null, "Check in daily."), " Streaks multiply XP; a perfect day adds a bonus."))),
          h("button", { class: "linkish", type: "button", onclick: openRulesSheet }, "See the XP rules")))));
  TR.thumb = createMap($("#teaser-stage"), { label: "Preview of your habit map", maxS: 28, pad: 1.5 });
  if (readOnly()) view.prepend(h("div", { class: "notice warn", style: "margin-bottom:16px" }, "You can look around, but you can't save check-ins. Ask the owner of this page to share it with you as an Editor."));
}
function updateLobby() {
  const box = $("#lobby-rooms");
  if (!box) return;
  const t = todayStr();
  if (!S.myRoomsLoaded) { put(box, h("div", { class: "skeleton" }), h("div", { class: "skeleton" }), S.loadTimedOut ? h("p", { class: "muted" }, "Can't reach your saved rooms yet. Check your connection.") : null); return; }
  if (!S.myRooms.size) {
    box.replaceChildren(h("div", { class: "notice" }, "No rooms yet. Create one and send the code to your friends, or join with a code someone sent you."));
    return;
  }
  const items = [...S.myRooms.entries()].map(([code, m]) => ({ code, m, room: S.roomCache.get(code) }));
  items.sort((a, b) => (b.m.joinedAt || 0) - (a.m.joinedAt || 0));
  box.replaceChildren(...items.map(({ code, m, room }) => {
    if (room === undefined) return h("div", { class: "skeleton" });
    if (room === null) return h("div", { class: "card room-card" },
      h("div", { class: "room-badge", style: "background:var(--lane)" }, "?"),
      h("div", null, h("h3", null, "Room ", h("span", { class: "code-chip" }, code)), h("div", { class: "room-meta" }, "This room was deleted by its creator.")),
      h("button", { class: "btn sm", onclick: () => removeMyRoomDoc(code) }, "Remove"));
    const ph = phase(room, t), sc = score(room, m, t), lv = levelOf(sc.xp);
    const total = daysBetween(room.start, room.end) + 1;
    const status = ph === "upcoming" ? "Starts " + fmtDate(room.start) : ph === "ended" ? "Finished " + fmtDate(room.end) : "Day " + (daysBetween(room.start, t) + 1) + " of " + total;
    const habitsN = habitList(room, m).length;
    return h("a", { class: "card room-card", href: "#" + code },
      h("div", { class: "room-badge" }, (room.name || "?").trim()[0].toUpperCase()),
      h("div", { style: "min-width:0" }, h("h3", null, room.name),
        h("div", { class: "room-meta" }, h("span", null, status),
          ph === "active" ? h("span", null, sc.todayDone + "/" + sc.todayTotal + " today") : h("span", null, habitsN + " habit" + (habitsN === 1 ? "" : "s")))),
      h("div", { class: "room-xp" }, h("b", null, fmtNum(sc.xp) + " XP"), h("small", null, "Lv " + lv.L + " · " + lv.name)));
  }));
}

/* ----- create room ----- */
function habitEditor(list, max, onChange) {
  const box = h("div", { class: "form-section" });
  function draw() {
    box.replaceChildren(
      ...list.map((hb, i) => {
        const sel = h("select", { "aria-label": "Icon", onchange: e => { hb.icon = e.target.value; } }, ...ICONS.map(ic => h("option", { value: ic }, ic)));
        sel.value = hb.icon || ICONS[0];
        return h("div", { class: "habit-edit" }, sel,
          h("input", { type: "text", id: "habit-" + hb.id, value: hb.name, maxlength: "48", placeholder: "e.g. Read 20 pages", "aria-label": "Habit name", oninput: e => { hb.name = e.target.value; } }),
          h("button", { type: "button", class: "icon-btn", svg: SVG.x, "aria-label": "Remove habit", onclick: () => { list.splice(i, 1); draw(); onChange && onChange(); } }));
      }),
      list.length < max ? h("div", { class: "chips" },
        h("button", { type: "button", class: "chip", onclick: () => { list.push({ id: "h" + rid(6), icon: ICONS[list.length % ICONS.length], name: "" }); draw(); const last = list[list.length - 1]; setTimeout(() => { const el = document.getElementById("habit-" + last.id); el && el.focus(); }); } }, "+ Add habit"),
        ...SUGGEST.filter(([, n]) => !list.some(x => x.name.trim().toLowerCase() === n.toLowerCase())).slice(0, 5).map(([ic, n]) =>
          h("button", { type: "button", class: "chip suggest", onclick: () => { list.push({ id: "h" + rid(6), icon: ic, name: n }); draw(); } }, ic + " " + n))) : h("p", { class: "muted", style: "margin:0;font-size:13px" }, "That's the maximum of " + max + " habits."));
  }
  draw();
  return box;
}
function toggleRow(id, title, sub, checked, onchange) {
  return h("label", { class: "toggle", for: id }, h("span", null, h("b", null, title), h("small", null, sub)),
    h("span", { class: "switch" }, h("input", { type: "checkbox", id, checked, onchange: e => onchange(e.target.checked) }), h("i")));
}
function renderCreate(view) {
  if (readOnly()) { view.append(stateBox("You can't create rooms here", "Ask the owner of this page to share it with you as an Editor.", h("a", { class: "btn", href: "#" }, "Back to rooms"))); return; }
  const t = todayStr();
  const f = { name: "", start: t, len: 30, end: addDays(t, 29), allowPersonal: true, proof: false, habits: [{ id: "h" + rid(6), icon: "💧", name: "Drink 2L of water" }, { id: "h" + rid(6), icon: "📚", name: "Read 20 pages" }] };
  const nick = h("input", { type: "text", id: "create-nick", maxlength: "24", value: myNick(), placeholder: "How friends see you" });
  const endOut = h("span", { class: "muted", style: "font-size:13px" });
  const endIn = h("input", { type: "date", id: "create-end", value: f.end, hidden: true, onchange: e => { f.end = e.target.value; showEnd(); } });
  const lens = [7, 14, 21, 30, 0];
  const lenChips = h("div", { class: "chips" });
  function showEnd() {
    if (f.len) f.end = addDays(f.start, f.len - 1);
    endIn.hidden = !!f.len;
    endIn.min = f.start;
    endIn.value = f.end;
    const n = daysBetween(f.start, f.end) + 1;
    endOut.textContent = n > 0 ? "Runs " + fmtDate(f.start) + " to " + fmtDate(f.end) + " · " + n + " days" : "The end date must be after the start date";
    lenChips.replaceChildren(...lens.map(L => h("button", { type: "button", class: "chip", "aria-pressed": String(f.len === L), onclick: () => { f.len = L; showEnd(); } }, L ? L + " days" : "Custom")));
  }
  const startIn = h("input", { type: "date", id: "create-start", value: f.start, min: t, onchange: e => { f.start = e.target.value || t; showEnd(); } });
  showEnd();
  const submit = h("button", { class: "btn primary", type: "submit" }, "Create room");
  view.append(
    h("div", { class: "crumbs" }, h("a", { href: "#" }, icon("back"), "Rooms")),
    h("h1", { style: "font-size:clamp(26px,4vw,36px);font-weight:800;margin-bottom:18px" }, "New room"),
    h("form", { class: "form card panel", onsubmit: async e => {
      e.preventDefault();
      const name = $("#create-name").value.trim();
      const habits = f.habits.map(x => ({ ...x, name: x.name.trim() })).filter(x => x.name);
      if (!name) { toast("Give the room a name"); $("#create-name").focus(); return; }
      if (!habits.length) { toast("Add at least one habit"); return; }
      if (f.end < f.start) { toast("The end date must be after the start date"); return; }
      submit.disabled = true; submit.textContent = "Creating…";
      try {
        await saveNick(nick.value);
        const code = await createRoom({ name: name.slice(0, 40), start: f.start, end: f.end, allowPersonal: f.allowPersonal, proof: f.proof, habits: habits.map(x => ({ id: x.id, icon: x.icon, name: x.name, since: f.start })) });
        location.hash = code;
        toast("Room created. Share the code " + code);
      } catch (err) { writeFailed(err); submit.disabled = false; submit.textContent = "Create room"; }
    } },
      h("label", { class: "field" }, h("span", null, "Room name"), h("input", { type: "text", id: "create-name", maxlength: "40", placeholder: "e.g. December reset", required: true })),
      h("div", { class: "form-section" }, h("span", { class: "label" }, "Challenge length"),
        h("div", { class: "grid2" }, h("label", { class: "field" }, h("span", null, "Starts"), startIn), h("label", { class: "field" }, h("span", null, "Ends"), endIn, endOut)),
        lenChips),
      h("div", { class: "form-section" }, h("span", { class: "label" }, "Shared habits (everyone competes on these)"), habitEditor(f.habits, MAX_SHARED)),
      toggleRow("create-personal", "Personal habits", "Each member can add up to " + MAX_PERSONAL + " of their own. They earn XP too.", f.allowPersonal, v => f.allowPersonal = v),
      toggleRow("create-proof", "Require proof", "Check-ins need a note or a photo. You can change this later.", f.proof, v => f.proof = v),
      h("label", { class: "field" }, h("span", null, "Your player name"), nick),
      h("div", { class: "row", style: "justify-content:flex-end" }, h("a", { class: "btn ghost", href: "#" }, "Cancel"), submit)));
  setTimeout(() => $("#create-name") && $("#create-name").focus());
}

/* ----- room ----- */
function renderRoom(view, code) {
  if (!S.room || S.room.code !== code) enterRoom(code);
  view.append(h("div", { id: "room-root" }));
}
function updateRoom() {
  const root = $("#room-root");
  const R = S.room;
  if (!root || !R) return;
  const t = todayStr();
  if (R.data === undefined) {
    root.replaceChildren(R.timedOut ? stateBox("Can't reach this room yet", "Check your connection. The room will appear as soon as it loads.") : h("div", { class: "center-state" }, h("div", { class: "skeleton", style: "width:min(520px,100%)" }), "Loading room " + R.code + "…"));
    return;
  }
  if (R.data === null) {
    put(root, stateBox("No room with code " + R.code, "Check the code with whoever sent it. Codes are 6 characters, like K7QF2X.", h("a", { class: "btn", href: "#" }, "Back to rooms"), S.myRooms.has(R.code) ? h("button", { class: "btn danger", onclick: () => removeMyRoomDoc(R.code).then(() => location.hash = "") }, "Remove it from my rooms") : null));
    return;
  }
  const room = R.data, ph = phase(room, t);
  const member = S.myRooms.has(R.code);
  const uids = R.members.map(m => m.uid);
  if (member && !uids.includes(S.me)) uids.push(S.me);
  wantProfiles(uids);
  const rows = uids.map(uid => {
    const m = uid === S.me && R.mine ? R.mine : R.logs.get(uid);
    return { uid, m, sc: score(room, m, t) };
  }).sort((a, b) => b.sc.xp - a.sc.xp || b.sc.checkins - a.sc.checkins || nameOf(a.uid).localeCompare(nameOf(b.uid)));

  const total = daysBetween(room.start, room.end) + 1;
  const dayN = Math.min(total, Math.max(0, daysBetween(room.start, t) + 1));
  const isCreator = room.createdBy === S.me;
  const head = h("section", { class: "room-head" },
    h("div", null,
      h("div", { class: "crumbs" }, h("a", { href: "#" }, icon("back"), "Rooms")),
      h("div", { class: "room-title" },
        h("h1", null, room.name),
        h("div", { class: "head-actions" },
          h("button", { class: "btn", onclick: () => copyInvite(R.code, room.name), title: "Copy invite" }, icon("copy"), h("span", { class: "code-chip" }, R.code)),
          member || isCreator ? h("button", { class: "btn", onclick: () => isCreator ? openSettingsSheet() : openRoomInfoSheet(), "aria-label": isCreator ? "Room settings" : "Room info" }, icon("gear"), isCreator ? "Settings" : "Room") : null))),
    h("div", { class: "season" },
      h("div", { class: "season-line" },
        h("b", null, ph === "upcoming" ? "Starts in " + daysBetween(t, room.start) + " day" + (daysBetween(t, room.start) === 1 ? "" : "s") : ph === "ended" ? "Challenge finished" : "Day " + dayN + " of " + total),
        h("span", { class: "muted" }, fmtDate(room.start) + " – " + fmtDate(room.end) + " · " + uids.length + " player" + (uids.length === 1 ? "" : "s") + (room.proof ? " · proof required" : ""))),
      total <= 62
        ? h("div", { class: "ticks", "aria-hidden": "true" }, ...Array.from({ length: total }, (_, i) => h("i", { class: i < dayN - 1 || ph === "ended" ? "past" : i === dayN - 1 && ph === "active" ? "now" : "" })))
        : h("div", { class: "bar" }, h("i", { style: "width:" + (ph === "ended" ? 100 : (dayN / total) * 100) + "%" }))));

  const left = h("div", { class: "col" });
  const right = h("div", { class: "col" });
  if (member) left.append(todayPanel(room, ph, t), meCard(room, rows.find(r => r.uid === S.me), t));
  else left.append(joinPanel(room, ph));
  right.append(boardPanel(room, rows, ph, t), feedPanel(room, uids, t));
  const extra = R.members.length > MAX_TRACKED ? h("p", { class: "muted" }, "Showing the first " + MAX_TRACKED + " players.") : null;
  put(root, head, readOnly() ? h("div", { class: "notice warn", style: "margin-bottom:16px" }, "You're watching. To check in, ask the owner of this page to share it with you as an Editor.") : null, h("div", { class: "room-grid" }, left, right), extra);
}

function allowedDays(room, t) {
  const y = addDays(t, -1);
  return { today: t >= room.start && t <= room.end ? t : null, yesterday: y >= room.start && y <= room.end ? y : null };
}
function todayPanel(room, ph, t) {
  const R = S.room, m = R.mine || {};
  const days = allowedDays(room, t);
  if (!days[S.day]) S.day = days.today ? "today" : "yesterday";
  const date = days[S.day];
  const panel = h("section", { class: "card panel" });
  const headRight = days.today && days.yesterday ? h("div", { class: "seg", role: "group", "aria-label": "Day" },
    h("button", { "aria-pressed": String(S.day === "today"), onclick: () => { S.day = "today"; refresh(); } }, "Today"),
    h("button", { "aria-pressed": String(S.day === "yesterday"), onclick: () => { S.day = "yesterday"; refresh(); } }, "Yesterday")) : null;
  panel.append(h("div", { class: "panel-head" }, h("h2", { style: "font-size:20px" }, date ? (S.day === "today" ? "Today" : "Yesterday") : "Check-ins"), headRight));
  if (!date) {
    panel.append(h("div", { class: "notice" }, ph === "upcoming" ? "Check-ins open on " + fmtDate(room.start) + ". Get your personal habits ready." : "This challenge is over. Final scores are locked in."));
  }
  const habits = habitList(room, m);
  const base = score(room, m, t);
  const shared = habits.filter(x => x.kind === "shared"), personal = habits.filter(x => x.kind === "personal");
  const row = hb => {
    const e = date && (m.log && m.log[date] || {})[hb.id];
    const notYet = date && hb.since && date < hb.since;
    let gain = 0;
    if (date && !notYet) {
      const alt = clone(m); alt.log = alt.log || {}; alt.log[date] = { ...(alt.log[date] || {}) };
      if (e) delete alt.log[date][hb.id]; else alt.log[date][hb.id] = { t: Date.now() };
      gain = Math.abs(score(room, alt, t).xp - base.xp);
    }
    const st = base.streak[hb.id] || 0;
    const btn = h("button", { class: "check", svg: SVG.check, "aria-label": (e ? "Undo " : "Check in ") + hb.name, "aria-pressed": String(!!e), disabled: !date || notYet || readOnly() ? true : null, onclick: () => toggleHabit(hb, date, btn) });
    return h("div", { class: "habit" + (e ? " done" : "") }, btn,
      h("div", { style: "min-width:0" },
        h("div", { class: "habit-name" }, h("span", { class: "ico", "aria-hidden": "true" }, hb.icon || "•"), h("span", null, hb.name)),
        h("div", { class: "habit-sub" },
          st > 0 ? h("span", { class: "streak", title: st + "-day streak" }, icon("flame"), st + "d") : h("span", null, "No streak yet"),
          mult(st + (e ? 0 : 1)) > 1 ? h("span", null, "×" + mult(st + (e ? 0 : 1)) + " XP") : null,
          e && e.note ? h("span", null, "Note added") : null, e && e.photo ? h("span", null, "Photo added") : null)),
      h("div", { class: "habit-right" },
        date && !notYet ? h("span", { class: "xp-chip" }, (e ? "" : "+") + gain + " XP") : null,
        hb.kind === "personal" && !readOnly() ? h("button", { class: "icon-btn", svg: SVG.x, "aria-label": "Remove " + hb.name, onclick: () => confirmRemovePersonal(hb) }) : null));
  };
  panel.append(h("div", { class: "habits" }, shared.map(row)));
  if (room.allowPersonal) {
    panel.append(h("div", { class: "sub-head" }, h("span", { class: "eyebrow" }, "Your habits"),
      personal.length < MAX_PERSONAL && !readOnly() && ph !== "ended" ? h("button", { class: "btn sm", onclick: openAddPersonalSheet }, icon("plus"), "Add") : null));
    panel.append(personal.length ? h("div", { class: "habits" }, personal.map(row)) : h("p", { class: "muted", style: "margin:0;font-size:14px" }, "Add up to " + MAX_PERSONAL + " habits only you track. They count toward your XP and perfect days."));
  }
  if (date) {
    const d = base.days[date] || { done: 0, active: habits.length };
    panel.append(h("p", { class: "muted", style: "margin:0;font-size:13px" },
      d.active && d.done === d.active ? "Perfect day. +" + PERFECT_XP + " XP bonus earned." : (d.active - d.done) + " to go for a perfect day (+" + PERFECT_XP + " XP)."));
  }
  return panel;
}
function meCard(room, row, t) {
  const sc = row ? row.sc : score(room, {}, t);
  const lv = levelOf(sc.xp);
  const panel = h("section", { class: "card panel" });
  panel.append(
    h("div", { class: "me-top" }, avatarOf(S.me, "lg"),
      h("div", { style: "flex:1;min-width:0" }, h("div", { class: "lvl" }, "Lv " + lv.L, h("small", null, lv.name)),
        h("div", { class: "bar gold", style: "margin-top:6px", role: "progressbar", "aria-valuemin": "0", "aria-valuemax": String(lv.span), "aria-valuenow": String(lv.into) }, h("i", { style: "width:" + (lv.into / lv.span * 100) + "%" })),
        h("div", { class: "muted mono", style: "font-size:12px;margin-top:4px" }, fmtNum(lv.into) + " / " + fmtNum(lv.span) + " XP to Lv " + (lv.L + 1)))),
    h("div", { class: "stats" },
      h("div", { class: "stat" }, h("b", { style: "color:var(--xp)" }, fmtNum(sc.xp)), h("span", null, "XP")),
      h("div", { class: "stat" }, h("b", null, sc.checkins), h("span", null, "Check-ins")),
      h("div", { class: "stat" }, h("b", null, sc.perfectDays), h("span", null, "Perfect days")),
      h("div", { class: "stat" }, h("b", { style: "color:var(--flame)" }, sc.bestStreak), h("span", null, "Best streak"))),
    weekGrid(room, row && row.m, t),
    h("div", { class: "panel-head" }, h("span", { class: "eyebrow" }, "Badges · " + BADGES.filter(b => b.test(sc)).length + "/" + BADGES.length), h("button", { class: "linkish", style: "font-size:13px", onclick: openRulesSheet }, "XP rules")),
    badgeGrid(sc));
  return panel;
}
function badgeGrid(sc) {
  return h("div", { class: "badges" }, BADGES.map(b => {
    const got = b.test(sc);
    return h("div", { class: "badge" + (got ? "" : " locked"), title: b.name + ": " + b.desc + (got ? " (earned)" : " (locked)") }, h("div", { class: "medal", "aria-hidden": "true" }, b.icon), h("span", null, b.name));
  }));
}
function weekGrid(room, m, t) {
  const last = room.end < t ? room.end : t;
  if (last < room.start) return null;
  const days = [];
  for (let i = 6; i >= 0; i--) { const d = addDays(last, -i); if (d >= room.start) days.push(d); }
  const sc = score(room, m, t);
  const habits = habitList(room, m);
  const log = (m && m.log) || {};
  return h("div", { class: "week" }, h("table", null,
    h("thead", null, h("tr", null, h("th", { class: "hname" }, h("span", { class: "eyebrow" }, "Last 7 days")),
      ...days.map(d => h("th", { class: sc.days[d] && sc.days[d].perfect ? "perfect" : null, title: sc.days[d] && sc.days[d].perfect ? "Perfect day" : null }, parseYmd(d).toLocaleDateString(undefined, { weekday: "narrow" }))))),
    h("tbody", null, ...habits.map(hb => h("tr", null, h("th", { class: "hname", title: hb.name }, (hb.icon || "") + " " + hb.name),
      ...days.map(d => h("td", { class: hb.since && d < hb.since ? "na" : (log[d] || {})[hb.id] ? "on" : null, title: fmtDate(d) })))))));
}
function joinPanel(room, ph) {
  return h("section", { class: "card panel" },
    h("h2", { style: "font-size:20px" }, "Join this room"),
    h("p", { class: "muted", style: "margin:0" }, ph === "ended" ? "This challenge has finished, so you can only watch." : "You're watching. Join to check in on " + (room.habits || []).length + " shared habit" + ((room.habits || []).length === 1 ? "" : "s") + " and climb the leaderboard."),
    h("div", { class: "habits" }, (room.habits || []).map(hb => h("div", { class: "habit" }, h("span", { style: "font-size:20px", "aria-hidden": "true" }, hb.icon), h("div", { class: "habit-name" }, hb.name), h("span")))),
    ph !== "ended" && !readOnly() ? h("button", { class: "btn primary", onclick: openJoinSheet }, "Join room") : null);
}
function boardPanel(room, rows, ph, t) {
  const panel = h("section", { class: "card panel" });
  panel.append(h("div", { class: "panel-head" }, h("h2", { style: "font-size:20px" }, ph === "ended" ? "Final standings" : "Leaderboard"), h("span", { class: "eyebrow" }, ph === "active" ? "Live" : "")));
  if (ph === "ended" && rows.length && rows[0].sc.xp > 0) {
    panel.append(h("div", { class: "winner" }, h("span", { svg: SVG.crown, "aria-hidden": "true" }), h("div", null, h("div", { class: "eyebrow" }, "Winner"), h("b", null, nameOf(rows[0].uid)), h("div", { class: "muted mono", style: "font-size:13px" }, fmtNum(rows[0].sc.xp) + " XP · " + rows[0].sc.perfectDays + " perfect days"))));
  }
  if (!rows.length) { panel.append(h("div", { class: "notice" }, "No players yet. Send the code " + S.room.code + " to your friends.")); return panel; }
  const top = Math.max(1, rows[0].sc.xp);
  panel.append(h("div", { class: "lanes" }, rows.map((r, i) => {
    const lv = levelOf(r.sc.xp), pct = Math.max(2, r.sc.xp / top * 100);
    const runner = avatarOf(r.uid); runner.className = "runner"; runner.style.left = pct + "%";
    const m = r.m || {};
    const todays = habitList(room, m).filter(hb => !hb.since || t >= hb.since);
    const dayLog = (m.log && m.log[t]) || {};
    const st = Math.max(0, ...Object.values(r.sc.streak));
    return h("button", { class: "lane-row" + (r.uid === S.me ? " me" : ""), onclick: () => openPlayerSheet(r.uid) },
      h("div", { class: "rank" }, i + 1),
      h("div", { class: "lane-body" },
        h("div", { class: "lane-top" }, h("span", { class: "who" }, nameOf(r.uid)), r.uid === S.me ? h("span", { class: "lv-chip" }, "you") : null, h("span", { class: "lv-chip" }, "Lv " + lv.L), h("span", { class: "xp" }, fmtNum(r.sc.xp) + " XP")),
        h("div", { class: "track" }, h("div", { class: "run", style: "width:" + pct + "%" }), runner),
        h("div", { class: "lane-foot" },
          ph === "active" ? h("span", { class: "pips", title: todays.filter(hb => dayLog[hb.id]).length + " of " + todays.length + " done today" }, todays.map(hb => h("i", { class: dayLog[hb.id] ? "on" : null }))) : null,
          ph === "active" ? h("span", null, todays.filter(hb => dayLog[hb.id]).length + "/" + todays.length + " today") : null,
          st > 0 ? h("span", { class: "streak" }, icon("flame"), st + "d streak") : null,
          h("span", null, r.sc.perfectDays + " perfect"))));
  })));
  return panel;
}
function feedEvents(room, uids, t) {
  const R = S.room, ev = [];
  const cheers = new Map();
  for (const uid of uids) {
    const m = uid === S.me && R.mine ? R.mine : R.logs.get(uid);
    if (!m) continue;
    for (const k of Object.keys(m.cheers || {})) { if (!cheers.has(k)) cheers.set(k, new Set()); cheers.get(k).add(uid); }
    const names = new Map(habitList(room, m).map(x => [x.id, x]));
    const sc = score(room, m, t);
    for (const [d, day] of Object.entries(m.log || {})) {
      if (d < room.start || d > room.end || d > t) continue;
      let maxT = 0;
      for (const [hid, e] of Object.entries(day)) {
        const hb = names.get(hid);
        if (!hb || !e) continue;
        maxT = Math.max(maxT, e.t || 0);
        ev.push({ type: "check", uid, d, hid, hb, e, t: e.t || parseYmd(d).getTime(), key: uid + "~" + d + "~" + hid });
      }
      if (sc.days[d] && sc.days[d].perfect) ev.push({ type: "perfect", uid, d, t: maxT + 1, key: uid + "~" + d + "~perfect" });
    }
  }
  ev.sort((a, b) => b.t - a.t);
  return { ev, cheers };
}
function feedPanel(room, uids, t) {
  const panel = h("section", { class: "card panel" });
  panel.append(h("div", { class: "panel-head" }, h("h2", { style: "font-size:20px" }, "Activity")));
  const { ev, cheers } = feedEvents(room, uids, t);
  if (!ev.length) { panel.append(h("div", { class: "notice" }, "Check-ins show up here as they happen. Notes and photos too, when people post them.")); return panel; }
  const member = S.myRooms.has(S.room.code);
  const shown = ev.slice(0, S.feedLimit);
  panel.append(h("div", { class: "feed" }, shown.map(x => {
    const who = h("b", null, x.uid === S.me ? "You" : nameOf(x.uid));
    const dayTxt = x.d === t ? "" : x.d === addDays(t, -1) ? " for yesterday" : " for " + fmtDate(x.d);
    const set = cheers.get(x.key) || new Set();
    const mine = set.has(S.me);
    const canCheer = member && x.uid !== S.me && !readOnly();
    let photo = null;
    if (x.type === "check" && x.e.photo && /^[A-Za-z0-9_.\/-]{8,200}$/.test(x.e.photo)) {
      photo = h("img", { class: "post-photo", src: platform.photoUrl(x.e.photo), alt: "Proof photo from " + nameOf(x.uid), loading: "lazy" });
      photo.addEventListener("error", () => photo.replaceWith(h("div", { class: "post-note muted" }, "Photo not available")), { once: true });
    }
    return h("div", { class: "post" + (x.type === "perfect" ? " perfect" : "") }, avatarOf(x.uid),
      h("div", { style: "min-width:0" },
        x.type === "perfect"
          ? h("div", { class: "post-text" }, who, " had a ", h("b", { class: "tag" }, "perfect day"), dayTxt, ". +" + PERFECT_XP + " XP")
          : h("div", { class: "post-text" }, who, " checked in ", h("b", null, (x.hb.icon ? x.hb.icon + " " : "") + x.hb.name), dayTxt),
        h("div", { class: "post-time" }, ago(x.t)),
        x.type === "check" && x.e.note ? h("div", { class: "post-note" }, x.e.note) : null,
        photo,
        (set.size || canCheer) ? h("div", { class: "post-actions" },
          h("button", { class: "cheer", "aria-pressed": String(mine), disabled: canCheer ? null : true, onclick: () => toggleCheer(x.key), "aria-label": (mine ? "Remove cheer" : "Cheer") }, "👏 " + (set.size || "Cheer"))) : null));
  })));
  if (ev.length > shown.length) panel.append(h("button", { class: "btn", onclick: () => { S.feedLimit += 20; refresh(); } }, "Show older activity"));
  return panel;
}

/* ---------- sheets ---------- */
let sheetEl = null, sheetReturn = null;
function openSheet(title, body, foot) {
  closeSheet();
  sheetReturn = document.activeElement;
  const close = h("button", { class: "icon-btn", svg: SVG.x, "aria-label": "Close", onclick: closeSheet });
  const sheet = h("div", { class: "sheet", role: "dialog", "aria-modal": "true", "aria-label": title }, h("div", { class: "sheet-head" }, h("h2", null, title), close), body, foot ? h("div", { class: "sheet-foot" }, foot) : null);
  sheetEl = h("div", { class: "scrim", onclick: e => { if (e.target === sheetEl) closeSheet(); } }, sheet);
  document.body.append(sheetEl);
  const first = sheet.querySelector("input, textarea, select") || close;
  setTimeout(() => first.focus());
  return sheet;
}
function closeSheet() {
  if (typeof TR !== "undefined" && TR.visit) { TR.visit.destroy(); TR.visit = null; }
  if (!sheetEl) return;
  sheetEl.remove(); sheetEl = null;
  if (sheetReturn && sheetReturn.isConnected) sheetReturn.focus();
}
document.addEventListener("keydown", e => { if (e.key === "Escape") closeSheet(); });

function openRulesSheet() {
  openSheet("How XP works", h("div", { style: "display:grid;gap:12px" },
    h("table", { class: "rules-table" }, h("tbody", null,
      h("tr", null, h("td", null, "Each check-in"), h("td", null, "+" + BASE_XP)),
      h("tr", null, h("td", null, "Streak of 3–6 days on that habit"), h("td", null, "×1.5")),
      h("tr", null, h("td", null, "Streak of 7–13 days"), h("td", null, "×2")),
      h("tr", null, h("td", null, "Streak of 14+ days"), h("td", null, "×2.5")),
      h("tr", null, h("td", null, "Perfect day (every habit you have, shared and personal)"), h("td", null, "+" + PERFECT_XP)))),
    h("p", { class: "muted", style: "margin:0;font-size:14px" }, "You can check in for today or yesterday. Missing a day resets that habit's streak. Levels: Lv 2 at 100 XP, Lv 3 at 300, Lv 4 at 600, and so on; each level needs 100 XP more than the last."),
    h("p", { class: "muted", style: "margin:0;font-size:14px" }, "Removing a habit removes the XP it earned, for everyone.")));
}
function openNickSheet() {
  const inp = h("input", { type: "text", id: "nick-input", maxlength: "24", value: myNick(), placeholder: "How friends see you" });
  const save = h("button", { class: "btn primary", type: "submit", form: "nick-form" }, "Save");
  const acct = platform.account;
  const confirmBox = h("div");
  const accountSection = acct ? h("div", { class: "account-box" },
    h("span", { class: "eyebrow" }, "Account"),
    acct.isGuest
      ? h("p", { class: "muted", style: "margin:0;font-size:14px" }, "You're playing as a guest. Your island is saved on this device only until you connect an account.")
      : h("p", { class: "muted", style: "margin:0;font-size:14px" }, "Signed in" + (acct.email ? " as " + acct.email : "") + ". Your island is saved to your account."),
    acct.isGuest && acct.linkGoogle ? h("button", { type: "button", class: "btn primary", onclick: () => acct.linkGoogle().catch(err => toast(err && err.message ? err.message : "Couldn't connect Google. Try again.")) }, "Save my island with Google") : null,
    h("button", { type: "button", class: "btn ghost", onclick: () => {
      if (!acct.isGuest) { acct.signOut(); return; }
      put(confirmBox, h("div", { class: "notice warn" }, "Signing out of a guest account loses this island for good. Connect Google first to keep it.",
        h("div", { class: "row", style: "margin-top:8px" }, h("button", { type: "button", class: "btn danger sm", onclick: () => acct.signOut() }, "Sign out anyway"), h("button", { type: "button", class: "btn sm", onclick: () => put(confirmBox) }, "Cancel"))));
    } }, "Sign out"), confirmBox) : null;
  openSheet("Your player name", h("div", { style: "display:grid;gap:16px" }, h("form", { id: "nick-form", class: "field", onsubmit: async e => {
    e.preventDefault(); save.disabled = true;
    try { await saveNick(inp.value); closeSheet(); toast("Name saved"); } catch (err) { writeFailed(err); save.disabled = false; }
  } }, h("span", null, "Shown on leaderboards in every room"), inp), accountSection), save);
}
function openJoinSheet() {
  const R = S.room;
  const inp = h("input", { type: "text", id: "join-nick", maxlength: "24", value: myNick(), placeholder: "How friends see you" });
  const btn = h("button", { class: "btn primary", type: "submit", form: "join-form" }, "Join " + (R.data.name || "room"));
  openSheet("Join " + R.data.name, h("form", { id: "join-form", class: "form-section", onsubmit: async e => {
    e.preventDefault(); btn.disabled = true; btn.textContent = "Joining…";
    try { await saveNick(inp.value); await joinRoom(R.code); closeSheet(); toast("You're in. Check in to score your first XP."); }
    catch (err) { writeFailed(err); btn.disabled = false; btn.textContent = "Join"; }
  } }, h("label", { class: "field" }, h("span", null, "Your player name"), inp),
    R.data.proof ? h("div", { class: "notice" }, "This room requires proof: each check-in needs a note or a photo.") : null), btn);
}
function inviteText(code, name) {
  const link = ARTIFACT_URL ? ARTIFACT_URL + "#" + code : "";
  return "Join my habit room \"" + name + "\" on Habit Arena. " + (link ? "Open " + link + " " : "Open Habit Arena ") + "and enter code " + code + ".";
}
function copyInvite(code, name) {
  const text = inviteText(code, name);
  const show = () => openSheet("Invite friends", h("div", { style: "display:grid;gap:12px" }, h("p", { class: "muted", style: "margin:0" }, "Copy this message and send it to your friends:"), h("div", { class: "copy-box" }, text), shareNote()));
  try {
    navigator.clipboard.writeText(text).then(() => toast("Invite copied. Code " + code), show);
  } catch (_) { show(); }
}
function shareNote() {
  return h("p", { class: "muted", style: "margin:0;font-size:13px" }, "Friends open the link, pick a name, and they're in. No account needed to start.");
}
function openRoomInfoSheet() {
  const R = S.room;
  const confirmBox = h("div");
  openSheet(R.data.name, h("div", { style: "display:grid;gap:14px" },
    h("div", null, h("div", { class: "eyebrow" }, "Code"), h("div", { class: "copy-box", style: "letter-spacing:.2em;font-weight:700" }, R.code)),
    h("p", { class: "muted", style: "margin:0;font-size:14px" }, fmtDate(R.data.start) + " – " + fmtDate(R.data.end) + (R.data.proof ? " · proof required" : " · honor system") + (R.data.allowPersonal ? " · personal habits on" : "")),
    h("button", { class: "btn", onclick: () => copyInvite(R.code, R.data.name) }, icon("copy"), "Copy invite"),
    h("div", { style: "border-top:1px solid var(--line);padding-top:14px;display:grid;gap:8px" },
      h("button", { class: "btn danger", onclick: () => {
        confirmBox.replaceChildren(h("div", { class: "notice warn" }, "Leaving deletes your check-ins and XP in this room.", h("div", { class: "row", style: "margin-top:8px" },
          h("button", { class: "btn danger sm", onclick: async () => { try { await leaveRoom(R.code); closeSheet(); location.hash = ""; toast("You left the room"); } catch (err) { writeFailed(err); } } }, "Leave room"),
          h("button", { class: "btn sm", onclick: () => confirmBox.replaceChildren() } , "Stay"))));
      } }, "Leave room"), confirmBox)));
}
function openSettingsSheet() {
  const R = S.room, room = clone(R.data), t = todayStr(), ph = phase(room, t);
  const habits = room.habits || [];
  const confirmBox = h("div");
  const save = h("button", { class: "btn primary", type: "submit", form: "settings-form" }, "Save changes");
  const startIn = h("input", { type: "date", id: "set-start", value: room.start, disabled: ph !== "upcoming" ? true : null });
  const endIn = h("input", { type: "date", id: "set-end", value: room.end, min: room.start });
  openSheet("Room settings", h("form", { id: "settings-form", class: "form", onsubmit: async e => {
    e.preventDefault();
    const name = $("#set-name").value.trim();
    const hs = habits.map(x => ({ ...x, name: x.name.trim() })).filter(x => x.name);
    if (!name) { toast("Give the room a name"); return; }
    if (!hs.length) { toast("Keep at least one habit"); return; }
    const start = ph === "upcoming" ? (startIn.value || room.start) : room.start;
    const end = endIn.value || room.end;
    if (end < start) { toast("The end date must be after the start date"); return; }
    const sinceNew = t > start ? t : start;
    const next = { ...room, name: name.slice(0, 40), start, end, habits: hs.map(x => ({ id: x.id, icon: x.icon, name: x.name, since: ph === "upcoming" ? start : (x.since || sinceNew) })) };
    save.disabled = true;
    try { await S.db.doc("rooms/" + R.code).set(next); closeSheet(); toast("Settings saved"); } catch (err) { writeFailed(err); save.disabled = false; }
  } },
    h("label", { class: "field" }, h("span", null, "Room name"), h("input", { type: "text", id: "set-name", maxlength: "40", value: room.name })),
    h("div", { class: "grid2" }, h("label", { class: "field" }, h("span", null, "Starts"), startIn), h("label", { class: "field" }, h("span", null, "Ends"), endIn)),
    h("div", { class: "form-section" }, h("span", { class: "label" }, "Shared habits"), habitEditor(habits, MAX_SHARED),
      ph === "active" ? h("p", { class: "muted", style: "margin:0;font-size:13px" }, "New habits count from today. Removing a habit removes the XP it earned.") : null),
    toggleRow("set-personal", "Personal habits", "Members can add up to " + MAX_PERSONAL + " of their own.", !!room.allowPersonal, v => room.allowPersonal = v),
    toggleRow("set-proof", "Require proof", "Check-ins need a note or a photo. Earlier check-ins stay as they are.", !!room.proof, v => room.proof = v),
    h("div", { style: "border-top:1px solid var(--line);padding-top:14px;display:grid;gap:8px" },
      h("div", null, h("div", { class: "eyebrow" }, "Code"), h("div", { class: "copy-box", style: "letter-spacing:.2em;font-weight:700" }, R.code)),
      shareNote(),
      h("button", { type: "button", class: "btn danger", onclick: () => {
        confirmBox.replaceChildren(h("div", { class: "notice warn" }, "Delete this room for everyone? Scores can't be recovered.", h("div", { class: "row", style: "margin-top:8px" },
          h("button", { type: "button", class: "btn danger sm", onclick: async () => { try { await deleteRoom(R.code); closeSheet(); location.hash = ""; toast("Room deleted"); } catch (err) { writeFailed(err); } } }, "Delete room"),
          h("button", { type: "button", class: "btn sm", onclick: () => confirmBox.replaceChildren() }, "Keep it"))));
      } }, "Delete room"), confirmBox)), save);
}
function openAddPersonalSheet() {
  const draft = { id: "p" + rid(6), icon: "🎸", name: "" };
  const sel = h("select", { "aria-label": "Icon", onchange: e => draft.icon = e.target.value }, ...ICONS.map(ic => h("option", { value: ic }, ic)));
  sel.value = draft.icon;
  const inp = h("input", { type: "text", id: "personal-name", maxlength: "48", placeholder: "e.g. Practice guitar 15 min" });
  const btn = h("button", { class: "btn primary", type: "submit", form: "personal-form" }, "Add habit");
  openSheet("Add a personal habit", h("form", { id: "personal-form", class: "form-section", onsubmit: e => {
    e.preventDefault();
    const name = inp.value.trim();
    if (!name) { inp.focus(); return; }
    const R = S.room, m = R.mine, t = todayStr();
    m.personal = [...(m.personal || []), { id: draft.id, icon: draft.icon, name, since: t > R.data.start ? t : R.data.start }].slice(0, MAX_PERSONAL);
    commitMine(); closeSheet(); toast("Habit added");
  } }, h("div", { class: "habit-edit", style: "grid-template-columns:64px minmax(0,1fr)" }, sel, inp),
    h("p", { class: "muted", style: "margin:0;font-size:13px" }, "Only you check this one in. It earns XP and counts toward your perfect days from today.")), btn);
  setTimeout(() => inp.focus());
}
function confirmRemovePersonal(hb) {
  openSheet("Remove " + hb.name + "?", h("p", { class: "muted", style: "margin:0" }, "Its check-ins and the XP they earned will be removed."),
    [h("button", { class: "btn", onclick: closeSheet }, "Keep"), h("button", { class: "btn danger", onclick: () => {
      const m = S.room.mine;
      m.personal = (m.personal || []).filter(x => x.id !== hb.id);
      for (const d of Object.keys(m.log || {})) { if (m.log[d][hb.id]) { delete m.log[d][hb.id]; if (!Object.keys(m.log[d]).length) delete m.log[d]; } }
      commitMine(); closeSheet();
    } }, "Remove")]);
}
function openPlayerSheet(uid) {
  const R = S.room, room = R.data, t = todayStr();
  const m = uid === S.me && R.mine ? R.mine : R.logs.get(uid);
  const sc = score(room, m, t), lv = levelOf(sc.xp);
  openSheet(nameOf(uid), h("div", { style: "display:grid;gap:14px" },
    h("div", { class: "me-top" }, avatarOf(uid, "lg"), h("div", null, h("div", { class: "lvl" }, "Lv " + lv.L, h("small", null, lv.name)), h("div", { class: "muted mono", style: "font-size:13px" }, fmtNum(sc.xp) + " XP"))),
    h("div", { class: "stats" },
      h("div", { class: "stat" }, h("b", null, sc.checkins), h("span", null, "Check-ins")),
      h("div", { class: "stat" }, h("b", null, sc.perfectDays), h("span", null, "Perfect days")),
      h("div", { class: "stat" }, h("b", { style: "color:var(--flame)" }, sc.bestStreak), h("span", null, "Best streak")),
      h("div", { class: "stat" }, h("b", null, sc.proofs), h("span", null, "Proofs"))),
    weekGrid(room, m, t), badgeGrid(sc), h("div", { id: "visit-slot" })));
  const slot = $("#visit-slot");
  S.db.doc(islandPath(uid)).get().then(snap => {
    if (!snap.exists || !slot || !slot.isConnected) return;
    const doc = snap.data(), model = trackerModel(doc, t), realm = realmOf(model.tiles.length);
    const stage = h("div", { class: "visit-stage" });
    put(slot, h("div", { class: "eyebrow" }, (uid === S.me ? "Your island" : "Their island") + (doc.name ? " · " + String(doc.name).slice(0, 32) : "")),
      stage, h("p", { class: "muted", style: "margin:0;font-size:13px" }, realm.name + " · " + fmtNum(model.tiles.length) + " squares · " + ITEMS.filter(i => model.owned[i.id]).length + " collectibles · " + DISCOVERIES.filter(d => model.found[d.id]).length + " discoveries"));
    if (TR.visit) TR.visit.destroy();
    TR.visit = createMap(stage, { label: "Island of " + nameOf(uid), maxS: 60, pad: 1.2, ambient: true });
    TR.visit.model = model; fitMap(TR.visit); kickMap(TR.visit);
  }).catch(() => {});
}
function openProofSheet(hb, date, btnEl) {
  const R = S.room;
  let file = null;
  const note = h("textarea", { id: "proof-note", maxlength: "200", placeholder: "What did you do? e.g. \"Read chapter 4 of Atomic Habits\"" });
  const preview = h("div");
  const fileIn = h("input", { type: "file", id: "proof-photo", accept: "image/*", hidden: true, onchange: () => {
    file = fileIn.files[0] || null;
    preview.replaceChildren();
    if (file) { const url = URL.createObjectURL(file); preview.append(h("img", { class: "photo-preview", src: url, alt: "Selected photo" })); }
  } });
  const btn = h("button", { class: "btn primary", type: "submit", form: "proof-form" }, "Check in");
  openSheet("Check in: " + hb.name, h("form", { id: "proof-form", class: "form-section", onsubmit: async e => {
    e.preventDefault();
    const text = note.value.trim();
    if (!text && !file) { toast("Add a note or a photo as proof"); return; }
    btn.disabled = true; btn.textContent = file ? "Uploading photo…" : "Saving…";
    const entry = { t: Date.now() };
    if (text) entry.note = text.slice(0, 200);
    if (file) {
      try { entry.photo = await uploadPhoto(file); }
      catch (err) { toast(err && err.message ? err.message : "The photo didn't upload. Try a smaller one, or post a note instead."); btn.disabled = false; btn.textContent = "Check in"; return; }
    }
    closeSheet();
    applyCheck(hb, date, entry, btnEl);
  } },
    h("label", { class: "field" }, h("span", null, "Note"), note),
    S.assets ? h("div", { class: "row" }, h("label", { class: "btn", for: "proof-photo" }, icon("camera"), "Add photo"), fileIn, h("span", { class: "muted", style: "font-size:13px" }, "Optional. Friends in the room can see it.")) : h("p", { class: "muted", style: "margin:0;font-size:13px" }, "Photos aren't available to you on this page, so a note will do."),
    preview,
    h("p", { class: "muted", style: "margin:0;font-size:13px" }, "This room requires proof. A note, a photo, or both.")), btn);
}

/* ---------- actions ---------- */
function writeFailed(err) {
  const code = err && err.code;
  if (code === "invalid_argument" && S.canWrite !== true) { S.canWrite = false; toast("You can't save here. Ask the owner to share this page with you as an Editor."); renderRoute(); return; }
  if (code === "quota_exceeded") { toast("This page's storage is full. Delete an old room to make space."); return; }
  if (code === "revoked") { toast("Your access to this page changed. Reload to continue."); return; }
  toast("That didn't save. Check your connection and try again.");
}
async function saveNick(v) {
  const nick = (v || "").trim().slice(0, 24);
  if (!nick || nick === (S.myProfile && S.myProfile.nick)) return;
  S.myProfile = { ...S.myProfile, nick };
  refresh();
  await S.db.doc("people/" + S.me).set({ ...S.myProfile, nick });
}
async function createRoom(room) {
  let code = newCode();
  for (let i = 0; i < 4; i++) { const s = await S.db.doc("rooms/" + code).get(); if (!s.exists) break; code = newCode(); }
  await S.db.doc("rooms/" + code).set({ ...room, createdBy: S.me, createdAt: Date.now() });
  S.roomCache.set(code, { ...room, createdBy: S.me });
  await joinRoom(code);
  return code;
}
async function joinRoom(code) {
  await S.db.doc("rooms/" + code + "/members/" + S.me).set({ joinedAt: Date.now() });
  const ref = S.db.doc("people/" + S.me + "/rooms/" + code);
  const existing = await ref.get();
  if (existing.exists) { S.myRooms.set(code, existing.data()); if (S.room && S.room.code === code) S.room.mine = clone(existing.data()); refresh(); return; }
  const body = { joinedAt: Date.now(), personal: [], log: {}, cheers: {} };
  S.myRooms.set(code, body);
  if (S.room && S.room.code === code) S.room.mine = clone(body);
  refresh();
  await ref.set(body);
}
async function leaveRoom(code) {
  await S.db.doc("rooms/" + code + "/members/" + S.me).delete();
  await removeMyRoomDoc(code);
}
async function removeMyRoomDoc(code) {
  try { await S.db.doc("people/" + S.me + "/rooms/" + code).delete(); S.myRooms.delete(code); refresh(); }
  catch (err) { writeFailed(err); }
}
async function deleteRoom(code) {
  await S.db.doc("rooms/" + code).delete();
  await leaveRoom(code);
}
function toggleHabit(hb, date, btnEl) {
  const R = S.room, m = R.mine;
  if (!m || !date || readOnly()) return;
  const has = m.log && m.log[date] && m.log[date][hb.id];
  if (has) {
    const prevXp = score(R.data, m, todayStr()).xp;
    delete m.log[date][hb.id];
    if (!Object.keys(m.log[date]).length) delete m.log[date];
    commitMine();
    const lost = prevXp - score(R.data, m, todayStr()).xp;
    toast("Undone" + (lost ? ". −" + lost + " XP" : ""));
    return;
  }
  if (R.data.proof) { openProofSheet(hb, date, btnEl); return; }
  applyCheck(hb, date, { t: Date.now() }, btnEl);
}
function applyCheck(hb, date, entry, btnEl) {
  const R = S.room, m = R.mine, t = todayStr();
  const before = score(R.data, m, t);
  m.log = m.log || {};
  m.log[date] = { ...(m.log[date] || {}), [hb.id]: entry };
  const after = score(R.data, m, t);
  commitMine();
  const gain = after.xp - before.xp;
  const wasPerfect = before.days[date] && before.days[date].perfect, isPerfect = after.days[date] && after.days[date].perfect;
  const l0 = levelOf(before.xp).L, l1 = levelOf(after.xp);
  toast("+" + gain + " XP" + (isPerfect && !wasPerfect ? " · perfect day!" : ""), isPerfect && !wasPerfect);
  if (l1.L > l0) setTimeout(() => toast("Level up! Lv " + l1.L + " · " + l1.name, true), 400);
  for (const b of BADGES) if (b.test(after) && !b.test(before)) setTimeout(() => toast("Badge unlocked: " + b.name, true), 800);
  requestAnimationFrame(() => { const el = document.querySelector('.check[aria-label="Undo ' + CSS.escape(hb.name) + '"]'); el && el.classList.add("pop"); });
}
function toggleCheer(key) {
  const m = S.room.mine;
  if (!m) return;
  m.cheers = { ...(m.cheers || {}) };
  if (m.cheers[key]) delete m.cheers[key]; else m.cheers[key] = Date.now();
  const keys = Object.keys(m.cheers);
  if (keys.length > 300) { keys.sort((a, b) => m.cheers[a] - m.cheers[b]).slice(0, keys.length - 300).forEach(k => delete m.cheers[k]); }
  commitMine();
}
let pending = null, writing = false;
function commitMine() {
  const R = S.room;
  if (!R || !R.mine) return;
  S.myRooms.set(R.code, clone(R.mine));
  refresh();
  pending = { code: R.code, body: clone(R.mine) };
  flush();
}
async function flush() {
  if (writing || !pending) return;
  writing = true;
  const job = pending; pending = null;
  try { await S.db.doc("people/" + S.me + "/rooms/" + job.code).set(job.body); }
  catch (err) { writeFailed(err); }
  writing = false;
  if (pending) flush();
}
async function uploadPhoto(file) {
  if (!S.assets) throw new Error("Photos aren't available to you on this page.");
  let blob = file;
  try {
    const bmp = await createImageBitmap(file);
    const k = Math.min(1, 1280 / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
    blob = await new Promise(res => c.toBlob(res, "image/jpeg", 0.82)) || file;
  } catch (_) {
    if (!/^image\/(png|jpeg|gif|webp)$/.test(file.type)) throw new Error("That image format isn't supported. Try a JPEG or PNG.");
  }
  try {
    const res = await S.assets.upload(blob, blob.type ? undefined : { type: "image/jpeg" });
    return res.id;
  } catch (err) {
    const code = err && err.code;
    throw new Error(code === "too_large" ? "That photo is too large." : code === "quota_or_state" ? "Photo storage is full. Post a note instead." : code === "rate_limited" ? "Too many uploads. Wait a moment and try again." : "The photo didn't upload. Post a note instead.");
  }
}

/* ---------- data subscriptions ---------- */
function enterRoom(code) {
  leaveRoomSubs();
  S.feedLimit = 12;
  const R = S.room = { code, data: undefined, members: [], logs: new Map(), nicks: new Map(), unsubs: [], logSubs: new Map(), mine: null, timedOut: false };
  R.timer = setTimeout(() => { R.timedOut = true; refresh(); }, 10000);
  if (S.myRooms.has(code)) R.mine = clone(S.myRooms.get(code));
  R.unsubs.push(S.db.doc("rooms/" + code).onSnapshot(s => {
    R.data = s.exists ? s.data() : (s.metadata.fromCache ? R.data : null);
    if (!s.metadata.fromCache) { clearTimeout(R.timer); R.timedOut = false; }
    if (R.data !== undefined) S.roomCache.set(code, R.data);
    refresh();
  }, () => { clearTimeout(R.timer); R.timedOut = true; refresh(); }));
  R.unsubs.push(S.db.collection("rooms/" + code + "/members").onSnapshot(snap => {
    R.members = snap.docs.map(d => ({ uid: d.id, ...d.data() })).sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0));
    syncMemberSubs();
    refresh();
  }, () => {}));
  syncMemberSubs();
}
function syncMemberSubs() {
  const R = S.room;
  const want = new Set(R.members.slice(0, MAX_TRACKED).map(m => m.uid));
  for (const uid of want) {
    if (R.logSubs.has(uid) || uid === S.me) continue;
    R.logSubs.set(uid, S.db.doc("people/" + uid + "/rooms/" + R.code).onSnapshot(s => {
      if (s.exists) R.logs.set(uid, s.data()); else R.logs.delete(uid);
      refresh();
    }, () => {}));
    S.db.doc("people/" + uid).get().then(s => { if (s.exists && s.data().nick) { R.nicks.set(uid, String(s.data().nick).slice(0, 24)); refresh(); } }).catch(() => {});
  }
  for (const [uid, un] of R.logSubs) if (!want.has(uid)) { un(); R.logSubs.delete(uid); R.logs.delete(uid); }
}
function leaveRoomSubs() {
  const R = S.room;
  if (!R) return;
  clearTimeout(R.timer);
  R.unsubs.forEach(u => u());
  R.logSubs.forEach(u => u());
  S.room = null;
}

/* ---------- personal map ---------- */
const TERRAINS = [
  { k: "forest", name: "Forest" }, { k: "lake", name: "Lake" }, { k: "meadow", name: "Meadow" }, { k: "dunes", name: "Dunes" },
  { k: "peaks", name: "Peaks" }, { k: "blossom", name: "Blossom" }, { k: "canyon", name: "Canyon" }, { k: "crystal", name: "Crystal" },
];
const TERRAIN_NAME = Object.fromEntries(TERRAINS.map(x => [x.k, x.name]));
const MAP_SUGGEST = [["Workout", "forest"], ["Drink 2L of water", "lake"], ["Meditate 10 min", "meadow"], ["Walk 8,000 steps", "dunes"], ["In bed by 23:00", "peaks"], ["Journal", "blossom"], ["No sugar", "canyon"], ["Read 20 pages", "crystal"]];
const REALMS = [[0, "Campsite"], [10, "Hamlet"], [30, "Village"], [75, "Town"], [150, "City"], [300, "Kingdom"], [600, "Empire"], [1200, "Continent"]];
const HOME_NAMES = ["a tent and a campfire", "a cottage", "a house with a flag", "a watchtower", "a keep", "a castle", "a castle", "a castle"];
const ISLAND_IDEAS = ["Isle of Dawn", "Ember Isle", "Little Haven", "Northwind", "Brightwater", "Kestrel Island", "Larkspur", "Saltmoor", "Juniper Key", "Wren's Rest", "Copperfield", "Mistral Isle"];
const REGION_WORDS = {
  forest: [["Whispering", "Elder", "Mossy", "Silent", "Hollow", "Emerald", "Misty", "Old"], ["Woods", "Pines", "Thicket", "Grove", "Forest", "Timberland"]],
  lake: [["Glass", "Moon", "Still", "Silver", "Blue", "Mirror", "Deep", "Quiet"], ["Lake", "Mere", "Waters", "Pool", "Tarn", "Shallows"]],
  meadow: [["Sunny", "Green", "Windy", "Clover", "Honey", "Soft", "Gentle", "Bright"], ["Meadows", "Fields", "Downs", "Pastures", "Lea", "Commons"]],
  dunes: [["Golden", "Shifting", "Amber", "Dry", "Burning", "Long"], ["Dunes", "Sands", "Wastes", "Barrens", "Expanse"]],
  peaks: [["Iron", "Frost", "Grey", "Thunder", "High", "Lonely", "Stone"], ["Peaks", "Crags", "Summits", "Spires", "Ridge", "Heights"]],
  blossom: [["Petal", "Rose", "Spring", "Sweet", "Cherry", "Pink"], ["Gardens", "Orchard", "Vale", "Bloom", "Glade"]],
  canyon: [["Red", "Rust", "Copper", "Sunset", "Broken", "Ember"], ["Canyon", "Gorge", "Mesa", "Bluffs", "Gulch"]],
  crystal: [["Shimmering", "Star", "Arcane", "Glimmer", "Violet", "Dream"], ["Caverns", "Shards", "Reach", "Spires", "Hollows"]],
};
const DISCOVERIES = [
  { id: "boat", name: "Fishing boat", hint: "Grow to 30 squares" },
  { id: "lighthouse", name: "Lighthouse", hint: "Grow to 50 squares" },
  { id: "ruins", name: "Old ruins", hint: "Grow to 100 squares" },
  { id: "stones", name: "Standing stones", hint: "Have 10 perfect days" },
  { id: "tree", name: "Ancient tree", hint: "Keep one habit going 14 days in a row" },
  { id: "falls", name: "Waterfall", hint: "Paint a Lake square right next to a Peaks square" },
  { id: "lagoon", name: "Hidden lagoon", hint: "Close a patch of sea in with land" },
  { id: "balloon", name: "Hot-air balloon", hint: "Paint something 30 days in a row" },
  { id: "harbor", name: "Harbor", hint: "Grow to 150 squares" },
  { id: "lanterns", name: "Lantern festival", hint: "Have 25 perfect days" },
  { id: "observatory", name: "Observatory", hint: "Grow to 300 squares" },
];
const PERKS = {
  boat: "Morning catch: your first square each day has a 35% chest chance instead of 20%.",
  lighthouse: "You can save up to 3 rest days instead of 2.",
  ruins: "Old secrets: epic and legendary finds are twice as likely in square chests.",
  stones: "Blessed chests: perfect-day chests roll on better odds.",
  tree: "Every square grows up faster: in 1 and 4 days instead of 2 and 7.",
  falls: "Lakes and peaks grow up faster.",
  lagoon: "Land waits 5 days before it starts to wilt, instead of 3.",
  balloon: "Every 7 days in a row brings a bonus chest.",
  harbor: "Shipments: when a chest would give you a duplicate, it gives something you don't have yet, when it can.",
  lanterns: "Perfect days bring two chests.",
  observatory: "Stargazing: squares painted after 7 pm have a 50% chest chance.",
};
const MAX_MAP_HABITS = 8;
const TR = { map: null, thumb: null, brush: null, day: "today", ver: 0 };
const trackerPath = () => "data/users/" + S.me + "/tracker";
const DIRS4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const keyOf = (x, y) => x + "," + y;

function realmOf(n) {
  let i = 0;
  while (i + 1 < REALMS.length && n >= REALMS[i + 1][0]) i++;
  const nx = REALMS[i + 1];
  return { i, name: REALMS[i][1], at: REALMS[i][0], next: nx ? nx[0] : null, nextName: nx ? nx[1] : null };
}
const activeOn = (hb, d) => (!hb.since || d >= hb.since) && (!hb.archived || d < hb.archived);
function hash2(x, y) { let n = (x * 374761393 + y * 668265263) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0); }

function enclosedCells(occ) {
  let minx = 0, maxx = 0, miny = 0, maxy = 0;
  for (const t of occ.values()) { if (t.x < minx) minx = t.x; if (t.x > maxx) maxx = t.x; if (t.y < miny) miny = t.y; if (t.y > maxy) maxy = t.y; }
  minx--; miny--; maxx++; maxy++;
  const W = maxx - minx + 1, H = maxy - miny + 1, seen = new Uint8Array(W * H), q = [[minx, miny]];
  seen[0] = 1;
  while (q.length) {
    const [x, y] = q.pop();
    for (const [dx, dy] of DIRS4) {
      const nx = x + dx, ny = y + dy;
      if (nx < minx || nx > maxx || ny < miny || ny > maxy) continue;
      const i = (ny - miny) * W + (nx - minx);
      if (seen[i] || occ.has(keyOf(nx, ny))) continue;
      seen[i] = 1; q.push([nx, ny]);
    }
  }
  const out = [];
  for (let y = miny; y <= maxy; y++) for (let x = minx; x <= maxx; x++) if (!seen[(y - miny) * W + (x - minx)] && !occ.has(keyOf(x, y))) out.push([x, y]);
  return out;
}
function landNeighbors(occ, x, y) { let n = 0; for (const [dx, dy] of DIRS4) if (occ.has(keyOf(x + dx, y + dy))) n++; return n; }
function pickTile(occ, used, ok, score) {
  let best = null, bs = -Infinity;
  for (const t of occ.values()) {
    if (t.home || used.has(keyOf(t.x, t.y)) || !ok(t)) continue;
    const sc = score(t);
    if (sc > bs) { bs = sc; best = t; }
  }
  return best;
}
function seaSpot(occ) {
  let best = null, bs = -Infinity;
  for (const t of occ.values()) for (const [dx, dy] of DIRS4) {
    const x = t.x + dx, y = t.y + dy;
    if (occ.has(keyOf(x, y))) continue;
    const sc = Math.hypot(x, y) + (hash2(x, y) % 100) / 60;
    if (sc > bs) { bs = sc; best = [x + dx, y + dy]; if (occ.has(keyOf(best[0], best[1]))) best = [x, y]; }
  }
  return best || [2, 2];
}

let MEMO = { doc: null, ver: -1, t: null, m: null }, MODEL_SEQ = 0, PAL_VER = 0;
function trackerModel(doc, t) {
  if (MEMO.m && MEMO.doc === doc && MEMO.ver === TR.ver && MEMO.t === t) return MEMO.m;
  const habits = (doc && doc.habits) || [];
  const byId = new Map(habits.map(x => [x.id, x]));
  const log = (doc && doc.log) || {};
  const home = { x: 0, y: 0, home: true, z: 1 };
  const tiles = [], occ = new Map([["0,0", home]]), perDay = {};
  const dates = Object.keys(log).filter(d => d <= t).sort();
  for (const d of dates) {
    const day = log[d] || {};
    let last = null;
    const dayTiles = [];
    for (const [hid, v] of Object.entries(day)) {
      const hb = byId.get(hid);
      if (!hb || !Array.isArray(v) || !Number.isFinite(v[0]) || !Number.isFinite(v[1])) continue;
      const k = keyOf(v[0], v[1]);
      if (occ.has(k)) continue;
      const tile = { x: v[0], y: v[1], t: v[2] || 0, d, hid, terrain: TERRAIN_NAME[hb.terrain] ? hb.terrain : "meadow" };
      occ.set(k, tile); dayTiles.push(tile);
      if (!last || tile.t > last.t) last = tile;
    }
    tiles.push(...dayTiles);
    const act = habits.filter(hb => activeOn(hb, d));
    const done = act.filter(hb => day[hb.id]).length;
    perDay[d] = { done, active: act.length, perfect: act.length > 0 && done === act.length };
    if (perDay[d].perfect && last) last.landmark = true;
  }
  tiles.sort((a, b) => a.d < b.d ? -1 : a.d > b.d ? 1 : a.t - b.t);
  const any = d => !!log[d] && Object.keys(log[d]).some(id => byId.has(id));
  for (const tile of tiles) tile.hv = hash2(tile.x, tile.y);
  // discoveries, replayed in the order the squares were painted so their spot never moves
  const found = {}, used = new Set(), occ2 = new Map([["0,0", home]]);
  const byDate = new Map();
  for (const tile of tiles) { if (!byDate.has(tile.d)) byDate.set(tile.d, []); byDate.get(tile.d).push(tile); }
  let n = 0, pd = 0, run = 0, prevDay = null;
  const runMarks = [];
  const hrun = {}, hlast = {};
  let maxHrun = 0;
  const solid = x => x.terrain !== "lake" && !x.landmark;
  for (const d of dates) {
    const dayTiles = byDate.get(d) || [];
    for (const tile of dayTiles) {
      occ2.set(keyOf(tile.x, tile.y), tile); n++;
      if (n === 30 && !found.boat) { const p = seaSpot(occ2); found.boat = { x: p[0], y: p[1], d }; }
      if (n === 50 && !found.lighthouse) {
        const tl = pickTile(occ2, used, solid, x => (4 - landNeighbors(occ2, x.x, x.y)) * 10 + Math.hypot(x.x, x.y) + (x.hv % 100) / 100);
        if (tl) { found.lighthouse = { x: tl.x, y: tl.y, d }; used.add(keyOf(tl.x, tl.y)); }
      }
      if (n === 100 && !found.ruins) {
        const tl = pickTile(occ2, used, x => solid(x) && Math.hypot(x.x, x.y) > 2, x => x.hv);
        if (tl) { found.ruins = { x: tl.x, y: tl.y, d }; used.add(keyOf(tl.x, tl.y)); }
      }
      if (n === 150 && !found.harbor) {
        let best = null, bs = -Infinity;
        for (const tl of occ2.values()) {
          if (tl.home || tl.terrain === "lake" || tl.landmark || used.has(keyOf(tl.x, tl.y))) continue;
          for (const [dx, dy] of [[1, 0], [0, 1]]) if (!occ2.has(keyOf(tl.x + dx, tl.y + dy)) && !occ2.has(keyOf(tl.x + 2 * dx, tl.y + 2 * dy))) {
            const sc = Math.hypot(tl.x, tl.y) + (tl.hv % 100) / 100;
            if (sc > bs) { bs = sc; best = { x: tl.x, y: tl.y, dx, dy }; }
          }
        }
        if (best) { found.harbor = { ...best, d }; used.add(keyOf(best.x, best.y)); }
      }
      if (n === 300 && !found.observatory) {
        const tl = pickTile(occ2, used, solid, x => (x.terrain === "peaks" ? 40 : 0) + Math.hypot(x.x, x.y) + (x.hv % 100) / 100);
        if (tl) { found.observatory = { x: tl.x, y: tl.y, d }; used.add(keyOf(tl.x, tl.y)); }
      }
      if (!found.falls && (tile.terrain === "lake" || tile.terrain === "peaks")) {
        for (const [dx, dy] of DIRS4) {
          const nb = occ2.get(keyOf(tile.x + dx, tile.y + dy));
          if (nb && !nb.home && nb.terrain !== tile.terrain && (nb.terrain === "lake" || nb.terrain === "peaks")) {
            const lake = tile.terrain === "lake" ? tile : nb, peak = lake === tile ? nb : tile;
            found.falls = { x: lake.x, y: lake.y, px: peak.x, py: peak.y, d };
            break;
          }
        }
      }
      if (!found.lagoon && n >= 4 && landNeighbors(occ2, tile.x, tile.y) >= 1) {
        if (enclosedCells(occ2).length) found.lagoon = { d };
      }
    }
    if (perDay[d] && perDay[d].perfect) {
      pd++;
      if (pd === 10 && !found.stones) {
        const tl = dayTiles.find(x => solid(x) && !used.has(keyOf(x.x, x.y))) || pickTile(occ2, used, solid, x => x.hv);
        if (tl) { found.stones = { x: tl.x, y: tl.y, d }; used.add(keyOf(tl.x, tl.y)); }
      }
      if (pd === 25 && !found.lanterns) found.lanterns = { d };
    }
    for (const hb of habits) {
      if (!(log[d] && log[d][hb.id])) continue;
      hrun[hb.id] = hlast[hb.id] && addDays(hlast[hb.id], 1) === d ? hrun[hb.id] + 1 : 1;
      hlast[hb.id] = d;
      if (hrun[hb.id] > maxHrun) maxHrun = hrun[hb.id];
      if (hrun[hb.id] === 14 && !found.tree) {
        const tl = dayTiles.find(x => x.hid === hb.id && solid(x) && !used.has(keyOf(x.x, x.y))) || pickTile(occ2, used, solid, x => x.hv);
        if (tl) { found.tree = { x: tl.x, y: tl.y, d }; used.add(keyOf(tl.x, tl.y)); }
      }
    }
    if (dayTiles.length) {
      run = prevDay && addDays(prevDay, 1) === d ? run + 1 : 1; prevDay = d;
      if (run === 30 && !found.balloon) found.balloon = { d };
      if ([7, 21, 66, 100, 365].includes(run)) runMarks.push({ d, n: run });
    }
  }
  // perks unlocked by discoveries feed back into the rules below
  const perk = id => !!found[id];
  let dayStreak = 0, bestDay = 0, shields = 0;
  const restDays = [];
  if (dates.length) for (let d = dates[0]; d <= t; d = addDays(d, 1)) {
    const cap = found.lighthouse && d >= found.lighthouse.d ? 3 : 2;
    if (any(d)) { dayStreak++; if (dayStreak % 7 === 0) shields = Math.min(cap, shields + 1); }
    else if (d < t) { if (dayStreak > 0 && shields > 0) { shields--; restDays.push(d); } else dayStreak = 0; }
    if (dayStreak > bestDay) bestDay = dayStreak;
  }
  const hstat = {};
  for (const hb of habits) {
    const done = d => log[d] && log[d][hb.id];
    let s = 0;
    for (let d = done(t) ? t : addDays(t, -1); done(d); d = addDays(d, -1)) s++;
    const mine = tiles.filter(x => x.hid === hb.id);
    const last = mine.length ? mine[mine.length - 1].d : null;
    hstat[hb.id] = { count: mine.length, streak: s, last, wilting: !hb.archived && mine.length > 0 && daysBetween(last, t) >= (perk("lagoon") ? 5 : 3) };
  }
  // how each square looks today: age + streak make it grow, a 3-day gap makes it wilt
  for (const tile of tiles) {
    const hs = hstat[tile.hid], age = daysBetween(tile.d, t), hv = hash2(tile.x, tile.y);
    tile.age = age;
    const fast = perk("tree") || (perk("falls") && (tile.terrain === "lake" || tile.terrain === "peaks"));
    tile.stage = Math.min(2, (age >= (fast ? 4 : 7) ? 2 : age >= (fast ? 1 : 2) ? 1 : 0) + (hs && hs.streak >= 5 ? 1 : 0));
    tile.wilt = !!(hs && hs.wilting);
    const j = ((hv % 5) - 2) * 0.035;
    tile.z = tile.terrain === "lake" ? 0.42 : tile.terrain === "peaks" ? 1.05 + 0.12 * tile.stage + (hv % 3) * 0.06
      : tile.terrain === "canyon" ? 1.12 + 0.16 * tile.stage + j : tile.terrain === "dunes" ? 0.82 + j : tile.terrain === "crystal" ? 1.05 + j : 0.95 + j;
  }
  const onTile = new Map();
  for (const id of ["lighthouse", "ruins", "stones", "tree", "harbor", "observatory"]) if (found[id]) onTile.set(keyOf(found[id].x, found[id].y), id);
  // named regions: 4+ touching squares of one terrain; the oldest square seeds the name
  const regions = [], seenR = new Set(), usedNames = new Set();
  for (const tile of tiles) {
    const k0 = keyOf(tile.x, tile.y);
    if (seenR.has(k0)) continue;
    const group = [], q = [tile];
    seenR.add(k0);
    while (q.length) {
      const c = q.pop(); group.push(c);
      for (const [dx, dy] of DIRS4) {
        const k = keyOf(c.x + dx, c.y + dy), nb = occ.get(k);
        if (nb && !nb.home && nb.terrain === tile.terrain && !seenR.has(k)) { seenR.add(k); q.push(nb); }
      }
    }
    if (group.length < 4) continue;
    const [adj, noun] = REGION_WORDS[tile.terrain] || REGION_WORDS.meadow;
    let i = 0, name;
    do { name = "The " + adj[(tile.hv + i) % adj.length] + " " + noun[((tile.hv >>> 7) + i * 3) % noun.length]; i++; } while (usedNames.has(name) && i < 30);
    usedNames.add(name);
    const cx = group.reduce((a, g) => a + g.x + 0.5, 0) / group.length, cy = group.reduce((a, g) => a + g.y + 0.5, 0) / group.length;
    const zTop = Math.max(...group.map(g => g.z));
    regions.push({ name, terrain: tile.terrain, size: group.length, cx, cy, z: zTop });
  }
  regions.sort((a, b) => b.size - a.size);
  // collectibles: each check-in may carry a find; a perfect day carries a chest
  const finds = (doc && doc.finds) || {}, items = new Map(), owned = {};
  const firstFind = {};
  const addItem = (tile, id, d) => { if (!tile || !ITEM_BY_ID[id]) return; const k = keyOf(tile.x, tile.y); if (!items.has(k)) items.set(k, []); items.get(k).push(id); owned[id] = (owned[id] || 0) + 1; if (!firstFind[id] || d < firstFind[id]) firstFind[id] = d; };
  for (const tile of tiles) { const f = finds[tile.d + "|" + tile.hid]; if (f) addItem(tile, f, tile.d); }
  for (const d of dates) for (const sfx of ["*", "+", "run"]) {
    const f = finds[d + "|" + sfx];
    if (f && (sfx === "run" || (perDay[d] && perDay[d].perfect))) addItem(chestTileFor(tiles, d, finds), f, d);
  }
  const perfectDays = Object.values(perDay).filter(x => x.perfect).length;
  const next = [
    ["boat", tiles.length, 30, "squares"], ["lighthouse", tiles.length, 50, "squares"], ["ruins", tiles.length, 100, "squares"],
    ["harbor", tiles.length, 150, "squares"], ["observatory", tiles.length, 300, "squares"], ["lanterns", perfectDays, 25, "perfect days"],
    ["stones", perfectDays, 10, "perfect days"], ["tree", maxHrun, 14, "days in a row on one habit"], ["balloon", bestDay, 30, "days in a row"],
  ].filter(([id]) => !found[id]).map(([id, v, goal, unit]) => ({ id, v: Math.min(v, goal), goal, unit, p: Math.min(v, goal) / goal })).sort((a, b) => b.p - a.p);
  const growTomorrow = tiles.filter(x => x.stage < 2 && (perk("tree") ? x.age === 0 || x.age === 3 : x.age === 1 || x.age === 6)).length;
  const m = { key: ++MODEL_SEQ, habits, tiles, occ, perDay, dayStreak, bestDay, shields, restDays, hstat, found, onTile, regions, lagoons: enclosedCells(occ),
    perfectDays, first: dates[0] || null, items, owned, next, growTomorrow, firstFind, runMarks };
  MEMO = { doc, ver: TR.ver, t, m };
  return m;
}
function frontierOf(occ) {
  const f = new Set();
  for (const tile of occ.values()) for (const [dx, dy] of DIRS4) {
    const k = keyOf(tile.x + dx, tile.y + dy);
    if (!occ.has(k)) f.add(k);
  }
  return f;
}
function autoSpot(model, terrain) {
  let best = null, bestScore = -Infinity;
  for (const k of frontierOf(model.occ)) {
    const [x, y] = k.split(",").map(Number);
    let sc = 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
      const nb = model.occ.get(keyOf(x + dx, y + dy));
      if (nb) { sc += 1; if (nb.terrain === terrain) sc += dx && dy ? 1.5 : 3; }
    }
    sc -= Math.hypot(x, y) * 0.15;
    sc += Math.random() * 0.8;
    if (sc > bestScore) { bestScore = sc; best = [x, y]; }
  }
  return best || [1, 0];
}

/* ---------- palette, read from the theme tokens ---------- */
function hexRgb(hx) { hx = (hx || "#888888").trim().replace("#", ""); if (hx.length === 3) hx = hx.split("").map(c => c + c).join(""); const n = parseInt(hx, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function mixc(a, b, t) { const A = hexRgb(a), B = hexRgb(b); return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join(""); }
const shade = (c, f) => f < 0 ? mixc(c, "#000000", -f) : mixc(c, "#ffffff", f);
let PAL = null;
function pal() {
  if (PAL) return PAL;
  const cs = getComputedStyle(document.documentElement), v = n => cs.getPropertyValue(n).trim();
  const P = { sea: v("--sea"), sea2: v("--sea-deep"), seaInk: v("--sea-ink"), sand: v("--sand"), shore: v("--shore"), roof: v("--roof"), accent: v("--accent"), gold: v("--xp-bright"),
    ink: v("--ink"), surface: v("--surface"), muted: v("--muted"), earth: v("--earth"), wilt: v("--wilt"), lagoon: v("--lagoon"), halo: v("--map-halo"), dark: v("--map-dark") === "1" };
  P.tops = {}; P.lefts = {}; P.rights = {}; P.wiltTops = {};
  for (const t of TERRAINS) {
    const base = v("--t-" + t.k);
    P[t.k] = base;
    P.tops[t.k] = base;
    P.wiltTops[t.k] = mixc(base, P.wilt, 0.55);
    const sideBase = t.k === "lake" ? P.sand : t.k === "peaks" || t.k === "dunes" || t.k === "canyon" || t.k === "crystal" ? base : P.earth;
    P.lefts[t.k] = shade(sideBase, -0.14); P.rights[t.k] = shade(sideBase, -0.3);
  }
  P.tops.home = P.sand; P.lefts.home = shade(P.earth, -0.14); P.rights.home = shade(P.earth, -0.3);
  PAL = P;
  return P;
}
function themeChanged() { PAL = null; PAL_VER++; if (TR.map) paintMap(TR.map); if (TR.thumb) paintMap(TR.thumb); }
try { matchMedia("(prefers-color-scheme: dark)").addEventListener("change", themeChanged); } catch (_) {}
new MutationObserver(themeChanged).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

/* ---------- isometric drawing ---------- */
function poly(c, pts, fill) { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.closePath(); c.fillStyle = fill; c.fill(); }
function isoBox(R, x0, y0, x1, y1, z0, z1, top, left, right) {
  const p = R.pr;
  poly(R.c, [p(x0, y1, z1), p(x1, y1, z1), p(x1, y1, z0), p(x0, y1, z0)], left);
  poly(R.c, [p(x1, y0, z1), p(x1, y1, z1), p(x1, y1, z0), p(x1, y0, z0)], right);
  poly(R.c, [p(x0, y0, z1), p(x1, y0, z1), p(x1, y1, z1), p(x0, y1, z1)], top);
}
function isoPyramid(R, x0, y0, x1, y1, z0, zt, light, mid, dark) {
  const p = R.pr, ap = p((x0 + x1) / 2, (y0 + y1) / 2, zt);
  poly(R.c, [p(x0, y0, z0), p(x1, y0, z0), ap], light);
  poly(R.c, [p(x0, y0, z0), p(x0, y1, z0), ap], mid);
  poly(R.c, [p(x0, y1, z0), p(x1, y1, z0), ap], mid);
  poly(R.c, [p(x1, y0, z0), p(x1, y1, z0), ap], dark);
}
function gableRoof(R, x0, y0, x1, y1, z0, zr, color) {
  const p = R.pr, ym = (y0 + y1) / 2;
  poly(R.c, [p(x0, y0, z0), p(x1, y0, z0), p(x1, ym, zr), p(x0, ym, zr)], shade(color, 0.12));
  poly(R.c, [p(x0, y1, z0), p(x1, y1, z0), p(x1, ym, zr), p(x0, ym, zr)], color);
  poly(R.c, [p(x1, y0, z0), p(x1, y1, z0), p(x1, ym, zr)], shade(color, -0.25));
}
function blobShadow(R, gx, gy, z, rx) {
  const [X, Y] = R.pr(gx, gy, z), c = R.c;
  c.fillStyle = "rgba(0,0,0,.18)"; c.beginPath(); c.ellipse(X, Y, rx * R.s, rx * R.s * 0.5, 0, 0, Math.PI * 2); c.fill();
}
function pine(R, gx, gy, z, size, col) {
  const c = R.c, [X, Y] = R.pr(gx, gy, z), h = size * R.s * 0.62, w = size * R.s * 0.2;
  blobShadow(R, gx + 0.04, gy + 0.04, z, size * 0.16);
  c.fillStyle = "#6B4A2B"; c.fillRect(X - w * 0.15, Y - h * 0.18, w * 0.3, h * 0.2);
  const tier = (base, top, half) => {
    poly(c, [[X, Y - top], [X - half, Y - base], [X, Y - base + half * 0.32]], shade(col, 0.1));
    poly(c, [[X, Y - top], [X, Y - base + half * 0.32], [X + half, Y - base]], shade(col, -0.18));
  };
  tier(h * 0.18, h * 0.78, w * 1.15);
  tier(h * 0.45, h, w * 0.85);
}
function roundTree(R, gx, gy, z, size, col, trunk) {
  const c = R.c, [X, Y] = R.pr(gx, gy, z), r = size * R.s * 0.17;
  blobShadow(R, gx + 0.05, gy + 0.05, z, size * 0.17);
  c.fillStyle = trunk || "#6B4A2B"; c.fillRect(X - r * 0.18, Y - r * 1.4, r * 0.36, r * 1.4);
  c.fillStyle = shade(col, -0.18); c.beginPath(); c.arc(X, Y - r * 1.9, r, 0, Math.PI * 2); c.fill();
  c.fillStyle = col; c.beginPath(); c.arc(X - r * 0.22, Y - r * 2.05, r * 0.78, 0, Math.PI * 2); c.fill();
  c.fillStyle = shade(col, 0.22); c.beginPath(); c.arc(X - r * 0.38, Y - r * 2.25, r * 0.32, 0, Math.PI * 2); c.fill();
}
function tufts(R, gx, gy, z, col, count, hv) {
  const c = R.c; c.strokeStyle = col; c.lineWidth = Math.max(1, R.s * 0.018); c.lineCap = "round";
  for (let i = 0; i < count; i++) {
    const fx = gx + (((hv >> (i * 3)) % 7) - 3) * 0.09, fy = gy + (((hv >> (i * 3 + 9)) % 7) - 3) * 0.09;
    const [X, Y] = R.pr(fx, fy, z), hh = R.s * 0.07;
    c.beginPath(); c.moveTo(X - hh * 0.4, Y - hh); c.lineTo(X, Y); c.lineTo(X + hh * 0.4, Y - hh); c.moveTo(X, Y); c.lineTo(X, Y - hh * 1.2); c.stroke();
  }
}
function dots(R, gx, gy, z, cols, count, hv, r) {
  const c = R.c;
  for (let i = 0; i < count; i++) {
    const fx = gx + (((hv >> (i * 3 + 1)) % 9) - 4) * 0.08, fy = gy + (((hv >> (i * 3 + 11)) % 9) - 4) * 0.08;
    const [X, Y] = R.pr(fx, fy, z);
    c.fillStyle = cols[i % cols.length]; c.beginPath(); c.arc(X, Y - R.s * 0.02, R.s * (r || 0.03), 0, Math.PI * 2); c.fill();
  }
}
function crystalShard(R, gx, gy, z, hgt, col) {
  const c = R.c, [X, Y] = R.pr(gx, gy, z), w = R.s * 0.06, h = R.s * hgt;
  c.save(); c.shadowColor = shade(col, 0.3); c.shadowBlur = R.s * 0.15;
  poly(c, [[X - w, Y - h * 0.15], [X, Y - h], [X, Y + w * 0.3]], shade(col, 0.35));
  poly(c, [[X, Y - h], [X + w, Y - h * 0.15], [X, Y + w * 0.3]], shade(col, -0.1));
  c.restore();
}
function house(R, x, y, z, tier) {
  const P = R.P, wall = "#F5EFE0", x0 = x + 0.3, x1 = x + 0.7, y0 = y + 0.33, y1 = y + 0.67, hh = tier >= 2 ? 0.75 : 0.45;
  blobShadow(R, x + 0.55, y + 0.55, z, 0.22);
  isoBox(R, x0, y0, x1, y1, z, z + hh, wall, "#E2D8C2", "#C9BC9F");
  if (R.s >= 18) {
    const [wx, wy] = R.pr(x0 + 0.13, y1, z + hh * 0.55); R.c.fillStyle = "rgba(60,40,20,.55)"; R.c.fillRect(wx - R.s * 0.025, wy - R.s * 0.04, R.s * 0.05, R.s * 0.05);
    if (tier >= 2) { const [vx, vy] = R.pr(x0 + 0.27, y1, z + hh * 0.22); R.c.fillRect(vx - R.s * 0.025, vy - R.s * 0.04, R.s * 0.05, R.s * 0.06); }
  }
  if (tier >= 1) isoBox(R, x0 + 0.06, y0 + 0.04, x0 + 0.13, y0 + 0.11, z + hh, z + hh + 0.42, "#9A6B50", "#86593F", "#704A34");
  if (R.amb) {
    if (tier >= 1) R.amb.smoke.push({ gx: x0 + 0.095, gy: y0 + 0.075, z: z + hh + 0.45, hv: hash2(x, y) });
    R.amb.lights.push([x0 + 0.13, y1, z + hh * 0.55]);
    if (tier >= 2) R.amb.lights.push([x0 + 0.27, y1, z + hh * 0.22]);
  }
  gableRoof(R, x0 - 0.04, y0 - 0.04, x1 + 0.04, y1 + 0.04, z + hh, z + hh + 0.32, P.roof);
}
function flagOn(R, gx, gy, z, height, color) {
  const c = R.c, [X, Y] = R.pr(gx, gy, z), [, Yt] = R.pr(gx, gy, z + height);
  c.strokeStyle = "#3A3530"; c.lineWidth = Math.max(1, R.s * 0.02); c.beginPath(); c.moveTo(X, Y); c.lineTo(X, Yt); c.stroke();
  poly(c, [[X, Yt], [X + R.s * 0.16, Yt + R.s * 0.05], [X, Yt + R.s * 0.1]], color);
}
function tower(R, x0, y0, x1, y1, z, h, wall, roof) {
  isoBox(R, x0, y0, x1, y1, z, z + h, wall, shade(wall, -0.1), shade(wall, -0.24));
  if (R.amb) R.amb.lights.push([x1, (y0 + y1) / 2, z + h * 0.6]);
  isoPyramid(R, x0 - 0.03, y0 - 0.03, x1 + 0.03, y1 + 0.03, z + h, z + h + 0.55, shade(roof, 0.15), roof, shade(roof, -0.25));
}
function homeObject(R, z, tierIdx) {
  const P = R.P, c = R.c, stone = "#D9D2C3";
  if (tierIdx === 0) {
    blobShadow(R, 0.45, 0.5, z, 0.22);
    isoPyramid(R, 0.22, 0.25, 0.62, 0.62, z, z + 0.85, "#F0A04B", "#E08A35", "#B9662A");
    const [X, Y] = R.pr(0.78, 0.74, z);
    c.fillStyle = "#6B4A2B"; c.fillRect(X - R.s * 0.06, Y - R.s * 0.015, R.s * 0.12, R.s * 0.03);
    if (R.amb) R.amb.fires.push([0.78, 0.74, z]);
    return;
  }
  if (tierIdx === 1) { house(R, 0, 0, z, 0); return; }
  if (tierIdx === 2) { house(R, 0, 0, z, 1); flagOn(R, 0.82, 0.25, z, 1.4, P.accent); return; }
  if (tierIdx === 3) { blobShadow(R, 0.5, 0.5, z, 0.2); tower(R, 0.34, 0.34, 0.66, 0.66, z, 1.5, stone, P.roof); flagOn(R, 0.5, 0.5, z + 2.05, 0.6, P.accent); return; }
  blobShadow(R, 0.5, 0.5, z, 0.36);
  if (tierIdx >= 5) {
    isoBox(R, 0.12, 0.12, 0.88, 0.88, z, z + 0.4, shade(stone, -0.05), shade(stone, -0.15), shade(stone, -0.3));
    tower(R, 0.1, 0.1, 0.26, 0.26, z, 0.85, stone, P.roof);
    tower(R, 0.74, 0.1, 0.9, 0.26, z, 0.85, stone, P.roof);
    tower(R, 0.1, 0.74, 0.26, 0.9, z, 0.85, stone, P.roof);
  }
  tower(R, 0.32, 0.32, 0.68, 0.68, z + (tierIdx >= 5 ? 0.4 : 0), 1.6, stone, P.roof);
  flagOn(R, 0.5, 0.5, z + (tierIdx >= 5 ? 0.4 : 0) + 2.15, 0.7, P.accent);
  if (tierIdx >= 4) tower(R, 0.62, 0.62, 0.84, 0.84, z, 1.0, stone, P.roof);
  if (tierIdx >= 5) tower(R, 0.74, 0.74, 0.9, 0.9, z, 0.85, stone, P.roof);
}
function discoveryObject(R, id, x, y, z, f) {
  const c = R.c, P = R.P, stone = "#CFC8B8";
  if (id === "harbor") {
    const dx = (f && f.dx) || 1, dy = (f && f.dy) || 0, wood = "#A87A4E";
    const x0 = dx ? x + 0.75 : x + 0.38, x1 = dx ? x + 2.0 : x + 0.62, y0 = dy ? y + 0.75 : y + 0.38, y1 = dy ? y + 2.0 : y + 0.62;
    for (const k of [0.35, 0.75, 1.15]) for (const side of [0, 0.17]) { const px = dx ? x + 0.75 + k : x + 0.4 + side, py = dy ? y + 0.75 + k : y + 0.4 + side; isoBox(R, px, py, px + 0.05, py + 0.05, -0.2, 0.32, "#6B4A2B", "#5A3B22", "#4A311C"); }
    isoBox(R, x0, y0, x1, y1, 0.25, 0.35, wood, shade(wood, -0.15), shade(wood, -0.3));
    isoBox(R, x + 0.3, y + 0.3, x + 0.5, y + 0.5, z, z + 0.2, "#C99A5E", "#B0844D", "#946D3E");
    isoBox(R, x + 0.32, y + 0.55, x + 0.48, y + 0.71, z, z + 0.16, "#C99A5E", "#B0844D", "#946D3E");
    if (R.amb) R.amb.lights.push([dx ? x1 : x + 0.5, dy ? y1 : y + 0.5, 0.7]);
    return;
  }
  if (id === "observatory") {
    blobShadow(R, x + 0.5, y + 0.5, z, 0.3);
    isoBox(R, x + 0.27, y + 0.27, x + 0.73, y + 0.73, z, z + 0.7, "#EDE7DA", "#D6CDB9", "#B8AD95");
    const [X, Y] = R.pr(x + 0.5, y + 0.5, z + 0.7), r = R.s * 0.2;
    c.fillStyle = "#8FA3BF"; c.beginPath(); c.ellipse(X, Y, r, r * 0.55, 0, Math.PI, 0); c.lineTo(X + r, Y); c.ellipse(X, Y, r, r * 1.05, 0, 0, Math.PI, true); c.fill();
    c.fillStyle = "#B9C8DC"; c.beginPath(); c.ellipse(X - r * 0.3, Y - r * 0.55, r * 0.35, r * 0.25, -0.5, 0, Math.PI * 2); c.fill();
    c.strokeStyle = "#3E4A5A"; c.lineWidth = Math.max(1.5, R.s * 0.04); c.lineCap = "round";
    c.beginPath(); c.moveTo(X + r * 0.2, Y - r * 0.7); c.lineTo(X + r * 0.9, Y - r * 1.5); c.stroke();
    if (R.amb) R.amb.lights.push([x + 0.73, y + 0.5, z + 0.4]);
    return;
  }
  if (id === "lighthouse") {
    blobShadow(R, x + 0.5, y + 0.5, z, 0.2);
    for (let i = 0; i < 4; i++) isoBox(R, x + 0.38, y + 0.38, x + 0.62, y + 0.62, z + i * 0.45, z + (i + 1) * 0.45, i % 2 ? "#D94B3B" : "#F7F3EA", i % 2 ? "#C23F31" : "#E5DED0", i % 2 ? "#9E3226" : "#C8C0AE");
    c.save(); c.shadowColor = "#FFD86B"; c.shadowBlur = R.s * 0.5;
    isoBox(R, x + 0.4, y + 0.4, x + 0.6, y + 0.6, z + 1.8, z + 2.15, "#FFE89A", "#FFD45E", "#F0B93A");
    c.restore();
    if (R.amb) R.amb.beacon = [x + 0.5, y + 0.5, z + 1.98];
    isoPyramid(R, x + 0.36, y + 0.36, x + 0.64, y + 0.64, z + 2.15, z + 2.5, "#3E4A5A", "#2E3846", "#232B36");
  } else if (id === "ruins") {
    const hs = [0.9, 0.55, 1.1, 0.35];
    [[0.2, 0.25], [0.5, 0.2], [0.25, 0.6], [0.6, 0.55]].forEach(([fx, fy], i) => isoBox(R, x + fx, y + fy, x + fx + 0.13, y + fy + 0.13, z, z + hs[i], stone, shade(stone, -0.12), shade(stone, -0.28)));
    isoBox(R, x + 0.55, y + 0.72, x + 0.85, y + 0.84, z, z + 0.12, stone, shade(stone, -0.12), shade(stone, -0.28));
  } else if (id === "stones") {
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * Math.PI * 2, fx = 0.5 + Math.cos(a) * 0.3 - 0.05, fy = 0.5 + Math.sin(a) * 0.3 - 0.05;
      isoBox(R, x + fx, y + fy, x + fx + 0.1, y + fy + 0.1, z, z + 0.55 + (i % 3) * 0.18, "#A7A296", "#908A7D", "#767064");
    }
  } else if (id === "tree") {
    const [X, Y] = R.pr(x + 0.5, y + 0.5, z), r = R.s * 0.26;
    blobShadow(R, x + 0.55, y + 0.55, z, 0.34);
    c.fillStyle = "#5A3B22"; poly(c, [[X - r * 0.25, Y], [X - r * 0.12, Y - r * 1.6], [X + r * 0.12, Y - r * 1.6], [X + r * 0.25, Y]], "#5A3B22");
    const g = "#2F7A3E";
    for (const [dx, dy, rr, col] of [[-0.55, -1.9, 0.75, shade(g, -0.2)], [0.55, -1.85, 0.75, shade(g, -0.25)], [0, -2.35, 0.9, g], [-0.25, -2.55, 0.5, shade(g, 0.15)], [0.3, -2.1, 0.45, shade(g, 0.05)]]) {
      c.fillStyle = col; c.beginPath(); c.arc(X + dx * r, Y + dy * r, rr * r, 0, Math.PI * 2); c.fill();
    }
    dots(R, x + 0.5, y + 0.5, z + 1.5, ["#FFD86B"], 3, 0x5a5a5a, 0.018);
  }
}
function boatAt(R, x, y) {
  const c = R.c, [X, Y] = R.pr(x + 0.5, y + 0.5, 0), s = R.s;
  c.fillStyle = "rgba(255,255,255,.35)"; c.beginPath(); c.ellipse(X, Y + s * 0.02, s * 0.2, s * 0.06, 0, 0, Math.PI * 2); c.fill();
  poly(c, [[X - s * 0.17, Y - s * 0.05], [X + s * 0.17, Y - s * 0.05], [X + s * 0.11, Y + s * 0.03], [X - s * 0.11, Y + s * 0.03]], "#7A4E2D");
  c.strokeStyle = "#3A2A1E"; c.lineWidth = Math.max(1, s * 0.015); c.beginPath(); c.moveTo(X, Y - s * 0.05); c.lineTo(X, Y - s * 0.42); c.stroke();
  poly(c, [[X + s * 0.01, Y - s * 0.4], [X + s * 0.15, Y - s * 0.09], [X + s * 0.01, Y - s * 0.09]], "#FBF7EE");
  poly(c, [[X - s * 0.01, Y - s * 0.33], [X - s * 0.11, Y - s * 0.09], [X - s * 0.01, Y - s * 0.09]], "#ECE4D3");
}
function balloonAt(R, x, y, zLift) {
  const c = R.c, P = R.P, [GX, GY] = R.pr(x, y, 1), [X, Y] = R.pr(x, y, zLift), r = R.s * 0.3;
  c.fillStyle = "rgba(0,0,0,.12)"; c.beginPath(); c.ellipse(GX, GY, r * 0.8, r * 0.35, 0, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "rgba(60,40,30,.7)"; c.lineWidth = 1;
  c.beginPath(); c.moveTo(X - r * 0.55, Y + r * 0.6); c.lineTo(X - r * 0.18, Y + r * 1.25); c.moveTo(X + r * 0.55, Y + r * 0.6); c.lineTo(X + r * 0.18, Y + r * 1.25); c.stroke();
  c.fillStyle = "#8A5A35"; c.fillRect(X - r * 0.2, Y + r * 1.2, r * 0.4, r * 0.28);
  c.save(); c.beginPath(); c.moveTo(X - r * 0.45, Y + r * 0.7); c.bezierCurveTo(X - r * 1.25, Y - r * 0.2, X - r * 0.8, Y - r * 1.35, X, Y - r * 1.35); c.bezierCurveTo(X + r * 0.8, Y - r * 1.35, X + r * 1.25, Y - r * 0.2, X + r * 0.45, Y + r * 0.7); c.closePath(); c.clip();
  const cols = [P.accent, P.gold, "#F2EEE4", P.roof];
  for (let i = -3; i <= 3; i++) { c.fillStyle = cols[(i + 4) % cols.length]; c.fillRect(X + i * r * 0.36 - r * 0.18, Y - r * 1.5, r * 0.36, r * 2.4); }
  c.fillStyle = "rgba(255,255,255,.18)"; c.fillRect(X - r * 1.3, Y - r * 1.5, r * 0.9, r * 2.4);
  c.restore();
}
function terrainDecor(R, tile) {
  const { x, y, z, stage, hv, wilt } = tile, P = R.P, s = R.s;
  const gx = x + 0.5, gy = y + 0.5;
  if (wilt) tufts(R, gx, gy, z, "#7A6A4A", 3, hv);
  switch (tile.terrain) {
    case "forest": {
      const col = wilt ? mixc(P.forest, P.wilt, 0.6) : shade(P.forest, -0.08);
      if (stage === 0) pine(R, gx, gy, z, 0.45, col);
      else if (stage === 1) { pine(R, gx - 0.1, gy - 0.1, z, 0.7, col); pine(R, gx + 0.2, gy + 0.15, z, 0.5, col); }
      else { pine(R, gx - 0.2, gy - 0.18, z, 0.85, col); pine(R, gx + 0.18, gy - 0.05, z, 0.7, col); pine(R, gx - 0.02, gy + 0.22, z, 0.9, col); }
      break;
    }
    case "meadow":
      if (!wilt) tufts(R, gx, gy, z, shade(P.meadow, -0.3), 2 + stage, hv);
      if (stage >= 1 && !wilt) dots(R, gx, gy, z, ["#FFFFFF", "#FFD86B", "#F28DB2"], 2 + stage * 2, hv);
      if (stage === 2 && hv % 3 === 0) roundTree(R, gx + 0.12, gy - 0.1, z, 0.7, wilt ? P.wilt : "#5FA34A");
      break;
    case "lake": {
      const c = R.c, [X, Y] = R.pr(gx, gy, z);
      c.strokeStyle = "rgba(255,255,255,.55)"; c.lineWidth = Math.max(1, s * 0.02);
      c.beginPath(); c.ellipse(X + ((hv % 5) - 2) * s * 0.03, Y, s * 0.12, s * 0.05, 0, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
      if (stage >= 1 && !wilt) { const [lx, ly] = R.pr(gx - 0.18, gy + 0.12, z); c.fillStyle = "#4E9A4A"; c.beginPath(); c.ellipse(lx, ly, s * 0.06, s * 0.03, 0, 0.3, Math.PI * 2); c.fill(); }
      if (stage === 2 && !wilt) { tufts(R, gx + 0.25, gy - 0.25, z, "#5B7F3A", 2, hv); dots(R, gx - 0.18, gy + 0.12, z, ["#F7C2D5"], 1, hv, 0.018); }
      break;
    }
    case "dunes":
      if (stage >= 1) { const [X, Y] = R.pr(gx + 0.1, gy - 0.1, z); R.c.fillStyle = "#B99C6B"; R.c.beginPath(); R.c.ellipse(X, Y - s * 0.02, s * 0.05, s * 0.03, 0, 0, Math.PI * 2); R.c.fill(); }
      if (stage === 2 && hv % 2 === 0) {
        const [X, Y] = R.pr(gx - 0.12, gy + 0.08, z), w = s * 0.035, cc = wilt ? P.wilt : "#4E8F4A";
        R.c.fillStyle = cc; R.c.fillRect(X - w / 2, Y - s * 0.3, w, s * 0.3);
        R.c.fillRect(X - w * 2.2, Y - s * 0.2, w * 0.8, s * 0.1); R.c.fillRect(X - w * 2.2, Y - s * 0.14, w * 2, w * 0.8);
        R.c.fillRect(X + w * 1.4, Y - s * 0.25, w * 0.8, s * 0.1); R.c.fillRect(X + w * 0.5, Y - s * 0.17, w * 1.7, w * 0.8);
      }
      break;
    case "peaks": {
      const pk = wilt ? mixc(P.peaks, P.wilt, 0.4) : P.peaks, ht = 0.45 + stage * 0.3 + (hv % 3) * 0.08;
      isoPyramid(R, x + 0.08, y + 0.08, x + 0.92, y + 0.92, z, z + ht, shade(pk, 0.12), pk, shade(pk, -0.25));
      if (stage >= 1) isoPyramid(R, x + 0.5 - 0.42 * 0.32, y + 0.5 - 0.42 * 0.32, x + 0.5 + 0.42 * 0.32, y + 0.5 + 0.42 * 0.32, z + ht * 0.68, z + ht, "#FFFFFF", "#EEF3F8", "#CBD6E2");
      break;
    }
    case "blossom": {
      const col = wilt ? P.wilt : P.blossom;
      if (stage === 0) dots(R, gx, gy, z, [shade(col, 0.2), "#FFFFFF"], 4, hv, 0.035);
      else roundTree(R, gx - 0.05, gy - 0.05, z, stage === 2 ? 0.95 : 0.7, col, "#7A5038");
      if (stage === 2) { roundTree(R, gx + 0.25, gy + 0.2, z, 0.6, shade(col, 0.1), "#7A5038"); dots(R, gx, gy + 0.2, z, [shade(col, 0.3)], 3, hv, 0.02); }
      break;
    }
    case "canyon": {
      const c = R.c, p = R.pr;
      c.strokeStyle = "rgba(60,20,0,.28)"; c.lineWidth = Math.max(1, s * 0.015);
      for (const f of [0.33, 0.66]) { c.beginPath(); const a = p(x, y + 1, z * f), b = p(x + 1, y + 1, z * f), d = p(x + 1, y, z * f); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineTo(d[0], d[1]); c.stroke(); }
      if (stage >= 1) isoBox(R, x + 0.55, y + 0.25, x + 0.75, y + 0.45, z, z + 0.2 + stage * 0.15, shade(P.canyon, 0.1), shade(P.canyon, -0.15), shade(P.canyon, -0.32));
      if (stage === 2) isoBox(R, x + 0.2, y + 0.55, x + 0.36, y + 0.71, z, z + 0.25, shade(P.canyon, 0.1), shade(P.canyon, -0.15), shade(P.canyon, -0.32));
      break;
    }
    case "crystal": {
      const col = wilt ? P.wilt : P.crystal;
      crystalShard(R, gx, gy, z, 0.22 + stage * 0.1, col);
      if (stage >= 1) crystalShard(R, gx - 0.2, gy + 0.12, z, 0.18 + stage * 0.06, col);
      if (stage === 2) crystalShard(R, gx + 0.18, gy - 0.15, z, 0.28, shade(col, 0.15));
      break;
    }
  }
}

function drawMap(ctx, w, h, st) {
  const P = pal(), s = st.view.s, hu = s * 0.3, now = performance.now();
  const uc = st.view.cx - st.view.cy, vc = st.view.cx + st.view.cy;
  const pr = (wx, wy, z) => [w / 2 + ((wx - wy) - uc) * s / 2, h / 2 + ((wx + wy) - vc) * s / 4 - z * hu];
  const amb = { live: [], blades: [], steam: [], smoke: [], lights: [], fires: [], bees: [], boat: null, balloon: null, beacon: null, center: [0.5, 0.5], radius: 1, single: !!(st.model && st.model.single) };
  st.amb = amb;
  const R = { c: ctx, P, s, hu, pr, now, amb };
  ctx.clearRect(0, 0, w, h);
  const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, P.sea); g.addColorStop(1, P.sea2);
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  const [o0x, o0y] = pr(0, 0, 0), sp = 34, offx = ((o0x % sp) + sp) % sp, offy = ((o0y % (sp / 2)) + sp / 2) % (sp / 2);
  ctx.strokeStyle = P.seaInk; ctx.lineWidth = 1.2; ctx.lineCap = "round";
  for (let y = offy - sp, row = 0; y < h + sp; y += sp / 2, row++) for (let x = offx - sp + (row % 2 ? sp / 2 : 0); x < w + sp; x += sp) {
    ctx.beginPath(); ctx.moveTo(x - 5, y); ctx.quadraticCurveTo(x - 2.5, y - 2.5, x, y); ctx.quadraticCurveTo(x + 2.5, y + 2.5, x + 5, y); ctx.stroke();
  }
  const model = st.model;
  if (!model) return;
  let tiles = model.tiles, cutD = null;
  if (st.replay) {
    const p = Math.min(1, (now - st.replay.start) / st.replay.dur);
    tiles = tiles.slice(0, Math.floor(p * tiles.length));
    cutD = tiles.length ? tiles[tiles.length - 1].d : "0000";
    if (p >= 1) { st.replay = null; cutD = null; tiles = model.tiles; }
  }
  const has = id => model.found[id] && (!cutD || model.found[id].d <= cutD);
  const visOcc = cutD ? new Map([["0,0", model.occ.get("0,0")], ...tiles.map(t => [keyOf(t.x, t.y), t])]) : model.occ;
  const homeTier = model.homeTier != null ? model.homeTier : realmOf(tiles.length).i;
  { let sx = 0, sy = 0, n = 0, rad = 1; for (const t of visOcc.values()) { sx += t.x + 0.5; sy += t.y + 0.5; n++; } amb.center = [sx / n, sy / n]; for (const t of visOcc.values()) rad = Math.max(rad, Math.hypot(t.x + 0.5 - amb.center[0], t.y + 0.5 - amb.center[1])); amb.radius = rad; }
  const dropOf = tile => {
    if (!st.anim || keyOf(tile.x, tile.y) !== st.anim.key) return 0;
    const p = Math.min(1, (now - st.anim.start) / 520);
    if (p >= 1) st.anim = null;
    return (1 - p) * (1 - p) * 5;
  };
  // sea level: surf ring, then beach
  const ring = (x, y, e, col) => poly(ctx, [pr(x - e, y - e, 0), pr(x + 1 + e, y - e, 0), pr(x + 1 + e, y + 1 + e, 0), pr(x - e, y + 1 + e, 0)], col);
  for (const t of visOcc.values()) if (!(t.home && model.single)) ring(t.x, t.y, 0.22, P.shore);
  for (const t of visOcc.values()) if (!(t.home && model.single)) ring(t.x, t.y, 0.1, P.sand);
  // painter's order
  const items = [];
  for (const t of visOcc.values()) if (!(t.home && model.single)) items.push({ k: t.home ? "home" : "tile", t, x: t.x, y: t.y });
  if (!cutD) for (const [x, y] of model.lagoons) items.push({ k: "lagoon", x, y });
  if (st.brush && !st.replay) for (const k of frontierOf(model.occ)) { const [x, y] = k.split(",").map(Number); items.push({ k: "front", x, y }); }
  if (has("boat")) {
    let [bx, by] = [model.found.boat.x, model.found.boat.y];
    const blocked = (x, y) => visOcc.has(keyOf(x, y)) || model.lagoons.some(l => l[0] === x && l[1] === y);
    if (blocked(bx, by)) {
      outer: for (let r = 1; r < 8; r++) for (let dx = -r; dx <= r; dx++) for (const dy of [-r, r]) { if (!blocked(bx + dx, by + dy) && !blocked(bx + dy, by + dx)) { bx += dx; by += dy; break outer; } }
    }
    amb.boat = [bx, by];
  }
  items.sort((a, b) => (a.x + a.y) - (b.x + b.y) || a.x - b.x);
  const falls = has("falls") ? model.found.falls : null;
  const fallsAfter = falls ? ((falls.x + falls.y) - (falls.px + falls.py) || falls.x - falls.px) > 0 ? keyOf(falls.x, falls.y) : keyOf(falls.px, falls.py) : null;
  const pulse = 0.55 + 0.35 * Math.sin(now / 260);
  for (const it of items) {
    if (it.k === "lagoon") {
      poly(ctx, [pr(it.x, it.y, 0.02), pr(it.x + 1, it.y, 0.02), pr(it.x + 1, it.y + 1, 0.02), pr(it.x, it.y + 1, 0.02)], P.lagoon);
      dots(R, it.x + 0.5, it.y + 0.5, 0.02, ["rgba(255,255,255,.8)"], 2, hash2(it.x, it.y), 0.018);
      continue;
    }
    if (it.k === "front") {
      const col = P[st.brush.terrain] || P.accent, e = 0.08, pts = [pr(it.x + e, it.y + e, 0.05), pr(it.x + 1 - e, it.y + e, 0.05), pr(it.x + 1 - e, it.y + 1 - e, 0.05), pr(it.x + e, it.y + 1 - e, 0.05)];
      ctx.save(); ctx.globalAlpha = 0.35 * pulse; poly(ctx, pts, col); ctx.globalAlpha = pulse;
      ctx.setLineDash([Math.max(3, s * 0.08), Math.max(2, s * 0.06)]); ctx.lineWidth = Math.max(1.5, s * 0.035); ctx.strokeStyle = col;
      ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (const q of pts.slice(1)) ctx.lineTo(q[0], q[1]); ctx.closePath(); ctx.stroke(); ctx.restore();
      continue;
    }
    const t = it.t, terr = t.home ? "home" : t.terrain;
    const drop = t.home ? 0 : dropOf(t), z = (t.home ? 1 : t.z) + drop;
    if (drop) ctx.globalAlpha = Math.max(0.2, 1 - drop / 5);
    const top = t.wilt ? P.wiltTops[terr] : P.tops[terr];
    isoBox(R, t.x, t.y, t.x + 1, t.y + 1, drop, z, top, P.lefts[terr], P.rights[terr]);
    if (!t.home && terr !== "lake" && terr !== "dunes" && terr !== "peaks" && terr !== "canyon" && terr !== "crystal") {
      // a strip of turf along the top of the dirt sides
      const lip = Math.min(0.22, z * 0.25);
      poly(ctx, [pr(t.x, t.y + 1, z), pr(t.x + 1, t.y + 1, z), pr(t.x + 1, t.y + 1, z - lip), pr(t.x, t.y + 1, z - lip)], shade(top, -0.12));
      poly(ctx, [pr(t.x + 1, t.y, z), pr(t.x + 1, t.y + 1, z), pr(t.x + 1, t.y + 1, z - lip), pr(t.x + 1, t.y, z - lip)], shade(top, -0.26));
    }
    if (s >= 14) { ctx.strokeStyle = "rgba(255,255,255,.14)"; ctx.lineWidth = 1; const a = pr(t.x, t.y + 1, z), b = pr(t.x, t.y, z), c2 = pr(t.x + 1, t.y, z); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c2[0], c2[1]); ctx.stroke(); }
    if (s >= 9) {
      const disc = !t.home && model.onTile.get(keyOf(t.x, t.y));
      if (t.home) homeObject(R, z, homeTier);
      else if (disc && has(disc)) discoveryObject(R, disc, t.x, t.y, z, model.found[disc]);
      else if (t.landmark) house(R, t.x, t.y, z, model.perfectDays >= 15 ? 2 : model.perfectDays >= 5 ? 1 : 0);
      else if (s >= 12) terrainDecor(R, t);
      const its = !t.home && model.items && model.items.get(keyOf(t.x, t.y));
      if (its) its.forEach((id, i) => placeItem(R, id, t, i));
    }
    if (falls && fallsAfter === keyOf(t.x, t.y)) {
      const lake = model.occ.get(keyOf(falls.x, falls.y)), peak = model.occ.get(keyOf(falls.px, falls.py));
      if (lake && peak) {
        const ex = (falls.x + falls.px + 1) / 2, ey = (falls.y + falls.py + 1) / 2, ztop = peak.z + 0.35;
        const [X1, Y1] = pr(ex, ey, ztop), [X2, Y2] = pr(ex, ey, lake.z), wd = s * 0.09;
        const fg = ctx.createLinearGradient(0, Y1, 0, Y2); fg.addColorStop(0, "#DFF4FF"); fg.addColorStop(1, "#8FD0F5");
        ctx.fillStyle = fg; ctx.fillRect(X1 - wd / 2, Y1, wd, Y2 - Y1);
        ctx.fillStyle = "rgba(255,255,255,.85)"; ctx.beginPath(); ctx.ellipse(X2, Y2, wd * 1.4, wd * 0.5, 0, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }
  if (has("balloon")) amb.balloon = model.balloonPos || [1.9, -0.9];
  amb.lanterns = has("lanterns");
}

/* ---------- map widget ---------- */
function fitMap(st) {
  if (!st.w || !st.h) return;
  let umin = 0, umax = 0, vmin = 0, vmax = 0;
  const cells = st.model ? [...st.model.occ.keys()] : ["0,0"];
  if (st.brush && st.model) cells.push(...frontierOf(st.model.occ));
  for (const k of cells) { const [x, y] = k.split(",").map(Number), u = x - y, v = x + y; if (u < umin) umin = u; if (u > umax) umax = u; if (v < vmin) vmin = v; if (v > vmax) vmax = v; }
  const pad = st.pad != null ? st.pad : 1.6;
  const du = umax - umin + 2 + pad * 2, dv = vmax - vmin + 2 + pad * 2;
  st.view.s = Math.max(6, Math.min(st.maxS || 90, st.w / (du / 2), st.h / (dv / 4 + 0.9)));
  const ucen = (umin + umax) / 2, vcen = (vmin + vmax) / 2 + 1 - 1.1;
  st.view.cx = (ucen + vcen) / 2; st.view.cy = (vcen - ucen) / 2;
}
function paintMap(st, now) {
  if (!st.w || !st.h) return;
  now = now || performance.now();
  const ctx = st.ctx, live = st.brush || st.anim || st.replay;
  ctx.save();
  // trauma shake: builds on quick repeats, decays smoothly, driven by layered sines rather than per-frame noise
  if (st.trauma > 0) {
    const dt = Math.min(0.05, (now - (st.tLast || now)) / 1000), tt = now / 1000;
    st.trauma = Math.max(0, st.trauma - 1.8 * dt);
    const k = st.trauma * st.trauma * 7;
    ctx.translate(k * (0.6 * Math.sin(tt * 41) + 0.4 * Math.sin(tt * 87 + 1)), k * (0.6 * Math.sin(tt * 53 + 2) + 0.4 * Math.sin(tt * 97 + 3)));
  }
  st.tLast = now;
  if (live || !st.useCache) drawMap(ctx, st.w, st.h, st);
  else {
    const dpr = window.devicePixelRatio || 1;
    const key = [st.model && st.model.key, st.view.s.toFixed(3), st.view.cx.toFixed(4), st.view.cy.toFixed(4), st.w, st.h, dpr, PAL_VER].join("|");
    if (!st.cache || st.cacheKey !== key) {
      st.cache = st.cache || document.createElement("canvas");
      st.cache.width = Math.round(st.w * dpr); st.cache.height = Math.round(st.h * dpr);
      const cx = st.cache.getContext("2d"); cx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawMap(cx, st.w, st.h, st); st.cacheKey = key; st.cacheAmb = st.amb;
    }
    st.amb = st.cacheAmb;
    ctx.drawImage(st.cache, 0, 0, st.w, st.h);
  }
  drawAmbient(ctx, st, now, !st.ambient || REDUCED);
  ctx.restore();
}
function kickMap(st) {
  if (st.raf) return;
  const loop = ts => {
    st.raf = 0;
    const busy = st.brush || st.anim || st.replay || st.trauma > 0 || (st.fx && st.fx.length);
    const alive = st.ambient && !REDUCED && st.visible !== false && !document.hidden;
    if (!busy && !alive) { paintMap(st, ts); return; }
    const gap = st.model && st.model.tiles && st.model.tiles.length > 500 ? 60 : 33;
    if (busy || ts - (st.lastFrame || 0) >= gap) { st.lastFrame = ts; paintMap(st, ts); }
    st.raf = requestAnimationFrame(loop);
  };
  st.raf = requestAnimationFrame(loop);
}
document.addEventListener("visibilitychange", () => { if (!document.hidden) { if (TR.map) kickMap(TR.map); if (TR.visit) kickMap(TR.visit); } });
function pickCell(st, sx, sy) {
  const s = st.view.s, hu = s * 0.3, uc = st.view.cx - st.view.cy, vc = st.view.cx + st.view.cy;
  const pr = (wx, wy, z) => [st.w / 2 + ((wx - wy) - uc) * s / 2, st.h / 2 + ((wx + wy) - vc) * s / 4 - z * hu];
  const cands = [];
  for (const t of st.model.occ.values()) cands.push({ x: t.x, y: t.y, z: t.home ? 1 : t.z });
  if (st.brush) for (const k of frontierOf(st.model.occ)) { const [x, y] = k.split(",").map(Number); cands.push({ x, y, z: 0.05 }); }
  cands.sort((a, b) => (b.x + b.y) - (a.x + a.y) || b.x - a.x);
  for (const c of cands) {
    const [X, Yt] = pr(c.x + 0.5, c.y + 0.5, c.z), Yb = Yt + c.z * hu, dx = Math.abs(sx - X) / (s / 2);
    if (dx > 1) continue;
    const half = (1 - dx) * s / 4;
    if (sy >= Yt - half && sy <= Yb + half) return [c.x, c.y];
  }
  const u = (sx - st.w / 2) / (s / 2) + uc, v = (sy - st.h / 2) / (s / 4) + vc;
  return [Math.floor((u + v) / 2), Math.floor((v - u) / 2)];
}
function createMap(host, opts) {
  const cv = h("canvas", { class: "map-canvas", role: "img", "aria-label": opts.label || "Your habit island" });
  host.prepend(cv);
  const st = { cv, ctx: cv.getContext("2d"), w: 0, h: 0, view: { cx: 0.5, cy: 0.5, s: 60 }, auto: true, model: null, brush: null, anim: null, replay: null, raf: 0, maxS: opts.maxS, pad: opts.pad, noLabels: opts.noLabels, ambient: !!opts.ambient, useCache: true, fx: [] };
  if (opts.ambient && "IntersectionObserver" in window) { st.io = new IntersectionObserver(es => { st.visible = es[0].isIntersecting; if (st.visible) kickMap(st); }); st.io.observe(cv); }
  const ro = new ResizeObserver(() => {
    const r = cv.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    st.w = r.width; st.h = r.height;
    cv.width = Math.max(1, Math.round(r.width * dpr)); cv.height = Math.max(1, Math.round(r.height * dpr));
    st.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (st.auto) fitMap(st);
    paintMap(st);
    if (st.ambient) kickMap(st);
  });
  ro.observe(cv);
  if (opts.interactive) {
    let down = null;
    cv.addEventListener("pointerdown", e => { down = { x: e.clientX, y: e.clientY, cx: st.view.cx, cy: st.view.cy, moved: false, id: e.pointerId }; });
    cv.addEventListener("pointermove", e => {
      if (!down || down.id !== e.pointerId) return;
      const dx = e.clientX - down.x, dy = e.clientY - down.y;
      if (!down.moved && Math.hypot(dx, dy) < 6) return;
      if (!down.moved) { down.moved = true; try { cv.setPointerCapture(e.pointerId); } catch (_) {} cv.classList.add("dragging"); }
      st.auto = false;
      const du = dx / (st.view.s / 2), dv = dy / (st.view.s / 4);
      st.view.cx = down.cx - (du + dv) / 2; st.view.cy = down.cy - (dv - du) / 2;
      paintMap(st);
    });
    const end = e => {
      if (!down || down.id !== e.pointerId) return;
      const wasTap = !down.moved && e.type === "pointerup";
      down = null; cv.classList.remove("dragging");
      if (wasTap && st.model) {
        const r = cv.getBoundingClientRect();
        const [x, y] = pickCell(st, e.clientX - r.left, e.clientY - r.top);
        opts.onTap && opts.onTap(x, y);
      }
    };
    cv.addEventListener("pointerup", end);
    cv.addEventListener("pointercancel", end);
    cv.addEventListener("wheel", e => { if (!e.ctrlKey) return; e.preventDefault(); zoomMap(st, e.deltaY < 0 ? 1.12 : 1 / 1.12); }, { passive: false });
  }
  st.destroy = () => { ro.disconnect(); if (st.io) st.io.disconnect(); cancelAnimationFrame(st.raf); st.raf = 0; };
  return st;
}
function zoomMap(st, k) { st.auto = false; st.view.s = Math.max(6, Math.min(160, st.view.s * k)); paintMap(st); }
function miniScene(id) {
  const tl = (x, y, terrain, extra) => ({ x, y, terrain, z: terrain === "lake" ? 0.42 : terrain === "peaks" ? 1.2 : 0.95, stage: 2, hv: hash2(x, y), d: "0", hid: "", ...extra });
  const tiles = id === "falls" ? [tl(-1, 0, "peaks"), tl(0, 0, "lake")] : id === "boat" ? [tl(-1, -1, "dunes")] : id === "lagoon" ? [tl(-1, -1, "meadow"), tl(0, -1, "meadow"), tl(1, -1, "forest"), tl(-1, 0, "meadow"), tl(1, 0, "forest"), tl(-1, 1, "forest"), tl(0, 1, "meadow"), tl(1, 1, "meadow")] : [tl(0, 0, "meadow")];
  const occ = new Map(tiles.map(t => [keyOf(t.x, t.y), t]));
  const onTile = new Map(["lighthouse", "ruins", "stones", "tree", "harbor", "observatory"].includes(id) ? [["0,0", id]] : []);
  const found = { [id]: id === "falls" ? { x: 0, y: 0, px: -1, py: 0, d: "0" } : id === "harbor" ? { x: 0, y: 0, dx: 1, dy: 0, d: "0" } : { x: 0, y: 0, d: "0" } };
  return { tiles, occ, found, onTile, regions: [], lagoons: id === "lagoon" ? [[0, 0]] : [], perfectDays: 0, mini: true, balloonPos: [0.5, 0.5] };
}
function drawDiscoveryIcon(cv, id, size) {
  const dpr = window.devicePixelRatio || 1, W = size || 64, H = W;
  cv.width = W * dpr; cv.height = H * dpr;
  const ctx = cv.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const model = miniScene(id);
  const st = { view: { cx: 0, cy: 0, s: 30 }, model, w: W, h: H, noLabels: true, noSky: true, pad: 0.4, maxS: W * (id === "balloon" || id === "lanterns" ? 0.4 : 0.62) };
  fitMap(st);
  if (id === "balloon") { st.view.cx -= 0.9; st.view.cy -= 0.9; }
  if (id === "boat" || id === "harbor") { st.view.cx += 0.45; st.view.cy += 0.45; }
  drawMap(ctx, W, H, st);
  drawAmbient(ctx, st, 0, true);
}

/* ---------- collectibles ---------- */
const FIND_CHANCE = 0.2;
const RARITY = {
  common: { name: "Common", color: "#8A94A6", w: [62, 30] },
  rare: { name: "Rare", color: "#2E8BFF", w: [28, 42] },
  epic: { name: "Epic", color: "#A64DFF", w: [8, 22] },
  legendary: { name: "Legendary", color: "#F5A300", w: [2, 6] },
};
const RARITY_ORDER = ["common", "rare", "epic", "legendary"];
const ITEMS = [
  { id: "sheep", name: "Sheep", r: "common", t: ["meadow", "blossom", "forest"], live: true },
  { id: "duck", name: "Duck", r: "common", t: ["lake"], live: true },
  { id: "mushrooms", name: "Mushroom ring", r: "common", t: "land" },
  { id: "haystack", name: "Haystack", r: "common", t: ["meadow", "dunes", "canyon", "blossom"] },
  { id: "beehive", name: "Beehive", r: "common", t: ["blossom", "meadow", "forest"] },
  { id: "well", name: "Wishing well", r: "common", t: "land" },
  { id: "deer", name: "Deer", r: "rare", t: ["forest", "meadow", "blossom"], live: true },
  { id: "fox", name: "Fox", r: "rare", t: "land", live: true },
  { id: "windmill", name: "Windmill", r: "rare", t: ["meadow", "dunes", "blossom", "canyon"] },
  { id: "camel", name: "Camel", r: "rare", t: ["dunes", "canyon"], live: true },
  { id: "goat", name: "Mountain goat", r: "rare", t: ["peaks", "canyon", "crystal"], live: true },
  { id: "swan", name: "Swan", r: "rare", t: ["lake"], live: true },
  { id: "treehouse", name: "Treehouse", r: "epic", t: ["forest", "blossom", "meadow"] },
  { id: "hotspring", name: "Hot spring", r: "epic", t: ["peaks", "crystal", "canyon", "dunes"] },
  { id: "rainbow", name: "Rainbow", r: "epic", t: "any" },
  { id: "dragon", name: "Baby dragon", r: "legendary", t: "any", live: true },
  { id: "whale", name: "Whale", r: "legendary", t: "any", live: true },
  { id: "phoenix", name: "Phoenix", r: "legendary", t: "any", live: true },
];
const ITEM_BY_ID = Object.fromEntries(ITEMS.map(i => [i.id, i]));
const fitsTerrain = (it, terr) => it.t === "any" || (it.t === "land" ? terr !== "lake" : it.t.includes(terr));
function chestWeights(found, chest) {
  const w = RARITY_ORDER.map(k => RARITY[k].w[chest ? 1 : 0]);
  if (!chest && found && found.ruins) { w[2] *= 2; w[3] *= 2; }
  if (chest && found && found.stones) return [15, 40, 33, 12];
  return w;
}
function rollItem(terr, chest, found, owned) {
  const ws = RARITY_ORDER.map((k, i) => [k, chestWeights(found, chest)[i]]);
  let r = Math.random() * ws.reduce((a, b) => a + b[1], 0), rar = "common";
  for (const [k, x] of ws) { if ((r -= x) < 0) { rar = k; break; } }
  let i = RARITY_ORDER.indexOf(rar), pool = [];
  while (i >= 0 && !(pool = ITEMS.filter(x => x.r === RARITY_ORDER[i] && fitsTerrain(x, terr))).length) i--;
  if (!pool.length) pool = ITEMS.filter(x => x.t === "any");
  if (found && found.harbor && owned) { const fresh = pool.filter(x => !owned[x.id]); if (fresh.length) pool = fresh; }
  return pool[Math.floor(Math.random() * pool.length)].id;
}
function chestTileFor(tiles, d, finds) {
  const day = tiles.filter(x => x.d === d).sort((a, b) => a.t - b.t);
  if (!day.length) return null;
  return [...day].reverse().find(x => !x.landmark && !finds[d + "|" + x.hid]) || day.find(x => x.landmark) || day[day.length - 1];
}

/* ---------- sound (synthesized, no files) ---------- */
const SFX = (() => {
  let ac = null, on = true;
  try { on = localStorage.getItem("ha-sound") !== "off"; } catch (_) {}
  let master = null, ocean = null;
  const ctx = () => {
    if (!ac) {
      try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (_) { return null; }
      // one master bus with a limiter so stacked effects never clip
      const comp = ac.createDynamicsCompressor(); comp.threshold.value = -14; comp.knee.value = 8; comp.ratio.value = 8; comp.attack.value = 0.003; comp.release.value = 0.2;
      master = ac.createGain(); master.gain.value = 0.9; master.connect(comp).connect(ac.destination);
    }
    if (ac.state === "suspended") ac.resume().catch(() => {});
    return ac;
  };
  function tone(f, t0, dur, type, vol, slide) {
    const a = ctx(); if (!a) return;
    const o = a.createOscillator(), g = a.createGain(), s = a.currentTime + t0;
    o.type = type || "sine"; o.frequency.setValueAtTime(f, s);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, s + dur);
    g.gain.setValueAtTime(0.0001, s); g.gain.exponentialRampToValueAtTime(vol || 0.12, s + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, s + dur);
    o.connect(g).connect(master); o.start(s); o.stop(s + dur + 0.03);
  }
  function noise(t0, dur, vol, hp) {
    const a = ctx(); if (!a) return;
    const len = Math.floor(a.sampleRate * dur), buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = a.createBufferSource(), g = a.createGain(), f = a.createBiquadFilter();
    f.type = "highpass"; f.frequency.value = hp || 900; g.gain.value = vol || 0.08;
    src.buffer = buf; src.connect(f).connect(g).connect(master); src.start(a.currentTime + t0);
  }
  const SC = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51, 1567.98];
  const play = fn => { if (on) try { fn(); } catch (_) {} };
  return {
    get on() { return on; },
    toggle() { on = !on; try { localStorage.setItem("ha-sound", on ? "on" : "off"); } catch (_) {} if (on) this.tap(); else this.ocean(false); return on; },
    nope() { play(() => { tone(240, 0, 0.08, "square", 0.04); tone(170, 0.08, 0.12, "square", 0.04); }); },
    ocean(want) {
      if (!want || !on) { if (ocean) { try { ocean.src.stop(); ocean.lfo.stop(); } catch (_) {} ocean = null; } return; }
      if (ocean) return;
      const a = ctx(); if (!a) return;
      const len = a.sampleRate * 3, buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
      let last = 0; for (let i = 0; i < len; i++) { last = last * 0.97 + (Math.random() * 2 - 1) * 0.03; d[i] = last * 6; }
      const src = a.createBufferSource(); src.buffer = buf; src.loop = true;
      const f = a.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 520;
      const g = a.createGain(); g.gain.value = 0.014;
      const lfo = a.createOscillator(), lg = a.createGain(); lfo.frequency.value = 0.09; lg.gain.value = 0.009;
      lfo.connect(lg).connect(g.gain);
      src.connect(f).connect(g).connect(master); src.start(); lfo.start();
      ocean = { src, lfo };
    },
    tap() { play(() => tone(880, 0, 0.05, "sine", 0.05)); },
    place(step) { play(() => { const f = SC[Math.min(step, SC.length - 1)] * (1 + (Math.random() - 0.5) * 0.035); noise(0, 0.06, 0.05, 1800); tone(f / 2, 0, 0.12, "triangle", 0.16, f * 0.7); tone(f, 0.06, 0.22, "sine", 0.1); }); },
    undo() { play(() => tone(420, 0, 0.14, "sine", 0.07, 240)); },
    perfect() { play(() => { [0, 2, 4, 5, 7].forEach((n, i) => tone(SC[n], 0.05 + i * 0.075, 0.4, "triangle", 0.1)); tone(SC[7] * 2, 0.5, 0.5, "sine", 0.05); }); },
    level() { play(() => { [0, 4, 7, 9].forEach((n, i) => tone(SC[Math.min(n, 8)] / 2, i * 0.11, 0.45, "square", 0.04)); [0, 4, 7].forEach((n, i) => tone(SC[n], 0.45 + i * 0.02, 0.8, "triangle", 0.08)); }); },
    shake() { play(() => { noise(0, 0.08, 0.06, 400); tone(140, 0, 0.1, "triangle", 0.12, 90); }); },
    open(rarity) {
      play(() => {
        noise(0, 0.25, 0.09, 1200);
        const k = RARITY_ORDER.indexOf(rarity);
        const notes = [[0, 2, 4], [0, 2, 4, 7], [0, 2, 4, 5, 7], [0, 2, 4, 5, 7, 8]][Math.max(0, k)];
        notes.forEach((n, i) => tone(SC[n], 0.12 + i * 0.07, 0.5 + k * 0.1, "triangle", 0.09));
        if (k >= 2) tone(SC[8] * 2, 0.12 + notes.length * 0.07, 0.9, "sine", 0.05);
      });
    },
  };
})();
const CALM = { on: (() => { try { return localStorage.getItem("ha-calm") === "on"; } catch (_) { return false; } })() };
const calmFx = () => REDUCED || CALM.on;
const REDUCED = (() => { try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (_) { return false; } })();
const HOUR_OVERRIDE = (() => { const m = location.search.match(/[?&]hour=(\d+)/); return m ? +m[1] : null; })();

/* ---------- time of day ---------- */
function skyNow() {
  const d = new Date(), hr = HOUR_OVERRIDE != null ? HOUR_OVERRIDE + 0.01 : d.getHours() + d.getMinutes() / 60;
  let dark = 0, warm = 0;
  if (hr >= 21 || hr < 5) dark = 1;
  else if (hr < 6.5) { dark = (6.5 - hr) / 1.5; warm = 0.6; }
  else if (hr < 8) warm = 0.5 * (8 - hr) / 1.5;
  else if (hr >= 19) { dark = (hr - 19) / 2; warm = 1 - dark * 0.7; }
  else if (hr >= 17.5) warm = (hr - 17.5) / 1.5;
  return { dark, warm, hr };
}

/* ---------- item drawing ---------- */
function circ(c, x, y, r, col) { c.fillStyle = col; c.beginPath(); c.arc(x, y, Math.max(0.5, r), 0, Math.PI * 2); c.fill(); }
function itemSpot(t, i) { const sp = [[0.74, 0.72], [0.26, 0.74], [0.74, 0.28], [0.3, 0.3]][((t.hv || 0) + i) % 4]; return [t.x + sp[0], t.y + sp[1]]; }
function placeItem(R, id, t, i) {
  const it = ITEM_BY_ID[id];
  if (!it) return;
  const amb = R.amb, [gx, gy] = amb && amb.single ? [t.x + 0.5, t.y + 0.55] : itemSpot(t, i), z = t.z, c = R.c, u = R.s / 10;
  if (it.live) { amb && amb.live.push({ id, gx, gy, z, hv: ((t.hv || 0) + i * 977) >>> 0 }); return; }
  const [X, Y] = R.pr(gx, gy, z);
  switch (id) {
    case "mushrooms":
      for (let k = 0; k < 3; k++) {
        const mx = X + (k - 1) * u * 0.9, my = Y + (k % 2) * u * 0.35;
        c.fillStyle = "#EFE6D2"; c.fillRect(mx - u * 0.12, my - u * 0.55, u * 0.24, u * 0.55);
        c.fillStyle = "#D9412F"; c.beginPath(); c.ellipse(mx, my - u * 0.55, u * 0.45, u * 0.32, 0, Math.PI, 0); c.fill();
        circ(c, mx - u * 0.14, my - u * 0.68, u * 0.08, "#fff"); circ(c, mx + u * 0.16, my - u * 0.64, u * 0.06, "#fff");
      }
      break;
    case "haystack":
      blobShadow(R, gx + 0.04, gy + 0.04, z, 0.12);
      c.fillStyle = "#E2B54A"; c.beginPath(); c.ellipse(X, Y, u * 1.05, u * 1.2, 0, Math.PI, 0); c.fill();
      c.strokeStyle = "rgba(140,90,20,.45)"; c.lineWidth = Math.max(1, u * 0.12);
      for (const yy of [0.4, 0.8]) { c.beginPath(); c.ellipse(X, Y - u * yy, u * 1.0 * (1 - yy * 0.4), u * 0.25, 0, 0.1, Math.PI - 0.1); c.stroke(); }
      break;
    case "beehive":
      c.fillStyle = "#6B4A2B"; c.fillRect(X - u * 0.08, Y - u * 0.9, u * 0.16, u * 0.9);
      for (let k = 0; k < 3; k++) { c.fillStyle = k % 2 ? "#C98F21" : "#F0BE45"; c.beginPath(); c.ellipse(X, Y - u * (1.05 + k * 0.32), u * (0.55 - k * 0.12), u * 0.2, 0, 0, Math.PI * 2); c.fill(); }
      if (amb) amb.bees.push({ gx, gy, z: z + 0.45, hv: t.hv || 0 });
      break;
    case "well": {
      const b = 0.11;
      isoBox(R, gx - b, gy - b, gx + b, gy + b, z, z + 0.28, "#3C6E9E", "#B3AA98", "#958C79");
      c.strokeStyle = "#5A3B22"; c.lineWidth = Math.max(1, u * 0.18);
      const p1 = R.pr(gx - b, gy, z + 0.28), p2 = R.pr(gx - b, gy, z + 0.75), p3 = R.pr(gx + b, gy, z + 0.28), p4 = R.pr(gx + b, gy, z + 0.75);
      c.beginPath(); c.moveTo(p1[0], p1[1]); c.lineTo(p2[0], p2[1]); c.moveTo(p3[0], p3[1]); c.lineTo(p4[0], p4[1]); c.stroke();
      gableRoof(R, gx - b - 0.03, gy - b, gx + b + 0.03, gy + b, z + 0.72, z + 0.92, R.P.roof);
      break;
    }
    case "windmill":
      blobShadow(R, gx + 0.03, gy + 0.03, z, 0.12);
      isoBox(R, gx - 0.08, gy - 0.08, gx + 0.08, gy + 0.08, z, z + 1.0, "#F3EEE3", "#DED5C3", "#BFB49D");
      isoPyramid(R, gx - 0.1, gy - 0.1, gx + 0.1, gy + 0.1, z + 1.0, z + 1.35, shade(R.P.roof, 0.1), R.P.roof, shade(R.P.roof, -0.25));
      if (amb) amb.blades.push({ gx: gx + 0.09, gy: gy + 0.09, z: z + 0.92 });
      break;
    case "treehouse": {
      roundTree(R, gx - 0.02, gy - 0.02, z, 1.25, "#3E8C4A");
      const hz = z + 1.15;
      isoBox(R, gx - 0.09, gy - 0.07, gx + 0.09, gy + 0.09, hz, hz + 0.32, "#B07A47", "#9A6838", "#7E532B");
      gableRoof(R, gx - 0.11, gy - 0.09, gx + 0.11, gy + 0.11, hz + 0.32, hz + 0.5, R.P.roof);
      c.strokeStyle = "#7E532B"; c.lineWidth = Math.max(1, u * 0.12);
      const a = R.pr(gx + 0.1, gy + 0.1, z), b2 = R.pr(gx + 0.1, gy + 0.1, hz);
      c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b2[0], b2[1]); c.stroke();
      if (amb) amb.lights.push([gx + 0.09, gy + 0.01, hz + 0.16]);
      break;
    }
    case "hotspring":
      c.fillStyle = "#9C9486"; c.beginPath(); c.ellipse(X, Y, u * 1.5, u * 0.78, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = "#6FD6D0"; c.beginPath(); c.ellipse(X, Y, u * 1.2, u * 0.58, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = "rgba(255,255,255,.45)"; c.beginPath(); c.ellipse(X - u * 0.3, Y - u * 0.15, u * 0.5, u * 0.16, 0, 0, Math.PI * 2); c.fill();
      if (amb) amb.steam.push({ gx, gy, z: z + 0.1, hv: t.hv || 0 });
      break;
    case "rainbow": {
      const [cx, cy] = R.pr(t.x + 0.5, t.y + 0.5, z), rr = u * 3.6;
      const cols = ["#E8483B", "#F39A2B", "#F5D547", "#53B85B", "#3D8FE0", "#7A5CD6"];
      c.save(); c.globalAlpha = 0.78; c.lineWidth = Math.max(1, u * 0.3);
      cols.forEach((col, k) => { c.strokeStyle = col; c.beginPath(); c.arc(cx, cy + u * 0.4, rr - k * u * 0.3, Math.PI * 1.05, Math.PI * 1.95); c.stroke(); });
      c.restore();
      break;
    }
  }
}
function creature(R, a, t, amb, occ) {
  const c = R.c, u = R.s / 10, wob = (a.hv % 628) / 100;
  let gx = a.gx + Math.sin(t * 0.35 + wob) * 0.08, gy = a.gy + Math.cos(t * 0.28 + wob * 1.3) * 0.07;
  const face = Math.cos(t * 0.35 + wob) - Math.sin(t * 0.28 + wob * 1.3) * 0.8 > 0 ? 1 : -1;
  const shadow = (x, y, rx) => { c.fillStyle = "rgba(0,0,0,.16)"; c.beginPath(); c.ellipse(x, y, rx, rx * 0.45, 0, 0, Math.PI * 2); c.fill(); };
  const legs = (X, Y, xs, len, col) => { c.strokeStyle = col; c.lineWidth = Math.max(1, u * 0.16); c.beginPath(); for (const x of xs) { c.moveTo(X + x, Y); c.lineTo(X + x, Y - len); } c.stroke(); };
  switch (a.id) {
    case "sheep": {
      const hop = Math.sin(t * 0.5 + wob) > 0.7 ? Math.abs(Math.sin(t * 6 + wob)) * u * 0.3 : 0;
      const [X, Y] = R.pr(gx, gy, a.z); shadow(X, Y, u * 0.9);
      legs(X, Y - hop, [-u * 0.4, u * 0.35], u * 0.6, "#3A3532");
      for (const [dx, dy] of [[-0.45, -1.05], [0.3, -1.05], [-0.1, -1.4], [0.05, -0.85]]) circ(c, X + dx * u, Y + dy * u - hop, u * 0.55, "#F7F4EC");
      circ(c, X + face * 0.85 * u, Y - 1.2 * u - hop, u * 0.32, "#3A3532");
      break;
    }
    case "duck": case "swan": {
      const [X, Y0] = R.pr(gx, gy, a.z), Y = Y0 + Math.sin(t * 2 + wob) * u * 0.08, swan = a.id === "swan";
      c.strokeStyle = "rgba(255,255,255,.5)"; c.lineWidth = 1; c.beginPath(); c.ellipse(X, Y + u * 0.1, u * (swan ? 1.3 : 0.95), u * 0.35, 0, 0, Math.PI * 2); c.stroke();
      c.fillStyle = swan ? "#FFFFFF" : "#F3D34A"; c.beginPath(); c.ellipse(X, Y - u * 0.2, u * (swan ? 0.85 : 0.6), u * 0.38, 0, 0, Math.PI * 2); c.fill();
      if (swan) { c.strokeStyle = "#FFFFFF"; c.lineWidth = u * 0.26; c.beginPath(); c.moveTo(X + face * u * 0.5, Y - u * 0.3); c.bezierCurveTo(X + face * u * 1.1, Y - u * 0.8, X + face * u * 0.2, Y - u * 1.4, X + face * u * 0.7, Y - u * 1.7); c.stroke(); circ(c, X + face * u * 0.72, Y - u * 1.72, u * 0.22, "#FFFFFF"); poly(c, [[X + face * u * 0.9, Y - u * 1.78], [X + face * u * 1.25, Y - u * 1.68], [X + face * u * 0.9, Y - u * 1.6]], "#F08A2B"); }
      else { circ(c, X + face * u * 0.45, Y - u * 0.65, u * 0.28, "#2F7A3E"); poly(c, [[X + face * u * 0.68, Y - u * 0.7], [X + face * u * 1.0, Y - u * 0.6], [X + face * u * 0.68, Y - u * 0.52]], "#F08A2B"); }
      break;
    }
    case "deer": case "goat": case "camel": {
      const [X, Y] = R.pr(gx, gy, a.z), goat = a.id === "goat", camel = a.id === "camel";
      const col = goat ? "#ECE7DD" : camel ? "#D2A869" : "#A66A3F", legH = camel ? u * 1.3 : u * 0.9;
      shadow(X, Y, u * 1.0);
      legs(X, Y, [-u * 0.5, -u * 0.25, u * 0.25, u * 0.5], legH, shade(col, -0.35));
      const by = Y - legH;
      c.fillStyle = col; c.beginPath(); c.ellipse(X, by, u * 0.85, u * 0.42, 0, 0, Math.PI * 2); c.fill();
      if (camel) circ(c, X - face * u * 0.05, by - u * 0.4, u * 0.42, col);
      const nx = X + face * u * 0.7, ny = by - u * (camel ? 0.2 : 0.1);
      c.strokeStyle = col; c.lineWidth = u * 0.3; c.beginPath(); c.moveTo(nx, ny); c.lineTo(nx + face * u * 0.25, ny - u * 0.8); c.stroke();
      c.fillStyle = col; c.beginPath(); c.ellipse(nx + face * u * 0.4, ny - u * 0.95, u * 0.35, u * 0.22, 0, 0, Math.PI * 2); c.fill();
      if (a.id === "deer") { c.strokeStyle = "#6B4A2B"; c.lineWidth = Math.max(1, u * 0.1); c.beginPath(); c.moveTo(nx + face * u * 0.25, ny - u * 1.1); c.lineTo(nx + face * u * 0.05, ny - u * 1.6); c.moveTo(nx + face * u * 0.15, ny - u * 1.35); c.lineTo(nx - face * u * 0.15, ny - u * 1.5); c.stroke(); circ(c, X - face * u * 0.8, by - u * 0.1, u * 0.14, "#FFFFFF"); }
      if (goat) { c.strokeStyle = "#7E7A70"; c.lineWidth = Math.max(1, u * 0.12); c.beginPath(); c.arc(nx + face * u * 0.1, ny - u * 1.05, u * 0.3, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); }
      break;
    }
    case "fox": {
      const [X, Y] = R.pr(gx, gy, a.z), col = "#E0732E";
      shadow(X, Y, u * 0.8);
      legs(X, Y, [-u * 0.35, u * 0.35], u * 0.45, "#3A2A1E");
      const by = Y - u * 0.6;
      c.fillStyle = col; c.beginPath(); c.ellipse(X - face * u * 0.95, by - u * 0.1, u * 0.55, u * 0.25, -face * 0.4, 0, Math.PI * 2); c.fill();
      circ(c, X - face * u * 1.4, by - u * 0.3, u * 0.17, "#FFFFFF");
      c.fillStyle = col; c.beginPath(); c.ellipse(X, by, u * 0.65, u * 0.3, 0, 0, Math.PI * 2); c.fill();
      poly(c, [[X + face * u * 0.45, by - u * 0.2], [X + face * u * 1.05, by - u * 0.25], [X + face * u * 0.6, by - u * 0.65]], col);
      poly(c, [[X + face * u * 0.55, by - u * 0.55], [X + face * u * 0.62, by - u * 0.95], [X + face * u * 0.75, by - u * 0.6]], shade(col, -0.2));
      break;
    }
    case "phoenix": {
      const [X, Y] = R.pr(a.gx, a.gy, a.z), fl = Math.sin(t * 9 + wob);
      c.save(); c.shadowColor = "#FF8A3D"; c.shadowBlur = u * 3;
      for (let k = 0; k < 3; k++) poly(c, [[X - face * u * 0.2, Y - u * 1.1], [X - face * u * (1.4 + k * 0.25 + fl * 0.1), Y - u * (0.6 + k * 0.45)], [X - face * u * 0.4, Y - u * 1.4]], ["#FFD35A", "#FF8A3D", "#E8483B"][k]);
      c.restore();
      c.fillStyle = "#E8483B"; c.beginPath(); c.ellipse(X, Y - u * 1.3, u * 0.5, u * 0.32, 0, 0, Math.PI * 2); c.fill();
      circ(c, X + face * u * 0.45, Y - u * 1.65, u * 0.22, "#FF8A3D");
      poly(c, [[X + face * u * 0.62, Y - u * 1.68], [X + face * u * 0.9, Y - u * 1.6], [X + face * u * 0.62, Y - u * 1.55]], "#FFD35A");
      c.strokeStyle = "#5A3B22"; c.lineWidth = Math.max(1, u * 0.1); c.beginPath(); c.moveTo(X - u * 0.5, Y - u * 0.95); c.lineTo(X + u * 0.5, Y - u * 0.95); c.stroke();
      break;
    }
    case "dragon": {
      const [cx, cy] = amb.center, rr = amb.single ? 0.9 : Math.max(2, amb.radius * 0.55 + 1.2), ang = t * 0.32 + wob;
      const wx = cx + Math.cos(ang) * rr, wy = cy + Math.sin(ang) * rr, zz = (amb.single ? 2.2 : 4.4) + Math.sin(t * 1.6) * 0.3;
      const [X, Y] = R.pr(wx, wy, zz), [GX, GY] = R.pr(wx, wy, 1), [NX] = R.pr(wx - Math.sin(ang) * 0.1, wy + Math.cos(ang) * 0.1, zz);
      const f = NX >= X ? 1 : -1, flap = Math.sin(t * 9 + wob);
      c.fillStyle = "rgba(0,0,0,.1)"; c.beginPath(); c.ellipse(GX, GY, u * 1.1, u * 0.45, 0, 0, Math.PI * 2); c.fill();
      const body = "#3FB8A0";
      poly(c, [[X - u * 0.2, Y - u * 0.1], [X - u * 0.9, Y - u * (0.2 + flap * 1.3)], [X + u * 0.3, Y - u * 0.2]], shade(body, -0.2));
      c.strokeStyle = body; c.lineWidth = u * 0.28; c.lineCap = "round"; c.beginPath(); c.moveTo(X - f * u * 0.5, Y); c.quadraticCurveTo(X - f * u * 1.2, Y + u * 0.3, X - f * u * 1.5, Y - u * 0.2); c.stroke();
      c.fillStyle = body; c.beginPath(); c.ellipse(X, Y, u * 0.75, u * 0.36, 0, 0, Math.PI * 2); c.fill();
      circ(c, X + f * u * 0.75, Y - u * 0.3, u * 0.3, body);
      poly(c, [[X + f * u * 0.65, Y - u * 0.55], [X + f * u * 0.6, Y - u * 0.9], [X + f * u * 0.8, Y - u * 0.55]], "#F5D547");
      poly(c, [[X + u * 0.1, Y - u * 0.1], [X + u * 0.8, Y - u * (0.2 + flap * 1.4)], [X + u * 0.5, Y]], shade(body, 0.12));
      circ(c, X + f * u * 0.88, Y - u * 0.36, u * 0.06, "#1A1A1A");
      if (Math.sin(t * 0.7 + wob) > 0.96) { c.save(); c.shadowColor = "#FF8A3D"; c.shadowBlur = u * 2; poly(c, [[X + f * u * 1.0, Y - u * 0.3], [X + f * u * 2.0, Y - u * 0.55], [X + f * u * 1.9, Y - u * 0.05]], "#FFB347"); c.restore(); }
      break;
    }
    case "whale": {
      const [cx, cy] = amb.center, rr = amb.single ? 1.2 : amb.radius + 2.4, ang = -t * 0.11 + wob;
      const wx = cx + Math.cos(ang) * rr, wy = cy + Math.sin(ang) * rr;
      if (occ && occ.has(keyOf(Math.floor(wx), Math.floor(wy)))) break;
      const [X, Y] = R.pr(wx, wy, 0), [NX] = R.pr(wx - Math.sin(ang) * 0.1, wy + Math.cos(ang) * 0.1, 0), f = NX >= X ? -1 : 1;
      const dip = Math.sin(t * 0.8 + wob) * u * 0.15;
      c.fillStyle = "rgba(255,255,255,.35)"; c.beginPath(); c.ellipse(X, Y + u * 0.2, u * 2.0, u * 0.5, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = "#2B4A6E"; c.beginPath(); c.ellipse(X, Y - u * 0.25 + dip, u * 1.6, u * 0.55, 0, Math.PI, 0); c.fill();
      c.fillStyle = "#3E6690"; c.beginPath(); c.ellipse(X + f * u * 0.3, Y - u * 0.5 + dip, u * 0.7, u * 0.18, 0, Math.PI, 0); c.fill();
      poly(c, [[X - f * u * 1.5, Y - u * 0.2 + dip], [X - f * u * 2.3, Y - u * 0.8 + dip], [X - f * u * 2.0, Y - u * 0.2 + dip], [X - f * u * 2.4, Y + u * 0.1 + dip]], "#2B4A6E");
      const sp = (t + wob) % 6;
      if (sp < 1.2) { const k = sp / 1.2; for (let j = -1; j <= 1; j++) circ(c, X + f * u * 0.6 + j * u * 0.35 * k, Y - u * (0.8 + k * 1.4) + j * j * u * 0.3 * k, u * 0.14 * (1 - k * 0.5), "rgba(235,248,255," + (1 - k) + ")"); }
      break;
    }
  }
}
function drawClouds(R, w, h, t, alpha) {
  const c = R.c;
  for (let k = 0; k < 3; k++) {
    const sz = 18 + k * 7, sp = 5 + k * 2.5, x = ((t * sp + k * 520) % (w + sz * 8)) - sz * 4, y = h * (0.08 + k * 0.36);
    c.fillStyle = "rgba(0,0,0," + (0.035 * alpha) + ")"; c.beginPath(); c.ellipse(x + 24, y + 56, sz * 1.4, sz * 0.32, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "rgba(255,255,255," + (0.5 * alpha) + ")";
    for (const [dx, dy, r] of [[-0.9, 0.1, 0.55], [-0.3, -0.25, 0.7], [0.4, -0.1, 0.6], [0.95, 0.15, 0.45], [0, 0.2, 0.6]]) { c.beginPath(); c.arc(x + dx * sz, y + dy * sz, r * sz, 0, Math.PI * 2); c.fill(); }
  }
}
function puffs(R, p, t, rgb, maxA) {
  const c = R.c, u = R.s / 10, [X, Y] = R.pr(p.gx, p.gy, p.z), off = ((p.hv || 0) % 100) / 100;
  for (let k = 0; k < 3; k++) {
    const ph = (t * 0.45 + k / 3 + off) % 1;
    c.fillStyle = rgb + ((1 - ph) * maxA).toFixed(3) + ")";
    c.beginPath(); c.arc(X + Math.sin(ph * 4 + k) * u * 0.4, Y - ph * u * 4.5, u * (0.3 + ph * 0.7), 0, Math.PI * 2); c.fill();
  }
}
function drawLabels(R, st, w, h) {
  const ctx = R.c, P = R.P, s = R.s, model = st.model;
  if (st.noLabels || st.replay || s < 18 || !model.regions) return;
  const placed = [];
  let shown = 0;
  ctx.save(); ctx.textAlign = "center"; ctx.textBaseline = "middle";
  for (const r of model.regions) {
    if (shown >= 5 || r.size < 6) continue;
    const size = Math.round(Math.max(10, Math.min(14, s * 0.12 + Math.sqrt(r.size) * 0.8)));
    ctx.font = "700 " + size + "px 'Bricolage Grotesque', system-ui, sans-serif";
    if ("letterSpacing" in ctx) ctx.letterSpacing = "0.06em";
    const [X, Y] = R.pr(r.cx, r.cy, r.z + 1.1), text = r.name.toUpperCase(), tw = ctx.measureText(text).width;
    const box = [X - tw / 2 - 4, Y - size / 2 - 3, X + tw / 2 + 4, Y + size / 2 + 3];
    if (box[0] < 4 || box[2] > w - 4 || box[1] < 4 || box[3] > h - 4) continue;
    if (placed.some(b => !(box[2] < b[0] || box[0] > b[2] || box[3] < b[1] || box[1] > b[3]))) continue;
    placed.push(box); shown++;
    ctx.lineWidth = Math.max(3, size * 0.32); ctx.lineJoin = "round"; ctx.strokeStyle = P.halo; ctx.strokeText(text, X, Y);
    ctx.globalAlpha = 0.82; ctx.fillStyle = P.ink; ctx.fillText(text, X, Y); ctx.globalAlpha = 1;
  }
  if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
  ctx.restore();
}
function viewProj(st) {
  const s = st.view.s, hu = s * 0.3, uc = st.view.cx - st.view.cy, vc = st.view.cx + st.view.cy;
  return (wx, wy, z) => [st.w / 2 + ((wx - wy) - uc) * s / 2, st.h / 2 + ((wx + wy) - vc) * s / 4 - z * hu];
}
function drawAmbient(ctx, st, now, still) {
  const amb = st.amb, model = st.model;
  if (!amb || !model) return;
  const P = pal(), s = st.view.s, w = st.w, h = st.h;
  const R = { c: ctx, P, s, hu: s * 0.3, pr: viewProj(st), now, amb };
  const t = still ? 7.3 : now / 1000;
  if (s >= 8) {
    for (const b of amb.blades) {
      const [X, Y] = R.pr(b.gx, b.gy, b.z), L = s * 0.17;
      ctx.save(); ctx.translate(X, Y); ctx.rotate(t * 1.4);
      for (let k = 0; k < 4; k++) { ctx.rotate(Math.PI / 2); ctx.fillStyle = "#F7F2E6"; ctx.fillRect(-L * 0.08, 0, L * 0.16, L); ctx.strokeStyle = "rgba(90,60,40,.6)"; ctx.lineWidth = 1; ctx.strokeRect(-L * 0.08, 0, L * 0.16, L); }
      ctx.restore(); circ(ctx, X, Y, s * 0.02, "#5A3B22");
    }
    for (const p of amb.smoke) puffs(R, p, t, "rgba(236,236,236,", 0.5);
    for (const p of amb.steam) puffs(R, p, t, "rgba(255,255,255,", 0.65);
    for (const f of amb.fires) {
      const [X, Y] = R.pr(f[0], f[1], f[2]), fl = 0.8 + Math.sin(t * 13) * 0.2, u = s / 10;
      ctx.save(); ctx.shadowColor = "#FFB347"; ctx.shadowBlur = s * 0.3;
      poly(ctx, [[X - u * 0.4, Y], [X, Y - u * 1.3 * fl], [X + u * 0.4, Y]], "#FF8A3D");
      poly(ctx, [[X - u * 0.2, Y], [X, Y - u * 0.7 * fl], [X + u * 0.2, Y]], "#FFE07A");
      ctx.restore();
    }
    for (const b of amb.bees) {
      const [X, Y] = R.pr(b.gx, b.gy, b.z);
      for (let k = 0; k < 3; k++) circ(ctx, X + Math.sin(t * 3 + k * 2.1) * s * 0.06, Y + Math.cos(t * 4 + k * 1.7) * s * 0.035, Math.max(1, s * 0.012), "#2A2A2A");
    }
    if (amb.boat) {
      const [X, Y] = R.pr(amb.boat[0] + 0.5, amb.boat[1] + 0.5, 0), bob = Math.sin(t * 1.6) * s * 0.012;
      ctx.save(); ctx.translate(X, Y + bob); ctx.rotate(Math.sin(t * 1.2) * 0.05); ctx.translate(-X, -Y);
      boatAt(R, amb.boat[0], amb.boat[1]); ctx.restore();
    }
    for (const a of amb.live) creature(R, a, t, amb, model.occ);
  }
  if (amb.lanterns && s >= 6) {
    const sky0 = st.noSky ? { dark: 0.6 } : skyNow(), a = 0.45 + 0.55 * sky0.dark;
    ctx.save(); ctx.shadowColor = "#FFB347"; ctx.shadowBlur = s * 0.25;
    for (let k = 0; k < 12; k++) {
      const ph = ((t * 0.05 + k / 12) % 1), ang = k * 2.4 + t * 0.03;
      const rr = (amb.single ? 0.6 : amb.radius * 0.7) * (0.3 + (k % 4) / 4);
      const [X, Y] = R.pr(amb.center[0] + Math.cos(ang) * rr, amb.center[1] + Math.sin(ang) * rr, 1.5 + ph * (amb.single ? 3 : 7));
      const al = a * Math.sin(ph * Math.PI);
      ctx.fillStyle = "rgba(255,170,70," + al.toFixed(3) + ")"; ctx.fillRect(X - s * 0.03, Y - s * 0.045, s * 0.06, s * 0.08);
      ctx.fillStyle = "rgba(255,230,150," + al.toFixed(3) + ")"; ctx.fillRect(X - s * 0.015, Y - s * 0.02, s * 0.03, s * 0.03);
    }
    ctx.restore();
  }
  if (amb.balloon && s >= 6) balloonAt(R, amb.balloon[0], amb.balloon[1], (model.mini ? 2.6 : 4.5) + Math.sin(t * 0.8) * 0.25);
  if (!st.noSky) {
    const sky = skyNow(), darkTheme = P.dark;
    drawClouds(R, w, h, still ? 30 : t, 1 - sky.dark * 0.6);
    if (sky.warm > 0) { ctx.fillStyle = "rgba(255,138,70," + (0.13 * sky.warm).toFixed(3) + ")"; ctx.fillRect(0, 0, w, h); }
    if (sky.dark > 0) {
      ctx.fillStyle = "rgba(12,18,58," + ((darkTheme ? 0.28 : 0.42) * sky.dark).toFixed(3) + ")"; ctx.fillRect(0, 0, w, h);
      for (let k = 0; k < 40; k++) {
        const sx = (hash2(k, 7) % 1000) / 1000 * w, sy = (hash2(k, 13) % 1000) / 1000 * h * 0.5, tw = 0.5 + 0.5 * Math.sin(t * 2 + k);
        circ(ctx, sx, sy, 1 + (k % 3) * 0.3, "rgba(255,255,240," + (sky.dark * 0.7 * tw).toFixed(3) + ")");
      }
      ctx.save(); ctx.shadowColor = "#FFCF6B"; ctx.shadowBlur = s * 0.25;
      for (const L of amb.lights) { const [X, Y] = R.pr(L[0], L[1], L[2]); ctx.fillStyle = "rgba(255,214,120," + (0.95 * sky.dark).toFixed(3) + ")"; ctx.fillRect(X - s * 0.025, Y - s * 0.045, s * 0.05, s * 0.055); }
      ctx.restore();
      if (amb.beacon) {
        const [X, Y] = R.pr(amb.beacon[0], amb.beacon[1], amb.beacon[2]), ang = t * 0.9, L = s * 4;
        const g = ctx.createRadialGradient(X, Y, 0, X, Y, L); g.addColorStop(0, "rgba(255,236,160," + (0.55 * sky.dark) + ")"); g.addColorStop(1, "rgba(255,236,160,0)");
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(X, Y); ctx.arc(X, Y, L, ang - 0.18, ang + 0.18); ctx.closePath(); ctx.fill();
      }
    }
  }
  drawLabels(R, st, w, h);
  // particles, floating text, confetti
  if (st.fx && st.fx.length) {
    const dt = Math.min(0.05, (now - (st.fxLast || now)) / 1000); st.fxLast = now;
    st.fx = st.fx.filter(p => (p.life -= dt) > 0);
    for (const p of st.fx) {
      p.vy += (p.g || 0) * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      const k = Math.max(0, p.life / p.max);
      if (p.type === "text") { ctx.save(); ctx.globalAlpha = Math.min(1, k * 2); ctx.font = "800 " + p.size + "px 'Bricolage Grotesque', system-ui, sans-serif"; ctx.textAlign = "center"; ctx.lineWidth = 4; ctx.strokeStyle = "rgba(0,0,0,.35)"; ctx.strokeText(p.text, p.x, p.y); ctx.fillStyle = p.color; ctx.fillText(p.text, p.x, p.y); ctx.restore(); }
      else if (p.type === "ring") { ctx.strokeStyle = "rgba(255,255,255," + (k * 0.8).toFixed(3) + ")"; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(p.x, p.y, (1 - k) * p.size + 4, ((1 - k) * p.size + 4) * 0.5, 0, 0, Math.PI * 2); ctx.stroke(); }
      else if (p.type === "spark") { const r = p.size * Math.sin(k * Math.PI); ctx.fillStyle = p.color; ctx.beginPath(); ctx.moveTo(p.x, p.y - r); ctx.lineTo(p.x + r * 0.3, p.y - r * 0.3); ctx.lineTo(p.x + r, p.y); ctx.lineTo(p.x + r * 0.3, p.y + r * 0.3); ctx.lineTo(p.x, p.y + r); ctx.lineTo(p.x - r * 0.3, p.y + r * 0.3); ctx.lineTo(p.x - r, p.y); ctx.lineTo(p.x - r * 0.3, p.y - r * 0.3); ctx.closePath(); ctx.fill(); }
      else if (p.type === "conf") { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot + (p.max - p.life) * p.spin); ctx.globalAlpha = Math.min(1, k * 3); ctx.fillStyle = p.color; ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2); ctx.restore(); }
      else { ctx.globalAlpha = Math.min(1, k * 1.5); circ(ctx, p.x, p.y, p.size * (0.5 + k * 0.5), p.color); ctx.globalAlpha = 1; }
    }
  } else st.fxLast = now;
}
function fxBurst(st, wx, wy, z, color) {
  if (!st || !st.w) return;
  const [X, Y] = viewProj(st)(wx, wy, z);
  st.fx = st.fx || [];
  const n = calmFx() ? 6 : 22;
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, sp = 60 + Math.random() * 140;
    st.fx.push({ x: X, y: Y, vx: Math.cos(a) * sp, vy: -90 - Math.random() * 180, g: 520, life: 0.6 + Math.random() * 0.5, max: 1.1, size: 2 + Math.random() * 3, color: i % 3 ? color : "#FFFFFF" });
  }
  st.fx.push({ type: "ring", x: X, y: Y, vx: 0, vy: 0, life: 0.5, max: 0.5, size: st.view.s * 0.9 });
  st.fx.push({ type: "text", x: X, y: Y - st.view.s * 0.3, vx: 0, vy: -55, life: 1.1, max: 1.1, size: 22, text: "+1", color: "#FFFFFF" });
  if (!calmFx()) st.trauma = Math.min(1, (st.trauma || 0) + 0.5);
}
function fxConfetti(st) {
  if (!st || !st.w || calmFx()) return;
  st.fx = st.fx || [];
  const cols = ["#E8483B", "#F5D547", "#3D8FE0", "#53B85B", "#A64DFF", "#FF8FB1", "#FFFFFF"];
  for (let i = 0; i < 90; i++) st.fx.push({ type: "conf", x: Math.random() * st.w, y: -10 - Math.random() * 80, vx: (Math.random() - 0.5) * 80, vy: 80 + Math.random() * 140, g: 90, life: 2.4 + Math.random(), max: 3.4, size: 6 + Math.random() * 5, color: cols[i % cols.length], rot: Math.random() * 6, spin: (Math.random() - 0.5) * 10 });
}
function fxSparkle(st, cells) {
  if (!st || !st.w || !st.model) return;
  st.fx = st.fx || [];
  const pr = viewProj(st);
  for (const t of cells.slice(0, 60)) {
    const [X, Y] = pr(t.x + 0.5, t.y + 0.5, t.z + 0.6);
    for (let k = 0; k < 2; k++) st.fx.push({ type: "spark", x: X + (Math.random() - 0.5) * st.view.s * 0.5, y: Y + (Math.random() - 0.5) * st.view.s * 0.3, vx: 0, vy: -12, life: 0.9 + k * 0.5 + Math.random() * 0.6, max: 1.6, size: 4 + Math.random() * 4, color: k ? "#FFF6C2" : "#FFFFFF" });
  }
}

/* ---------- chest reveal ---------- */
const revealQueue = [];
let revealOpen = false;
function queueReveal(r) { revealQueue.push(r); if (!revealOpen) nextReveal(); }
function nextReveal() {
  const r = revealQueue.shift();
  if (!r) {
    revealOpen = false;
    if (TR.askName && current && current.view === "map" && !islandName()) { TR.askName = false; setTimeout(openIslandNameSheet, 250); }
    return;
  }
  revealOpen = true;
  const kind = r.kind || "item";
  let color, label, title, lines, sound;
  if (kind === "item") {
    const it = ITEM_BY_ID[r.id], rar = RARITY[it.r];
    color = rar.color; label = rar.name; title = it.name; sound = () => SFX.open(it.r);
    lines = [(r.isNew ? "New! " : "Another one. You have " + r.count + " now. ") + (it.live ? "It lives on your island." : "It now stands on your island."), r.src];
  } else if (kind === "discovery") {
    const d = DISCOVERIES.find(x => x.id === r.id);
    color = "#18A999"; label = "Discovery"; title = d.name; sound = () => { SFX.open("epic"); setTimeout(() => SFX.perfect(), 350); };
    lines = [PERKS[d.id] ? "Unlocks: " + PERKS[d.id] : "Something new appeared on " + (islandName() || "your island") + ".", "Found because you managed to " + d.hint.charAt(0).toLowerCase() + d.hint.slice(1) + "."];
  } else {
    color = "#F5A300"; label = "New realm"; title = "Your island is now a " + REALMS[r.i][1]; sound = () => SFX.level();
    lines = ["Home became " + HOME_NAMES[r.i] + ".", r.i + 1 < REALMS.length ? "Next: " + REALMS[r.i + 1][1] + " at " + REALMS[r.i + 1][0] + " squares." : "The largest realm there is."];
  }
  const art = h("canvas", { class: "reveal-art", width: "160", height: "160", "aria-hidden": "true" });
  const btn = h("button", { class: "btn primary reveal-btn" }, kind === "item" && r.isNew ? "Add to my island" : kind === "realm" ? "Let's go" : "Nice");
  const card = h("div", { class: "reveal-card" + (kind === "item" ? "" : " no-chest"), style: "--rc:" + color },
    h("div", { class: "rays", "aria-hidden": "true" }),
    kind === "item" ? h("div", { class: "chest", "aria-hidden": "true" }, h("div", { class: "lid" }), h("div", { class: "box" }, h("i"))) : null,
    art,
    h("div", { class: "reveal-text" },
      h("div", { class: "reveal-rarity" }, label),
      h("h2", null, title),
      h("p", null, lines[0]),
      lines[1] ? h("p", { class: "muted", style: "font-size:13px" }, lines[1]) : null),
    btn);
  const el = h("div", { class: "reveal", role: "dialog", "aria-modal": "true", "aria-label": label + ": " + title }, card);
  const close = () => { el.remove(); document.removeEventListener("keydown", onKey); setTimeout(nextReveal, 200); };
  const onKey = e => { if (e.key === "Escape" || ((e.key === "Enter" || e.key === " ") && card.classList.contains("open"))) { e.preventDefault(); close(); } };
  document.addEventListener("keydown", onKey);
  btn.addEventListener("click", close);
  el.addEventListener("click", e => { if (e.target === el && card.classList.contains("open")) close(); });
  document.body.append(el);
  if (kind === "item") drawItemIcon(art, r.id, 160);
  else if (kind === "discovery") drawDiscoveryIcon(art, r.id, 160);
  else drawRealmIcon(art, r.i, 160);
  const big = kind !== "item" || ["epic", "legendary"].includes(ITEM_BY_ID[r.id].r);
  const open = () => {
    card.classList.add("open"); sound(); setTimeout(() => btn.focus(), 50);
    if (big && !calmFx()) {
      const cols = ["#E8483B", "#F5D547", "#3D8FE0", "#53B85B", "#A64DFF", "#FF8FB1", color];
      for (let i = 0; i < 40; i++) card.append(h("i", { class: "rconf", style: "--x:" + Math.round(Math.random() * 360 - 180) + "px;--y:" + Math.round(200 + Math.random() * 180) + "px;--r:" + Math.round(Math.random() * 720 - 360) + "deg;--d:" + (Math.random() * 0.3).toFixed(2) + "s;background:" + cols[i % cols.length] }));
    }
  };
  if (REDUCED || kind !== "item") setTimeout(open, REDUCED ? 0 : 60);
  else { SFX.shake(); setTimeout(SFX.shake, 380); setTimeout(open, 900); }
}
function itemScene(id) {
  const it = ITEM_BY_ID[id];
  const terr = it.t === "any" || it.t === "land" ? (id === "whale" ? "dunes" : "meadow") : it.t[0];
  const tile = { x: 0, y: 0, terrain: terr, z: terr === "lake" ? 0.42 : terr === "peaks" ? 1.1 : 0.95, stage: 0, hv: 0, d: "0", hid: "" };
  const tiles = [tile], occ = new Map([["0,0", tile]]);
  return { tiles, occ, found: {}, onTile: new Map(), regions: [], lagoons: [], perfectDays: 0, mini: true, items: new Map([["0,0", [id]]]), single: true };
}
function drawRealmIcon(cv, tier, size) {
  const dpr = window.devicePixelRatio || 1, W = size || 64;
  cv.width = W * dpr; cv.height = W * dpr;
  const ctx = cv.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const model = { tiles: [], occ: new Map([["0,0", { x: 0, y: 0, home: true, z: 1 }]]), found: {}, onTile: new Map(), regions: [], lagoons: [], perfectDays: 0, mini: true, items: new Map(), homeTier: tier };
  const st = { view: { cx: 0.5, cy: 0.5, s: W * 0.85 }, model, w: W, h: W, noLabels: true, noSky: true };
  const focus = viewProj(st)(0.5, 0.5, 1.8), dv = (focus[1] - W / 2) / (st.view.s / 4);
  st.view.cx += dv / 2; st.view.cy += dv / 2;
  drawMap(ctx, W, W, st); drawAmbient(ctx, st, 0, true);
}
function drawItemIcon(cv, id, size) {
  const dpr = window.devicePixelRatio || 1, W = size || 64;
  cv.width = W * dpr; cv.height = W * dpr;
  const ctx = cv.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const st = { view: { cx: 0, cy: 0, s: 30 }, model: itemScene(id), w: W, h: W, noLabels: true, noSky: true };
  st.view.s = W * (id === "whale" ? 0.42 : id === "rainbow" ? 0.62 : id === "dragon" ? 0.6 : 1.05);
  st.view.cx = st.view.cy = 0.5;
  const focus = viewProj(st)(0.5, 0.5, st.model.tiles[0].z + (id === "dragon" ? 1.9 : id === "whale" ? -0.2 : ["windmill", "treehouse", "deer", "camel"].includes(id) ? 1.0 : 0.6));
  const dv = (focus[1] - W / 2) / (st.view.s / 4);
  st.view.cx += dv / 2; st.view.cy += dv / 2;
  drawMap(ctx, W, W, st);
  drawAmbient(ctx, st, 0, true);
}

/* ---------- data ---------- */
const trackerSaver = (() => {
  let pending = null, busy = false;
  async function flush() {
    if (busy || !pending) return;
    busy = true;
    const job = pending; pending = null;
    try { await S.db.doc(job.path).set(job.body); } catch (err) { writeFailed(err); }
    busy = false;
    if (pending) flush();
  }
  return { save(path, body) { pending = { path, body: clone(body) }; flush(); }, get busy() { return busy || !!pending; } };
})();
const mirrorSaver = (() => {
  let pending = null, busy = false;
  async function flush() {
    if (busy || !pending) return;
    busy = true; const job = pending; pending = null;
    try { await S.db.doc(job.path).set(job.body); } catch (_) {}
    busy = false; if (pending) flush();
  }
  return { save(path, body) { pending = { path, body }; flush(); } };
})();
const islandPath = uid => "people/" + uid + "/island";
function mirrorBody(d) { return { name: d.name || "", habits: (d.habits || []).map(x => ({ id: x.id, terrain: x.terrain, since: x.since || null, archived: x.archived || null })), log: d.log || {}, finds: d.finds || {}, updated: Date.now() }; }
function commitTracker() {
  TR.ver++;
  trackerSaver.save(trackerPath(), S.tracker);
  if (S.tracker && S.tracker.share) mirrorSaver.save(islandPath(S.me), mirrorBody(S.tracker));
  refresh();
}
async function setShare(on) {
  ensureTracker().share = !!on;
  commitTracker();
  if (!on) { try { await S.db.doc(islandPath(S.me)).delete(); } catch (_) {} toast("Your island is private again"); }
  else toast("Friends in your rooms can now visit your island");
}
function ensureTracker() {
  if (!S.tracker) S.tracker = { v: 1, created: todayStr(), habits: [], log: {} };
  S.tracker.habits = S.tracker.habits || []; S.tracker.log = S.tracker.log || {};
  return S.tracker;
}
function startBrush(hb, date) {
  if (readOnly()) { toast("You need edit access to this page to paint"); return; }
  TR.brush = { hid: hb.id, date, terrain: hb.terrain, name: hb.name };
  SFX.tap();
  if (TR.map) { TR.map.brush = TR.brush; if (TR.map.auto) fitMap(TR.map); kickMap(TR.map); }
  refresh();
  const stage = $("#map-stage");
  if (stage) { const r = stage.getBoundingClientRect(); if (r.top < 0 || r.bottom > innerHeight) stage.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" }); }
}
function stopBrush() {
  TR.brush = null;
  if (TR.map) { TR.map.brush = null; if (TR.map.auto) fitMap(TR.map); paintMap(TR.map); }
  refresh();
}
function placeTile(x, y) {
  const br = TR.brush, doc = ensureTracker(), t = todayStr();
  if (!br) return;
  const before = trackerModel(doc, t);
  const hb = before.habits.find(z => z.id === br.hid), terr = hb ? hb.terrain : br.terrain;
  doc.log[br.date] = { ...(doc.log[br.date] || {}), [br.hid]: [x, y, Date.now()] };
  doc.finds = doc.finds || {};
  const hs0 = before.hstat[br.hid], revived = !!(hs0 && hs0.wilting), first = before.tiles.length === 0;
  const reveals = [];
  const fk = br.date + "|" + br.hid;
  if (!(fk in doc.finds)) {
    const F = before.found, firstToday = Object.keys(doc.log[br.date]).length === 1;
    const chance = Math.max(FIND_CHANCE, F.boat && firstToday ? 0.35 : 0, F.observatory && new Date().getHours() >= 19 && br.date === t ? 0.5 : 0);
    doc.finds[fk] = first || revived || Math.random() < chance ? rollItem(terr, false, F, before.owned) : "";
    if (doc.finds[fk]) reveals.push({ id: doc.finds[fk], src: first ? "Your first square came with a chest." : revived ? "Comeback chest for reviving " + (hb ? hb.name : "a habit") + "." : "Found while painting " + (hb ? hb.name : "a square") + "." });
  }
  TR.ver++;
  let after = trackerModel(doc, t);
  const pd = after.perDay[br.date], wasPerfect = before.perDay[br.date] && before.perDay[br.date].perfect, nowPerfect = !!(pd && pd.perfect && !wasPerfect);
  if (nowPerfect && !((br.date + "|*") in doc.finds)) {
    const tl = chestTileFor(after.tiles, br.date, doc.finds);
    doc.finds[br.date + "|*"] = rollItem(tl ? tl.terrain : terr, true, after.found, after.owned);
    reveals.push({ id: doc.finds[br.date + "|*"], src: "Perfect-day chest. Every habit done " + (br.date === t ? "today" : "that day") + "." });
    if (after.found.lanterns && !((br.date + "|+") in doc.finds)) {
      doc.finds[br.date + "|+"] = rollItem(tl ? tl.terrain : terr, true, after.found, { ...after.owned, [doc.finds[br.date + "|*"]]: 1 });
      reveals.push({ id: doc.finds[br.date + "|+"], src: "The lanterns brought a second chest." });
    }
    TR.ver++; after = trackerModel(doc, t);
  }
  if (after.found.balloon && after.dayStreak > before.dayStreak && after.dayStreak % 7 === 0 && !((br.date + "|run") in doc.finds)) {
    doc.finds[br.date + "|run"] = rollItem(terr, true, after.found, after.owned);
    reveals.push({ id: doc.finds[br.date + "|run"], src: "The balloon dropped a bonus chest for " + after.dayStreak + " days in a row." });
    TR.ver++; after = trackerModel(doc, t);
  }
  TR.brush = null;
  const tileNow = after.occ.get(keyOf(x, y));
  if (TR.map) {
    const st = TR.map;
    st.brush = null; st.model = after; st.anim = { key: keyOf(x, y), start: performance.now() };
    if (st.auto) fitMap(st);
    setTimeout(() => { fxBurst(st, x + 0.5, y + 0.5, tileNow ? tileNow.z : 1, pal()[terr] || "#ffffff"); if (nowPerfect) fxConfetti(st); kickMap(st); }, REDUCED ? 0 : 380);
    kickMap(st);
  }
  commitTracker();
  const doneToday = Object.keys(doc.log[br.date] || {}).length;
  SFX.place(doneToday - 1);
  const r0 = realmOf(before.tiles.length), r1 = realmOf(after.tiles.length);
  let delay = 500;
  if (first) pipSay("Look at that, real land! Every habit you do adds a square. Now let's see what's in that chest.");
  else if (revived) pipSay("Your " + LAND_IS[terr] + " green again. Told you it would come back.");
  if (nowPerfect) setTimeout(() => { SFX.perfect(); pipSay("Perfect day! I'm building you a house for it" + (after.growTomorrow ? ". And " + after.growTomorrow + " square" + (after.growTomorrow === 1 ? " grows" : "s grow") + " overnight." : ".")); }, delay += 250);
  const big = [];
  if (r1.i > r0.i) big.push({ kind: "realm", i: r1.i });
  for (const d of DISCOVERIES) if (after.found[d.id] && !before.found[d.id]) big.push({ kind: "discovery", id: d.id });
  big.forEach(r => setTimeout(() => queueReveal(r), delay += 500));
  if (first && !islandName()) TR.askName = true;
  const newRegion = after.regions.find(r => !before.regions.some(b2 => b2.name === r.name));
  if (newRegion) setTimeout(() => pipSay("Four squares of " + TERRAIN_NAME[newRegion.terrain].toLowerCase() + " together. I'm calling that " + newRegion.name + "."), delay += 600);
  const seen = { ...before.owned };
  reveals.forEach(r => { r.count = (seen[r.id] || 0) + 1; r.isNew = !seen[r.id]; seen[r.id] = r.count; setTimeout(() => queueReveal(r), delay + 500); });
}
function tapCell(x, y) {
  const st = TR.map;
  if (!st || !st.model) return;
  const k = keyOf(x, y), tile = st.model.occ.get(k);
  if (!TR.brush) {
    if (tile && tile.home) toast("Home: " + HOME_NAMES[realmOf(st.model.tiles.length).i] + ". It grows with your island.");
    else if (tile) {
      const hb = st.model.habits.find(z => z.id === tile.hid), disc = st.model.onTile.get(k);
      const region = st.model.regions.find(r => Math.abs(r.cx - (tile.x + 0.5)) < 4 && Math.abs(r.cy - (tile.y + 0.5)) < 4 && r.terrain === tile.terrain);
      toast((hb ? hb.name : "Square") + " · " + fmtDate(tile.d) + (disc ? " · " + DISCOVERIES.find(d => d.id === disc).name : tile.landmark ? " · perfect day" : region ? " · " + region.name : "") + (tile.wilt ? " · wilting" : ""));
    }
    return;
  }
  if (tile) { SFX.nope(); toast("That square is already painted"); return; }
  if (!frontierOf(st.model.occ).has(k)) { SFX.nope(); toast("Paint a glowing square next to your land"); return; }
  placeTile(x, y);
}
function autoPlace() {
  if (!TR.brush || !TR.map || !TR.map.model) return;
  const [x, y] = autoSpot(TR.map.model, TR.brush.terrain);
  placeTile(x, y);
}
function undoTile(hb, date) {
  const doc = S.tracker;
  if (!doc || !doc.log[date] || !doc.log[date][hb.id]) return;
  delete doc.log[date][hb.id];
  if (!Object.keys(doc.log[date]).length) delete doc.log[date];
  commitTracker();
  SFX.undo();
  toast("Square removed");
}

/* ---------- views ---------- */
function terrainSwatch(terrain, cls) { return h("span", { class: "tswatch " + (cls || ""), style: "background:var(--t-" + terrain + ")", "aria-hidden": "true" }); }
function islandName() { return (S.tracker && S.tracker.name) || ""; }
function renderMapView(view) {
  const ro = readOnly();
  if (ro) view.append(h("div", { class: "notice warn", style: "margin-bottom:16px" }, "You can't save here. Ask the owner of this page to share it with you as an Editor."));
  view.append(
    h("section", { class: "map-head" },
      h("div", { style: "min-width:0" }, h("div", { class: "eyebrow" }, "Personal · only you can see it"),
        h("div", { class: "island-title" }, h("h1", { id: "island-name" }, "My island"), ro ? null : h("button", { class: "btn sm ghost", id: "rename-btn", onclick: openIslandNameSheet }, "Rename")),
        h("div", { id: "realm-line", class: "realm-line" })),
      h("div", { class: "head-actions" },
        h("button", { class: "btn", id: "btn-replay", onclick: () => { const st = TR.map; if (!st || !st.model || !st.model.tiles.length) { toast("Paint a few squares first"); return; } if (st.auto) fitMap(st); st.replay = { start: performance.now(), dur: Math.min(8000, 1400 + st.model.tiles.length * 50) }; kickMap(st); } }, "Replay growth"),
        S.downloads ? h("button", { class: "btn", onclick: saveMapImage }, "Save image") : null,
        h("button", { class: "btn", onclick: openMapHabitsSheet, disabled: ro ? true : null }, icon("gear"), "Habits"))),
    h("div", { class: "map-layout" },
      h("div", { class: "col" },
        h("div", { class: "card map-card" },
          h("div", { class: "map-stage", id: "map-stage" },
            h("div", { class: "map-zoom" },
              h("button", { "aria-label": "Zoom in", onclick: () => TR.map && zoomMap(TR.map, 1.3) }, "+"),
              h("button", { "aria-label": "Zoom out", onclick: () => TR.map && zoomMap(TR.map, 1 / 1.3) }, "−"),
              h("button", { "aria-label": "Fit the whole island", onclick: () => { if (TR.map) { TR.map.auto = true; fitMap(TR.map); paintMap(TR.map); } } }, "⤢"),
              h("button", { id: "calm-btn", "aria-pressed": String(CALM.on), "aria-label": "Calm effects (less shake and confetti)", title: "Calm effects", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/></svg>', onclick: e => { CALM.on = !CALM.on; try { localStorage.setItem("ha-calm", CALM.on ? "on" : "off"); } catch (_) {} e.currentTarget.setAttribute("aria-pressed", String(CALM.on)); toast(CALM.on ? "Calm effects on: less shake and confetti" : "Full effects on"); } }),
              h("button", { id: "sound-btn", "aria-label": SFX.on ? "Mute sounds" : "Turn sounds on", svg: SFX.on ? SVG.soundOn : SVG.soundOff, onclick: e => { const on = SFX.toggle(); const b = e.currentTarget; b.innerHTML = on ? SVG.soundOn : SVG.soundOff; b.setAttribute("aria-label", on ? "Mute sounds" : "Turn sounds on"); } })),
            h("div", { id: "map-report" }),
            h("div", { id: "map-banner" })),
          h("div", { class: "milestone", id: "milestone" })),
        h("section", { class: "card panel", id: "map-collection" }),
        h("section", { class: "card panel", id: "map-discoveries" }),
        h("section", { class: "card panel", id: "map-chronicle" })),
      h("div", { class: "col" },
        h("section", { class: "card panel", id: "map-today" }),
        h("section", { class: "card panel", id: "map-legend" }))));
  TR.map = createMap($("#map-stage"), { interactive: true, onTap: tapCell, ambient: true });
  $("#map-stage").addEventListener("pointerdown", () => SFX.ocean(true), { once: true });
  TR.discDrawn = ""; TR.collDrawn = ""; TR.chronDrawn = ""; TR.reportDone = false;
}
function updateMapView() {
  const t = todayStr(), doc = S.tracker, model = trackerModel(doc, t);
  const habits = model.habits.filter(hb => !hb.archived);
  if (TR.brush && !habits.some(hb => hb.id === TR.brush.hid)) TR.brush = null;
  if (TR.map) { TR.map.model = model; TR.map.brush = TR.brush; if (TR.map.auto) fitMap(TR.map); paintMap(TR.map); kickMap(TR.map); }
  const realm = realmOf(model.tiles.length);
  if (!TR.reportDone && S.tracker !== undefined) { TR.reportDone = true; morningReport(model, t); }
  const nm = $("#island-name"); if (nm) nm.textContent = islandName() || "My island";
  const rb = $("#rename-btn"); if (rb) rb.textContent = islandName() ? "Rename" : "Name it";
  const rl = $("#realm-line");
  if (rl) put(rl, h("b", null, realm.name), " · " + fmtNum(model.tiles.length) + " square" + (model.tiles.length === 1 ? "" : "s") + (model.regions.length ? " · " + model.regions.length + " region" + (model.regions.length === 1 ? "" : "s") : "") + (model.first ? " · since " + fmtDate(model.first) : ""));
  const ms = $("#milestone");
  if (ms) {
    if (realm.next) {
      const p = (model.tiles.length - realm.at) / (realm.next - realm.at);
      put(ms, h("div", { class: "milestone-line" }, h("span", null, h("b", null, realm.name), " → " + realm.nextName), h("span", { class: "mono muted" }, (realm.next - model.tiles.length) + " squares to go")),
        h("div", { class: "bar gold" }, h("i", { style: "width:" + Math.max(2, p * 100) + "%" })),
        h("div", { class: "muted", style: "font-size:13px" }, "At " + realm.nextName + ", home becomes " + HOME_NAMES[realm.i + 1] + "."), nextDiscoveryLine(model));
    } else put(ms, h("div", { class: "milestone-line" }, h("span", null, h("b", null, realm.name), ". The largest realm there is."), h("span", { class: "mono muted" }, fmtNum(model.tiles.length) + " squares")), nextDiscoveryLine(model));
  }
  const banner = $("#map-banner");
  if (banner) {
    put(banner, TR.brush ? h("div", { class: "brush-banner" },
      terrainSwatch(TR.brush.terrain),
      h("div", { style: "min-width:0;flex:1" }, h("b", null, TR.brush.name), h("div", { class: "muted", style: "font-size:13px" }, "Tap a glowing square next to your land")),
      h("button", { class: "btn sm primary", onclick: autoPlace }, "Place for me"),
      h("button", { class: "btn sm ghost", onclick: stopBrush }, "Cancel"))
      : !model.tiles.length && S.tracker !== undefined ? h("div", { class: "brush-banner quiet" }, h("div", null, h("b", null, "This is home: a tent and a campfire."), h("div", { class: "muted", style: "font-size:13px" }, "Every habit you complete adds one square of land. Pick where it goes. Forests grow, villages appear, and the camp becomes a castle."))) : null);
    $("#map-stage").classList.toggle("brushing", !!TR.brush);
  }
  const today = $("#map-today");
  if (today) put(today, mapTodayPanel(model, habits, t));
  const legend = $("#map-legend");
  if (legend) {
    put(legend, mapLegendPanel(model, habits));
    const el = legend.querySelector("[data-countup]"), to = model.tiles.length, from = TR.lastSquares != null ? TR.lastSquares : to;
    if (el && from !== to && !REDUCED) {
      const t0 = performance.now();
      const step = now => { const k = Math.min(1, (now - t0) / 700), e = 1 - Math.pow(1 - k, 3); el.textContent = fmtNum(Math.round(from + (to - from) * e)); if (k < 1 && el.isConnected) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    } else if (el) el.textContent = fmtNum(to);
    TR.lastSquares = to;
  }
  const coll = $("#map-collection");
  if (coll) {
    const sig = ITEMS.map(i => model.owned[i.id] || 0).join(",") + PAL_VER;
    if (sig !== TR.collDrawn) { TR.collDrawn = sig; put(coll, collectionPanel(model)); }
  }
  const chron = $("#map-chronicle");
  if (chron) { const sig = model.key + "|" + !!TR.chronAll; if (sig !== TR.chronDrawn) { TR.chronDrawn = sig; put(chron, chroniclePanel(model)); } }
  const disc = $("#map-discoveries");
  if (disc) {
    const sig = DISCOVERIES.map(d => model.found[d.id] ? d.id : "").join("|") + document.documentElement.getAttribute("data-theme") + matchMedia("(prefers-color-scheme: dark)").matches;
    if (sig !== TR.discDrawn) { TR.discDrawn = sig; put(disc, discoveriesPanel(model)); }
  }
}
function nextDiscoveryLine(model) {
  const n = model.next && model.next[0];
  if (!n) return null;
  const d = DISCOVERIES.find(x => x.id === n.id);
  return h("div", { class: "next-disc" },
    h("span", null, "Next discovery: ", h("b", null, d.name)),
    h("span", { class: "mono muted" }, n.v + "/" + n.goal + " " + n.unit),
    h("div", { class: "bar", style: "height:6px" }, h("i", { style: "width:" + Math.max(3, n.p * 100) + "%;background:var(--accent)" })));
}
function oddsTable(found) {
  const W = [chestWeights(found, false), chestWeights(found, true)];
  const tot = i => W[i].reduce((a, b) => a + b, 0);
  const pct = (k, i) => (W[i][RARITY_ORDER.indexOf(k)] / tot(i) * 100).toFixed(0) + "%";
  return h("details", { class: "odds" }, h("summary", null, "Chest odds"),
    h("table", null,
      h("thead", null, h("tr", null, h("th", null, "Rarity"), h("th", null, "Square chest"), h("th", null, "Perfect-day chest"))),
      h("tbody", null, RARITY_ORDER.map(k => h("tr", null, h("td", null, h("span", { class: "rdot", style: "background:" + RARITY[k].color }), RARITY[k].name), h("td", null, pct(k, 0)), h("td", null, pct(k, 1)))))),
    h("p", null, "These odds include any perks you've unlocked. Free to play: chests are earned by doing habits, never bought. The items you can get depend on the terrain of the square."));
}
function collectionPanel(model) {
  const have = ITEMS.filter(i => model.owned[i.id]).length;
  return [
    h("div", { class: "panel-head" }, h("h2", { style: "font-size:20px" }, "Collection"), h("span", { class: "eyebrow" }, have + " of " + ITEMS.length)),
    h("p", { class: "muted", style: "margin:0;font-size:13px" }, "Every square you paint has a 1 in 5 chance of a chest. A perfect day always gives one, with better odds. Your first square and a revived habit always do too."),
    oddsTable(model.found),
    h("div", { class: "coll" }, ITEMS.map(it => {
      const n = model.owned[it.id] || 0, rc = RARITY[it.r].color;
      if (!n) return h("div", { class: "coll-cell locked", style: "--rc:" + rc, title: RARITY[it.r].name + " · not found yet" }, h("div", { class: "coll-art mystery" }, "?"), h("span", null, RARITY[it.r].name));
      const cv = h("canvas", { class: "coll-art", width: "64", height: "64", "aria-hidden": "true" });
      requestAnimationFrame(() => drawItemIcon(cv, it.id, 64));
      return h("div", { class: "coll-cell", style: "--rc:" + rc, title: it.name + " · " + RARITY[it.r].name }, cv, h("b", null, it.name), n > 1 ? h("span", { class: "coll-n" }, "×" + n) : h("span", null, RARITY[it.r].name));
    })),
  ];
}
function chronicle(model) {
  const ev = [];
  if (model.first) ev.push({ d: model.first, t: (islandName() || "The island") + " was founded with its first square." });
  REALMS.forEach(([n, name], i) => { if (i && model.tiles.length >= n) ev.push({ d: model.tiles[n - 1].d, t: "Grew into a " + name + ". Home became " + HOME_NAMES[i] + "." }); });
  for (const d of DISCOVERIES) if (model.found[d.id]) ev.push({ d: model.found[d.id].d, t: "Discovered: " + d.name + "." });
  for (const it of ITEMS) if ((it.r === "epic" || it.r === "legendary") && model.firstFind[it.id]) ev.push({ d: model.firstFind[it.id], t: "A " + RARITY[it.r].name.toLowerCase() + " find: " + it.name + "." });
  const runText = { 7: "A full week in a row.", 21: "21 days in a row.", 66: "66 days in a row. On average, that's when a habit starts to run on its own (Lally, 2010).", 100: "100 days in a row.", 365: "A whole year in a row." };
  for (const m of model.runMarks) ev.push({ d: m.d, t: runText[m.n] });
  ev.sort((a, b) => a.d < b.d ? 1 : a.d > b.d ? -1 : 0);
  return ev;
}
function chroniclePanel(model) {
  const ev = chronicle(model);
  const shown = TR.chronAll ? ev : ev.slice(0, 6);
  return [
    h("div", { class: "panel-head" }, h("h2", { style: "font-size:20px" }, "Chronicle"), h("span", { class: "eyebrow" }, ev.length + " moments")),
    ev.length ? h("ol", { class: "chron" }, shown.map(e => h("li", null, h("time", null, fmtDate(e.d)), h("span", null, e.t)))) : h("p", { class: "muted", style: "margin:0" }, "Your island's story starts with its first square."),
    ev.length > 6 ? h("button", { class: "linkish", style: "justify-self:start;font-size:13px", onclick: () => { TR.chronAll = !TR.chronAll; TR.chronDrawn = ""; refresh(); } }, TR.chronAll ? "Show less" : "Show all " + ev.length) : null,
  ];
}
const LAND_IS = { forest: "forest is", lake: "lake is", meadow: "meadow is", dunes: "dunes are", peaks: "peaks are", blossom: "blossom trees are", canyon: "canyon is", crystal: "crystals are" };
const aOrAn = w => (/^[aeiou]/i.test(w) ? "an " : "a ") + w;
function strHash(str) { let h2 = 2166136261; for (let i = 0; i < str.length; i++) h2 = Math.imul(h2 ^ str.charCodeAt(i), 16777619); return h2 >>> 0; }
function pipLines(model, t, report) {
  const name = islandName() || "the island", hr = HOUR_OVERRIDE != null ? HOUR_OVERRIDE : new Date().getHours();
  const greet = hr < 5 ? "Up late?" : hr < 12 ? "Morning!" : hr < 18 ? "Hey!" : "Evening.";
  const habits = model.habits.filter(x => !x.archived), log = (S.tracker && S.tracker.log) || {};
  const left = habits.filter(hb => activeOn(hb, t) && !(log[t] && log[t][hb.id]));
  if (!habits.length) return ["Hi, I'm Pip. I look after this island. Add a habit below, then paint your first square. I'll show you what grows."];
  if (!model.tiles.length) return [greet + " I'm Pip, keeper of " + name + ". Tap one of your habits, then tap the glowing water next to the camp. That's your first piece of land, and it comes with a chest."];
  const L = [];
  L.push(report && report.grown ? greet + " While you were away, " + report.grown + " square" + (report.grown === 1 ? "" : "s") + " grew on " + name + "." : greet + " " + name + " is looking good today.");
  if (report && report.rests) L.push("You missed a day, so I used a rest day. Your " + model.dayStreak + "-day run is safe.");
  const wilting = habits.filter(hb => model.hstat[hb.id] && model.hstat[hb.id].wilting);
  if (wilting.length) L.push("Your " + LAND_IS[wilting[0].terrain] + " drooping. One square of " + wilting[0].name + " brings it back, and there's a chest in it for you.");
  if (!left.length) L.push("Everything's painted today. Go do something fun. I'll keep an eye on things" + (model.growTomorrow ? ", and " + model.growTomorrow + " square" + (model.growTomorrow === 1 ? " is" : "s are") + " about to grow." : "."));
  else if (left.length <= 2 && left.length < habits.length) L.push("Only " + left.map(x => x.name).join(" and ") + " left for a perfect day. That's a house and a chest.");
  else L.push(left.length + " habits to paint today. Start with the easiest one.");
  const n = model.next && model.next[0];
  if (n) { const d = DISCOVERIES.find(x => x.id === n.id); L.push(n.goal - n.v <= 3 ? "I can feel something close. " + (n.goal - n.v) + " more " + n.unit + " and something new turns up." : "People say " + aOrAn(d.name.toLowerCase()) + " shows up at " + n.goal + " " + n.unit + ". You're at " + n.v + "."); }
  const reg = model.regions.length ? model.regions[strHash(t) % model.regions.length].name : null;
  const own = id => model.owned[id];
  const pool = [
    reg && own("sheep") && "The sheep wandered into " + reg + " again. I let them.",
    own("fox") && "The fox keeps stealing mushrooms. I've stopped pretending not to see.",
    own("dragon") && "The baby dragon sneezed a tiny flame at a cloud. The cloud is fine.",
    own("whale") && "The whale came close to the shore this morning. I think it likes you.",
    own("deer") && "A deer stared at me for a whole minute today. I stared back. I won.",
    own("duck") && "The ducks have started a club. I'm not allowed in.",
    reg && reg + " is my favourite place to watch the sunset.",
    model.found.lighthouse && "The lighthouse keeps the boats safe at night. Come and look after 9 pm.",
    "Missing one day barely changes a habit. Missing lots of days does. That's what rest days are for.",
    "Most habits feel automatic after about two months. Your run is at " + model.dayStreak + " day" + (model.dayStreak === 1 ? "" : "s") + ".",
    "Small and daily beats big and rare. Even one square counts.",
    model.dayStreak >= 5 && "Land grows faster on a 5-day streak. You'll see it.",
    !own("phoenix") && "I've heard there's a phoenix out there. Nobody I know has seen one.",
    ITEMS.filter(i => own(i.id)).length + " of " + ITEMS.length + " collectibles found so far. The collection book is below the map.",
  ].filter(Boolean);
  let seed = strHash(t + S.me);
  for (let i = pool.length - 1; i > 0; i--) { seed = Math.imul(seed ^ (seed >>> 15), 2246822507) >>> 0; const j = seed % (i + 1); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  return L.concat(pool.slice(0, 2));
}
function showPip(lines, opts) {
  const box = $("#map-report");
  if (!box) return;
  TR.pip = { lines, i: 0 };
  const draw = () => {
    const P = TR.pip;
    if (!P) { put(box); return; }
    const more = P.i < P.lines.length - 1;
    put(box, h("div", { class: "pip" + (opts && opts.pop ? " pop" : "") },
      h("div", { class: "pip-face", svg: '<svg viewBox="0 0 40 42" aria-hidden="true"><ellipse cx="20" cy="27" rx="13.5" ry="13" fill="#2B3446"/><ellipse cx="20" cy="29" rx="8.5" ry="9.5" fill="#FFFFFF"/><circle cx="20" cy="15" r="10.5" fill="#2B3446"/><ellipse cx="20" cy="16" rx="7.2" ry="6.2" fill="#FFFFFF"/><circle cx="16.8" cy="15" r="1.7" fill="#1A1A1A"/><circle cx="23.2" cy="15" r="1.7" fill="#1A1A1A"/><circle cx="17.3" cy="14.4" r=".5" fill="#fff"/><circle cx="23.7" cy="14.4" r=".5" fill="#fff"/><path d="M17.2 18.4 Q20 16.6 22.8 18.4 L20 23.4 Z" fill="#F08A2B"/><path d="M17.2 18.4 Q20 19.6 22.8 18.4" stroke="#C2601A" stroke-width=".6" fill="none"/><ellipse cx="14.5" cy="40" rx="3.2" ry="1.4" fill="#F08A2B"/><ellipse cx="25.5" cy="40" rx="3.2" ry="1.4" fill="#F08A2B"/></svg>' }),
      h("button", { class: "pip-bubble", "aria-label": more ? "Pip says: " + P.lines[P.i] + ". Tap for more" : "Pip says: " + P.lines[P.i], onclick: () => { SFX.tap(); if (more) { P.i++; draw(); } else { TR.pip = null; draw(); } } },
        h("span", { class: "pip-name" }, "Pip"), h("span", null, P.lines[P.i]),
        h("span", { class: "pip-more" }, more ? "Tap for more · " + (P.i + 1) + "/" + P.lines.length : "Tap to close")),
      h("button", { class: "icon-btn pip-x", svg: SVG.x, "aria-label": "Hide Pip", onclick: () => { TR.pip = null; draw(); } })));
  };
  draw();
}
function pipSay(text) {
  if (!$("#map-report")) return;
  const rest = TR.pip ? TR.pip.lines.slice(TR.pip.i + 1) : [];
  showPip([text, ...rest], { pop: true });
}
function morningReport(model, t) {
  const box = $("#map-report");
  if (!box) return;
  let last = null;
  try { last = localStorage.getItem("ha-seen-" + S.me); localStorage.setItem("ha-seen-" + S.me, t); } catch (_) {}
  if (!last || last >= t || !model.tiles.length) { showPip(pipLines(model, t, null)); return; }
  const from = daysBetween(last, t) > 7 ? addDays(t, -7) : last;
  const old = trackerModel(S.tracker, from);
  const grownTiles = [], cur = trackerModel(S.tracker, t);
  for (const tile of cur.tiles) { const o = old.occ.get(keyOf(tile.x, tile.y)); if (o && !o.home && o.stage < tile.stage) grownTiles.push(tile); }
  const wilting = cur.habits.filter(hb => cur.hstat[hb.id] && cur.hstat[hb.id].wilting && !(old.hstat[hb.id] && old.hstat[hb.id].wilting));
  const rests = cur.restDays.filter(d => d >= from);
  showPip(pipLines(cur, t, { grown: grownTiles.length, rests: rests.length }));
  setTimeout(() => { if (TR.map) { fxSparkle(TR.map, grownTiles); kickMap(TR.map); } }, 700);
}
function discoveriesPanel(model) {
  const n = DISCOVERIES.filter(d => model.found[d.id]).length;
  return [
    h("div", { class: "panel-head" }, h("h2", { style: "font-size:20px" }, "Discoveries"), h("span", { class: "eyebrow" }, n + " of " + DISCOVERIES.length + " found")),
    h("div", { class: "discoveries" }, DISCOVERIES.map(d => {
      const f = model.found[d.id];
      if (!f) return h("div", { class: "disc locked" }, h("div", { class: "disc-art mystery", "aria-hidden": "true" }, "?"), h("b", null, "Undiscovered"), h("span", null, d.hint), PERKS[d.id] ? h("span", { class: "perk" }, "Unlocks a perk") : null);
      const cv = h("canvas", { class: "disc-art", width: "64", height: "64", "aria-hidden": "true" });
      requestAnimationFrame(() => drawDiscoveryIcon(cv, d.id));
      return h("div", { class: "disc", title: PERKS[d.id] || "" }, cv, h("b", null, d.name), h("span", null, "Found " + fmtDate(f.d)), PERKS[d.id] ? h("span", { class: "perk" }, PERKS[d.id]) : null);
    })),
  ];
}
function mapTodayPanel(model, habits, t) {
  const out = [];
  const date = TR.day === "today" ? t : addDays(t, -1);
  out.push(h("div", { class: "panel-head" }, h("h2", { style: "font-size:20px" }, TR.day === "today" ? "Today" : "Yesterday"),
    h("div", { class: "seg", role: "group", "aria-label": "Day" },
      h("button", { "aria-pressed": String(TR.day === "today"), onclick: () => { SFX.tap(); TR.day = "today"; if (TR.brush) stopBrush(); refresh(); } }, "Today"),
      h("button", { "aria-pressed": String(TR.day === "yesterday"), onclick: () => { SFX.tap(); TR.day = "yesterday"; if (TR.brush) stopBrush(); refresh(); } }, "Yesterday"))));
  if (S.tracker === undefined) { out.push(h("div", { class: "skeleton" }), h("div", { class: "skeleton" })); return out; }
  if (!habits.length) {
    out.push(h("p", { class: "muted", style: "margin:0" }, "Add the habits you want to keep. Each one grows its own terrain on your island: forests, lakes, peaks, crystal fields."),
      readOnly() ? null : h("div", { class: "chips" }, MAP_SUGGEST.map(([n, terr]) => h("button", { class: "chip suggest", onclick: () => addMapHabit(n, terr) }, terrainSwatch(terr, "sm"), n))),
      readOnly() ? null : h("button", { class: "btn primary", onclick: openMapHabitsSheet }, icon("plus"), "Add your own habit"));
    return out;
  }
  const log = (S.tracker && S.tracker.log) || {};
  const doneN = habits.filter(hb => log[date] && log[date][hb.id]).length;
  const firstOpen = habits.find(hb => !(log[date] && log[date][hb.id]) && !(date < (hb.since || "")));
  out.push(h("div", { class: "day-progress", "aria-label": doneN + " of " + habits.length + " painted" },
    h("div", { class: "pips-row" }, habits.map(hb => h("i", { style: log[date] && log[date][hb.id] ? "background:var(--t-" + hb.terrain + ")" : null }))),
    h("span", { class: "chest-goal" + (doneN === habits.length ? " got" : "") }, doneN === habits.length ? "Chest earned" : (habits.length - doneN) + " to the chest")));
  const rows = habits.map(hb => {
    const done = log[date] && log[date][hb.id];
    const before = date < (hb.since || "");
    const brushing = TR.brush && TR.brush.hid === hb.id && TR.brush.date === date;
    const st = model.hstat[hb.id] || { count: 0, streak: 0 };
    const btn = h("button", { class: "check paint", style: "--sw:var(--t-" + hb.terrain + ")", svg: done ? SVG.check : "", "aria-pressed": String(!!done),
      "aria-label": done ? "Undo " + hb.name : "Paint a square for " + hb.name, disabled: before || readOnly() ? true : null,
      onclick: () => done ? undoTile(hb, date) : brushing ? stopBrush() : startBrush(hb, date) });
    const nudge = !done && !brushing && model.tiles.length === 0 && firstOpen === hb;
    return h("div", { class: "habit" + (done ? " done" : "") + (brushing ? " brushing" : "") + (nudge ? " nudge" : "") }, btn,
      h("div", { style: "min-width:0" },
        h("div", { class: "habit-name" }, h("span", null, hb.name)),
        h("div", { class: "habit-sub" },
          st.streak > 0 ? h("span", { class: "streak" }, icon("flame"), st.streak + "d") : null,
          h("span", null, TERRAIN_NAME[hb.terrain] + " · " + st.count + " sq"),
          st.wilting && !done ? h("span", { class: "wilt-chip" }, "Wilting · paint to revive") : null,
          st.streak >= 5 ? h("span", { class: "grow-chip" }, "Growing fast") : null,
          before ? h("span", null, "Added today") : null)),
      h("div", { class: "habit-right" }, brushing ? h("span", { class: "xp-chip" }, "Painting…") : done ? h("span", { class: "muted", style: "font-size:13px" }, "Painted") : null));
  });
  out.push(h("div", { class: "habits" }, rows));
  const pd = model.perDay[date], left = habits.filter(hb => activeOn(hb, date) && !(log[date] && log[date][hb.id])).length;
  if (pd && pd.perfect && TR.day === "today") {
    out.push(h("div", { class: "done-card" },
      h("b", null, "All painted for today."),
      h("p", null, "Now go live your day. Your island keeps growing without you" + (model.growTomorrow ? ": by tomorrow, " + model.growTomorrow + " square" + (model.growTomorrow === 1 ? "" : "s") + " will have grown." : ".")),
      h("p", { class: "muted" }, "Come back tomorrow to see what changed.")));
  } else out.push(h("p", { class: "muted", style: "margin:0;font-size:13px" }, pd && pd.perfect ? "Perfect day. A house stands on your island for it." : left ? left + " more for a perfect day: a house and a chest with better odds." : ""));
  return out;
}
function mapLegendPanel(model, habits) {
  return [
    h("div", { class: "stats", style: "grid-template-columns:repeat(2,minmax(0,1fr))" },
      h("div", { class: "stat" }, h("b", { "data-countup": String(model.tiles.length) }, fmtNum(TR.lastSquares != null ? TR.lastSquares : model.tiles.length)), h("span", null, "Squares of land")),
      h("div", { class: "stat" }, h("b", null, model.perfectDays), h("span", null, "Houses (perfect days)")),
      h("div", { class: "stat" }, h("b", { style: "color:var(--flame)" }, model.dayStreak), h("span", null, "Days in a row")),
      h("div", { class: "stat" }, h("b", null, model.bestDay), h("span", null, "Best run"))),
    h("div", { class: "rest-row" }, h("span", { class: "rest-dots", "aria-hidden": "true" }, (model.found.lighthouse ? [0, 1, 2] : [0, 1]).map(i => h("i", { class: i < model.shields ? "on" : null }))),
      h("span", null, h("b", null, model.shields + " rest day" + (model.shields === 1 ? "" : "s") + " saved. "), "Every 7 days in a row earns one (you can hold " + (model.found.lighthouse ? 3 : 2) + "). Miss a day and one is used, so your run keeps going." + (model.restDays.length ? " Used " + model.restDays.length + " so far." : ""))),
    habits.length ? h("div", { class: "legend" }, h("span", { class: "eyebrow" }, "Terrain"),
      habits.map(hb => { const s = model.hstat[hb.id] || { count: 0 }; return h("div", { class: "legend-row" }, terrainSwatch(hb.terrain), h("span", { class: "legend-name" }, hb.name), h("span", { class: "mono muted" }, s.count)); })) : null,
    model.regions.length ? h("div", { class: "legend" }, h("span", { class: "eyebrow" }, "Regions"),
      model.regions.slice(0, 8).map(r => h("div", { class: "legend-row" }, terrainSwatch(r.terrain), h("span", { class: "legend-name region-name" }, r.name), h("span", { class: "mono muted" }, r.size)))) : null,
    h("p", { class: "muted", style: "margin:0;font-size:12.5px" }, "Squares grow as they age, faster while a habit's streak is 5+ days. Skip a habit 3 days and its land starts to wilt until you paint it again. 4 touching squares of one terrain become a named region."),
    readOnly() ? null : toggleRow("share-island", "Show my island to friends", "Friends in your rooms can visit it from the leaderboard. Habit names stay private.", !!(S.tracker && S.tracker.share), v => setShare(v)),
  ];
}
function addMapHabit(name, terrain) {
  const doc = ensureTracker();
  const active = doc.habits.filter(x => !x.archived);
  if (active.length >= MAX_MAP_HABITS) { toast("You can keep up to " + MAX_MAP_HABITS + " habits on your island"); return; }
  doc.habits = [...doc.habits, { id: "m" + rid(6), name: name.slice(0, 48), terrain, since: todayStr() }];
  commitTracker();
  if (active.length === 0) pipSay("Nice pick. Now tap " + name + " below, then tap the glowing water next to the camp. Your first square comes with a chest.");
}
function openIslandNameSheet() {
  if (readOnly()) return;
  const inp = h("input", { type: "text", id: "island-input", maxlength: "32", value: islandName(), placeholder: "e.g. Isle of Dawn" });
  const ideas = h("div", { class: "chips" });
  const roll = () => put(ideas, [...ISLAND_IDEAS].sort(() => Math.random() - 0.5).slice(0, 4).map(n => h("button", { type: "button", class: "chip suggest", onclick: () => { inp.value = n; inp.focus(); } }, n)));
  roll();
  openSheet("Name your island", h("form", { id: "island-form", class: "form-section", onsubmit: e => {
    e.preventDefault();
    const v = inp.value.trim().slice(0, 32);
    ensureTracker().name = v;
    commitTracker(); closeSheet(); toast(v ? "Welcome to " + v : "Name cleared");
  } }, h("label", { class: "field" }, h("span", null, "Island name"), inp), ideas, h("button", { type: "button", class: "linkish", style: "justify-self:start;font-size:13px", onclick: roll }, "More ideas")),
  h("button", { class: "btn primary", type: "submit", form: "island-form" }, "Save"));
}
function openMapHabitsSheet() {
  if (readOnly()) return;
  const doc = clone(ensureTracker());
  const t = todayStr();
  const body = h("div", { style: "display:grid;gap:14px" });
  const used = () => new Set(doc.habits.filter(x => !x.archived).map(x => x.terrain));
  function draw() {
    const active = doc.habits.filter(x => !x.archived), archived = doc.habits.filter(x => x.archived);
    put(body,
      active.map(hb => h("div", { class: "map-habit-edit" },
        h("input", { type: "text", id: "mh-" + hb.id, value: hb.name, maxlength: "48", "aria-label": "Habit name", oninput: e => { hb.name = e.target.value; } }),
        h("div", { class: "terrain-pick", role: "radiogroup", "aria-label": "Terrain for " + (hb.name || "habit") },
          TERRAINS.map(tr => h("button", { type: "button", role: "radio", "aria-checked": String(hb.terrain === tr.k), title: tr.name, "aria-label": tr.name, style: "background:var(--t-" + tr.k + ")", onclick: () => { hb.terrain = tr.k; draw(); } }))),
        h("button", { type: "button", class: "btn sm ghost", onclick: () => { hb.archived = t; draw(); } }, "Archive"))),
      active.length < MAX_MAP_HABITS ? h("button", { type: "button", class: "btn", onclick: () => {
        const free = TERRAINS.find(tr => !used().has(tr.k)) || TERRAINS[0];
        const hb = { id: "m" + rid(6), name: "", terrain: free.k, since: t };
        doc.habits.push(hb); draw(); setTimeout(() => { const el = document.getElementById("mh-" + hb.id); el && el.focus(); });
      } }, icon("plus"), "Add habit") : h("p", { class: "muted", style: "margin:0;font-size:13px" }, "That's the maximum of " + MAX_MAP_HABITS + " active habits."),
      archived.length ? h("div", { style: "display:grid;gap:6px;border-top:1px solid var(--line);padding-top:12px" }, h("span", { class: "eyebrow" }, "Archived · their land stays on your island"),
        archived.map(hb => h("div", { class: "legend-row" }, terrainSwatch(hb.terrain), h("span", { class: "legend-name" }, hb.name), active.length < MAX_MAP_HABITS ? h("button", { type: "button", class: "btn sm", onclick: () => { delete hb.archived; draw(); } }, "Restore") : null))) : null,
      h("p", { class: "muted", style: "margin:0;font-size:13px" }, "Changing a terrain repaints that habit's land. Archiving takes a habit off your daily list; its squares stay."));
  }
  draw();
  openSheet("Island habits", body, [h("button", { class: "btn", onclick: closeSheet }, "Cancel"), h("button", { class: "btn primary", onclick: () => {
    doc.habits = doc.habits.map(x => ({ ...x, name: (x.name || "").trim().slice(0, 48) })).filter(x => x.name || Object.values(doc.log || {}).some(d => d[x.id]));
    for (const x of doc.habits) if (!x.name) x.name = "Untitled habit";
    S.tracker = { ...ensureTracker(), habits: doc.habits };
    commitTracker(); closeSheet(); toast("Habits saved");
  } }, "Save")]);
}
async function saveMapImage() {
  const dl = S.downloads;
  if (!dl) return;
  const model = trackerModel(S.tracker, todayStr());
  const W = 1600, H = 1200, band = 160;
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const ctx = c.getContext("2d");
  const st = { w: W, h: H - band, view: { cx: 0.5, cy: 0.5, s: 60 }, model, maxS: 150, pad: 1.2 };
  fitMap(st);
  st.noSky = true;
  drawMap(ctx, st.w, st.h, st);
  drawAmbient(ctx, st, 0, true);
  const P = pal(), realm = realmOf(model.tiles.length);
  ctx.fillStyle = P.surface; ctx.fillRect(0, H - band, W, band);
  ctx.fillStyle = P.ink; ctx.font = "800 60px 'Bricolage Grotesque', system-ui, sans-serif"; ctx.textBaseline = "alphabetic"; ctx.textAlign = "left";
  ctx.fillText(islandName() || realm.name, 56, H - band + 80);
  ctx.fillStyle = P.muted; ctx.font = "500 30px Figtree, system-ui, sans-serif";
  const found = DISCOVERIES.filter(d => model.found[d.id]).length;
  ctx.fillText(realm.name + " · " + fmtNum(model.tiles.length) + " squares · " + model.perfectDays + " perfect days · " + found + " discoveries" + (model.first ? " · since " + fmtDate(model.first) : ""), 56, H - band + 126);
  try {
    const blob = await new Promise(res => c.toBlob(res, "image/png"));
    await dl.save({ filename: (islandName() || "my-island").replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "-").toLowerCase() + ".png", data: blob });
  } catch (err) {
    const code = err && err.code;
    if (code === "declined") return;
    toast(code === "rate_limited" ? "A save is already open. Finish it first." : "This view can't save files.");
  }
}
function mapTeaser() {
  return h("a", { class: "card map-teaser", href: "#map", "aria-label": "Open my island" },
    h("div", { class: "teaser-stage", id: "teaser-stage" }),
    h("div", { class: "teaser-body", id: "teaser-body" }));
}
function updateMapTeaser() {
  const body = $("#teaser-body");
  if (!body) return;
  const t = todayStr(), model = trackerModel(S.tracker, t), realm = realmOf(model.tiles.length);
  const habits = model.habits.filter(hb => !hb.archived);
  const log = (S.tracker && S.tracker.log) || {};
  const left = habits.filter(hb => activeOn(hb, t) && !(log[t] && log[t][hb.id])).length;
  const wilting = habits.filter(hb => model.hstat[hb.id] && model.hstat[hb.id].wilting).length;
  if (TR.thumb) { TR.thumb.model = model; fitMap(TR.thumb); paintMap(TR.thumb); }
  put(body,
    h("div", { class: "eyebrow" }, "My island"),
    h("h2", null, habits.length ? (islandName() || realm.name) : "Grow your own island"),
    h("p", { class: "muted", style: "margin:0;font-size:14px" }, habits.length
      ? realm.name + " · " + fmtNum(model.tiles.length) + " squares · " + model.dayStreak + "-day run · " + (left ? left + " to paint today" : "all painted today")
      : "Your personal tracker. Every habit you complete adds a square of land. Forests grow, villages appear, and secrets turn up as the island gets bigger."),
    wilting ? h("p", { class: "wilt-chip", style: "margin:0;justify-self:start" }, wilting + " habit" + (wilting === 1 ? " is" : "s are") + " wilting") : null,
    h("span", { class: "btn primary sm", style: "justify-self:start" }, habits.length && left ? "Paint today's squares" : "Open my island"));
}

/* ---------- boot ---------- */
async function boot() {
  renderRoute();
  const c = platform;
  const [db, user] = await Promise.all([c.use("db"), c.use("user")]);
  S.db = db; S.user = user;
  if (!db) { S.status = "nodb"; renderRoute(); return; }
  S.me = user ? await user.id() : null;
  if (!S.me) { S.status = "noid"; renderRoute(); return; }
  S.meInfo = await user.me();
  S.isOwner = !!S.meInfo.isOwner;
  S.canWrite = await user.can("data.write");
  c.use("assets").then(a => { S.assets = a; }).catch(() => {});
  c.use("downloads").then(d => { S.downloads = d; if (current && current.view === "map") renderRoute(); }).catch(() => {});
  S.tracker = undefined;
  db.doc(trackerPath()).onSnapshot(s => {
    if (trackerSaver.busy && S.tracker) return;
    S.tracker = s.exists ? clone(s.data()) : (s.metadata.fromCache ? S.tracker : null);
    refresh();
  }, () => { if (S.tracker === undefined) S.tracker = null; refresh(); });
  const timer = setTimeout(() => { S.loadTimedOut = true; refresh(); }, 10000);
  db.doc("people/" + S.me).onSnapshot(s => { if (s.exists) S.myProfile = { ...s.data() }; refresh(); }, () => {});
  db.collection("people/" + S.me + "/rooms").onSnapshot(snap => {
    if (!snap.metadata.fromCache) { clearTimeout(timer); S.loadTimedOut = false; }
    S.myRoomsLoaded = true;
    const next = new Map();
    for (const d of snap.docs) next.set(d.id, d.data());
    // keep local edits that haven't been confirmed yet
    if (S.room && (writing || pending) && S.room.mine) next.set(S.room.code, clone(S.room.mine));
    S.myRooms = next;
    if (S.room && S.myRooms.has(S.room.code) && !writing && !pending) S.room.mine = clone(S.myRooms.get(S.room.code));
    if (S.room && S.myRooms.has(S.room.code) && !S.room.mine) S.room.mine = clone(S.myRooms.get(S.room.code));
    for (const code of next.keys()) {
      if (S.roomCache.has(code)) continue;
      S.roomCache.set(code, undefined);
      db.doc("rooms/" + code).get().then(s => { S.roomCache.set(code, s.exists ? s.data() : null); refresh(); }).catch(() => S.roomCache.delete(code));
    }
    refresh();
  }, () => { clearTimeout(timer); S.myRoomsLoaded = true; refresh(); });
  S.status = "ready";
  renderRoute();
}
window.addEventListener("hashchange", renderRoute);
setInterval(() => { if (current && current.view === "room") refresh(); }, 60000);
boot();
}
