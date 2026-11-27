/*
 * Demo platform: the same document API as the Supabase platform, stored in this browser's
 * localStorage. Used when no Supabase project is configured, or with ?demo in the URL.
 * One player, no sign-in, nothing leaves the device.
 */
const KEY = "ha-demo-db";
const DEMO_UID = "demo-player";

export function makeLocalPlatform({ appUrl } = {}) {
  let store = {};
  try { store = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (_) { store = {}; }
  const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (_) {} };
  const subs = new Set();
  const notify = () => setTimeout(() => subs.forEach(f => f()), 0);
  const segs = p => p.split("/");
  const clone = v => (v == null ? undefined : JSON.parse(JSON.stringify(v)));
  const snap = (path) => ({ id: segs(path).pop(), exists: path in store, data: () => clone(store[path]), metadata: { fromCache: false, hasPendingWrites: false } });

  function doc(path) {
    return {
      id: segs(path).pop(), path,
      get: async () => snap(path),
      set: async data => { store[path] = clone(data); persist(); notify(); },
      update: async data => { store[path] = { ...(store[path] || {}), ...clone(data) }; persist(); notify(); },
      delete: async () => { delete store[path]; persist(); notify(); },
      onSnapshot(next) { const f = () => next(snap(path)); subs.add(f); setTimeout(f, 0); return () => subs.delete(f); },
      collection: sub => collection(path + "/" + sub),
    };
  }
  function collection(path) {
    const n = segs(path).length;
    const list = () => Object.keys(store).filter(k => k.startsWith(path + "/") && segs(k).length === n + 1).sort().map(snap);
    const qs = () => { const docs = list(); return { docs, size: docs.length, empty: !docs.length, docChanges: () => [], metadata: { fromCache: false, hasPendingWrites: false } }; };
    return {
      path,
      doc: id => doc(path + "/" + (id || Math.random().toString(36).slice(2))),
      get: async () => qs(),
      onSnapshot(next) { const f = () => next(qs()); subs.add(f); setTimeout(f, 0); return () => subs.delete(f); },
    };
  }
  const user = {
    id: async () => DEMO_UID,
    me: async () => ({ id: DEMO_UID, name: "", avatarUrl: "", color: "#2B55F0", email: null, isOwner: true, canEdit: true }),
    isOwner: async () => true, canEdit: async () => true, can: async () => true,
    profiles: async ids => Object.fromEntries([].concat(ids).map(id => [id, { id, name: "", avatarUrl: "", color: "#2B55F0", email: null, isMe: id === DEMO_UID, guest: false, roles: null }])),
  };
  const photos = {};
  const assets = {
    async upload(blob) {
      const id = "local-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
      photos[id] = URL.createObjectURL(blob);
      return { id, url: photos[id], sizeBytes: blob.size, contentType: blob.type };
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
  const ns = { db: { doc, collection }, user, assets, downloads };
  return {
    appUrl, demo: true,
    use: async name => ns[name] || null,
    photoUrl: id => photos[id] || "",
    account: {
      isGuest: true, email: null, linkGoogle: null,
      signOut: async () => { try { localStorage.removeItem(KEY); } catch (_) {} location.reload(); },
    },
  };
}
