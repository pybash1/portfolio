import { useEffect, useRef, useState } from "react";
import { safeEmbedUrl, socialEmbed } from "../../lib/inspoEmbed";
import Icon from "./Icon";
import FontSpecimen from "./FontSpecimen";
import SocialEmbed from "./SocialEmbed";
import { loadButton } from "./styles";
import type { InspoItem } from "./types";

/** Used both on the canvas and in the reader. Live media only exists in the reader. */
export default function InspoContent({
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
    if (item.kind === "website" && element?.complete && !element.naturalWidth) {
      setImageFailed(true);
    }
  }, [item.kind, image?.src]);

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
      {image ? (
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
            onError={
              item.kind === "website" ? () => setImageFailed(true) : undefined
            }
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
