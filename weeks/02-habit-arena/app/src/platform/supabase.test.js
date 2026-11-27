import { describe, it, expect } from "vitest";
import { routeOf, rowFor, toRoom, fromRoom, makeSupabasePlatform } from "./supabase.js";

// A tiny in-memory stand-in for the parts of supabase-js the adapter uses.
function fakeSupabase() {
  const tables = { profiles: [], rooms: [], room_members: [], islands: [], island_public: [] };
  const keys = { profiles: ["id"], rooms: ["code"], room_members: ["room_code", "user_id"], islands: ["user_id"], island_public: ["user_id"] };
  const query = table => {
    const filters = [];
    let op = "select", payload = null, single = false;
    const run = () => {
      const rows = tables[table];
      const hit = r => filters.every(([c, v, kind]) => (kind === "in" ? v.includes(r[c]) : r[c] === v));
      if (op === "select") { const out = rows.filter(hit).map(r => ({ ...r })); return { data: single ? out[0] || null : out, error: null }; }
      if (op === "delete") { tables[table] = rows.filter(r => !hit(r)); return { data: null, error: null }; }
      if (op === "upsert") {
        const k = keys[table], i = rows.findIndex(r => k.every(c => r[c] === payload[c]));
        if (i >= 0) rows[i] = { ...rows[i], ...payload };
        else rows.push({ personal: [], log: {}, cheers: {}, ...payload });
        return { data: null, error: null };
      }
    };
    const b = {
      select() { op = op === "upsert" ? op : "select"; return b; },
      eq(c, v) { filters.push([c, v]); return b; },
      in(c, v) { filters.push([c, v, "in"]); return b; },
      match(m) { for (const [c, v] of Object.entries(m)) filters.push([c, v]); return b; },
      maybeSingle() { single = true; return b; },
      upsert(row) { op = "upsert"; payload = row; return b; },
      delete() { op = "delete"; return b; },
      then(res, rej) { return Promise.resolve(run()).then(res, rej); },
    };
    return b;
  };
  const channel = () => { const c = { on: () => c, subscribe: () => c }; return c; };
  return {
    tables,
    from: query,
    channel,
    removeChannel: () => {},
    storage: { from: () => ({ getPublicUrl: p => ({ data: { publicUrl: "https://cdn.test/" + p } }), upload: async () => ({ error: null }) }) },
    auth: { linkIdentity: async () => ({ error: null }), signOut: async () => ({}) },
  };
}
const tick = () => new Promise(r => setTimeout(r, 0));

describe("path routing", () => {
  it("maps every path the game uses", () => {
    expect(routeOf("people/u1")).toEqual({ kind: "profile", uid: "u1" });
    expect(routeOf("people/u1/rooms")).toEqual({ kind: "myRooms", uid: "u1" });
    expect(routeOf("people/u1/rooms/ABC234")).toEqual({ kind: "memberLog", uid: "u1", code: "ABC234" });
    expect(routeOf("people/u1/island")).toEqual({ kind: "islandPublic", uid: "u1" });
    expect(routeOf("data/users/u1/tracker")).toEqual({ kind: "island", uid: "u1" });
    expect(routeOf("rooms/ABC234")).toEqual({ kind: "room", code: "ABC234" });
    expect(routeOf("rooms/ABC234/members")).toEqual({ kind: "roomMembers", code: "ABC234" });
    expect(routeOf("rooms/ABC234/members/u1")).toEqual({ kind: "membership", code: "ABC234", uid: "u1" });
    expect(() => routeOf("votes/x")).toThrow(TypeError);
  });
  it("round-trips a room through its row", () => {
    const room = { name: "Gym", createdBy: "u1", createdAt: 5, start: "2026-11-01", end: "2026-11-30", allowPersonal: true, proof: false, habits: [{ id: "h1", name: "Run" }] };
    expect(toRoom(fromRoom("ABC234", room))).toEqual(room);
  });
  it("membership writes never clobber a player's log", () => {
    expect(Object.keys(rowFor(routeOf("rooms/ABC234/members/u1"), { joinedAt: 1 }).row).sort()).toEqual(["joined_at", "room_code", "user_id"]);
  });
});

