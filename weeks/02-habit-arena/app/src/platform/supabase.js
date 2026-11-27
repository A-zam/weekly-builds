/*
 * Supabase platform for Habit Arena.
 *
 * The game talks to storage through a tiny document API (doc/collection, get/set/delete/onSnapshot)
 * addressed by paths like "rooms/K7QF2X". This module maps each path to a Postgres table and keeps
 * live copies in sync with Supabase Realtime, so the game code does not know which backend it runs on.
 *
 *   people/<uid>                  -> profiles row            (player name)
 *   people/<uid>/rooms            -> room_members by user    (my rooms)
 *   people/<uid>/rooms/<code>     -> room_members row        (my check-ins in a room)
 *   people/<uid>/island           -> island_public row       (shared copy of my island, no habit names)
 *   data/users/<uid>/tracker      -> islands row             (my private island)
 *   rooms/<code>                  -> rooms row
 *   rooms/<code>/members          -> room_members by room
 *   rooms/<code>/members/<uid>    -> room_members row        (membership only)
 */

export function routeOf(path) {
  const s = path.split("/");
  if (s[0] === "people" && s.length === 2) return { kind: "profile", uid: s[1] };
  if (s[0] === "people" && s.length === 3 && s[2] === "rooms") return { kind: "myRooms", uid: s[1] };
  if (s[0] === "people" && s.length === 4 && s[2] === "rooms") return { kind: "memberLog", uid: s[1], code: s[3] };
  if (s[0] === "people" && s.length === 3 && s[2] === "island") return { kind: "islandPublic", uid: s[1] };
  if (s[0] === "data" && s[1] === "users" && s.length === 4 && s[3] === "tracker") return { kind: "island", uid: s[2] };
  if (s[0] === "rooms" && s.length === 2) return { kind: "room", code: s[1] };
  if (s[0] === "rooms" && s.length === 3 && s[2] === "members") return { kind: "roomMembers", code: s[1] };
  if (s[0] === "rooms" && s.length === 4 && s[2] === "members") return { kind: "membership", code: s[1], uid: s[3] };
  throw new TypeError("Unsupported path: " + path);
}

const memberKey = r => r.room_code + "|" + r.user_id;
export const toRoom = r => ({ name: r.name, createdBy: r.created_by, createdAt: Number(r.created_at), start: r.start_date, end: r.end_date, allowPersonal: r.allow_personal, proof: r.proof, habits: r.habits || [] });
export const fromRoom = (code, d) => ({ code, name: d.name, created_by: d.createdBy, created_at: d.createdAt || Date.now(), start_date: d.start, end_date: d.end, allow_personal: !!d.allowPersonal, proof: !!d.proof, habits: d.habits || [] });
export const toMemberLog = r => ({ joinedAt: Number(r.joined_at), personal: r.personal || [], log: r.log || {}, cheers: r.cheers || {} });

// Which live query backs each path, and how to read one document out of it.
export function specOf(r) {
  switch (r.kind) {
    case "profile": return { key: "profiles:" + r.uid, table: "profiles", col: "id", val: r.uid, pk: x => x.id, id: r.uid, map: x => (x.nick ? { nick: x.nick } : {}) };
    case "memberLog": return { key: "rm:room:" + r.code, table: "room_members", col: "room_code", val: r.code, pk: memberKey, id: r.code + "|" + r.uid, map: toMemberLog };
    case "membership": return { key: "rm:room:" + r.code, table: "room_members", col: "room_code", val: r.code, pk: memberKey, id: r.code + "|" + r.uid, map: x => ({ joinedAt: Number(x.joined_at) }) };
    case "room": return { key: "rooms:" + r.code, table: "rooms", col: "code", val: r.code, pk: x => x.code, id: r.code, map: toRoom };
    case "island": return { key: "islands:" + r.uid, table: "islands", col: "user_id", val: r.uid, pk: x => x.user_id, id: r.uid, map: x => x.doc };
    case "islandPublic": return { key: "island_public:" + r.uid, table: "island_public", col: "user_id", val: r.uid, pk: x => x.user_id, id: r.uid, map: x => x.doc };
    case "myRooms": return { key: "rm:user:" + r.uid, table: "room_members", col: "user_id", val: r.uid, pk: memberKey, docId: x => x.room_code, map: toMemberLog };
    case "roomMembers": return { key: "rm:room:" + r.code, table: "room_members", col: "room_code", val: r.code, pk: memberKey, docId: x => x.user_id, map: x => ({ joinedAt: Number(x.joined_at) }) };
  }
  throw new TypeError("No live query for " + r.kind);
}

