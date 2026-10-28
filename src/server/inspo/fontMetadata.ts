import { create, type Font } from "fontkit";
import { EditorError } from "./http";
import type { PreviewFont } from "../../components/inspo/types";

/** Read the face's own names and axes; never trust a file name for display metadata. */
export function fontMetadata(bytes: Buffer): {
  extension: string;
  font: PreviewFont;
} {
  const magic = bytes.subarray(0, 4).toString("ascii");
  const extension =
    magic === "wOF2"
      ? "woff2"
      : magic === "wOFF"
        ? "woff"
        : magic === "OTTO"
          ? "otf"
          : bytes.length >= 4 && bytes.readUInt32BE(0) === 0x00010000
            ? "ttf"
            : null;
  if (!extension)
    throw new EditorError("Choose a WOFF, WOFF2, TTF, or OTF font file.");

  let parsed: Font;
  try {
    const result = create(bytes);
    if (!("familyName" in result)) throw new Error("Font collection");
    parsed = result;
  } catch {
    throw new EditorError("This font file couldn’t be read.");
  }

  const named = parsed as Font & {
    name?: { records?: { preferredFamily?: Record<string, string> } };
  };
  const family =
    named.name?.records?.preferredFamily?.en?.trim() ||
    parsed.familyName?.trim();
  if (!family) throw new EditorError("This font has no family name.");
  const axes = parsed.variationAxes ?? {};
  const variable = Object.keys(axes).length > 0;
  const weight = variable
    ? 400
    : Math.min(1000, Math.max(1, parsed["OS/2"]?.usWeightClass || 400));
  const style = variable
    ? "normal"
    : /italic|oblique/i.test(parsed.subfamilyName ?? "") ||
        parsed.italicAngle !== 0
      ? "italic"
      : "normal";
  const weightAxis = axes.wght;
  const variationSettings = variable
    ? [
        axes.wght && '"wght" 400',
        axes.ital && '"ital" 0',
        axes.slnt && '"slnt" 0',
      ]
        .filter(Boolean)
        .join(", ")
    : undefined;
  return {
    extension,
    font: {
      family,
      weight,
      style,
      ...(weightAxis
        ? { weightRange: [weightAxis.min, weightAxis.max] as [number, number] }
        : {}),
      ...(variationSettings ? { variationSettings } : {}),
    },
  };
}
