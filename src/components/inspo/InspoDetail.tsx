import { useEffect, useRef } from "react";
import Icon from "./Icon";
import InspoContent from "./InspoContent";
import { dialog, dialogHeader, dialogInner, iconButton } from "./styles";
import type { InspoItem } from "./types";

export default function InspoDetail({
  item,
  onClose,
}: {
  item: InspoItem;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const showTitle = !["text", "quote", "email", "tweet", "embed"].includes(
    item.kind,
  );
  const destination =
    item.source ??
    (item.kind === "tweet" && item.url
      ? { url: item.url, label: "X" }
      : item.kind === "embed" && item.embed
        ? { url: item.embed.url, label: item.embed.label }
        : undefined);

  useEffect(() => {
    const opener = document.activeElement;
    const element = dialogRef.current;
    element?.showModal();
    return () => {
      element?.close();
      if (opener instanceof HTMLElement) opener.focus({ preventScroll: true });
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className={`${dialog} w-[min(780px,calc(100%-48px))] max-md:w-[calc(100%-24px)]`}
      aria-labelledby={showTitle ? "inspo-detail-title" : undefined}
      aria-label={showTitle ? undefined : `${item.kind} detail`}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className={dialogInner}>
        <header className={dialogHeader}>
          <button
            className={`${iconButton} ml-auto size-[34px]`}
            aria-label="Close detail"
            onClick={onClose}
            autoFocus
          >
            <Icon name="close" />
          </button>
        </header>
        {showTitle && (
          <h2
            id="inspo-detail-title"
            className="mt-5 mb-6 font-print text-[28px]/[1.2] font-normal tracking-[-0.02em]"
          >
            {item.title}
          </h2>
        )}
        <InspoContent item={item} expanded />
        {destination && (
          <footer className="mt-[30px] flex flex-wrap items-center justify-end gap-5 border-t border-inspo-line pt-5">
            <a
              className="inline-flex items-center gap-[9px] text-[13px]"
              href={destination.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open on {destination.label}
            </a>
          </footer>
        )}
      </div>
    </dialog>
  );
}
