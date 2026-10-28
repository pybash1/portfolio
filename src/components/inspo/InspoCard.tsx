import type { CSSProperties } from "react";
import Icon from "./Icon";
import InspoContent from "./InspoContent";
import { formatLabels, type InspoItem } from "./types";

export default function InspoCard({
  item,
  canvas,
  onOpen,
  onDelete,
}: {
  item: InspoItem;
  canvas: boolean;
  onOpen: (item: InspoItem) => void;
  onDelete?: ((item: InspoItem) => void) | undefined;
}) {
  const showCaption = !["text", "quote", "email", "tweet", "embed"].includes(
    item.kind,
  );
  const label = formatLabels[item.kind].toLowerCase();
  return (
    <article
      className={
        canvas
          ? "absolute top-(--item-y) left-(--item-x) w-(--item-width)"
          : "relative mb-11 w-full break-inside-avoid max-md:mb-8 max-xs:mb-10"
      }
      data-inspo-card
      data-inspo-id={item.id}
      style={
        {
          "--item-x": `${item.position.x}px`,
          "--item-y": `${item.position.y}px`,
          "--item-width": `${item.position.width}px`,
        } as CSSProperties
      }
    >
      <button
        className={`block w-full text-left ${canvas ? "cursor-[inherit]!" : ""}`}
        onClick={() => onOpen(item)}
        aria-label={`Open ${label}: ${item.title}`}
        aria-haspopup="dialog"
      >
        <InspoContent item={item} />
        {showCaption && (
          <span className="block pt-3">
            <span className="block text-[13px]/[1.4]">{item.title}</span>
          </span>
        )}
      </button>
      {onDelete && (
        <button
          className="absolute -top-[22px] right-0 z-1 inline-flex size-[22px] items-center justify-center text-inspo-muted hover:text-[#ff6b61] focus-visible:text-[#ff6b61]"
          onClick={() => onDelete(item)}
          aria-label={`Delete ${label}: ${item.title}`}
        >
          <Icon name="close" width="12" height="12" />
        </button>
      )}
      {item.kind === "website" && (
        <a
          className="mt-1 inline-block text-[11px] text-inspo-muted"
          href={item.source.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {item.source.label}
        </a>
      )}
    </article>
  );
}
