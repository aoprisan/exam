import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Project page is served from https://<user>.github.io/exam/
export default defineConfig({
  base: "/exam/",
  plugins: [react()],
});
