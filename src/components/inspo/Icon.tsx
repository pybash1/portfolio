import type { SVGProps } from "react";

const paths = {
  search: "m21 21-5-5M19 10.5a8.5 8.5 0 1 1-17 0 8.5 8.5 0 0 1 17 0",
  close: "m6 6 12 12M6 18 18 6",
  plus: "M12 5v14M5 12h14",
  play: "m9 5 11 7-11 7z",
  music:
    "M9 18V5l12-2v13M9 8l12-2M9 18a3 3 0 1 1-3-3c1 0 3 0 3 3M21 16a3 3 0 1 1-3-3c1 0 3 0 3 3",
  link: "m10 13 4-4M8 15l-2 2a3 3 0 0 1-4-4l5-5a3 3 0 0 1 4 0m2 1 2-2a3 3 0 0 1 4 4l-5 5a3 3 0 0 1-4 0",
  figma:
    "M12 3H8a4 4 0 0 0 0 8h4m0-8h4a4 4 0 0 1 0 8h-4m0-8v16a4 4 0 1 1-4-4h4m0-4H8a4 4 0 0 0 0 8m4-4a4 4 0 1 0 8 0 4 4 0 0 0-8 0",
} as const;

export default function Icon({
  name,
  ...props
}: SVGProps<SVGSVGElement> & { name: keyof typeof paths }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d={paths[name]} />
    </svg>
  );
}
