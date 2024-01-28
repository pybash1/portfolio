import { DM_Sans } from "next/font/google";
import localFont from "next/font/local";

export const dmSans = DM_Sans({
  subsets: ["latin"],
});

export const otBrut = localFont({
  src: [
    { style: "normal", path: "./fonts/OTBrut-Regular.woff2" },
  ],
  weight: "400",
});

export const otBrutMono = localFont({
  src: [
    { style: "normal", path: "./fonts/OTBrut-RegularMono.woff2" },
  ],
  weight: "400",
});