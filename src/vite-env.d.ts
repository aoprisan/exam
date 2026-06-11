/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

// The app persists progress through an optional host-provided `window.storage`
// API (async get/set returning `{ value }`). In the browser `main.tsx` backs it
// with localStorage; in an artifact/sandbox host it may already be present.
interface Window {
  storage?: {
    get: (key: string) => Promise<{ value: string | null }>;
    set: (key: string, value: string) => Promise<void>;
  };
}
