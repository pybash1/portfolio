export const formatLabels = {
  image: "Image",
  quote: "Quote",
  text: "Text",
  music: "Music",
  video: "Video",
  youtube: "YouTube",
  email: "Email",
  tweet: "Tweet",
  design: "Design",
  figma: "Figma",
  instagram: "Instagram",
  embed: "Embed",
  link: "Website",
  font: "Font",
  website: "Website",
} as const;

export type Format = keyof typeof formatLabels;

interface BaseItem {
  id: string;
  title: string;
  source?: { url: string; label: string };
  /** World coordinates in pixels. Change these to compose the canvas. */
  position: { x: number; y: number; width: number };
}

export interface PreviewImage {
  src: string;
  alt: string;
  aspectRatio: number;
}

export interface Embed {
  url: string;
  label: string;
  height?: number;
}

export interface PreviewFont {
  family: string;
  /** Omit for a system font or a family already declared in the site CSS. */
  src?: string;
  weight?: number;
  style?: "normal" | "italic";
  weightRange?: [number, number];
  variationSettings?: string;
}

export type InspoItem = BaseItem &
  (
    | { kind: "text"; text: string }
    | { kind: "quote"; text: string; author?: string }
    | { kind: "email"; text: string; from?: string }
    | { kind: "tweet"; url?: string; text?: string }
    | { kind: "image" | "design" | "instagram"; image: PreviewImage }
    | { kind: "font"; font: PreviewFont }
    | {
        kind: "website";
        source: { url: string; label: string };
        image?: PreviewImage;
      }
    | {
        kind: "music" | "video" | "youtube" | "figma" | "embed" | "link";
        description: string;
        image?: PreviewImage;
        embed?: Embed;
        /** Direct media files, for native players instead of an iframe. */
        mediaSrc?: string;
      }
  );
