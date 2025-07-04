import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";
import vercel from "@astrojs/vercel";

// https://astro.build/config
export default defineConfig({
  integrations: [react(), tailwind()],
  adapter: vercel(),
  experimental: {
    fonts: [
      {
        provider: "local",
        name: "Matter",
        cssVariable: "--font-matter",
        variants: [
          {
            src: ["./src/assets/fonts/Matter-Black.woff2"],
            style: "normal",
            weight: "900",
          },
          {
            src: ["./src/assets/fonts/Matter-Bold.woff2"],
            style: "normal",
            weight: "700",
          },
          {
            src: ["./src/assets/fonts/Matter-Heavy.woff2"],
            style: "normal",
            weight: "800",
          },
          {
            src: ["./src/assets/fonts/Matter-Light.woff2"],
            style: "normal",
            weight: "300",
          },
          {
            src: ["./src/assets/fonts/Matter-Medium.woff2"],
            style: "normal",
            weight: "500",
          },
          {
            src: ["./src/assets/fonts/Matter-Regular.woff2"],
            style: "normal",
            weight: "400",
          },
          {
            src: ["./src/assets/fonts/Matter-SemiBold.woff2"],
            style: "normal",
            weight: "600",
          },
          {
            src: ["./src/assets/fonts/Matter-Thin.woff2"],
            style: "normal",
            weight: "100",
          },
        ],
      },
    ],
  },
});
