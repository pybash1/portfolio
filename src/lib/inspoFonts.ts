import type { PreviewFont } from "../components/inspo/types";

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
