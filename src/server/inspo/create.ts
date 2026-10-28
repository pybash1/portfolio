import { z } from "zod";
import sharp, { type Metadata, type WebpOptions } from "sharp";
import type { InspoItem } from "../../components/inspo/types";
import type { UrlPreview } from "../../lib/inspoEditor";
import { itemUrlKey, normalizeItemUrl } from "../../lib/inspoEditor";
import { safeEmbedUrl, socialEmbed } from "../../lib/inspoEmbed";
import { EditorError } from "./http";
import { itemStore, type ItemStore } from "./store";
import { fetchPublicPage, publicTarget } from "./publicFetch";
import { verifyUrlPreview } from "./preview";
import { fontMetadata } from "./fontMetadata";

const title = z.string().trim().max(180);
const url = z.string().trim().max(2048);
const text = z.string().trim().min(1).max(20000);
const fileData = z
  .string()
  .max(4_200_000)
  .regex(/^[A-Za-z\d+/]*={0,2}$/);
const fieldsSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("url"),
      url,
      title,
      imageUrl: url.min(1).optional(),
      fileData: fileData.optional(),
    })
    .strict(),
  z.object({ kind: z.literal("text"), text }).strict(),
  z.object({ kind: z.literal("quote"), text, author: title.min(1) }).strict(),
  z
    .object({ kind: z.literal("email"), text, from: z.email().max(254) })
    .strict(),
  z.object({ kind: z.literal("tweet"), url }).strict(),
  z
    .object({
      kind: z.literal("image"),
      url,
      title: title.min(1),
      fileData: fileData.optional(),
    })
    .strict(),
  z
    .object({
      kind: z.literal("design"),
      url,
      title: title.min(1),
      fileData: fileData.optional(),
    })
    .strict(),
  z.object({ kind: z.literal("font"), fileData: fileData.min(1) }).strict(),
  z.object({ kind: z.literal("embed"), url }).strict(),
]);
const inputSchema = z
  .object({
    requestId: z.uuid(),
    fields: fieldsSchema,
    preview: z.unknown().optional(),
  })
  .strict();

function addedItemPosition(index: number, width: number) {
  const angle = index * Math.PI * (3 - Math.sqrt(5)),
    radius = 620 * Math.sqrt(index);
  return {
    x: Math.round(1100 + Math.cos(angle) * radius - width / 2),
    y: Math.round(650 + Math.sin(angle) * radius * 0.85),
    width,
  };
}

const maxImageSide = 1920;

/**
 * Converts any image sharp can decode into WebP. Both a lossy and a lossless
 * encoding are tried and the smaller one is kept, so flat graphics and
 * screenshots don’t get bigger than photos would. Metadata is stripped and
 * animated images keep only their first frame.
 */
async function image(bytes: Buffer) {
  const options = { limitInputPixels: 30_000_000 };
  let metadata: Metadata;
  try {
    metadata = await sharp(bytes, options).metadata();
  } catch {
    throw new EditorError("Choose an image file.");
  }
  if (!metadata.width || !metadata.height)
    throw new EditorError("This image couldn’t be read.");
  const encode = (webp: WebpOptions) =>
    sharp(bytes, options)
      .rotate()
      .resize({
        width: maxImageSide,
        height: maxImageSide,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ effort: 6, smartSubsample: true, ...webp })
      .toBuffer({ resolveWithObject: true });
  let lossy, lossless;
  try {
    [lossy, lossless] = await Promise.all([
      encode({ quality: 85 }),
      encode({ lossless: true }),
    ]);
  } catch {
    throw new EditorError("This image couldn’t be read.");
  }
  const output = lossless.data.length < lossy.data.length ? lossless : lossy;
  return {
    bytes: output.data,
    aspectRatio: output.info.width / output.info.height,
  };
}

