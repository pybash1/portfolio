/** Click a document on the desk to bring it up close: it glides to the
 * middle of the screen, straightens and grows to a comfortable reading size
 * over a faint veil. Click it, click the veil or press Escape to put it back
 * exactly where it lay. (Like picking a sheet up off a desk to read it.)
 *
 * Not for everything: the map flips on click and the folder opens, so they
 * keep those; hardware (pens, the breadboard, clips, magnets, wires) isn't a
 * document. A drag never counts as a click (movableDesk swallows those). Links
 * and buttons inside a sheet still work, open or not. */
const skip =
  "[data-map-sheet], [data-work-folder], [data-pen], [data-breadboard]";
const interactive =
  "a, button, input, textarea, select, summary, [data-gem-clip], [data-desk-magnet], [data-turn-back]";

const DURATION = 420;
const EASE = "cubic-bezier(.2,.75,.25,1)";

export function initializeDeskFocus(canvas: HTMLElement) {
  if (canvas.dataset.focusReady) return;
  canvas.dataset.focusReady = "true";

  const veil = document.createElement("div");
  veil.setAttribute("aria-hidden", "true");
  Object.assign(veil.style, {
    position: "fixed",
    inset: "0",
    zIndex: "2147483000",
    background: "rgb(10 10 10 / .55)",
    opacity: "0",
    pointerEvents: "none",
    transition: `opacity ${DURATION}ms ease`,
  });
  // Inside the desk (its own stacking context), just under the open sheet.
  canvas.append(veil);

  let open: { item: HTMLElement; transform: string; z: string } | null = null;
  let busy = false;

  const announce = (text: string) => {
    const live = canvas.querySelector("[data-desk-announcement]");
    if (live) live.textContent = text;
  };

  /** The extra transform that centres the item, upright, at reading size. */
  const lift = (item: HTMLElement) => {
    const turn = parseFloat(getComputedStyle(item).rotate) || 0;
    // A folder sheet out on the desk travels in a frame as big as the
    // folder's leaf; it is the sheet that is read and centred.
    const body = item.matches("[data-sheet-frame]")
      ? item.querySelector<HTMLElement>("[data-folder-sheet]")!
      : item;
    const r = body.getBoundingClientRect();
    // Sheets printed sideways (the business card) opt in to turning further
    // so their print reads level; the fit then uses the turned dimensions.
    const extra = parseFloat(
      item.querySelector<HTMLElement>("[data-focus-turn]")?.dataset.focusTurn ??
        "0",
    );
    const sideways = Math.abs(extra) % 180 === 90;
    const w = sideways ? body.offsetHeight : body.offsetWidth,
      h = sideways ? body.offsetWidth : body.offsetHeight;

    // Fit the upright item in most of the viewport, no smaller than it is,
    // no more than 4× (a small card grows to readable size).
    const scale = Math.max(
      1,
      Math.min(4, (innerWidth * 0.82) / w, (innerHeight * 0.86) / h),
    );

    const dx = innerWidth / 2 - (r.x + r.width / 2),
      dy = innerHeight / 2 - (r.y + r.height / 2);

    // Applied before its own translate/rotate (the transform property comes
    // last in CSS), so undo its turn here and move in screen axes.
    const a = (-turn * Math.PI) / 180;
    const lx = dx * Math.cos(a) - dy * Math.sin(a),
      ly = dx * Math.sin(a) + dy * Math.cos(a);

    return `translate(${lx}px, ${ly}px) rotate(${-turn + extra}deg) scale(${scale})`;
  };

  const show = (item: HTMLElement) => {
    if (busy || open) return;
    busy = true;

    open = { item, transform: item.style.transform, z: item.style.zIndex };
    item.dataset.focused = "true";
    // Up close nothing casts or dents (see globals.css, deskBumps).
    canvas.dataset.deskFocused = "";
    item.style.zIndex = "2147483001";
    item.style.transition = `transform ${DURATION}ms ${EASE}`;
    item.style.transform = `${lift(item)} ${open.transform}`.trim();

    veil.style.pointerEvents = "auto";
    veil.style.opacity = "1";

    setTimeout(() => (busy = false), DURATION);
    announce(
      `${item.getAttribute("aria-label") ?? "Document"} brought up close. Escape to put it back.`,
    );
  };

  const hide = () => {
    if (busy || !open) return;
    busy = true;

    const { item, transform, z } = open;
    open = null;
    item.style.transform = transform;
    veil.style.opacity = "0";
    veil.style.pointerEvents = "none";

    setTimeout(() => {
      item.style.removeProperty("transition");
      if (!transform) item.style.removeProperty("transform");
      item.style.zIndex = z;
      delete item.dataset.focused;
      delete canvas.dataset.deskFocused;
      busy = false;
      // Dents were not tracked while it was up: work out what lies over what
      // again, now that everything is back where it was.
      canvas.dispatchEvent(new CustomEvent("desk:layout-changed"));
    }, DURATION);
  };

  canvas.addEventListener("click", (event) => {
    if (event.defaultPrevented) return;
    const target = event.target instanceof Element ? event.target : null;
    if (!target || target.closest(interactive)) return;

    // A sheet still in the journal pocket doesn't zoom; only once taken out.
    if (target.closest("[data-pocket-sheet]:not([data-out])")) return;
    // Likewise a sheet still lying in the folder's leaf.
    if (target.closest("[data-folder-sheet]:not([data-out])")) return;

    const item = target.closest<HTMLElement>(
      "[data-movable-item], [data-pocket-sheet], [data-sheet-frame]",
    );

    if (open) {
      // A link inside the open sheet goes through; anything else puts it back.
      event.preventDefault();
      hide();
      return;
    }

    if (!item || item.querySelector(skip) || item.dataset.turnedOver) return;
    show(item);
  });

  veil.addEventListener("click", hide);

  // Enter on a focused document opens it (Escape closes).
  canvas.addEventListener("keydown", (event) => {
    const item = event.target as HTMLElement;

    if (
      event.key === "Enter" &&
      !open &&
      item.matches?.("[data-movable-item]") &&
      !item.querySelector(skip)
    ) {
      event.preventDefault();
      show(item);
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && open) {
      event.preventDefault();
      hide();
    }
  });

  // Scrolling or resizing while open: put it back (its place has moved).
  window.addEventListener("resize", hide);
  window.addEventListener("scroll", () => open && hide(), { passive: true });
}
