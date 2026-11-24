import type { SVGProps } from "react";

// --- Icon ---

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

export function Icon({
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

// --- Styles ---

/** Class lists shared by the board's controls, dialogs and editor fields. */
export const iconButton =
  "inline-flex shrink-0 items-center justify-center hover:bg-[#ffffff0b]";
export const textButton =
  "text-[12px] text-inspo-ink underline underline-offset-4";
export const submitButton =
  "border border-inspo-ink bg-inspo-ink px-4 py-[11px] text-[13px] text-inspo-bg";
export const loadButton =
  "mt-5 flex w-full items-center justify-center gap-2.5 border border-[#464640] bg-[#30302c] p-[13px]";
export const errorText = "text-[13px] text-[#efa99a]";
export const field = "grid gap-[7px] text-[12px] text-inspo-muted";
export const control =
  "w-full min-w-0 border border-inspo-line bg-inspo-bg px-3 py-2.5 text-[14px] leading-normal text-inspo-ink [color-scheme:dark] placeholder:text-inspo-faint [&[type=file]]:text-[12px]";
export const hint = "text-[11px] text-inspo-faint";
export const dialog =
  "fixed inset-0 m-auto max-h-[calc(100dvh-64px)] overflow-auto border border-[#44443f] bg-inspo-surface p-0 font-print text-inspo-ink select-text backdrop:bg-[#000b] backdrop:backdrop-blur-[5px] max-md:max-h-[calc(100dvh-24px)]";
export const dialogInner =
  "px-8 pt-6 pb-[30px] max-md:px-5 max-md:pt-4 max-md:pb-6";
export const dialogHeader =
  "flex items-center justify-between gap-4 text-[12px] text-inspo-muted";
export const unavailable =
  "grid min-h-dvh place-items-center bg-black font-[system-ui,sans-serif] text-[18px]/[1.4] text-[#e8e7e2]";
