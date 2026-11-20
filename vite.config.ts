import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Alchemy adds its own Cloudflare plugin when it builds or runs `alchemy dev`.
// Don't add @cloudflare/vite-plugin here; the two conflict.
export default defineConfig({
  plugins: [tailwindcss(), tanstackStart(), viteReact()],
});
