import { aimMagnet, magnetCarried } from "./rayShadow";

/** Where a magnet rests: on a paper (by stable key, on one of its faces), or
 * loose on the desk. x/y are fractions of the mount, for the magnet's centre. */
// `binds`: the sheets lying under the magnet when it was put down, held with it.
// `z`: the desk layer of a magnet lying loose (it stacks like a sheet put down).
type Placement = {
  surface: string | null;
  face: string;
  x: number;
  y: number;
  binds?: string[];
  z?: number;
};

type Snapshot = {
  parent: Node;
  next: Node | null;
  classes: string;
  style: string | null;
  binds: string | undefined;
  home: string | undefined;
  layered: boolean;
};

type Magnet = {
  element: HTMLElement;
  key: string;
  initial: Snapshot;
  size: number;
};

// A magnet holds whichever face of a sheet it was put on, and turns with it:
// folder leaves and the map have two faces, each hidden when turned away.
const faces = [
  "[data-folder-inside]",
  "[data-folder-exterior]",
  "[data-map-front]",
  "[data-map-back]",
];

const placed =
  "pointer-events-auto absolute grid aspect-square cursor-grab touch-none select-none outline-none focus-visible:opacity-80";

export function initializeMagnets(canvas: HTMLElement) {
  if (canvas.dataset.magnetsReady) return;
  canvas.dataset.magnetsReady = "true";

  const owned = <T extends Element>(selector: string) =>
    [...canvas.querySelectorAll<T>(selector)].filter(
      (el) => el.closest("[data-desk-canvas]") === canvas,
    );

  const counts = new Map<string, number>();

  const key = (element: Element, kind: string) => {
    const group = `${element.closest<HTMLElement>("[data-movable-id]")?.dataset.movableId ?? "desk"}:${kind}`;
    const index = counts.get(group) ?? 0;
    counts.set(group, index + 1);
    return `${group}:${index}`;
  };

  // The folder's hinge backing is not a sheet anything can be held to.
  const surfaces = owned<HTMLElement>("[data-clip-surface]").filter(
    (surface) => !surface.hasAttribute("data-folder-board"),
  );

  const surfaceKeys = new Map(
    surfaces.map((surface) => [surface, key(surface, "sheet")]),
  );

  const snapshot = (element: HTMLElement): Snapshot => ({
    parent: element.parentNode!,
    next: element.nextSibling,
    classes: element.getAttribute("class") ?? "",
    style: element.getAttribute("style"),
    binds: element.dataset.binds,
    home: element.dataset.bindHome,
    layered: element.dataset.deskLayer !== undefined,
  });

  const bind = (element: HTMLElement, ids: string[] | undefined) => {
    const home = element.closest<HTMLElement>("[data-movable-item]")?.dataset
      .movableId;

    const before = element.dataset.binds;

    if (ids?.length && home) {
      element.dataset.binds = ids.join(" ");
      element.dataset.bindHome = home;
    } else {
      delete element.dataset.binds;
      delete element.dataset.bindHome;
    }

    // What a magnet holds also pins its unit: let the desk know.
    if (before !== element.dataset.binds)
      canvas.dispatchEvent(new CustomEvent("desk:holds-changed"));
  };

  /** A magnet presses down on everything beneath it: its own sheet and every
   * sheet lying under its disc, which it holds together as one unit. A sheet
   * lying on top of the magnet is not held; the folder (it folds) never is. */
  const heldUnder = (element: HTMLElement) => {
    const home = element.closest<HTMLElement>("[data-movable-item]");
    if (!home || home.querySelector("[data-work-folder]")) return [];

    // On the hidden side of a face-down sheet, the magnet is underneath it and
    // presses on nothing below.
    if (
      getComputedStyle(element).visibility !== "visible" ||
      element.closest(
        '[data-map-sheet][data-facing="back"] [data-map-front], [data-map-sheet][data-facing="front"] [data-map-back]',
      )
    )
      return [];

    const r = element.getBoundingClientRect();

    const cx = r.x + r.width / 2,
      cy = r.y + r.height / 2,
      reach = element.offsetWidth * 0.35;

    const level = Number(getComputedStyle(home).zIndex) || 0;
    const ids = new Set<string>();

    for (let i = 0; i <= 8; i++) {
      const angle = (i * Math.PI) / 4,
        k = i === 8 ? 0 : reach;

      for (const hit of document.elementsFromPoint(
        cx + Math.cos(angle) * k,
        cy + Math.sin(angle) * k,
      )) {
        if (
          hit.closest("[data-hardware]") ||
          !hit.closest("[data-clip-surface], [data-turn-back]")
        )
          continue;

        const item = hit.closest<HTMLElement>("[data-movable-item]");

        if (
          !item ||
          item === home ||
          item.closest("[data-desk-canvas]") !== canvas ||
          item.querySelector("[data-work-folder]")
        )
          continue;

        if ((Number(getComputedStyle(item).zIndex) || 0) < level)
          ids.add(item.dataset.movableId!);
      }
    }

    return [...ids];
  };

  const magnets: Magnet[] = owned<HTMLElement>("[data-desk-magnet]").map(
    (element) => ({
      element,
      key: key(element, "magnet"),
      initial: snapshot(element),
      size: 0,
    }),
  );

  const storageKey = `${canvas.dataset.storageKey}:magnets`;
  let saved: Record<string, Placement> = {};
  let scrollFrame = 0;

  let active: {
    magnet: Magnet;
    before: Snapshot;
    pointer: number | null;
    x: number;
    y: number;
    startX: number;
    startY: number;
    started: boolean;
  } | null = null;

  const announce = (text: string) => {
    const live = canvas.querySelector("[data-desk-announcement]");
    if (live) live.textContent = text;
  };

  const settle = (element: HTMLElement, lift: number) => {
    element.dataset.lift = String(lift);
    aimMagnet(element);
  };

  const restore = (magnet: Magnet, before: Snapshot) => {
    before.parent.insertBefore(
      magnet.element,
      before.next?.parentNode === before.parent ? before.next : null,
    );

    magnet.element.setAttribute("class", before.classes);

    if (before.style === null) magnet.element.removeAttribute("style");
    else magnet.element.setAttribute("style", before.style);

    if (before.layered) magnet.element.dataset.deskLayer = "";
    else delete magnet.element.dataset.deskLayer;

    bind(magnet.element, before.binds?.split(" "));
    settle(magnet.element, 0);
  };

  const prepare = (magnet: Magnet) => {
    // Keep the size it was authored at (photos and folders use different magnets).
    magnet.size ||= magnet.element.offsetWidth || 44;
    magnet.element.setAttribute("class", placed);
    magnet.element.removeAttribute("style");

    Object.assign(magnet.element.style, {
      width: `${magnet.size}px`,
      translate: "-50% -50%",
      zIndex: "1000001",
    });
  };

  // Zero-sized probes give each mount's local axes, even when rotated or mirrored.
  const probes = new WeakMap<HTMLElement, HTMLElement[]>();

  const localPoint = (mount: HTMLElement, x: number, y: number) => {
    let points = probes.get(mount);

    if (!points) {
      points = [
        [0, 0],
        [100, 0],
        [0, 100],
      ].map(([px, py]) => {
        const point = document.createElement("span");
        point.setAttribute("aria-hidden", "true");

        Object.assign(point.style, {
          position: "absolute",
          left: `${px}%`,
          top: `${py}%`,
          width: "0",
          height: "0",
          pointerEvents: "none",
        });

        mount.append(point);
        return point;
      });

      probes.set(mount, points);
    }

    const [o, a, b] = points.map((point) => point.getBoundingClientRect());

    const ax = a!.x - o!.x,
      ay = a!.y - o!.y,
      bx = b!.x - o!.x,
      by = b!.y - o!.y,
      det = ax * by - ay * bx;

    if (Math.abs(det) < 1) return null;

    return {
      x: ((x - o!.x) * by - (y - o!.y) * bx) / det,
      y: (ax * (y - o!.y) - ay * (x - o!.x)) / det,
    };
  };

  const mountOf = (surface: HTMLElement | null, face: string) =>
    surface
      ? (face && surface.querySelector<HTMLElement>(face)) || surface
      : canvas;

  const place = (magnet: Magnet, placement: Placement) => {
    const surface =
      placement.surface === null
        ? null
        : surfaces.find(
            (surface) => surfaceKeys.get(surface) === placement.surface,
          );

    if (placement.surface !== null && !surface) return false;
    prepare(magnet);
    mountOf(surface ?? null, placement.face).append(magnet.element);

    Object.assign(magnet.element.style, {
      left: `${placement.x * 100}%`,
      top: `${placement.y * 100}%`,
    });

    // Loose on the desk, a magnet has its own layer; mounted, it rides its sheet's.
    if (!surface && placement.z !== undefined) {
      magnet.element.style.zIndex = String(placement.z);
      magnet.element.dataset.deskLayer = "";
    } else {
      if (!surface) magnet.element.style.removeProperty("z-index");
      delete magnet.element.dataset.deskLayer;
    }

    bind(magnet.element, placement.binds);
    settle(magnet.element, 0);
    return true;
  };

  try {
    const data: unknown = JSON.parse(
      localStorage.getItem(storageKey) ?? "null",
    );

    if (data && typeof data === "object")
      for (const magnet of magnets) {
        const p = (data as Record<string, Placement>)[magnet.key];

        if (
          p &&
          [p.x, p.y].every(Number.isFinite) &&
          (p.surface === null ||
            (p.x >= -0.2 && p.x <= 1.2 && p.y >= -0.2 && p.y <= 1.2)) &&
          (p.surface === null || typeof p.surface === "string") &&
          (p.face === "" || faces.includes(p.face))
        ) {
          if (
            p.binds !== undefined &&
            !(
              Array.isArray(p.binds) &&
              p.binds.every((id) => typeof id === "string")
            )
          )
            delete p.binds;

          if (p.z !== undefined && !Number.isFinite(p.z)) delete p.z;
          if (place(magnet, p)) saved[magnet.key] = p;
        }
      }
  } catch {
    /* Optional per-visitor persistence. */
  }

  /** The topmost sheet under a point, and which of its faces is showing there. */
  function targetAt(x: number, y: number): Placement {
    for (const hit of document.elementsFromPoint(x, y)) {
      if (hit.closest("[data-hardware]")) continue;

      // A face-down sheet's printed front is hidden; lay the magnet on top of it loose.
      if (hit.closest("[data-turn-back]")) break;
      const surface = hit.closest<HTMLElement>("[data-clip-surface]");

      if (
        !surface ||
        !surfaceKeys.has(surface) ||
        surface.closest("[data-desk-canvas]") !== canvas
      )
        break;

      if (
        surface.closest<HTMLElement>("[data-work-folder]")?.dataset
          .animating === "true"
      )
        break;

      const face =
        faces.find((face) => {
          const element = hit.closest(face);
          return element && surface.contains(element);
        }) ?? "";

      const local = localPoint(mountOf(surface, face), x, y);
      if (!local) break;

      return {
        surface: surfaceKeys.get(surface)!,
        face,
        x: Math.max(0, Math.min(1, local.x)),
        y: Math.max(0, Math.min(1, local.y)),
      };
    }

    const rect = canvas.getBoundingClientRect();

    return {
      surface: null,
      face: "",
      // Anywhere, off the screen too.
      x: (x - rect.left) / rect.width,
      y: (y - rect.top) / rect.height,
    };
  }

  function move(x: number, y: number) {
    if (!active) return;
    active.x = x;
    active.y = y;

    if (!active.started && Math.hypot(x - active.startX, y - active.startY) < 4)
      return;

    const element = active.magnet.element;

    if (!active.started) {
      active.started = true;
      prepare(active.magnet);
      document.body.append(element);

      Object.assign(element.style, {
        position: "fixed",
        zIndex: "2147483646",
        pointerEvents: "none",
        cursor: "grabbing",
      });

      // Lifted off the paper: the same ray-traced shadow, cast from higher up.
      // Lifting the magnet off frees whatever it held, and unpins its sheet.
      bind(element, undefined);
      canvas.dispatchEvent(new CustomEvent("desk:holds-changed"));
      settle(element, magnetCarried);
      if (active.pointer !== null) element.setPointerCapture(active.pointer);

      if (active.pointer !== null)
        scrollFrame = requestAnimationFrame(autoScroll);
    }

    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
  }

  function autoScroll() {
    if (!active?.started || active.pointer === null) return;

    const speed =
      active.y < 64
        ? -Math.ceil((64 - active.y) / 5)
        : active.y > innerHeight - 64
          ? Math.ceil((active.y - innerHeight + 64) / 5)
          : 0;

    if (speed) {
      window.scrollBy(0, Math.max(-18, Math.min(18, speed)));
      move(active.x, active.y);
    }

    scrollFrame = requestAnimationFrame(autoScroll);
  }

  function finish(cancel = false) {
    if (!active) return;
    const current = active;
    active = null;
    cancelAnimationFrame(scrollFrame);

    if (
      current.pointer !== null &&
      current.magnet.element.hasPointerCapture(current.pointer)
    )
      current.magnet.element.releasePointerCapture(current.pointer);

    if (!current.started) return;

    if (cancel) {
      restore(current.magnet, current.before);
      canvas.dispatchEvent(new CustomEvent("desk:holds-changed"));
      announce("Magnet move cancelled.");
      return;
    }

    const placement = targetAt(current.x, current.y);
    place(current.magnet, placement);

    if (placement.surface) {
      const held = heldUnder(current.magnet.element);
      if (held.length) placement.binds = held;
      bind(current.magnet.element, placement.binds);
    }
    // Put down loose, it lies on top of what is there now, under what comes later.
    else {
      canvas.dispatchEvent(
        new CustomEvent("desk:lay", { detail: current.magnet.element }),
      );

      placement.z = Number(current.magnet.element.style.zIndex);
    }

    saved[current.magnet.key] = placement;

    try {
      localStorage.setItem(storageKey, JSON.stringify(saved));
    } catch {
      /* Still usable without storage. */
    }

    const owner = placement.surface
      ? current.magnet.element.closest<HTMLElement>("[data-movable-item]")
      : null;

    if (owner)
      canvas.dispatchEvent(new CustomEvent("desk:raise", { detail: owner }));

    current.magnet.element.focus({ preventScroll: true });
    canvas.dispatchEvent(new CustomEvent("desk:holds-changed"));

    const held = (placement.binds ?? [])
      .map((id) =>
        canvas
          .querySelector(`[data-movable-id="${id}"]`)
          ?.getAttribute("aria-label"),
      )
      .filter(Boolean);

    announce(
      owner
        ? `Magnet placed on ${owner.getAttribute("aria-label")}${held.length ? `, holding it together with ${held.join(" and ")}` : ""}.`
        : "Magnet left on the desk.",
    );
  }

  canvas.addEventListener(
    "pointerdown",
    (event) => {
      const element =
        event.target instanceof Element
          ? event.target.closest("[data-desk-magnet]")
          : null;

      const magnet = magnets.find((magnet) => magnet.element === element);
      if (!magnet || event.button !== 0 || !event.isPrimary) return;
      event.preventDefault();
      event.stopPropagation();
      if (active) finish(true);

      active = {
        magnet,
        before: snapshot(magnet.element),
        pointer: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        startX: event.clientX,
        startY: event.clientY,
        started: false,
      };
    },
    true,
  );

  window.addEventListener(
    "pointermove",
    (event) => {
      if (active?.pointer !== event.pointerId) return;
      event.preventDefault();
      move(event.clientX, event.clientY);
    },
    { passive: false },
  );

  window.addEventListener("pointerup", (event) => {
    if (active?.pointer === event.pointerId) finish();
  });

  window.addEventListener("pointercancel", (event) => {
    if (active?.pointer === event.pointerId) finish(true);
  });

  window.addEventListener("blur", () => finish(true));

  // Picking up a magnet must never flip a map, toggle a folder or follow a link.
  canvas.addEventListener(
    "click",
    (event) => {
      if (
        event.target instanceof Element &&
        magnets.some((magnet) => magnet.element.contains(event.target as Node))
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true,
  );

  window.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "Escape" && active) {
        event.preventDefault();
        finish(true);
        return;
      }

      const magnet = magnets.find((magnet) => magnet.element === event.target);
      if (!magnet) return;

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        event.stopPropagation();

        if (active) finish();
        else {
          const rect = magnet.element.getBoundingClientRect();

          const x = rect.x + rect.width / 2,
            y = rect.y + rect.height / 2;

          active = {
            magnet,
            before: snapshot(magnet.element),
            pointer: null,
            x,
            y,
            startX: x,
            startY: y,
            started: false,
          };

          move(x + 5, y);
          magnet.element.focus({ preventScroll: true });

          announce(
            "Magnet picked up. Use arrow keys, then Enter to put down; Escape to cancel.",
          );
        }
      } else if (active?.magnet === magnet && active.pointer === null) {
        const delta = {
          ArrowLeft: [-1, 0],
          ArrowRight: [1, 0],
          ArrowUp: [0, -1],
          ArrowDown: [0, 1],
        }[event.key];

        if (!delta) return;
        event.preventDefault();
        event.stopPropagation();
        const step = event.shiftKey ? 40 : 10;
        move(active.x + delta[0]! * step, active.y + delta[1]! * step);
      }
    },
    true,
  );

  // Magnets as authored (never moved) hold whatever lies under them once the
  // desk has laid out; on reset, the restored layout is judged afresh.
  const holdAuthored = () =>
    magnets.forEach((magnet) => {
      if (saved[magnet.key] || !magnet.element.closest("[data-movable-item]"))
        return;

      bind(magnet.element, heldUnder(magnet.element));
    });

  let authored = false;

  canvas.addEventListener("desk:settled", () => {
    if (!authored) {
      authored = true;
      holdAuthored();
    }
  });

  canvas.querySelector("[data-desk-reset]")?.addEventListener("click", () => {
    finish(true);
    magnets.forEach((magnet) => restore(magnet, magnet.initial));
    saved = {};

    requestAnimationFrame(() => {
      holdAuthored();
      canvas.dispatchEvent(new CustomEvent("desk:holds-changed"));
    });

    try {
      localStorage.removeItem(storageKey);
    } catch {
      /* Optional persistence. */
    }
  });

  window.addEventListener("resize", () => {
    if (active) finish(true);
  });
}