// The row a write produces, for upsert, and the columns that identify it.
export function rowFor(r, data) {
  switch (r.kind) {
    case "profile": return { table: "profiles", row: { id: r.uid, nick: data.nick ? String(data.nick).slice(0, 24) : null }, conflict: "id" };
    case "memberLog": return { table: "room_members", row: { room_code: r.code, user_id: r.uid, joined_at: data.joinedAt || Date.now(), personal: data.personal || [], log: data.log || {}, cheers: data.cheers || {} }, conflict: "room_code,user_id" };
    case "membership": return { table: "room_members", row: { room_code: r.code, user_id: r.uid, joined_at: data.joinedAt || Date.now() }, conflict: "room_code,user_id" };
    case "room": return { table: "rooms", row: fromRoom(r.code, data), conflict: "code" };
    case "island": return { table: "islands", row: { user_id: r.uid, doc: data }, conflict: "user_id" };
    case "islandPublic": return { table: "island_public", row: { user_id: r.uid, doc: data }, conflict: "user_id" };
  }
  throw new TypeError("Can't write to " + r.kind);
}
export function matchFor(r) {
  switch (r.kind) {
    case "profile": return { table: "profiles", match: { id: r.uid } };
    case "memberLog": case "membership": return { table: "room_members", match: { room_code: r.code, user_id: r.uid } };
    case "room": return { table: "rooms", match: { code: r.code } };
    case "island": return { table: "islands", match: { user_id: r.uid } };
    case "islandPublic": return { table: "island_public", match: { user_id: r.uid } };
  }
  throw new TypeError("Can't address " + r.kind);
}

function mapErr(error) {
  if (!error) return { code: "unavailable", message: "Unknown error" };
  const msg = error.message || String(error);
  if (error.code === "42501" || /row-level security|permission denied/i.test(msg)) return { code: "invalid_argument", message: msg };
  if (error.code === "23505") return { code: "invalid_argument", message: msg };
  if (/fetch|network|Failed to/i.test(msg)) return { code: "unavailable", message: msg };
  return { code: "invalid_argument", message: msg };
}
const snapDoc = (id, data) => ({ id, exists: data !== undefined && data !== null, data: () => (data == null ? undefined : JSON.parse(JSON.stringify(data))), metadata: { fromCache: false, hasPendingWrites: false } });

