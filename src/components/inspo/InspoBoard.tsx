import { useEffect, useMemo, useRef, useState } from "react";
import { searchInspo } from "../../lib/inspoSearch";
import {
  authErrorMessages,
  editorRequest,
  type OwnerSession,
} from "../../lib/inspoEditor";
import Icon from "./Icon";
import InspoCard from "./InspoCard";
import InspoDetail from "./InspoDetail";
import InspoAddDialog from "./InspoAddDialog";
import type { InspoItem } from "./types";
import { useCanvas } from "./useCanvas";
import { useCanvasLayout } from "./useCanvasLayout";
import { iconButton, textButton } from "./styles";

interface Props {
  items: InspoItem[];
}

export default function InspoBoard({ items }: Props) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<InspoItem | null>(null);
  const [adding, setAdding] = useState(false);
  const [signInError, setSignInError] = useState("");
  const [collection, setCollection] = useState<InspoItem[]>(items);
  const [addedId, setAddedId] = useState<string | null>(null);
  const [owner, setOwner] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const mutationVersion = useRef(0);
  const searching = !!query.trim();
  const isCanvas = !searching;
  const results = useMemo(
    () => searchInspo(collection, query),
    [collection, query],
  );
  // The viewport only mounts with results, so the first item starts the camera.
  const { viewportRef, sceneRef, reveal } = useCanvas(
    isCanvas && results.length > 0,
  );
  useCanvasLayout(sceneRef, results, isCanvas);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("editor") !== "1") return;
    setAdding(true);
    const reason = url.searchParams.get("auth_error");
    if (reason)
      setSignInError(
        authErrorMessages[reason] ?? authErrorMessages.failed ?? "",
      );
    url.searchParams.delete("editor");
    url.searchParams.delete("auth_error");
    window.history.replaceState(
      window.history.state,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }, []);

  useEffect(() => {
    let controller: AbortController | null = null;
    const refresh = () => {
      controller?.abort();
      controller = new AbortController();
      const signal = controller.signal;
      // An older snapshot must not undo a local add or delete.
      const version = mutationVersion.current;
      editorRequest<{ items: InspoItem[] }>("items", {
        signal,
      })
        .then(({ items: next }) => {
          if (!signal.aborted) {
            if (version === mutationVersion.current) {
              setCollection(next);
              setSelected((current) =>
                current
                  ? (next.find((item) => item.id === current.id) ?? null)
                  : null,
              );
            }
          }
        })
        .catch(() => {
          // SSR already supplied a successful snapshot. Keep it visible and
          // retry on the next focus or poll instead of discarding an open form.
        });
    };
    refresh();
    window.addEventListener("focus", refresh);
    const timer = window.setInterval(refresh, 60_000);
    return () => {
      controller?.abort();
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  const checkOwner = () =>
    editorRequest<OwnerSession>("session")
      .then((session) => setOwner(session.authenticated))
      .catch(() => setOwner(false));
  useEffect(() => {
    checkOwner();
    window.addEventListener("focus", checkOwner);
    return () => window.removeEventListener("focus", checkOwner);
  }, []);

  const deleteItem = async (item: InspoItem) => {
    if (!window.confirm(`Delete “${item.title}”? This can’t be undone.`))
      return;
    try {
      await editorRequest(`items/${encodeURIComponent(item.id)}`, {
        method: "DELETE",
      });
      mutationVersion.current++;
      setCollection((current) =>
        current.filter((entry) => entry.id !== item.id),
      );
      setSelected((current) => (current?.id === item.id ? null : current));
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : "That didn’t work.",
      );
      checkOwner();
    }
  };

  useEffect(() => {
    if (!addedId) return;
    const frame = requestAnimationFrame(() => {
      const card = sceneRef.current?.querySelector<HTMLElement>(
        `[data-inspo-id="${CSS.escape(addedId)}"]`,
      );
      if (card) {
        const focus = () =>
          card
            .querySelector<HTMLButtonElement>("button")
            ?.focus({ preventScroll: true });
        if (isCanvas) {
          reveal(card);
          // Wait for the camera paint before focus can reveal the card again.
          requestAnimationFrame(focus);
        } else {
          card.scrollIntoView({ block: "center" });
          focus();
        }
      }
      setAddedId(null);
    });
    return () => cancelAnimationFrame(frame);
  }, [addedId, isCanvas]);

  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      const target = event.target;
      const editing =
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          /INPUT|TEXTAREA|SELECT/.test(target.tagName));
      if (
        event.key === "/" &&
        !editing &&
        !selected &&
        !adding &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey
      ) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, [selected, adding]);

  return (
    <div
      className={`relative bg-inspo-bg font-print text-[14px] leading-normal text-inspo-ink [-webkit-tap-highlight-color:transparent] [&_:focus-visible]:outline-2 [&_:focus-visible]:outline-offset-5 [&_:focus-visible]:outline-[#c3d6e2] [&_a]:underline-offset-4 [&_a:hover]:underline [&_button]:cursor-pointer [&_button:disabled]:cursor-default [&_button:disabled]:opacity-35 ${
        isCanvas
          ? "flex h-dvh min-h-[540px] flex-col overflow-hidden select-none"
          : "min-h-dvh select-text"
      }`}
      data-view={isCanvas ? "canvas" : "grid"}
    >
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-5 focus:z-10 focus:bg-inspo-ink focus:p-3 focus:text-inspo-bg"
        href="#inspo-collection"
      >
        Skip to collection
      </a>
      <h1 className="sr-only">Inspiration collection</h1>
      <div className="absolute top-6 left-6 z-2 flex w-[min(351px,calc(100%-48px))] gap-2">
        <div
          className="flex min-h-[43px] min-w-0 flex-1 items-center gap-3 border border-inspo-line bg-inspo-bg px-3 text-inspo-muted focus-within:border-inspo-muted"
          role="search"
        >
          <Icon name="search" className="w-4 shrink-0" />
          <input
            ref={searchRef}
            className="w-full min-w-0 bg-transparent py-2.5 text-[13px] text-inspo-ink outline-none! placeholder:text-inspo-muted [&::-webkit-search-cancel-button]:hidden"
            type="search"
            aria-label="Search collection"
            aria-describedby="inspo-search-help"
            aria-controls="inspo-collection"
            placeholder="Find something…"
            maxLength={200}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setQuery("");
                event.currentTarget.blur();
              }
            }}
          />
          {query ? (
            <button
              className={`${iconButton} h-[30px] w-[26px] min-w-[26px]`}
              aria-label="Clear search"
              onClick={() => {
                setQuery("");
                searchRef.current?.focus();
              }}
            >
              <Icon name="close" />
            </button>
          ) : (
            <kbd className="border border-inspo-line px-1.5 font-print text-[12px] leading-[normal]">
              /
            </kbd>
          )}
          <span className="sr-only" id="inspo-search-help">
            Search titles, sources, and text. Small spelling mistakes are okay.
          </span>
        </div>
        <button
          className="grid h-[43px] flex-[0_0_43px] place-items-center border border-inspo-line bg-inspo-bg hover:border-inspo-muted"
          aria-label="Add item"
          aria-haspopup="dialog"
          onClick={() => setAdding(true)}
        >
          <Icon name="plus" />
        </button>
      </div>
      <span
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {results.length}{" "}
        {searching
          ? `match${results.length === 1 ? "" : "es"}`
          : `thing${results.length === 1 ? "" : "s"}`}
      </span>
      <main
        id="inspo-collection"
        className={`relative ${isCanvas ? "min-h-0 flex-1" : "min-h-80"}`}
        aria-label={
          searching ? "Collection search results" : "Inspiration collection"
        }
      >
        {!results.length ? (
          <div className="flex min-h-[50dvh] flex-col items-center justify-center gap-3 p-10 text-center">
            <Icon
              name="search"
              width="28"
              height="28"
              className="mb-2 text-inspo-muted"
            />
            <h2 className="text-[22px] font-normal">
              {collection.length
                ? "Nothing here just yet."
                : "Room for something good."}
            </h2>
            <p className="mb-2.5 text-inspo-muted">
              {collection.length
                ? "Try a different word."
                : "The collection is waiting for its first addition."}
            </p>
            {searching && (
              <button className={textButton} onClick={() => setQuery("")}>
                Show everything
              </button>
            )}
          </div>
        ) : (
          <div
            ref={viewportRef}
            className={`outline-offset-[-5px]! ${
              isCanvas
                ? "absolute inset-0 cursor-grab touch-none overflow-hidden data-dragging:cursor-grabbing"
                : ""
            }`}
            tabIndex={isCanvas ? 0 : -1}
            role={isCanvas ? "region" : undefined}
            aria-label={isCanvas ? "Explorable canvas" : undefined}
            aria-describedby={isCanvas ? "inspo-canvas-help" : undefined}
          >
            <div
              ref={sceneRef}
              className={
                isCanvas
                  ? "absolute top-0 left-0 m-0 h-[1800px] w-[2400px] max-w-none origin-top-left p-0 will-change-transform"
                  : "columns-[4_250px] gap-x-12 px-10 pt-[100px] pb-10 max-[1001px]:columns-[3_220px] max-[1001px]:gap-x-8 max-md:columns-2 max-md:gap-x-5 max-md:px-5 max-md:pt-[95px] max-md:pb-7 max-xs:mx-auto max-xs:max-w-[400px] max-xs:columns-1 max-xs:px-[30px] max-xs:pb-[30px] min-[1700px]:[column-count:5]"
              }
            >
              {results.map((item) => (
                <InspoCard
                  key={item.id}
                  item={item}
                  canvas={isCanvas}
                  onOpen={setSelected}
                  onDelete={owner ? deleteItem : undefined}
                />
              ))}
            </div>
          </div>
        )}
      </main>
      <p className="sr-only" id="inspo-canvas-help">
        Drag or scroll to move. Pinch to zoom. When the canvas is focused, use
        arrow keys to move, plus and minus to zoom, and Home to reset. Tab to
        explore individual items.
      </p>
      {selected && (
        <InspoDetail
          key={selected.id}
          item={selected}
          onClose={() => setSelected(null)}
        />
      )}
      {adding && (
        <InspoAddDialog
          initialError={signInError}
          onClose={() => {
            setAdding(false);
            setSignInError("");
            checkOwner();
          }}
          onAdded={(item) => {
            mutationVersion.current++;
            setCollection((current) => [
              ...current.filter((entry) => entry.id !== item.id),
              item,
            ]);
            setQuery("");
            setAdding(false);
            setAddedId(item.id);
          }}
        />
      )}
    </div>
  );
}
