/** Closing the kraft folder with something lying on it (a sheet, a pen, a
 * loose clip or magnet): nothing is shut inside. The folder is brought up
 * over whatever lies on it first, then closes; everything else stays where
 * it is. Hardware attached to the folder itself (clips on its edges, magnets
 * on its faces) folds with it as before. */
export function initializeFolderClose(canvas: HTMLElement) {
  if (canvas.dataset.folderCloseReady) return;
  canvas.dataset.folderCloseReady = "true";

  // Things shut in by earlier versions are let out.
  try {
    localStorage.removeItem(`${canvas.dataset.storageKey}:pocket`);
  } catch {
    /* Optional persistence. */
  }

  const zOf = (element: Element) =>
    Number(getComputedStyle(element).zIndex) || 0;

  /** Does `element` lie over the folder's spread anywhere? */
  const over = (element: Element, stage: HTMLElement) => {
    const a = element.getBoundingClientRect(),
      b = stage.getBoundingClientRect();

    return (
      a.left < b.right &&
      a.right > b.left &&
      a.top < b.bottom &&
      a.bottom > b.top
    );
  };

  canvas.addEventListener("desk:folder-fold", (event) => {
    const folder = event.target instanceof HTMLElement ? event.target : null;
    const folderItem = folder?.closest<HTMLElement>("[data-movable-item]");
    const { opening } = (event as CustomEvent<{ opening: boolean }>).detail;
    const stage = folder?.querySelector<HTMLElement>("[data-folder-stage]");
    if (!folder || !folderItem || !stage || opening) return;
    const folderZ = zOf(folderItem);

    const onTop = [
      ...canvas.querySelectorAll<HTMLElement>("[data-movable-item]"),
      ...canvas.querySelectorAll<HTMLElement | SVGElement>(
        "[data-gem-clip], [data-desk-magnet]",
      ),
    ].some(
      (element) =>
        element !== folderItem &&
        element.closest("[data-desk-canvas]") === canvas &&
        !element.closest("[data-clip-surface]") &&
        zOf(element) > folderZ &&
        over(element, stage),
    );

    if (onTop)
      canvas.dispatchEvent(
        new CustomEvent("desk:raise", { detail: folderItem }),
      );
  });
}
