import defaultTheme from "tailwindcss/defaultTheme";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      fontFamily: {
        serif: ["Crimson Pro", "serif"],
        sans: ["Plus Jakarta Sans", ...defaultTheme.fontFamily.sans],
        ellograph: ["Ellograph CF", ...defaultTheme.fontFamily.sans],
        italic: ["Quincy CF Text Italic", "serif"],
      },
      fontSize: {
        display: ["clamp(2.5rem, 5vw, 4rem)", { lineHeight: "1.2" }],
      },
      cursor: {
        external: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25"/></svg>'), auto`,
        custom: "default",
      },
      keyframes: {
        "sparkle-spin": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "gradient-shift": Object.fromEntries(
          Array.from({ length: 361 }, (_, i) => {
            const percent = ((i / 360) * 100).toFixed(2);
            const degree = i;

            // Calculate smooth circular motion for background position
            const radians = (degree * Math.PI) / 180;
            const x = 50 + 40 * Math.cos(radians);
            const y = 50 + 40 * Math.sin(radians);

            return [
              `${percent}%`,
              {
                backgroundPosition: `${x.toFixed(1)}% ${y.toFixed(1)}%`,
                filter: `hue-rotate(${degree}deg)`,
                backgroundImage: `linear-gradient(${degree}deg, rgb(147, 51, 234), rgb(236, 72, 153), rgb(59, 130, 246))`,
              },
            ];
          }),
        ),
      },
      animation: {
        "sparkle-spin": "sparkle-spin 3s ease-in-out 1 forwards",
        "gradient-shift": "gradient-shift 4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
