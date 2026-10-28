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
