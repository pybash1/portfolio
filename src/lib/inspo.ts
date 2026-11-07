import type {
  InspoItem,
  PreviewImage,
  Embed,
  PreviewFont,
} from "../components/inspo/types";

// Board search and layout
// Board search
const normalize = (value: string) =>
  value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

const words = (value: string) =>
  normalize(value).match(/[\p{L}\p{N}]+/gu) ?? [];

/** Damerau–Levenshtein also treats swapped letters as a single typo. */
function editDistance(a: string, b: string): number {
  const rows = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  rows[0] = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const row = rows[i]!;
      const previous = rows[i - 1]!;
      row[j] = Math.min(
        previous[j]! + 1,
        row[j - 1]! + 1,
        previous[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        row[j] = Math.min(row[j]!, rows[i - 2]![j - 2]! + 1);
      }
    }
  }
  return rows[a.length]![b.length]!;
}

function matchScore(query: string, candidate: string): number {
  if (query === candidate) return 100;
  if (candidate.startsWith(query)) return 80;
  if (query.length >= 3 && candidate.includes(query)) return 60;
  const tolerance = query.length >= 7 ? 2 : query.length >= 4 ? 1 : 0;
  if (!tolerance || Math.abs(candidate.length - query.length) > tolerance)
    return 0;
  const distance = editDistance(query, candidate);
  return distance <= tolerance ? 40 - distance * 10 : 0;
}

/** Every query word must match. Exact title matches rank above fuzzy body matches. */
export function searchInspo(
  items: readonly InspoItem[],
  query: string,
): InspoItem[] {
  const terms = words(query).slice(0, 20);
  if (!terms.length) return [...items];

  return items
    .map((item) => {
      const fields = [
        { value: item.title, weight: 3 },
        {
          value: `${item.kind} ${item.kind === "font" ? item.font.family : ""} ${item.source?.label ?? ""} ${item.source?.url ?? ""} ${item.kind === "quote" ? (item.author ?? "") : ""} ${item.kind === "email" ? (item.from ?? "") : ""} ${item.kind === "tweet" ? (item.url ?? "") : ""} ${item.kind === "embed" ? (item.embed?.url ?? "") : ""}`,
          weight: 2,
        },
        {
          value:
            "text" in item
              ? (item.text ?? "")
              : "description" in item
                ? item.description
                : "",
          weight: 1,
        },
      ];
      const tokens = fields.flatMap(({ value, weight }) =>
        words(value).map((word) => ({ word, weight })),
      );
      const scores = terms.map((term) =>
        tokens.reduce(
          (best, { word, weight }) =>
            Math.max(best, matchScore(term, word) * weight),
          0,
        ),
      );
      return {
        item,
        score: scores.every(Boolean) ? scores.reduce((a, b) => a + b, 0) : 0,
      };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item);
}

// Card layout
interface CanvasCard {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CanvasPosition {
  x: number;
  y: number;
}

const gap = 28;

function touches(a: CanvasCard, b: CanvasCard) {
  return (
    a.x < b.x + b.width + gap &&
    a.x + a.width + gap > b.x &&
    a.y < b.y + b.height + gap &&
    a.y + a.height + gap > b.y
  );
}

function distance(a: CanvasPosition, b: CanvasPosition) {
  return (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
}

/** Keep authored positions where possible and move a colliding card nearby. */
export function layoutCanvasCards(
  cards: CanvasCard[],
): Map<string, CanvasPosition> {
  const placed: CanvasCard[] = [];
  const positions = new Map<string, CanvasPosition>();

  for (const card of cards) {
    const clear = (candidate: CanvasPosition) =>
      placed.every(
        (other) => touches({ ...card, ...candidate }, other) === false,
      );
    let position: CanvasPosition = { x: card.x, y: card.y };
    let found = clear(position);

    if (!found) {
      const candidates = placed.flatMap((other) => [
        { x: other.x + other.width + gap, y: card.y },
        { x: other.x - card.width - gap, y: card.y },
        { x: card.x, y: other.y + other.height + gap },
        { x: card.x, y: other.y - card.height - gap },
      ]);
      candidates.sort((a, b) => distance(a, card) - distance(b, card));
      const nearby = candidates.find(clear);
      if (nearby) {
        position = nearby;
        found = true;
      } else {
        // Dense clusters need a wider search than their immediate edges.
        search: for (let radius = 40; radius <= 10_000; radius += 40) {
          for (let step = 0; step < 24; step++) {
            const angle = (step * Math.PI * 2) / 24;
            const candidate = {
              x: Math.round(card.x + Math.cos(angle) * radius),
              y: Math.round(card.y + Math.sin(angle) * radius),
            };
            if (clear(candidate)) {
              position = candidate;
              found = true;
              break search;
            }
          }
        }
      }
    }

    if (!found) {
      // Last resort: below every placed card, which can never collide.
      const bottom = Math.max(...placed.map((other) => other.y + other.height));
      position = { x: card.x, y: bottom + gap };
    }

    positions.set(card.id, position);
    placed.push({ ...card, ...position });
  }
  return positions;
}

// Content previews and safe embeds
// Font specimens
export const fontSpecimenText = "Aa Bb Cc\n0123456789";

const pendingFonts = new Map<string, Promise<void>>();

/** Keep an uploaded specimen separate from a site-wide face with the same name. */
export function previewFontFamily(font: PreviewFont): string {
  if (!font.src) return font.family;
  let hash = 2166136261;
  for (const character of `${font.family}\0${font.src}`)
    hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return `InspoPreview-${(hash >>> 0).toString(36)}`;
}

/** Share one font request between its card and the expanded specimen. */
export function loadPreviewFont(font: PreviewFont): Promise<void> {
  const weight = String(font.weight ?? 400);
  const style = font.style ?? "normal";
  if (!font.src) {
    return document.fonts
      .load(`${style} ${weight} 24px ${JSON.stringify(font.family)}`)
      .then(() => undefined);
  }

  const key = JSON.stringify(font);
  let pending = pendingFonts.get(key);
  if (!pending) {
    pending = new FontFace(
      previewFontFamily(font),
      `url(${JSON.stringify(font.src)})`,
      {
        weight: font.weightRange?.join(" ") ?? weight,
        style,
      },
    )
      .load()
      .then((face) => {
        document.fonts.add(face);
      })
      .catch((error: unknown) => {
        pendingFonts.delete(key);
        throw error;
      });
    pendingFonts.set(key, pending);
  }
  return pending;
}

// Safe media embeds
// Only pass allowlisted media URLs to iframes; never accept pasted embed HTML.
const embedPaths: Record<string, RegExp> = {
  "www.youtube-nocookie.com": /^\/embed\/[\w-]+$/,
  "open.spotify.com": /^\/embed\/(track|album|playlist|episode)\/[\w]+$/,
  "player.vimeo.com": /^\/video\/\d+$/,
  "www.figma.com": /^\/embed$/,
  "w.soundcloud.com": /^\/player\/$/,
  "www.instagram.com": /^\/(p|reel)\/[\w-]+\/embed\/?$/,
};

export function safeEmbedUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      !url.port &&
      embedPaths[url.hostname]?.test(url.pathname)
      ? url.href
      : null;
  } catch {
    return null;
  }
}

/** GitHub does not offer a repository iframe; X profiles use its timeline widget. */
export function socialEmbed(
  value: string,
):
  | { provider: "github"; name: string; url: string }
  | { provider: "x"; name: string; url: string }
  | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.port)
      return null;
    const parts = url.pathname.split("/").filter(Boolean);
    if (
      ["github.com", "www.github.com"].includes(url.hostname) &&
      parts.length === 2 &&
      parts.every((part) => /^[\w.-]+$/.test(part))
    )
      return {
        provider: "github",
        name: `${parts[0]}/${parts[1]}`,
        url: `https://github.com/${parts[0]}/${parts[1]}`,
      };
    if (
      ["x.com", "www.x.com", "twitter.com", "www.twitter.com"].includes(
        url.hostname,
      ) &&
      parts.length === 1 &&
      /^[A-Za-z0-9_]{1,15}$/.test(parts[0]!)
    )
      return {
        provider: "x",
        name: `@${parts[0]}`,
        url: `https://x.com/${parts[0]}`,
      };
    return null;
  } catch {
    return null;
  }
}

