import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import {
  fontSpecimenText,
  loadPreviewFont,
  previewFontFamily,
  safeEmbedUrl,
  socialEmbed,
} from "../../lib/inspo";
import { formatLabels, type InspoItem, type PreviewFont } from "./types";
import {
  Icon,
  dialog,
  dialogHeader,
  dialogInner,
  iconButton,
  loadButton,
} from "./ui";

// --- Card ---

export function InspoCard({
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
            <span
              className={`block text-[13px]/[1.4] ${canvas ? "max-sm:text-[22px]" : ""}`}
            >
              {item.title}
            </span>
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
          className={`mt-1 inline-block text-[11px] text-inspo-muted ${canvas ? "max-sm:text-[19px]" : ""}`}
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

// --- Detail ---

export function InspoDetail({
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

// --- Content ---

/** Used both on the canvas and in the reader. Live media only exists in the reader. */
function InspoContent({
  item,
  expanded = false,
}: {
  item: InspoItem;
  expanded?: boolean;
}) {
  const [loadEmbed, setLoadEmbed] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const embed = "embed" in item ? item.embed : undefined;
  const embedUrl = embed ? safeEmbedUrl(embed.url) : null;
  const image = "image" in item ? item.image : undefined;

  useEffect(() => {
    const element = imageRef.current;
    // A failed server-rendered image may finish before React attaches onError.
    setImageFailed(!!image && !!element?.complete && !element.naturalWidth);
  }, [image?.src]);

  const textClass = "wrap-anywhere whitespace-pre-wrap";
  const bodyText = expanded
    ? "text-[18px]/[1.75]"
    : "text-[15px]/[1.65] max-md:text-[14px]";
  const clamp = expanded ? "" : "line-clamp-7";

  // A website without a usable capture is represented by its title and link.
  if (item.kind === "website" && (!image || imageFailed)) return null;

  if (item.kind === "font") {
    return <FontSpecimen font={item.font} expanded={expanded} />;
  }

  if (item.kind === "embed" && embed && socialEmbed(embed.url)) {
    return <SocialEmbed item={item} expanded={expanded} />;
  }

  if (expanded && "mediaSrc" in item && item.mediaSrc) {
    return item.kind === "music" ? (
      <audio
        className="max-h-[55dvh] w-full"
        controls
        preload="none"
        src={item.mediaSrc}
      >
        Your browser cannot play this audio.
      </audio>
    ) : (
      <video
        className="max-h-[55dvh] w-full"
        controls
        playsInline
        preload="none"
        src={item.mediaSrc}
        poster={image?.src}
      >
        Your browser cannot play this video.
      </video>
    );
  }

  if (expanded && loadEmbed && embed && embedUrl) {
    return (
      <div>
        <iframe
          className="block w-full border-0"
          src={embedUrl}
          title={`${item.title} on ${embed.label}`}
          height={embed.height ?? 400}
          allow="encrypted-media; fullscreen; picture-in-picture"
          sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
        <p className="mt-3 text-[12px] text-inspo-muted">
          If the player is unavailable, use the source link below.
        </p>
      </div>
    );
  }

  return (
    <>
      {image && !imageFailed ? (
        <div
          className={`relative overflow-hidden bg-inspo-surface ${expanded ? "max-h-[55dvh]" : ""}`}
          style={{ aspectRatio: image.aspectRatio }}
        >
          <img
            ref={imageRef}
            className={`block size-full ${expanded ? "object-contain" : "object-cover"}`}
            src={image.src}
            alt={image.alt}
            loading="lazy"
            decoding="async"
            draggable={false}
            onError={() => setImageFailed(true)}
          />
          {(item.kind === "video" || item.kind === "youtube") && !expanded && (
            <span className="absolute inset-0 grid place-content-center bg-[#0002]">
              <Icon
                name="play"
                className="box-content size-[42px] bg-[#111b] p-3 text-white"
              />
            </span>
          )}
        </div>
      ) : image && imageFailed ? (
        <div className="border border-inspo-line bg-inspo-surface p-6 text-[13px] text-inspo-muted max-md:p-[18px]">
          Preview unavailable. Try again later.
        </div>
      ) : item.kind === "music" ? (
        <div
          className="flex h-[165px] items-center justify-around overflow-hidden bg-[#acb3a2] text-[#3b4537] max-md:h-[150px]"
          aria-hidden="true"
        >
          <div className="grid size-[136px] -translate-x-3 place-items-center bg-[repeating-radial-gradient(circle,#252823_0_2px,#343730_3px,#252823_4px_5px)] max-md:size-[110px]">
            <span className="size-[42px] border-[17px] border-[#bfc4b2] bg-[#d6d8ca]" />
          </div>
          <Icon name="music" className="size-7 max-md:mr-3 max-md:size-5" />
        </div>
      ) : item.kind === "figma" ? (
        <div
          className="flex min-h-[150px] flex-col items-center justify-center gap-4 bg-[#2a2635] text-[12px] text-[#d5ccec]"
          aria-hidden="true"
        >
          <Icon name="figma" width="34" height="34" />
          <span>Design file</span>
        </div>
      ) : item.kind === "tweet" && item.url ? (
        <div className={`${textClass} ${bodyText}`}>
          <p className={clamp}>
            @{new URL(item.url).pathname.split("/")[1]?.replace(/^@/, "")}
          </p>
          <small className={byline}>{item.url}</small>
        </div>
      ) : "text" in item ? (
        <div
          className={`${textClass} ${
            item.kind !== "quote"
              ? bodyText
              : expanded
                ? "pt-[15px] pb-[25px] text-[18px]/[1.75]"
                : ""
          }`}
        >
          {item.kind === "quote" ? (
            <blockquote
              className={`font-[Georgia,serif] leading-[1.24] font-normal tracking-[-0.025em] ${
                expanded
                  ? "text-[clamp(28px,5vw,44px)]"
                  : "text-[31px] max-md:text-[25px] max-xs:text-[31px]"
              }`}
            >
              “{item.text}”
            </blockquote>
          ) : (
            <p className={clamp}>{item.text}</p>
          )}
          {item.kind === "quote" && item.author && (
            <cite className={byline}>— {item.author}</cite>
          )}
          {item.kind === "email" && item.from && (
            <small className={byline}>From {item.from}</small>
          )}
        </div>
      ) : (
        <div className="border border-inspo-line bg-inspo-surface p-6 text-inspo-muted max-md:p-[18px] max-md:text-[14px]">
          <Icon
            name={
              item.kind === "video" || item.kind === "youtube" ? "play" : "link"
            }
          />
          {"description" in item && item.description && (
            <p className={linkText}>{item.description}</p>
          )}
          {item.kind === "embed" && item.embed && (
            <p className={linkText}>{item.embed.url}</p>
          )}
        </div>
      )}
      {expanded && "description" in item && item.description && (
        <p className="mt-[22px] text-[15px]/[1.7] wrap-anywhere whitespace-pre-wrap text-inspo-muted">
          {item.description}
        </p>
      )}
      {expanded && embed && embedUrl && (
        <button className={loadButton} onClick={() => setLoadEmbed(true)}>
          <Icon name="play" /> Load {embed.label} player
        </button>
      )}
    </>
  );
}

const byline =
  "mt-3.5 block font-print text-[12px] leading-normal font-normal wrap-anywhere text-inspo-muted not-italic";
const linkText = "mt-[18px] text-[15px]/[1.6] wrap-anywhere";

// --- Social embed ---

function SocialEmbed({
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

// --- Font specimen ---

function FontSpecimen({
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
