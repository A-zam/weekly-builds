import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// BASE: "/" for a custom domain or local dev, "/habit-arena/" for GitHub Pages project sites.
const base = process.env.VITE_BASE || "/";

export default defineConfig({
  base,
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/icon.svg", "icons/apple-touch-icon.png", "icons/island-hero.png"],
      manifest: {
        name: "Habit Arena",
        short_name: "Habit Arena",
        description: "Grow a living island with every habit you keep, and race friends in habit rooms.",
        theme_color: "#2B55F0",
        background_color: "#EEF1F5",
        display: "standalone",
        orientation: "portrait",
        start_url: base + "#map",
        scope: base,
        categories: ["lifestyle", "health", "productivity", "games"],
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
        shortcuts: [
          { name: "Paint today's squares", url: base + "#map", icons: [{ src: "icons/icon-192.png", sizes: "192x192" }] },
          { name: "My rooms", url: base, icons: [{ src: "icons/icon-192.png", sizes: "192x192" }] },
        ],
      },
      workbox: {
        navigateFallback: "index.html",
        globPatterns: ["**/*.{js,css,html,svg,png,webmanifest}"],
        runtimeCaching: [
          { urlPattern: ({ url }) => url.origin === "https://fonts.googleapis.com" || url.origin === "https://fonts.gstatic.com", handler: "StaleWhileRevalidate", options: { cacheName: "fonts", expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 } } },
        ],
      },
    }),
  ],
  test: { environment: "node" },
});
