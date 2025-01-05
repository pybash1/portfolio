import defaultTheme from "tailwindcss/defaultTheme";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      fontFamily: {
        neue: ["NeueMontreal", ...defaultTheme.fontFamily.sans],
        sans: [
          "LDD",
          "Mondwest",
          "NeueMontreal",
          ...defaultTheme.fontFamily.sans,
        ],
        mondwest: [
          "Mondwest",
          "LDD",
          "NeueMontreal",
          ...defaultTheme.fontFamily.sans,
        ],
      },
    },
  },
  plugins: [],
};
