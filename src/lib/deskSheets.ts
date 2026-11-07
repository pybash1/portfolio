import { aimRayShadowsWithin } from "./rayShadow";

const NEAR = 70;

// Shared sheet measurement
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

const measureSheet = (element: HTMLElement) => {
  const r = element.getBoundingClientRect();
  const a = probe(element, 0, 0),
    b = probe(element, 100, 0);

  return {
    x: r.x + r.width / 2,
    y: r.y + r.height / 2,
    turn: Math.atan2(b.y - a.y, b.x - a.x),
  };
};

// Sheets in the folder leaf
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
      const at = measureSheet(sheet);

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

      const at = measureSheet(sheet);

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
      const at = measureSheet(sheet);
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

// Journal pocket sheets
/** Journal log sheets in the folder's field-notes pocket
 * (JournalPocket.astro). A sheet can be pulled out of the pocket and laid
 * anywhere on the desk; dropped back near the pocket it slides into its slot.
 *
 * In the pocket a sheet lives in the folder (it folds and moves with it).
 * Taken out, it moves to the desk itself, at the same place and angle on
 * screen, with its own desk layer, so it can be covered or cover things like
 * any sheet put down. Where each sheet is (in its slot, or on the desk) is
 * saved. Keyboard: Enter takes a focused sheet out (laid beside the folder)
 * or puts it back. */
type Place = { x: number; y: number; turn: number };