describe("supabase platform", () => {
  it("creates a room, joins it, checks in and sees itself on the live member list", async () => {
    const sb = fakeSupabase();
    const p = makeSupabasePlatform(sb, { id: "u1", user_metadata: { full_name: "Ana" }, is_anonymous: false }, { appUrl: "https://app.test/" });
    const db = await p.use("db");
    const seen = [];
    const off = db.collection("rooms/ABC234/members").onSnapshot(s => seen.push(s.docs.map(d => d.id)));
    await db.doc("rooms/ABC234").set({ name: "Gym", createdBy: "u1", createdAt: 1, start: "2026-11-01", end: "2026-11-30", allowPersonal: true, proof: false, habits: [] });
    await db.doc("rooms/ABC234/members/u1").set({ joinedAt: 10 });
    await db.doc("people/u1/rooms/ABC234").set({ joinedAt: 10, personal: [], log: { "2026-11-02": { h1: { t: 1 } } }, cheers: {} });
    await tick();
    expect(seen.at(-1)).toEqual(["u1"]);
    const mine = await db.doc("people/u1/rooms/ABC234").get();
    expect(mine.exists).toBe(true);
    expect(mine.data().log["2026-11-02"].h1.t).toBe(1);
    expect(sb.tables.room_members).toHaveLength(1);
    const room = await db.doc("rooms/ABC234").get();
    expect(room.data().name).toBe("Gym");
    off();
  });
  it("reloads a room's member list after joining, since RLS hid the others before", async () => {
    const sb = fakeSupabase();
    sb.tables.room_members.push({ room_code: "ABC234", user_id: "u0", joined_at: 1, personal: [], log: {}, cheers: {} });
    const hidden = sb.from; let member = false;
    sb.from = t => { const q = hidden(t); if (t !== "room_members" || member) return q; const eq = q.eq; q.eq = (c, v) => { eq(c, v); return eq("user_id", "u1"); }; return q; };
    const p = makeSupabasePlatform(sb, { id: "u1", user_metadata: {}, is_anonymous: true }, {});
    const db = await p.use("db");
    const seen = [];
    db.collection("rooms/ABC234/members").onSnapshot(s => seen.push(s.docs.map(d => d.id).sort()));
    await tick();
    expect(seen.at(-1)).toEqual([]);
    member = true;
    await db.doc("rooms/ABC234/members/u1").set({ joinedAt: 2 });
    await tick(); await tick();
    expect(seen.at(-1)).toEqual(["u0", "u1"]);
  });
  it("keeps the private island and the shared copy in separate tables", async () => {
    const sb = fakeSupabase();
    const p = makeSupabasePlatform(sb, { id: "u1", user_metadata: {}, is_anonymous: true }, {});
    const db = await p.use("db");
    await db.doc("data/users/u1/tracker").set({ v: 1, habits: [{ id: "a", name: "Secret habit", terrain: "forest" }], log: {} });
    await db.doc("people/u1/island").set({ habits: [{ id: "a", terrain: "forest" }], log: {} });
    expect(sb.tables.islands[0].doc.habits[0].name).toBe("Secret habit");
    expect(sb.tables.island_public[0].doc.habits[0].name).toBeUndefined();
    await db.doc("people/u1/island").delete();
    expect(sb.tables.island_public).toHaveLength(0);
    expect(p.account.isGuest).toBe(true);
  });
  it("updates a live document after a local write and after a delete", async () => {
    const sb = fakeSupabase();
    const p = makeSupabasePlatform(sb, { id: "u1", user_metadata: {}, is_anonymous: true }, {});
    const db = await p.use("db");
    const states = [];
    db.doc("people/u1").onSnapshot(s => states.push(s.exists ? s.data().nick : null));
    await tick();
    await db.doc("people/u1").set({ nick: "Zed" });
    await db.doc("people/u1").delete();
    expect(states).toContain("Zed");
    expect(states.at(-1)).toBe(null);
  });
  it("builds public photo URLs from stored ids", () => {
    const p = makeSupabasePlatform(fakeSupabase(), { id: "u1", user_metadata: {}, is_anonymous: true }, {});
    expect(p.photoUrl("u1/1-abc.jpg")).toBe("https://cdn.test/u1/1-abc.jpg");
  });
});
