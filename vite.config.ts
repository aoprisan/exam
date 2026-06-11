import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// Project page is served from https://<user>.github.io/exam/ , so every asset
// (including the service worker scope and the manifest) lives under /exam/.
export default defineConfig({
  base: "/exam/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      // Auto-injects the registration snippet into index.html.
      injectRegister: "auto",
      includeAssets: ["favicon.svg", "apple-touch-icon.png"],
      manifest: {
        name: "Spre clasa a V-a — pregătire matematică",
        short_name: "Mate Lazăr",
        description:
          "Caietul meu de pregătire la matematică pentru admiterea la Colegiul Național Gheorghe Lazăr, Sibiu.",
        lang: "ro",
        dir: "ltr",
        theme_color: "#21385C",
        background_color: "#FBF8F0",
        display: "standalone",
        orientation: "portrait",
        // start_url / scope are derived from Vite's `base` (/exam/).
        icons: [
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          {
            src: "maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // Precache the built shell; cache the Google Fonts used by the "caiet"
        // styling at runtime so the app keeps its look-and-feel offline.
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "StaleWhileRevalidate",
            options: { cacheName: "google-fonts-stylesheets" },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-webfonts",
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
});
