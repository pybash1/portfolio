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

const NEAR = 70;

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

  /** A sheet's centre on screen and its turn (radians), from its corners. */
  const measure = (sheet: HTMLElement) => {
    const r = sheet.getBoundingClientRect();

    // Its own frame: probes at two corners give the real turn.
    const a = probe(sheet, 0, 0),
      b = probe(sheet, 100, 0);

    return {
      x: r.x + r.width / 2,
      y: r.y + r.height / 2,
      turn: Math.atan2(b.y - a.y, b.x - a.x),
    };
  };

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

      const at = measure(sheet);

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
