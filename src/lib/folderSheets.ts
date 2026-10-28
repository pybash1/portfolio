import { aimRayShadowsWithin } from "./rayShadow";

/** Papers lying in the folder's right leaf (`data-folder-sheet`): each can be
 * pulled out and laid anywhere on the desk, and slides back into its place
 * when put down near it with the folder open. Taken out, a sheet is carried
 * in a transparent frame the size of the leaf (so its type, sized to the
 * leaf, stays as it was), turned about the sheet's own centre; the frame
 * sits on the desk at the same place and angle on screen, with its own desk
 * layer. A hidden twin keeps the sheet's place in the leaf. A sheet out on
 * the desk can be brought up close like any document (deskFocus). Where each
 * sheet is (in the leaf, or on the desk) is saved. Keyboard: Enter takes a
 * focused sheet out beside the folder or puts it back. */
const NEAR = 70;
const interactive = "[data-gem-clip], [data-desk-magnet], button";

type Saved = { x: number; y: number; turn: number; z: number };

export function initializeFolderSheets(canvas: HTMLElement) {
  if (canvas.dataset.folderSheetsReady) return;
  canvas.dataset.folderSheetsReady = "true";

  const storageKey = `${canvas.dataset.storageKey}:folder-sheets`;

  const sheets = [
    ...canvas.querySelectorAll<HTMLElement>("[data-folder-sheet]"),
  ];

  if (!sheets.length) return;

  const homes = new Map<
    HTMLElement,
    { place: HTMLElement; frame: HTMLElement }
  >();

  const announce = (text: string) => {
    const live = canvas.querySelector("[data-desk-announcement]");
    if (live) live.textContent = text;
  };

  const nameOf = (sheet: HTMLElement) =>
    sheet.getAttribute("aria-label")?.split(".")[0] ?? "Folder sheet";

  const folderOf = (sheet: HTMLElement) =>
    (homes.get(sheet)?.place.closest("[data-work-folder]") ??
      sheet.closest("[data-work-folder]")) as HTMLElement | null;

  /** Corner probes give the sheet's true centre and turn on screen. */
  const probes = new WeakMap<HTMLElement, Map<string, HTMLElement>>();

  const probe = (host: HTMLElement, x: number, y: number) => {
    let points = probes.get(host);
    if (!points) probes.set(host, (points = new Map()));
    let point = points.get(`${x},${y}`);

    if (!point) {
      point = document.createElement("span");
      point.setAttribute("aria-hidden", "true");

      Object.assign(point.style, {
        position: "absolute",
        left: `${x}%`,
        top: `${y}%`,
        width: "0",
        height: "0",
        pointerEvents: "none",
      });

      host.append(point);
      points.set(`${x},${y}`, point);
    }

    const r = point.getBoundingClientRect();
    return { x: r.x, y: r.y };
  };

  const measure = (element: HTMLElement) => {
    const r = element.getBoundingClientRect();
    const a = probe(element, 0, 0),
      b = probe(element, 100, 0);

    return {
      x: r.x + r.width / 2,
      y: r.y + r.height / 2,
      turn: Math.atan2(b.y - a.y, b.x - a.x),
    };
  };

  const canvasPoint = (x: number, y: number) => {
    const box = canvas.getBoundingClientRect();
    return { x: x - box.left, y: y - box.top };
  };

  /** The sheet is in the folder's leaf; the folder is open and still. */
  const inLeaf = (sheet: HTMLElement) => sheet.dataset.out === undefined;

  const folderReady = (sheet: HTMLElement) => {
    const folder = folderOf(sheet);
    return (
      folder?.dataset.open === "true" && folder.dataset.animating !== "true"
    );
  };

  /** The frame for a sheet: the leaf's size, turning about the sheet's centre. */
  const frameFor = (sheet: HTMLElement) => {
    const known = homes.get(sheet);
    if (known) return known;

    const leaf = sheet.closest<HTMLElement>("[data-folder-inside]")!;
    const frame = document.createElement("div");
    frame.dataset.sheetFrame = "";

    Object.assign(frame.style, {
      position: "absolute",
      width: `${leaf.offsetWidth}px`,
      height: `${leaf.offsetHeight}px`,
      pointerEvents: "none",
      containerType: "inline-size",
      // Ink colour is inherited from the folder; carry it out with the sheet.
      color: getComputedStyle(sheet).color,
      transformOrigin: `${sheet.offsetLeft + sheet.offsetWidth / 2}px ${sheet.offsetTop + sheet.offsetHeight / 2}px`,
    });

    // Its place in the leaf, empty, so the sheet knows where home is and
    // goes back in at the same depth.
    const place = sheet.cloneNode(false) as HTMLElement;

    for (const name of [...place.getAttributeNames()])
      if (name !== "class") place.removeAttribute(name);

    place.setAttribute("aria-hidden", "true");
    place.dataset.sheetPlace = "";
    place.style.visibility = "hidden";
    place.style.pointerEvents = "none";

    const entry = { place, frame };
    homes.set(sheet, entry);
    return entry;
  };

  const centreInFrame = (sheet: HTMLElement) => ({
    x: sheet.offsetLeft + sheet.offsetWidth / 2,
    y: sheet.offsetTop + sheet.offsetHeight / 2,
  });

  /** On the desk: the sheet's centre at (x, y) in canvas px, turned `turn`. */
  const layOnDesk = (
    sheet: HTMLElement,
    at: { x: number; y: number; turn: number },
  ) => {
    const { place, frame } = frameFor(sheet);

    if (inLeaf(sheet)) {
      sheet.before(place);
      sheet.style.rotate = "none";
      frame.append(sheet);
      canvas.append(frame);
      sheet.dataset.out = "";
    }

    const c = centreInFrame(sheet);
    frame.style.left = `${at.x - c.x}px`;
    frame.style.top = `${at.y - c.y}px`;
    frame.style.rotate = `${at.turn}rad`;
    aimRayShadowsWithin(frame);
  };

  const moveTo = (sheet: HTMLElement, x: number, y: number) => {
    const { frame } = homes.get(sheet)!;
    const c = centreInFrame(sheet);
    frame.style.left = `${x - c.x}px`;
    frame.style.top = `${y - c.y}px`;
  };

  /** Back in its place in the folder's leaf. */
  const putBack = (sheet: HTMLElement) => {
    const home = homes.get(sheet);
    if (!home || inLeaf(sheet)) return;

    home.place.replaceWith(sheet);
    home.frame.remove();
    sheet.style.removeProperty("rotate");
    delete sheet.dataset.out;
    delete home.frame.dataset.deskLayer;
    home.frame.style.removeProperty("z-index");
    aimRayShadowsWithin(sheet);
  };

  /** Is a screen point over the sheet's place in the leaf (or near it)? */
  const nearHome = (sheet: HTMLElement, x: number, y: number) => {
    const home = homes.get(sheet);
    if (!home || !folderReady(sheet)) return false;
    const r = home.place.getBoundingClientRect();

    return (
      x > r.left - NEAR &&
      x < r.right + NEAR &&
      y > r.top - NEAR &&
      y < r.bottom + NEAR
    );
  };

  const save = () => {
    const box = canvas.getBoundingClientRect();

    const data: Record<string, Saved> = {};

    for (const sheet of sheets) {
      if (inLeaf(sheet)) continue;
      const { frame } = homes.get(sheet)!;
      const at = measure(sheet);

      data[sheet.dataset.folderSheet!] = {
        x: (at.x - box.left) / box.width,
        y: (at.y - box.top) / box.height,
        turn: at.turn,
        z: Number(frame.style.zIndex) || 0,
      };
    }

    try {
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch {
      /* Optional persistence. */
    }
  };

  // --- dragging ------------------------------------------------------------
  let drag: {
    sheet: HTMLElement;
    id: number;
    dx: number;
    dy: number;
    startX: number;
    startY: number;
    started: boolean;
    turn: number;
  } | null = null;

  let swallowClick = 0;

  canvas.addEventListener(
    "pointerdown",
    (event) => {
      if (event.button !== 0 || !event.isPrimary || drag) return;
      const target = event.target as Element | null;
      const sheet = target?.closest<HTMLElement>("[data-folder-sheet]");
      if (!sheet || !sheets.includes(sheet) || target?.closest(interactive))
        return;

      // A sheet in the leaf only comes out of an open folder at rest.
      if (inLeaf(sheet) && !folderReady(sheet)) return;

      // The folder (or desk) must not pick itself up instead.
      event.stopPropagation();

      const at = measure(sheet);

      drag = {
        sheet,
        id: event.pointerId,
        dx: event.clientX - at.x,
        dy: event.clientY - at.y,
        startX: event.clientX,
        startY: event.clientY,
        started: false,
        turn: at.turn,
      };
    },
    true,
  );

  window.addEventListener("pointermove", (event) => {
    if (!drag || event.pointerId !== drag.id) return;

    if (!drag.started) {
      if (
        Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 5
      )
        return;

      drag.started = true;
      const p = canvasPoint(event.clientX - drag.dx, event.clientY - drag.dy);
      layOnDesk(drag.sheet, { ...p, turn: drag.turn });
      homes.get(drag.sheet)!.frame.style.zIndex = "1000003";
      drag.sheet.dataset.dragging = "true";
      document.documentElement.style.cursor = "grabbing";
    }

    event.preventDefault();
    const p = canvasPoint(event.clientX - drag.dx, event.clientY - drag.dy);
    moveTo(drag.sheet, p.x, p.y);

    drag.sheet.toggleAttribute(
      "data-near-home",
      nearHome(drag.sheet, event.clientX, event.clientY),
    );
  });

  const drop = (event: PointerEvent) => {
    if (!drag || event.pointerId !== drag.id) return;
    const { sheet, started } = drag;
    drag = null;
    if (!started) return;

    swallowClick = performance.now() + 300;
    document.documentElement.style.removeProperty("cursor");
    delete sheet.dataset.dragging;
    sheet.removeAttribute("data-near-home");

    if (nearHome(sheet, event.clientX, event.clientY)) {
      putBack(sheet);
      announce(`${nameOf(sheet)} put back in the folder.`);
    } else {
      const { frame } = homes.get(sheet)!;
      // Put down, it lies on top of what is there now.
      frame.style.removeProperty("z-index");
      canvas.dispatchEvent(new CustomEvent("desk:lay", { detail: frame }));
      aimRayShadowsWithin(frame);
      announce(`${nameOf(sheet)} taken out and laid on the desk.`);
    }

    save();
  };

  window.addEventListener("pointerup", drop);
  window.addEventListener("pointercancel", drop);

  // A drag never follows a link or toggles the folder.
  canvas.addEventListener(
    "click",
    (event) => {
      if (
        performance.now() < swallowClick &&
        (event.target as Element | null)?.closest("[data-folder-sheet]")
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true,
  );

  canvas.addEventListener("dragstart", (event) => {
    if ((event.target as Element | null)?.closest("[data-folder-sheet]"))
      event.preventDefault();
  });

  // Keyboard: Enter takes a sheet out (beside the folder) or puts it back.
  canvas.addEventListener("keydown", (event) => {
    const sheet = event.target as HTMLElement;
    if (!sheets.includes(sheet) || event.key !== "Enter") return;
    event.preventDefault();

    if (!inLeaf(sheet)) {
      if (!folderReady(sheet)) return;
      putBack(sheet);
      announce(`${nameOf(sheet)} put back in the folder.`);
    } else {
      if (!folderReady(sheet)) return;
      const stage = folderOf(sheet)!
        .querySelector<HTMLElement>("[data-folder-stage]")!
        .getBoundingClientRect();
      const at = measure(sheet);
      const p = canvasPoint(
        Math.min(innerWidth - 40, stage.right + sheet.offsetWidth * 0.55),
        at.y,
      );

      layOnDesk(sheet, { ...p, turn: at.turn });
      const { frame } = homes.get(sheet)!;
      canvas.dispatchEvent(new CustomEvent("desk:lay", { detail: frame }));
      announce(`${nameOf(sheet)} taken out and laid on the desk.`);
    }

    sheet.focus({ preventScroll: true });
    save();
  });

  // Saved: sheets left out on the desk go back where they were.
  try {
    const data = JSON.parse(localStorage.getItem(storageKey) ?? "{}") as Record<
      string,
      Saved
    >;

    const box = canvas.getBoundingClientRect();

    for (const sheet of sheets) {
      const saved = data[sheet.dataset.folderSheet ?? ""];
      if (!saved || ![saved.x, saved.y, saved.turn].every(Number.isFinite))
        continue;

      layOnDesk(sheet, {
        x: saved.x * box.width,
        y: saved.y * box.height,
        turn: saved.turn,
      });

      const { frame } = homes.get(sheet)!;
      frame.style.zIndex = String(saved.z);
      frame.dataset.deskLayer = "";
    }
  } catch {
    /* Optional persistence. */
  }

  // The canvas reset puts every sheet back in the folder.
  canvas.querySelector("[data-desk-reset]")?.addEventListener("click", () => {
    sheets.forEach(putBack);

    try {
      localStorage.removeItem(storageKey);
    } catch {
      /* Optional persistence. */
    }
  });
}
