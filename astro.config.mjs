import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import vercel from "@astrojs/vercel";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  site: "https://pybash.xyz",
  trailingSlash: "never",
  integrations: [react(), sitemap()],
  adapter: vercel({ maxDuration: 60 }),
  vite: {
    plugins: [tailwindcss()],
  },
});