// Editor fields, URLs, and requests
export const editorKinds = {
  url: "Link",
  text: "Text",
  quote: "Quote",
  email: "Email",
  tweet: "Tweet",
  image: "Image",
  design: "Design",
  font: "Font",
  embed: "Embed",
} as const;
export type EditorKind = keyof typeof editorKinds;

export type EditorFields =
  | {
      kind: "url";
      url: string;
      title: string;
      imageUrl?: string;
      fileData?: string;
    }
  | { kind: "text"; text: string }
  | { kind: "quote"; text: string; author: string }
  | { kind: "email"; text: string; from: string }
  | { kind: "tweet"; url: string }
  | { kind: "image" | "design"; title: string; url: string; fileData?: string }
  | { kind: "font"; fileData: string }
  | { kind: "embed"; url: string };

export interface UrlDraft {
  url: string;
  title: string;
  kind: InspoItem["kind"];
  description: string;
  text?: string;
  image?: PreviewImage;
  embed?: Embed;
  mediaSrc?: string;
  expiresAt: number;
}
export interface UrlPreview {
  draft: UrlDraft;
  signature: string;
  warning?: string;
}
export interface OwnerSession {
  authenticated: boolean;
  configured: boolean;
  storageConfigured: boolean;
}

export const authErrorMessages: Record<string, string> = {
  cancelled: "Sign-in was cancelled. You can try again.",
  forbidden: "This Authentik account doesn’t have owner access.",
  failed: "Sign-in couldn’t be completed. Please try again.",
};

export function normalizeItemUrl(value: string): URL {
  const url = new URL(
    /^[a-z][a-z\d+.-]*:/i.test(value.trim())
      ? value.trim()
      : `https://${value.trim()}`,
  );
  if (
    !/^https?:$/.test(url.protocol) ||
    url.username ||
    url.password ||
    !url.hostname.includes(".")
  ) {
    throw new Error("Enter a public website URL.");
  }
  url.hash = "";
  return url;
}

/** Compare meaningful URLs without www, fragments, trailing slashes, or tracking. */
export function itemUrlKey(value: string): string {
  const url = normalizeItemUrl(value);
  for (const key of [...url.searchParams.keys()]) {
    if (/^utm_|^(fbclid|gclid)$/i.test(key)) url.searchParams.delete(key);
  }
  url.searchParams.sort();
  return `${url.hostname.toLowerCase().replace(/^www\./, "")}${url.port ? `:${url.port}` : ""}${url.pathname.replace(/\/+$/, "")}${url.search}`;
}

export async function editorRequest<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`/api/inspo/${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
    credentials: "same-origin",
  });
  const data: unknown = await response.json();
  if (!response.ok) {
    const message =
      typeof data === "object" && data !== null && "error" in data
        ? String(data.error)
        : "That didn’t work. Please try again.";
    throw new Error(message);
  }
  return data as T;
}
