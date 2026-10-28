/** Articles from the journal (journal.pybash.xyz), read from its RSS feed at
 * build time. The feed's links point at an old `/blog/` path, so each link
 * is rewritten to where the article lives now (`/writing/<slug>`). If the
 * feed can't be reached the last known list is used, so the build never
 * fails on a network hiccup. */
type Article = {
  title: string;
  /** The article's own summary, or its opening line. */
  summary: string;
  date: Date;
  href: string;
  /** Minutes to read (at 220 words a minute). */
  minutes: number;
};

const site = "https://journal.pybash.xyz";

const known: Article[] = [
  {
    title: "Using voice for a floating to-do workflow",
    summary:
      "A hands-free approach to capturing thoughts without breaking your flow.",
    date: new Date("2025-12-25"),
    href: `${site}/writing/voicenotes`,
    minutes: 6,
  },
  {
    title: "The WSL Homelab Experiment",
    summary: "Experimenting with a homelab running inside a WSL instance.",
    date: new Date("2025-10-01"),
    href: `${site}/writing/wsl-homelab`,
    minutes: 5,
  },
  {
    title: "Giving AI Another Chance",
    summary:
      "I have long been skeptical of AI copilot tools in my code editor. But recently, things took a turn.",
    date: new Date("2024-08-15"),
    href: `${site}/writing/cursor`,
    minutes: 3,
  },
  {
    title: "4 s -> 13 ms",
    summary:
      "I had the urge to learn Rust, so I remade nerdfetch in it, with a twist.",
    date: new Date("2024-04-21"),
    href: `${site}/writing/4s-13ms`,
    minutes: 7,
  },
  {
    title: "The Devil's Workshop",
    summary:
      "Everyone starting out with programming begins with tutorials. I did too. I don't recommend it anymore.",
    date: new Date("2024-01-08"),
    href: `${site}/writing/the-devils-workshop`,
    minutes: 4,
  },
  {
    title: "Turning the Tables",
    summary:
      "Trying to get my life in order, by building tools or by finding them. This time I found Matter.",
    date: new Date("2024-01-08"),
    href: `${site}/writing/turning-the-tables`,
    minutes: 4,
  },
];

const decode = (text: string) =>
  text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .trim();

const field = (item: string, tag: string) =>
  decode(item.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`))?.[1] ?? "");

/** Newest first. */
export async function getArticles(): Promise<Article[]> {
  try {
    const response = await fetch(`${site}/rss.xml`, {
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) throw new Error(String(response.status));

    const xml = await response.text();

    const articles = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(
      ([, item]): Article => {
        const slug = field(item!, "link").replace(/\/$/, "").split("/").pop();
        const description = field(item!, "description");
        const href = `${site}/writing/${slug}`;

        // Several posts carry a placeholder description: use the known
        // summary (the article's opening line) for those.
        const fallback = known.find((article) => article.href === href);

        return {
          minutes: fallback?.minutes ?? 0,
          title: field(item!, "title"),
          summary:
            description && description.toLowerCase() !== "test"
              ? description
              : (fallback?.summary ?? ""),
          date: new Date(field(item!, "pubDate")),
          href,
        };
      },
    );

    if (!articles.length) throw new Error("empty feed");

    // How long each takes to read, from the article itself.
    await Promise.all(
      articles.map(async (article) => {
        try {
          const page = await fetch(article.href, {
            signal: AbortSignal.timeout(5000),
          });
          if (!page.ok) return;
          const html = await page.text();
          const body =
            html.match(/<article[^>]*>([\s\S]*?)<\/article>/)?.[1] ?? html;
          const words = body
            .replace(
              /<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>/g,
              " ",
            )
            .split(/\s+/)
            .filter(Boolean).length;
          article.minutes = Math.max(1, Math.round(words / 220));
        } catch {
          /* Keep the known reading time. */
        }
      }),
    );

    return articles.sort((a, b) => +b.date - +a.date);
  } catch {
    return known;
  }
}
