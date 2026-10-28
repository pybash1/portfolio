import type { UrlDraft, UrlPreview } from "../../lib/inspoEditor";
import { normalizeItemUrl } from "../../lib/inspoEditor";
import { safeEmbedUrl, socialEmbed } from "../../lib/inspoEmbed";
import { EditorError } from "./http";
import { fetchPublicPage, publicTarget } from "./publicFetch";
import { sign, validSignature } from "./auth";

function decode(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCodePoint(Math.min(Number(code), 0x10ffff)),
    );
}

async function pageTitle(url: string, fallback: string): Promise<string> {
  const response = await fetchPublicPage(url);
  const title = response.body
    .toString("utf8")
    .match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]
    ?.replace(/\s+/g, " ")
    .trim();
  return decode(title || fallback).slice(0, 180);
}

export async function makeUrlPreview(value: string): Promise<UrlPreview> {
  const { url } = await publicTarget(value);
  const host = url.hostname.replace(/^www\./, "");
  const draft: UrlDraft = {
    url: url.href,
    title: host,
    kind: "website",
    description: "",
    expiresAt: Date.now() + 30 * 60_000,
  };
  let warning: string | undefined;
  const videoId =
    host === "youtu.be"
      ? url.pathname.slice(1)
      : /^(www\.)?youtube\.com$/.test(url.hostname)
        ? (url.searchParams.get("v") ??
          url.pathname.match(/^\/(?:shorts|embed)\/([\w-]+)/)?.[1])
        : null;
  const spotify =
    url.hostname === "open.spotify.com"
      ? url.pathname.match(/^\/(track|album|playlist|episode)\/([a-zA-Z0-9]+)/)
      : null;
  const social = socialEmbed(url.href);
  if (videoId && /^[\w-]{11}$/.test(videoId)) {
    draft.kind = "youtube";
    draft.embed = {
      url: `https://www.youtube-nocookie.com/embed/${videoId}`,
      label: "YouTube",
    };
    draft.image = {
      src: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      alt: "YouTube video preview",
      aspectRatio: 16 / 9,
    };
  } else if (spotify) {
    draft.kind = "music";
    draft.embed = {
      url: `https://open.spotify.com/embed/${spotify[1]}/${spotify[2]}`,
      label: "Spotify",
      height: 352,
    };
  } else if (host === "soundcloud.com") {
    draft.kind = "music";
    draft.embed = {
      url: `https://w.soundcloud.com/player/?url=${encodeURIComponent(url.href)}`,
      label: "SoundCloud",
      height: 166,
    };
  } else if (host === "figma.com" && /^\/(file|design)\//.test(url.pathname)) {
    draft.kind = "figma";
    draft.embed = {
      url: `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(url.href)}`,
      label: "Figma",
    };
  } else if (safeEmbedUrl(url.href) || social) {
    draft.kind = "embed";
    draft.embed = {
      url: social?.url ?? url.href,
      label: social ? (social.provider === "github" ? "GitHub" : "X") : host,
    };
  } else if (/\.(mp4|webm|ogg)$/i.test(url.pathname)) {
    draft.kind = "video";
    draft.mediaSrc = url.href;
  } else if (/\.(mp3|m4a|wav|flac)$/i.test(url.pathname)) {
    draft.kind = "music";
    draft.mediaSrc = url.href;
  }

  if (draft.kind === "website") {
    draft.title = await pageTitle(url.href, host);
  } else if (!draft.mediaSrc) {
    try {
      draft.title = await pageTitle(url.href, host);
    } catch {
      warning = "The title couldn’t be fetched. You can enter one below.";
    }
  }
  return {
    draft,
    signature: sign(JSON.stringify(draft)),
    ...(warning ? { warning } : {}),
  };
}

export function verifyUrlPreview(preview: UrlPreview, url: string): UrlDraft {
  if (
    !preview?.draft ||
    !validSignature(JSON.stringify(preview.draft), preview.signature) ||
    preview.draft.expiresAt < Date.now() ||
    normalizeItemUrl(url).href !== preview.draft.url
  ) {
    throw new EditorError(
      "This preview expired or changed. Fetch it again before adding the item.",
    );
  }
  return preview.draft;
}