function initialsAvatar(name, color) {
  const ch = ((name || "?").trim()[0] || "?").toUpperCase().replace(/[<&>"']/g, "");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" rx="32" fill="${color}"/><text x="32" y="41" font-family="system-ui,sans-serif" font-size="28" font-weight="700" fill="#fff" text-anchor="middle">${ch}</text></svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}
const COLORS = ["#2B55F0", "#16935A", "#C8452F", "#8C6FDB", "#C98A00", "#E68FB2", "#3A84D0"];
const colorFor = id => COLORS[[...String(id)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7) % COLORS.length];

export function makeSupabasePlatform(sb, user, { appUrl } = {}) {
  const uid = user.id;
  const caches = new Map();

  function emit(c) { for (const l of c.listeners) { try { l.fn(); } catch (e) { console.error(e); } } }
  function live(spec) {
    let c = caches.get(spec.key);
    if (c) return c;
    c = { ...spec, rows: new Map(), ready: false, listeners: new Set(), channel: null };
    caches.set(spec.key, c);
    c.load = async () => {
      const { data, error } = await sb.from(spec.table).select("*").eq(spec.col, spec.val);
      if (error) { for (const l of c.listeners) l.err && l.err(mapErr(error)); return; }
      c.rows = new Map(data.map(row => [spec.pk(row), row]));
      c.ready = true;
      emit(c);
    };
    c.channel = sb.channel(spec.key + ":" + Math.random().toString(36).slice(2))
      .on("postgres_changes", { event: "*", schema: "public", table: spec.table, filter: spec.col + "=eq." + spec.val }, p => {
        if (p.eventType === "DELETE") { const k = p.old && spec.pk(p.old); if (k && c.rows.delete(k)) emit(c); return; }
        if (p.new && p.new[spec.col] === spec.val) { c.rows.set(spec.pk(p.new), p.new); emit(c); }
      })
      .subscribe(status => { if (status === "SUBSCRIBED" && c.ready) c.load(); });
    c.load();
    return c;
  }
  function unlisten(key, l) {
    const c = caches.get(key);
    if (!c) return;
    c.listeners.delete(l);
    if (!c.listeners.size) { sb.removeChannel(c.channel); caches.delete(key); }
  }
  // Apply our own successful writes to every live query that covers the row, without waiting for Realtime.
  function applyLocal(table, row, removeMatch) {
    for (const c of caches.values()) {
      if (c.table !== table) continue;
      if (removeMatch) {
        for (const [k, r] of c.rows) if (Object.entries(removeMatch).every(([col, v]) => r[col] === v)) { c.rows.delete(k); emit(c); }
      } else if (row[c.col] === c.val) {
        const k = c.pk(row), joined = table === "room_members" && row.user_id === uid && !c.rows.has(k);
        c.rows.set(k, { ...(c.rows.get(k) || {}), ...row });
        emit(c);
        // Row-level security hides other players until we are a member, so a list loaded before
        // joining holds only us. Reload it once our membership exists.
        if (joined && c.col === "room_code") c.load();
      }
    }
  }

  function doc(path) {
    const r = routeOf(path), id = path.split("/").pop();
    return {
      id, path,
      async get() {
        const spec = specOf(r), { table, match } = matchFor(r);
        const { data, error } = await sb.from(table).select("*").match(match).maybeSingle();
        if (error) throw mapErr(error);
        return snapDoc(id, data ? spec.map(data) : undefined);
      },
      async set(data) {
        const { table, row, conflict } = rowFor(r, data);
        const { error } = await sb.from(table).upsert(row, { onConflict: conflict });
        if (error) throw mapErr(error);
        applyLocal(table, row);
      },
      async update(data) { return this.set(data); },
      async delete() {
        const { table, match } = matchFor(r);
        const { error } = await sb.from(table).delete().match(match);
        if (error) throw mapErr(error);
        applyLocal(table, null, match);
      },
      onSnapshot(next, err) {
        const spec = specOf(r), c = live(spec);
        const l = { fn: () => { const row = c.rows.get(spec.id); next(snapDoc(id, row ? spec.map(row) : undefined)); }, err };
        c.listeners.add(l);
        if (c.ready) queueMicrotask(l.fn);
        return () => unlisten(spec.key, l);
      },
      collection: sub => collection(path + "/" + sub),
    };
  }
  function collection(path) {
    const r = routeOf(path);
    return {
      path,
      doc: id => doc(path + "/" + (id || Math.random().toString(36).slice(2))),
      async get() {
        const spec = specOf(r);
        const { data, error } = await sb.from(spec.table).select("*").eq(spec.col, spec.val);
        if (error) throw mapErr(error);
        const docs = data.map(row => snapDoc(spec.docId(row), spec.map(row)));
        return { docs, size: docs.length, empty: !docs.length, metadata: { fromCache: false } };
      },
      onSnapshot(next, err) {
        const spec = specOf(r), c = live(spec);
        const l = { fn: () => { const docs = [...c.rows.values()].map(row => snapDoc(spec.docId(row), spec.map(row))); next({ docs, size: docs.length, empty: !docs.length, docChanges: () => [], metadata: { fromCache: false, hasPendingWrites: false } }); }, err };
        c.listeners.add(l);
        if (c.ready) queueMicrotask(l.fn);
        return () => unlisten(spec.key, l);
      },
    };
  }

  const meta = user.user_metadata || {};
  const myName = meta.full_name || meta.name || "";
  const myAvatar = meta.avatar_url || meta.picture || null;
  if (!user.is_anonymous) {
    sb.from("profiles").upsert({ id: uid, display_name: myName || null, avatar_url: myAvatar }, { onConflict: "id" }).then(() => {}, () => {});
  }
  const profileCache = new Map();
  const userApi = {
    id: async () => uid,
    me: async () => ({ id: uid, name: myName, avatarUrl: myAvatar || initialsAvatar(myName || "You", colorFor(uid)), color: colorFor(uid), email: user.email || null, isOwner: false, canEdit: true }),
    isOwner: async () => false,
    canEdit: async () => true,
    can: async () => true,
    async profiles(ids) {
      const uniq = [...new Set([].concat(ids))], now = Date.now();
      const stale = uniq.filter(id => !profileCache.has(id) || now - profileCache.get(id).at > 60000);
      if (stale.length) {
        const { data } = await sb.from("profiles").select("id,display_name,avatar_url").in("id", stale);
        for (const id of stale) profileCache.set(id, { at: now, row: (data || []).find(x => x.id === id) || null });
      }
      return Object.fromEntries(uniq.map(id => {
        const row = profileCache.get(id).row, name = (row && row.display_name) || "";
        return [id, { id, name, avatarUrl: (row && row.avatar_url) || initialsAvatar(name || "?", colorFor(id)), color: colorFor(id), email: null, isMe: id === uid, guest: false, roles: null }];
      }));
    },
  };
  const assets = {
    async upload(blob, opts) {
      const type = (opts && opts.type) || blob.type || "image/jpeg";
      const path = uid + "/" + Date.now() + "-" + Math.random().toString(36).slice(2, 8) + (type === "image/png" ? ".png" : ".jpg");
      const { error } = await sb.storage.from("proofs").upload(path, blob, { contentType: type, upsert: false });
      if (error) throw { code: /size|large/i.test(error.message) ? "too_large" : "upstream_error", message: error.message };
      return { id: path, url: sb.storage.from("proofs").getPublicUrl(path).data.publicUrl, sizeBytes: blob.size, contentType: type };
    },
  };
  const downloads = {
    async save({ filename, data }) {
      const url = URL.createObjectURL(data instanceof Blob ? data : new Blob([data]));
      const a = Object.assign(document.createElement("a"), { href: url, download: filename });
      document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      return { status: "saved" };
    },
  };
  const namespaces = { db: { doc, collection }, user: userApi, assets, downloads };
  return {
    appUrl,
    use: async name => namespaces[name] || null,
    photoUrl: id => sb.storage.from("proofs").getPublicUrl(id).data.publicUrl,
    account: {
      isGuest: !!user.is_anonymous,
      email: user.email || null,
      linkGoogle: () => sb.auth.linkIdentity({ provider: "google", options: { redirectTo: appUrl } }).then(({ error }) => { if (error) throw error; }),
      signOut: async () => { await sb.auth.signOut(); location.replace(appUrl); },
    },
  };
}
