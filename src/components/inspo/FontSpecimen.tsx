import { useEffect, useId, useState } from "react";
import {
  fontSpecimenText,
  loadPreviewFont,
  previewFontFamily,
} from "../../lib/inspoFonts";
import type { PreviewFont } from "./types";

export default function FontSpecimen({
  font,
  expanded = false,
}: {
  font: PreviewFont;
  expanded?: boolean;
}) {
  const [text, setText] = useState(fontSpecimenText);
  const [size, setSize] = useState(48);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const id = useId();

  useEffect(() => {
    let mounted = true;
    setStatus("loading");
    loadPreviewFont(font).then(
      () => {
        if (mounted) setStatus("ready");
      },
      () => {
        if (mounted) setStatus("error");
      },
    );
    return () => {
      mounted = false;
    };
  }, [font]);

  return (
    <div>
      <div
        className={`text-[38px]/[1.25] wrap-anywhere whitespace-pre-wrap ${
          expanded
            ? "max-h-[45dvh] min-h-[200px] overflow-auto"
            : "line-clamp-4"
        }`}
        style={{
          fontFamily: `${JSON.stringify(previewFontFamily(font))}, sans-serif`,
          fontWeight: font.weight ?? 400,
          fontStyle: font.style ?? "normal",
          ...(font.variationSettings
            ? { fontVariationSettings: font.variationSettings }
            : {}),
          ...(expanded ? { fontSize: `${size}px` } : {}),
        }}
      >
        {expanded ? text || fontSpecimenText : fontSpecimenText}
      </div>
      {expanded && (
        <span className="flex justify-between gap-3 text-[11px] text-inspo-muted">
          {font.family}{" "}
          <span>
            {font.weight ?? 400}
            {font.style === "italic" ? " italic" : ""}
          </span>
        </span>
      )}
      {status === "error" && (
        <p className="mt-3.5 text-[12px] text-inspo-muted" role="status">
          Font unavailable. Showing a fallback typeface.
        </p>
      )}
      {expanded && (
        <div className="mt-6 grid gap-2.5 border-t border-inspo-line pt-5 text-[12px] text-inspo-muted">
          <label htmlFor={`${id}-text`}>Preview text</label>
          <textarea
            className="min-h-[75px] w-full resize-y border border-[#4b4b44] bg-inspo-bg px-3 py-2.5 font-print text-[14px] leading-normal text-inspo-ink"
            id={`${id}-text`}
            value={text}
            maxLength={500}
            rows={2}
            onChange={(event) => setText(event.target.value)}
          />
          <label className="mt-2 flex justify-between" htmlFor={`${id}-size`}>
            Size <output>{size}px</output>
          </label>
          <input
            className="min-h-7 w-full accent-inspo-ink"
            id={`${id}-size`}
            type="range"
            min={24}
            max={96}
            value={size}
            onChange={(event) => setSize(Number(event.target.value))}
          />
        </div>
      )}
    </div>
  );
}