export async function createItem(
  input: unknown,
  store: ItemStore = itemStore(),
  fetchPage: typeof fetchPublicPage = fetchPublicPage,
): Promise<InspoItem> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success)
    throw new EditorError(
      parsed.error.issues[0]?.message ?? "Check the item fields.",
    );
  const { fields, requestId } = parsed.data;
  const id = `added-${requestId}`;
  const saved = await store.read();
  const existing = saved.find((item) => item.id === id);
  if (existing) return existing;
  let targetUrl: URL | null = null;
  try {
    targetUrl =
      "url" in fields && fields.url ? normalizeItemUrl(fields.url) : null;
  } catch {
    throw new EditorError("Enter a public website URL.");
  }
  if (
    targetUrl &&
    saved.some(
      (item) =>
        (item.source &&
          itemUrlKey(item.source.url) === itemUrlKey(targetUrl.href)) ||
        (item.kind === "tweet" &&
          item.url &&
          itemUrlKey(item.url) === itemUrlKey(targetUrl.href)),
    )
  )
    throw new EditorError("That URL is already on the board.", 409);
  const itemTitle =
    ("title" in fields && fields.title) ||
    ("text" in fields && fields.text.split("\n")[0]?.slice(0, 100)) ||
    targetUrl?.hostname ||
    "Font";
  const base = {
    id,
    title: itemTitle,
    position: addedItemPosition(
      new Set(saved.map((item) => item.id)).size,
      420,
    ),
  };
  let item: InspoItem;
  if (fields.kind === "url") {
    if (!targetUrl || !parsed.data.preview)
      throw new EditorError("Fetch a URL preview before adding it.");
    const draft = verifyUrlPreview(
      parsed.data.preview as UrlPreview,
      targetUrl.href,
    );
    const common = {
      ...base,
      title: fields.title || draft.title,
      source: {
        url: draft.url,
        label: targetUrl.hostname.replace(/^www\./, ""),
      },
    };
    let previewImage = draft.image;
    if (fields.fileData && fields.imageUrl)
      throw new EditorError("Choose either an uploaded image or an image URL.");
    if (fields.fileData || fields.imageUrl) {
      const bytes = fields.fileData
        ? Buffer.from(fields.fileData, "base64")
        : (await fetchPage(fields.imageUrl!, 4_000_000)).body;
      const screenshot = await image(bytes);
      previewImage = {
        src: await store.asset(screenshot.bytes, "webp", "image/webp"),
        alt:
          draft.kind === "website"
            ? `Landing page of ${common.title}`
            : `Preview of ${common.title}`,
        aspectRatio: screenshot.aspectRatio,
      };
    }
    if (draft.kind === "website")
      item = {
        ...common,
        kind: "website",
        ...(previewImage ? { image: previewImage } : {}),
      };
    else if (
      ["music", "video", "youtube", "figma", "embed", "link"].includes(
        draft.kind,
      )
    )
      item = {
        ...common,
        kind: draft.kind as
          | "music"
          | "video"
          | "youtube"
          | "figma"
          | "embed"
          | "link",
        description: draft.description,
        ...(previewImage ? { image: previewImage } : {}),
        ...(draft.embed ? { embed: draft.embed } : {}),
        ...(draft.mediaSrc ? { mediaSrc: draft.mediaSrc } : {}),
      };
    else throw new EditorError("Choose another format for this item.");
  } else if (
    fields.kind === "text" ||
    fields.kind === "quote" ||
    fields.kind === "email"
  ) {
    const width =
      fields.text.length > 400 ? 680 : fields.text.length > 120 ? 560 : 320;
    item = {
      ...base,
      kind: fields.kind,
      text: fields.text,
      ...(fields.kind === "quote" ? { author: fields.author } : {}),
      ...(fields.kind === "email" ? { from: fields.from } : {}),
      position: { ...base.position, width },
    };
  } else if (fields.kind === "tweet") {
    if (
      !targetUrl ||
      !/^(?:www\.|mobile\.)?(?:x|twitter)\.com$/i.test(targetUrl.hostname) ||
      !/^\/(?:[^/]+|i\/web)\/status\/\d+\/?$/.test(targetUrl.pathname)
    )
      throw new EditorError("Enter a tweet URL from x.com or twitter.com.");
    item = {
      ...base,
      kind: "tweet",
      url: targetUrl.href,
      position: { ...base.position, width: 420 },
    };
  } else if (fields.kind === "image" || fields.kind === "design") {
    if (!fields.fileData && !targetUrl)
      throw new EditorError("Choose an image or paste its URL.");
    const bytes = fields.fileData
      ? Buffer.from(fields.fileData, "base64")
      : (await fetchPage(targetUrl!.href, 4_000_000)).body;
    const converted = await image(bytes);
    item = {
      ...base,
      kind: fields.kind,
      ...(targetUrl
        ? {
            source: {
              url: targetUrl.href,
              label: targetUrl.hostname.replace(/^www\./, ""),
            },
          }
        : {}),
      image: {
        src: await store.asset(converted.bytes, "webp", "image/webp"),
        alt: itemTitle,
        aspectRatio: converted.aspectRatio,
      },
    };
  } else if (fields.kind === "font") {
    const bytes = Buffer.from(fields.fileData, "base64");
    const { extension, font } = fontMetadata(bytes);
    const src = await store.asset(bytes, extension, `font/${extension}`);
    item = {
      ...base,
      title: font.family,
      kind: "font",
      font: { ...font, src },
      position: { ...base.position, width: 350 },
    };
  } else {
    const social = targetUrl && socialEmbed(targetUrl.href);
    if (!targetUrl || (!safeEmbedUrl(targetUrl.href) && !social))
      throw new EditorError(
        "Use an embed URL from GitHub, X, YouTube, Spotify, Vimeo, Figma, SoundCloud, or Instagram.",
      );
    await publicTarget(targetUrl.href);
    item = {
      ...base,
      kind: "embed",
      description: "",
      embed: {
        url: social?.url ?? targetUrl.href,
        label: social
          ? social.provider === "github"
            ? "GitHub"
            : "X"
          : targetUrl.hostname,
      },
    };
  }
  return store.add(item);
}
