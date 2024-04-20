import { Newsreader } from "next/font/google";
import localFont from "next/font/local";

export const matter = localFont({
  src: "./fonts/Matter-Regular.otf",
  weight: "400",
});

export const newsreader = Newsreader({
  subsets: ["latin"],
  weight: "500",
  style: "italic",
});
