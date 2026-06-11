import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import MatePentruLazar from "../matematica-cnlg.tsx";

// The app persists progress through an optional `window.storage` host API
// (async get/set returning { value }). In the browser we back it with
// localStorage so progress survives reloads.
if (typeof window !== "undefined" && !window.storage) {
  window.storage = {
    get: async (key) => ({ value: window.localStorage.getItem(key) }),
    set: async (key, value) => {
      window.localStorage.setItem(key, value);
    },
  };
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MatePentruLazar />
  </StrictMode>,
);
