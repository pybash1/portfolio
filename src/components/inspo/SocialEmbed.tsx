import { useEffect, useRef, useState } from "react";
import { socialEmbed } from "../../lib/inspoEmbed";
import { loadButton } from "./styles";
import type { InspoItem } from "./types";

export default function SocialEmbed({
  item,
  expanded,
}: {
  item: InspoItem;
  expanded: boolean;
}) {
  const social =
    "embed" in item && item.embed ? socialEmbed(item.embed.url) : null;
  const [showTimeline, setShowTimeline] = useState(false);
  const [timelineFailed, setTimelineFailed] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showTimeline || social?.provider !== "x") return undefined;
    const container = timelineRef.current;
    if (!container) return undefined;

    const load = () => {
      const widgets = (
        window as Window & {
          twttr?: { widgets?: { load: (element: HTMLElement) => void } };
        }
      ).twttr?.widgets;
      if (widgets) widgets.load(container);
      else setTimelineFailed(true);
    };
    const script = document.querySelector<HTMLScriptElement>(
      'script[data-inspo-x-widget="true"]',
    );
    if (script) {
      if (script.dataset.loaded === "true") load();
      else script.addEventListener("load", load, { once: true });
      return () => script.removeEventListener("load", load);
    }
    const added = document.createElement("script");
    added.src = "https://platform.twitter.com/widgets.js";
    added.async = true;
    added.dataset.inspoXWidget = "true";
    added.addEventListener(
      "load",
      () => {
        added.dataset.loaded = "true";
        load();
      },
      { once: true },
    );
    added.addEventListener("error", () => setTimelineFailed(true), {
      once: true,
    });
    document.head.appendChild(added);
    return undefined;
  }, [showTimeline, social?.provider]);

  if (!social || item.kind !== "embed") return null;

  return (
    <div className="min-h-[140px] border border-inspo-line bg-inspo-surface p-[22px] wrap-anywhere text-inspo-ink">
      <div className="mb-5 text-[11px] text-inspo-muted">
        {social.provider === "github" ? "GitHub" : "X"}
      </div>
      <strong className="block text-[20px]/[1.3] font-medium">
        {social.name}
      </strong>
      {social.provider === "github" && item.title !== social.name && (
        <p className="mt-3 text-[13px] leading-normal text-inspo-muted">
          {item.title}
        </p>
      )}
      {expanded && social.provider === "x" && (
        <>
          {!showTimeline && (
            <button
              className={loadButton}
              onClick={() => setShowTimeline(true)}
            >
              Load X timeline
            </button>
          )}
          {showTimeline && (
            <div ref={timelineRef} className="mt-5 max-h-[560px] overflow-auto">
              <a className="twitter-timeline" href={social.url}>
                {timelineFailed
                  ? `Open ${social.name} on X`
                  : `Posts by ${social.name}`}
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
}
