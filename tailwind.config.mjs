import defaultTheme from "tailwindcss/defaultTheme";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        paper: "#c2bab1",
        writing: "#1c1c1a",
      },
      fontFamily: {
        matter: ["'Matter'", ...defaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [],
};