export function initializeJournalPocket(canvas: HTMLElement) {
  const pocket = canvas.querySelector<HTMLElement>("[data-journal-pocket]");
  if (!pocket || canvas.dataset.journalReady) return;
  canvas.dataset.journalReady = "true";

  const storageKey = `${canvas.dataset.storageKey}:journal`;

  const sheets = [
    ...pocket.querySelectorAll<HTMLElement>("[data-pocket-sheet]"),
  ];

  const announce = (text: string) => {
    const live = canvas.querySelector("[data-desk-announcement]");
    if (live) live.textContent = text;
  };

  const titleOf = (sheet: HTMLElement) =>
    sheet.querySelector("h3")?.textContent?.trim() ?? "Journal entry";

  // The width a sheet has in the pocket, kept when it is taken out.
  const widthOf = (sheet: HTMLElement) => sheet.getBoundingClientRect().width;

  /** On the desk: centred at (x, y) in canvas px, turned `turn` radians. */
  const layOnDesk = (sheet: HTMLElement, place: Place, width: number) => {
    canvas.append(sheet);
    Object.assign(sheet.style, {
      position: "absolute",
      left: `${place.x}px`,
      top: `${place.y}px`,
      width: `${width}px`,
      translate: "-50% -50%",
      rotate: `${place.turn}rad`,
      transform: "",
    });
    sheet.dataset.out = "";
  };

  /** Back in its slot in the pocket. */
  const putBack = (sheet: HTMLElement) => {
    const slot = Number(sheet.dataset.slot);
    const after = sheets.find(
      (other) =>
        Number(other.dataset.slot) > slot && other.parentElement === pocket,
    );
    pocket.insertBefore(
      sheet,
      after ?? pocket.querySelector(":scope > :not([data-pocket-sheet])"),
    );

    sheet.style.removeProperty("position");
    sheet.style.removeProperty("left");
    sheet.style.removeProperty("top");
    sheet.style.removeProperty("width");
    sheet.style.removeProperty("transform");
    sheet.style.translate = "var(--slot-x) var(--slot-y)";
    sheet.style.rotate = "var(--slot-turn)";
    sheet.style.zIndex = String(slot + 1);
    delete sheet.dataset.out;
    delete sheet.dataset.deskLayer;
  };

  const canvasPoint = (x: number, y: number) => {
    const box = canvas.getBoundingClientRect();
    return { x: x - box.left, y: y - box.top };
  };

  /** Is a screen point over the pocket (or close to it)? */
  const nearPocket = (x: number, y: number) => {
    const r = pocket.getBoundingClientRect();
    return (
      x > r.left - NEAR &&
      x < r.right + NEAR &&
      y > r.top - NEAR &&
      y < r.bottom + NEAR
    );
  };

  const save = () => {
    const box = canvas.getBoundingClientRect();

    const data = Object.fromEntries(
      sheets
        .filter((sheet) => sheet.dataset.out !== undefined)
        .map((sheet) => {
          const r = sheet.getBoundingClientRect();
          return [
            sheet.dataset.slot,
            {
              x: (r.x + r.width / 2 - box.left) / box.width,
              y: (r.y + r.height / 2 - box.top) / box.height,
              turn: parseFloat(sheet.style.rotate) || 0,
              width: parseFloat(sheet.style.width) || 0,
              z: Number(sheet.style.zIndex) || 0,
            },
          ];
        }),
    );

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
    width: number;
    turn: number;
  } | null = null;

  let swallowClick = 0;

  canvas.addEventListener(
    "pointerdown",
    (event) => {
      if (event.button !== 0 || !event.isPrimary || drag) return;
      const sheet = (event.target as Element | null)?.closest<HTMLElement>(
        "[data-pocket-sheet]",
      );
      if (!sheet || !sheets.includes(sheet)) return;

      // The folder (or desk) must not pick itself up instead.
      event.stopPropagation();

      const at = measureSheet(sheet);

      drag = {
        sheet,
        id: event.pointerId,
        dx: event.clientX - at.x,
        dy: event.clientY - at.y,
        startX: event.clientX,
        startY: event.clientY,
        started: false,
        width: widthOf(sheet),
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
      // Lifted out of the pocket onto the desk, above everything.
      const p = canvasPoint(event.clientX - drag.dx, event.clientY - drag.dy);
      layOnDesk(drag.sheet, { ...p, turn: drag.turn }, drag.width);
      drag.sheet.style.zIndex = "1000003";
      drag.sheet.dataset.dragging = "true";
      document.documentElement.style.cursor = "grabbing";
    }

    event.preventDefault();
    const p = canvasPoint(event.clientX - drag.dx, event.clientY - drag.dy);
    drag.sheet.style.left = `${p.x}px`;
    drag.sheet.style.top = `${p.y}px`;
    drag.sheet.toggleAttribute(
      "data-near-pocket",
      nearPocket(event.clientX, event.clientY),
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
    sheet.removeAttribute("data-near-pocket");

    if (nearPocket(event.clientX, event.clientY)) {
      putBack(sheet);
      announce(`${titleOf(sheet)} put back in the field notes pocket.`);
    } else {
      // Put down, it lies on top of what is there now.
      sheet.style.removeProperty("z-index");
      canvas.dispatchEvent(new CustomEvent("desk:lay", { detail: sheet }));
      announce(`${titleOf(sheet)} taken out and laid on the desk.`);
    }

    save();
  };

  window.addEventListener("pointerup", drop);
  window.addEventListener("pointercancel", drop);

  // A drag never follows the title's link.
  canvas.addEventListener(
    "click",
    (event) => {
      if (
        performance.now() < swallowClick &&
        (event.target as Element | null)?.closest("[data-pocket-sheet]")
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true,
  );

  // Keyboard: Enter takes a sheet out (beside the folder) or puts it back.
  canvas.addEventListener("keydown", (event) => {
    const sheet = event.target as HTMLElement;
    if (!sheets.includes(sheet) || event.key !== "Enter") return;
    event.preventDefault();

    if (sheet.dataset.out !== undefined) {
      putBack(sheet);
      announce(`${titleOf(sheet)} put back in the field notes pocket.`);
    } else {
      const r = pocket.getBoundingClientRect();
      const width = widthOf(sheet);
      const p = canvasPoint(
        r.left - width * 0.75,
        r.top + r.height / 2 + Number(sheet.dataset.slot) * 24,
      );
      layOnDesk(sheet, { ...p, turn: -0.05 }, width);
      canvas.dispatchEvent(new CustomEvent("desk:lay", { detail: sheet }));
      announce(`${titleOf(sheet)} taken out and laid on the desk.`);
    }

    sheet.focus({ preventScroll: true });
    save();
  });

  // Saved: sheets left out on the desk go back where they were.
  try {
    const data = JSON.parse(localStorage.getItem(storageKey) ?? "{}") as Record<
      string,
      { x: number; y: number; turn: number; width: number; z: number }
    >;
    const box = canvas.getBoundingClientRect();

    for (const sheet of sheets) {
      const saved = data[sheet.dataset.slot ?? ""];
      if (
        !saved ||
        ![saved.x, saved.y, saved.turn, saved.width].every(Number.isFinite)
      )
        continue;

      layOnDesk(
        sheet,
        { x: saved.x * box.width, y: saved.y * box.height, turn: saved.turn },
        saved.width,
      );
      sheet.style.zIndex = String(saved.z);
      sheet.dataset.deskLayer = "";
    }
  } catch {
    /* Optional persistence. */
  }

  // The canvas reset puts every sheet back in the pocket.
  canvas.querySelector("[data-desk-reset]")?.addEventListener("click", () => {
    sheets.forEach(putBack);
    try {
      localStorage.removeItem(storageKey);
    } catch {
      /* Optional persistence. */
    }
  });
}

// Closing the folder over desk items
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
