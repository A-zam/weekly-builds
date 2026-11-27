import "./styles.css";
import "./gate.css";
import { startApp } from "./game.js";
import { registerSW } from "virtual:pwa-register";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const appUrl = location.origin + import.meta.env.BASE_URL;
const forceDemo = new URLSearchParams(location.search).has("demo");

registerSW({ immediate: true });

const gate = document.getElementById("gate");
const el = (tag, attrs, ...kids) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) k.startsWith("on") ? n.addEventListener(k.slice(2), v) : n.setAttribute(k, v);
  n.append(...kids.filter(Boolean));
  return n;
};

function showGate(sb, onIn) {
  document.body.classList.add("gated");
  const msg = el("p", { class: "gate-msg", role: "status" });
  const busy = (b, text) => { gate.querySelectorAll("button").forEach(x => { x.disabled = b; }); msg.textContent = text || ""; };
  const guest = el("button", { class: "gate-btn primary", onclick: async () => {
    busy(true, "Building your camp…");
    const { data, error } = await sb.auth.signInAnonymously();
    if (error) { busy(false, "Couldn't start a guest island: " + error.message); return; }
    onIn(data.user);
  } }, "Start playing");
  const google = el("button", { class: "gate-btn", onclick: async () => {
    busy(true, "Opening Google…");
    const { error } = await sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: appUrl } });
    if (error) busy(false, "Couldn't open Google sign-in: " + error.message);
  } }, el("span", { class: "g", "aria-hidden": "true" }, "G"), "Continue with Google");
  gate.replaceChildren(el("div", { class: "gate-card" },
    el("div", { class: "gate-art", "aria-hidden": "true" }),
    el("h1", null, "Habit Arena"),
    el("p", { class: "gate-lede" }, "Every habit you keep adds a square of land to your island. Keep going and it grows into a kingdom, full of creatures and secrets. Bring friends and race them in habit rooms."),
    guest, google,
    el("p", { class: "gate-fine" }, "No account needed to start. Connect Google later to keep your island on every device."),
    msg));
  gate.hidden = false;
}

async function main() {
  if (!SUPABASE_URL || !SUPABASE_KEY || forceDemo) {
    const { makeLocalPlatform } = await import("./platform/local.js");
    document.body.classList.add("demo");
    startApp(makeLocalPlatform({ appUrl }));
    return;
  }
  const [{ createClient }, { makeSupabasePlatform }] = await Promise.all([import("@supabase/supabase-js"), import("./platform/supabase.js")]);
  const sb = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { flowType: "pkce", persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
  let started = false;
  const go = user => {
    if (started) return;
    started = true;
    gate.hidden = true; document.body.classList.remove("gated");
    if (location.search.includes("code=")) history.replaceState(null, "", appUrl + location.hash);
    startApp(makeSupabasePlatform(sb, user, { appUrl }));
  };
  sb.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT") location.replace(appUrl);
    // linking Google to a guest account keeps the same user id, so a reload is enough to refresh the account state
    if (event === "USER_UPDATED" && started) location.reload();
    if (session && !started && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) go(session.user);
  });
  const { data: { session } } = await sb.auth.getSession();
  if (session) go(session.user);
  else if (!started) showGate(sb, go);
}
main().catch(err => {
  console.error(err);
  gate.replaceChildren(el("div", { class: "gate-card" }, el("h1", null, "Habit Arena"), el("p", null, "Something went wrong while starting. Check your connection and reload.")));
  gate.hidden = false;
});
