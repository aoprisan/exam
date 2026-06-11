// Generates the PWA icon set from inline SVG sources, so there are no binary
// design assets to keep in sync. Run with `npm run icons` (needs `sharp`).
//
// Outputs into ./public (served at the site root):
//   favicon.svg                 — crisp scalable favicon
//   pwa-192x192.png             — manifest icon (any)
//   pwa-512x512.png             — manifest icon (any)
//   maskable-icon-512x512.png   — manifest icon (maskable, full-bleed)
//   apple-touch-icon.png        — iOS home-screen icon
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(root, "public");

// App palette (kept in sync with the CSS variables in matematica-cnlg.tsx).
const INK = "#21385C";
const HIGHLIGHT = "#FFD23F";
const RED = "#D6402B";

// A big "V" (clasa a V-a) drawn as a stroked polyline over a red "caiet" line,
// so the icon needs no embedded fonts to rasterize.
const rounded = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect x="16" y="16" width="480" height="480" rx="112" fill="${INK}"/>
  <polyline points="150,150 256,366 362,150" fill="none" stroke="${HIGHLIGHT}" stroke-width="58" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="150" y="392" width="212" height="20" rx="10" fill="${RED}"/>
</svg>`;

// Maskable variant: full-bleed background and the artwork pulled into the
// central ~60% safe zone so platform masks never clip it.
const maskable = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${INK}"/>
  <polyline points="178,186 256,336 334,186" fill="none" stroke="${HIGHLIGHT}" stroke-width="42" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="178" y="354" width="156" height="15" rx="7.5" fill="${RED}"/>
</svg>`;

await mkdir(publicDir, { recursive: true });

const png = (svg, size) => sharp(Buffer.from(svg)).resize(size, size).png();

await writeFile(join(publicDir, "favicon.svg"), rounded);
await png(rounded, 192).toFile(join(publicDir, "pwa-192x192.png"));
await png(rounded, 512).toFile(join(publicDir, "pwa-512x512.png"));
await png(rounded, 180).toFile(join(publicDir, "apple-touch-icon.png"));
await png(maskable, 512).toFile(join(publicDir, "maskable-icon-512x512.png"));

console.log("PWA icons written to public/");
