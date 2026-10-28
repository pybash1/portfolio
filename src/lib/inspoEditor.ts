import type { InspoItem, PreviewImage, Embed } from "../components/inspo/types";

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
