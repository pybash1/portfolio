import { setRayShadowHeight, updateRayShadow } from "./rayShadow";
import { clippedUnit } from "./deskUnits";

type Edge = "top" | "right" | "bottom" | "left";

// `binds`: other desk items caught in the clip's grip, carried as one unit.
// `z`: the desk layer of a clip lying loose (it stacks like a sheet put down).
type Placement = {
  surface: string | null;
  x: number;
  y: number;
  edge: Edge;
  binds?: string[];
  z?: number;
};

type Snapshot = {
  parent: Node;
  next: Node | null;
  classes: string;
  style: string | null;
  mounted: boolean;
  binds: string | undefined;
  home: string | undefined;
  view: string | undefined;
  layered: boolean;
};

type Clip = { element: SVGSVGElement; key: string; initial: Snapshot };

type Target = { surface: HTMLElement; placement: Placement; distance: number };

const width = 48;
const jaw = (width * 30) / 76;
const angles = { top: 0, right: 90, bottom: 180, left: -90 };

// Height (CSS px) of a whole clip above what it lies on: loose (its loops bow
// off the surface), or carried.
const resting = 6,
  carried = 16;

// Re-aim every shadow of a clip at the desk light after it turns or lifts.
const aim = (element: SVGSVGElement, height?: number) => {
  const desk = element.querySelector<SVGFilterElement>(
    `filter[id="${element.dataset.gemDeskShadow}"]`,
  );

  if (height !== undefined) setRayShadowHeight(desk, height, element);

  element
    .querySelectorAll<SVGFilterElement>("filter[data-ray-shadow]")
    .forEach((filter) => {
      if (filter !== desk) updateRayShadow(filter);
    });

  if (desk && height === undefined) updateRayShadow(desk, element);
};

export function initializePaperClips(canvas: HTMLElement) {
  if (canvas.dataset.clipsReady) return;
  canvas.dataset.clipsReady = "true";

  const owned = <T extends Element>(selector: string) =>
    [...canvas.querySelectorAll<T>(selector)].filter(
      (el) => el.closest("[data-desk-canvas]") === canvas,
    );

  const surfaces = owned<HTMLElement>("[data-clip-surface]");
  const surfaceKeys = new Map<HTMLElement, string>();
  const counts = new Map<string, number>();

  const key = (element: Element, kind: string) => {
    const owner =
      element.closest<HTMLElement>("[data-movable-id]")?.dataset.movableId ??
      "desk";

    const group = `${owner}:${kind}`,
      index = counts.get(group) ?? 0;

    counts.set(group, index + 1);
    return `${group}:${index}`;
  };

  surfaces.forEach((surface) => {
    const generated = key(surface, "paper");

    // Preserve folder attachment identities when the two faces change DOM order.
    const stable =
      surface.closest("[data-movable-id]") && surface.dataset.clipSurfaceKey;

    surfaceKeys.set(
      surface,
      stable ? generated.replace(/\d+$/, stable) : generated,
    );
  });

  const snapshot = (element: SVGSVGElement): Snapshot => ({
    parent: element.parentNode!,
    next: element.nextSibling,
    classes: element.getAttribute("class") ?? "",
    style: element.getAttribute("style"),
    mounted: element.dataset.mounted === "true",
    binds: element.dataset.binds,
    home: element.dataset.bindHome,
    view: element.dataset.stackView,
    layered: element.dataset.deskLayer !== undefined,
  });

  // Loose on the desk, a clip has its own layer; mounted, it rides its sheet's.
  const layered = (element: SVGSVGElement, z: number | undefined) => {
    if (z !== undefined && Number.isFinite(z)) {
      element.style.zIndex = String(z);
      element.dataset.deskLayer = "";
    } else delete element.dataset.deskLayer;
  };

  const bind = (
    element: SVGSVGElement,
    ids: string[] | undefined,
    home?: string,
  ) => {
    const before = element.dataset.binds;

    if (ids?.length && home) {
      element.dataset.binds = ids.join(" ");
      element.dataset.bindHome = home;
    } else {
      delete element.dataset.binds;
      delete element.dataset.bindHome;
    }

    // A clip can join a sheet to a magnet-held (pinned) stack: let the desk know.
    if (before !== element.dataset.binds)
      canvas.dispatchEvent(new CustomEvent("desk:holds-changed"));
  };

  /** Re-seated on top of its stack: which of its sides shows (see reseat). */
  const showSide = (element: SVGSVGElement, view: string | undefined) => {
    if (view) element.dataset.stackView = view;
    else delete element.dataset.stackView;
  };

  const clips: Clip[] = owned<SVGSVGElement>("[data-gem-clip]").map(
    (element) => ({
      element,
      key: key(element, "gem"),
      initial: snapshot(element),
    }),
  );

  const storageKey = `${canvas.dataset.storageKey}:clips`;
  let saved: Record<string, Placement> = {};
  let scrollFrame = 0;

  let active: {
    clip: Clip;
    before: Snapshot;
    pointer: number | null;
    x: number;
    y: number;
    startX: number;
    startY: number;
    started: boolean;
    target: Target | null;
  } | null = null;

  const announce = (text: string) => {
    const live = canvas.querySelector("[data-desk-announcement]");
    if (live) live.textContent = text;
  };

  const mounted = (element: SVGSVGElement, value: boolean) => {
    element.dataset.mounted = String(value);
    const rear = element.querySelector("[data-gem-rear]");

    if (value)
      rear?.setAttribute("clip-path", `url(#${element.dataset.gemMask})`);
    else rear?.removeAttribute("clip-path");

    const front = element.querySelector<SVGGElement>("[data-gem-front]");
    if (front) front.style.display = value ? "" : "none";
  };

  const restore = (clip: Clip, before: Snapshot) => {
    before.parent.insertBefore(
      clip.element,
      before.next?.parentNode === before.parent ? before.next : null,
    );

    clip.element.setAttribute("class", before.classes);

    if (before.style === null) clip.element.removeAttribute("style");
    else clip.element.setAttribute("style", before.style);

    mounted(clip.element, before.mounted);

    if (before.layered) clip.element.dataset.deskLayer = "";
    else delete clip.element.dataset.deskLayer;

    bind(clip.element, before.binds?.split(" "), before.home);
    showSide(clip.element, before.view);
    aim(clip.element, resting);
  };

  const prepare = (element: SVGSVGElement) => {
    element.setAttribute(
      "class",
      "pointer-events-auto absolute block overflow-visible touch-none cursor-grab select-none outline-none focus-visible:opacity-80",
    );

    element.removeAttribute("style");
    element.style.width = `${width}px`;
    element.style.height = `${(width * 140) / 76}px`;
    element.style.zIndex = "1000001";
  };

  const folderEdges = new Map<HTMLElement, SVGPathElement>();

  const folderClipLayers = new Map<
    HTMLElement,
    { open: HTMLElement; closed: HTMLElement }
  >();

  for (const surface of surfaces) {
    if (!surface.matches("[data-folder-leaf]")) continue;

    const outline = surface.querySelector<SVGPathElement>(
      "[data-folder-exterior] [data-folder-stock] g > path",
    );

    if (outline) folderEdges.set(surface, outline);

    const layer = (inside: boolean) => {
      const plane = document.createElement("div");
      plane.dataset.folderClipLayer = inside ? "inside" : "outside";

      // Keep the leaf's attachment coordinates on both faces. The inside face
      // is reversed, so mirror its clip layer back into physical leaf space.
      plane.className = inside
        ? "pointer-events-none absolute inset-0 z-[1000002] -scale-x-100"
        : "pointer-events-none absolute inset-0 z-[1000002]";

      surface
        .querySelector(
          inside ? "[data-folder-inside]" : "[data-folder-exterior]",
        )!
        .append(plane);

      return plane;
    };

    folderClipLayers.set(surface, { open: layer(true), closed: layer(false) });
  }

  const mountOnFolderFace = (element: SVGSVGElement, surface: HTMLElement) => {
    const layers = folderClipLayers.get(surface);
    if (!layers) return;

    const plane =
      surface.dataset.leafFacing === "open" ? layers.open : layers.closed;

    if (element.parentElement !== plane) {
      plane.append(element);
      aim(element);
    }
  };

  // A clip is part of its paper face, not an independently depth-sorted SVG
  // floating above both covers. Switch faces only at the edge-on midpoint;
  // the same clip and physical leaf remain attached throughout the fold.
  const clipFaces = new MutationObserver((records) => {
    for (const { target } of records) {
      const leaf = target as HTMLElement;

      for (const { element } of clips) {
        if (
          element.parentElement?.matches("[data-folder-clip-layer]") &&
          element.closest("[data-folder-leaf]") === leaf
        )
          mountOnFolderFace(element, leaf);
      }
    }
  });

  for (const leaf of folderClipLayers.keys())
    clipFaces.observe(leaf, {
      attributes: true,
      attributeFilter: ["data-leaf-facing"],
    });

  const sideEdge = (
    surface: HTMLElement,
    edge: "left" | "right",
    y: number,
  ) => {
    const outline = folderEdges.get(surface);
    if (!outline) return edge === "left" ? 0 : 1;

    // The exterior SVG is mirrored into leaf coordinates. Intersect its real
    // die-cut outline, including the inset front and the projecting rear tab.
    let inside = 0.5,
      outside = edge === "left" ? -0.1 : 1.1;

    for (let i = 0; i < 18; i++) {
      const x = (inside + outside) / 2;

      if (outline.isPointInFill(new DOMPoint((1 - x) * 1000, y * 1000)))
        inside = x;
      else outside = x;
    }

    return (inside + outside) / 2;
  };

  // A leaf's spine side is a fold in continuous stock, not a free paper edge:
  // a clip there would be buried in the hinge once the folder closes.
  const hinged = (surface: HTMLElement, edge: Edge) =>
    surface.dataset.folderLeaf === edge;

  // Attachments stay on their physical paper/leaf. Closing the opposite leaf
  // must not transplant an interior clip onto the outside of the back cover.
  const place = (clip: Clip, placement: Placement) => {
    let surface = surfaces.find(
      (surface) => surfaceKeys.get(surface) === placement.surface,
    );

    if (placement.surface && !surface) return false;

    // Recover attachments saved against the old full-spread backing without
    // discarding the visitor's other clip placements.
    if (surface?.hasAttribute("data-folder-board")) {
      const side = placement.x < 0.5 ? "left" : "right";

      surface =
        surface
          .closest("[data-work-folder]")
          ?.querySelector<HTMLElement>(`[data-folder-leaf="${side}"]`) ??
        undefined;

      if (!surface) return false;
      placement.surface = surfaceKeys.get(surface)!;
      placement.x = side === "left" ? 1 - 2 * placement.x : 2 - 2 * placement.x;

      if (placement.edge === "left" || placement.edge === "right")
        placement.edge = placement.edge === "left" ? "right" : "left";
    }

    if (surface && hinged(surface, placement.edge)) return false;

    if (
      surface &&
      folderEdges.has(surface) &&
      (placement.edge === "left" || placement.edge === "right")
    ) {
      placement.x = sideEdge(surface, placement.edge, placement.y);
    }

    const element = clip.element;
    prepare(element);
    (surface ?? canvas).append(element);
    element.style.left = `${placement.x * 100}%`;
    element.style.top = `${placement.y * 100}%`;
    element.style.transformOrigin = `50% ${jaw}px`;
    element.style.transform = `translate(-50%, -${jaw}px) rotate(${surface ? angles[placement.edge] : -12}deg)`;

    // Lying loose it casts its own shadow.
    element.style.filter = surface
      ? ""
      : `url(#${element.dataset.gemDeskShadow})`;

    if (surface) layered(element, undefined);
    else if (placement.z !== undefined) layered(element, placement.z);
    else {
      element.style.removeProperty("z-index");
      layered(element, undefined);
    }

    mounted(element, !!surface);

    bind(
      element,
      surface ? placement.binds : undefined,
      surface?.closest<HTMLElement>("[data-movable-item]")?.dataset.movableId,
    );

    showSide(element, undefined);
    if (surface) mountOnFolderFace(element, surface);
    aim(element, resting);
    return true;
  };

  try {
    const data: unknown = JSON.parse(
      localStorage.getItem(storageKey) ?? "null",
    );

    if (data && typeof data === "object") {
      for (const clip of clips) {
        const p = (data as Record<string, Placement>)[clip.key];

        if (
          p &&
          [p.x, p.y].every(Number.isFinite) &&
          (p.surface === null ||
            (p.x >= -0.1 && p.x <= 1.1 && p.y >= 0 && p.y <= 1)) &&
          Object.hasOwn(angles, p.edge) &&
          (p.surface === null || typeof p.surface === "string")
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
          if (place(clip, p)) saved[clip.key] = p;
        }
      }
    }
  } catch {
    /* Optional per-visitor persistence. */
  }

  function syncFolderClips(folder: HTMLElement) {
    for (const clip of clips) {
      if (active?.clip === clip) continue;
      const placement = saved[clip.key];

      const surface = placement
        ? surfaces.find(
            (surface) => surfaceKeys.get(surface) === placement.surface,
          )
        : clip.initial.parent instanceof Element
          ? clip.initial.parent.closest<HTMLElement>("[data-clip-surface]")
          : null;

      if (surface?.closest("[data-work-folder]") !== folder) continue;

      if (placement) place(clip, placement);
      else {
        restore(clip, clip.initial);
        surface.append(clip.element);
        mountOnFolderFace(clip.element, surface);
      }
    }
  }

  const folders = owned<HTMLElement>("[data-work-folder]");
  folders.forEach(syncFolderClips);

  canvas.addEventListener("desk:folder-toggle", (event) => {
    if (event.target instanceof HTMLElement && folders.includes(event.target))
      syncFolderClips(event.target);
  });

  // Three zero-sized probes give a local coordinate system even on rotated papers.
  const probes = new Map<HTMLElement, HTMLElement[]>();

  for (const surface of surfaces) {
    const points = [
      [0, 0],
      [100, 0],
      [0, 100],
    ].map(([x, y]) => {
      const point = document.createElement("span");
      point.setAttribute("aria-hidden", "true");

      Object.assign(point.style, {
        position: "absolute",
        left: `${x}%`,
        top: `${y}%`,
        width: "0",
        height: "0",
        pointerEvents: "none",
      });

      surface.append(point);
      return point;
    });

    probes.set(surface, points);
  }

  function targetAt(x: number, y: number): Target | null {
    const hit = document
      .elementsFromPoint(x, y)
      .find((el) => el.closest("[data-movable-item]"))
      ?.closest("[data-movable-item]");

    const targets: Target[] = [];

    for (const surface of surfaces) {
      if (
        !surface.getClientRects().length ||
        surface.closest("[hidden],[inert]")
      )
        continue;

      // The hinge backing is not a sheet. Overlapping closed leaves also have
      // nearly identical edges, so distance alone can attach behind the cover.
      if (surface.hasAttribute("data-folder-board")) continue;
      const folder = surface.closest<HTMLElement>("[data-work-folder]");

      if (folder) {
        if (folder.dataset.animating === "true") continue;
        const leaf = surface.closest<HTMLElement>("[data-folder-leaf]");

        if (
          folder.dataset.folderFacing === "closed" &&
          leaf?.dataset.folderLeaf !== folder.dataset.foldSide
        )
          continue;
      }

      if (getComputedStyle(surface).visibility !== "visible") continue;

      const [o, a, b] = probes
        .get(surface)!
        .map((point) => point.getBoundingClientRect());

      const ax = a!.x - o!.x,
        ay = a!.y - o!.y,
        bx = b!.x - o!.x,
        by = b!.y - o!.y;

      const determinant = ax * by - ay * bx;
      if (Math.abs(determinant) < 1) continue;
      const u = ((x - o!.x) * by - (y - o!.y) * bx) / determinant;
      const v = (ax * (y - o!.y) - ay * (x - o!.x)) / determinant;

      const w = Math.hypot(ax, ay),
        h = Math.hypot(bx, by);

      if (u < -42 / w || u > 1 + 42 / w || v < -42 / h || v > 1 + 42 / h)
        continue;

      const edgeY = Math.max(0.001, Math.min(0.999, v));

      const left = sideEdge(surface, "left", edgeY),
        right = sideEdge(surface, "right", edgeY);

      const edges: [Edge, number][] = [
        ["top", Math.abs(v) * h],
        ["right", Math.abs(right - u) * w],
        ["bottom", Math.abs(1 - v) * h],
        ["left", Math.abs(u - left) * w],
      ];

      const [edge, distance] = edges
        .filter(([edge]) => !hinged(surface, edge))
        .sort((a, b) => a[1] - b[1])[0]!;

      if (distance > 42) continue;

      const insetX = Math.min(0.25, width / 2 / w),
        insetY = Math.min(0.25, width / 2 / h);

      targets.push({
        surface,
        distance,
        placement: {
          surface: surfaceKeys.get(surface)!,
          edge,
          x:
            edge === "left"
              ? left
              : edge === "right"
                ? right
                : Math.max(insetX, Math.min(1 - insetX, u)),
          y:
            edge === "top"
              ? 0
              : edge === "bottom"
                ? 1
                : Math.max(insetY, Math.min(1 - insetY, v)),
        },
      });
    }

    targets.sort(
      (a, b) =>
        Number(b.surface.closest("[data-movable-item]") === hit) -
          Number(a.surface.closest("[data-movable-item]") === hit) ||
        a.distance - b.distance,
    );

    return targets[0] ?? null;
  }

  /** Every other sheet the clip actually holds. Like a real clip, a sheet is
   * held only if its edge lies inside the clip's mouth: it is under the arms
   * (from just inside the clipped edge to 24px in, across the clip's width)
   * and it does not carry on past that edge, where the bend wraps. A sheet
   * that runs on beyond the bend is not held: the back arm merely slides
   * between the sheets, and the clip is covered or not by ordinary stacking.
   * The folder folds in 3D and is never held; a sheet clipped to it is not
   * carried with it. */
  function gripped(surface: HTMLElement, placement: Placement) {
    const owner = surface.closest<HTMLElement>("[data-movable-item]");

    if (!owner || surface.closest("[data-work-folder]") || !probes.has(surface))
      return [];

    const [o, a, b] = probes
      .get(surface)!
      .map((point) => point.getBoundingClientRect());

    const w = Math.hypot(a!.x - o!.x, a!.y - o!.y),
      h = Math.hypot(b!.x - o!.x, b!.y - o!.y);

    if (w < 1 || h < 1) return [];

    // Local unit steps: inward from the edge, and along it.
    const vertical = placement.edge === "left" || placement.edge === "right";

    const inward =
      placement.edge === "left"
        ? [1 / w, 0]
        : placement.edge === "right"
          ? [-1 / w, 0]
          : placement.edge === "top"
            ? [0, 1 / h]
            : [0, -1 / h];

    const along = vertical ? [0, 1 / h] : [1 / w, 0];

    const sheetsAt = (depth: number, side: number) => {
      const u = placement.x + inward[0]! * depth + along[0]! * side,
        v = placement.y + inward[1]! * depth + along[1]! * side;

      const x = o!.x + u * (a!.x - o!.x) + v * (b!.x - o!.x),
        y = o!.y + u * (a!.y - o!.y) + v * (b!.y - o!.y);

      const ids = new Set<string>();

      for (const element of document.elementsFromPoint(x, y)) {
        if (
          element.closest("[data-hardware]") ||
          !element.closest("[data-clip-surface]")
        )
          continue;

        const item = element.closest<HTMLElement>("[data-movable-item]");

        if (
          !item ||
          item === owner ||
          item.closest("[data-desk-canvas]") !== canvas ||
          item.querySelector("[data-work-folder]")
        )
          continue;

        ids.add(item.dataset.movableId!);
      }

      return ids;
    };

    const under = new Set<string>(),
      beyond = new Set<string>();

    for (const side of [-6, 0, 6]) {
      for (const depth of [6, 14, 24])
        sheetsAt(depth, side).forEach((id) => under.add(id));

      // Past the clipped edge, under the bend (a few px of misalignment is fine).
      for (const depth of [-5, -10])
        sheetsAt(depth, side).forEach((id) => beyond.add(id));
    }

    return [...under].filter((id) => !beyond.has(id));
  }

  function move(x: number, y: number) {
    if (!active) return;
    active.x = x;
    active.y = y;

    if (!active.started && Math.hypot(x - active.startX, y - active.startY) < 4)
      return;

    const element = active.clip.element;

    if (!active.started) {
      active.started = true;
      prepare(element);
      document.body.append(element);

      Object.assign(element.style, {
        position: "fixed",
        zIndex: "2147483646",
        pointerEvents: "none",
        cursor: "grabbing",
        filter: `url(#${element.dataset.gemDeskShadow})`,
        transform: `translate(-50%, -${jaw}px) rotate(-12deg)`,
      });

      mounted(element, false);

      // Lifting the clip off releases whatever it held together.
      bind(element, undefined);
      showSide(element, undefined);
      aim(element, carried);
      if (active.pointer !== null) element.setPointerCapture(active.pointer);

      if (active.pointer !== null)
        scrollFrame = requestAnimationFrame(autoScroll);
    }

    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
    if (active.target) delete active.target.surface.dataset.clipTarget;
    active.target = targetAt(x, y);
    if (active.target) active.target.surface.dataset.clipTarget = "true";
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
    if (current.target) delete current.target.surface.dataset.clipTarget;

    if (
      current.pointer !== null &&
      current.clip.element.hasPointerCapture(current.pointer)
    )
      current.clip.element.releasePointerCapture(current.pointer);

    if (!current.started) return;

    if (cancel) {
      restore(current.clip, current.before);
      announce("Paper clip move cancelled.");
      return;
    }

    const rect = canvas.getBoundingClientRect();

    const p: Placement = current.target?.placement ?? {
      surface: null,
      edge: "top",
      // Anywhere, off the screen too.
      x: (current.x - rect.left) / rect.width,
      y: (current.y - rect.top) / rect.height,
    };

    if (current.target) p.binds = gripped(current.target.surface, p);
    if (!p.binds?.length) delete p.binds;
    place(current.clip, p);

    // Put down loose, it lies on top of what is there now, under what comes later.
    if (!current.target) {
      canvas.dispatchEvent(
        new CustomEvent("desk:lay", { detail: current.clip.element }),
      );

      p.z = Number(current.clip.element.style.zIndex);
    }

    saved[current.clip.key] = p;

    try {
      localStorage.setItem(storageKey, JSON.stringify(saved));
    } catch {
      /* Still usable without storage. */
    }

    reseat();

    const owner = current.target?.surface.closest<HTMLElement>(
      "[data-movable-item]",
    );

    if (owner)
      canvas.dispatchEvent(new CustomEvent("desk:raise", { detail: owner }));

    current.clip.element.focus({ preventScroll: true });

    const held = (p.binds ?? [])
      .map((id) =>
        canvas
          .querySelector(`[data-movable-id="${id}"]`)
          ?.getAttribute("aria-label"),
      )
      .filter(Boolean);

    announce(
      owner
        ? `Paper clip attached to ${owner.getAttribute("aria-label")}${held.length ? `, clipping it together with ${held.join(" and ")}` : ""}.`
        : current.target
          ? "Paper clip attached."
          : "Paper clip left on the desk.",
    );
  }

  /** A clip wraps the edge of the whole stack it binds, so it always shows
   * above the stack's top sheet. When its home sheet is not on top (it was
   * clipped from underneath, or the stack was turned over), seat it on the top
   * sheet at exactly the same place on screen, showing the side that faces
   * up: its front arm, or its back arm when its home sheet lies face-down. */
  const homeOf = (clip: Clip) => {
    const p = saved[clip.key];
    if (active?.clip === clip || !p?.surface || !p.binds?.length) return null;

    const home = surfaces.find(
      (surface) => surfaceKeys.get(surface) === p.surface,
    );

    const item = home?.closest<HTMLElement>("[data-movable-item]");
    return home && item ? { p, home, item } : null;
  };

  const stacked = (item: HTMLElement) =>
    clippedUnit(canvas, item).sort(
      (a, b) =>
        Number(getComputedStyle(a).zIndex) - Number(getComputedStyle(b).zIndex),
    );

  const faceDown = (home: HTMLElement, item: HTMLElement) =>
    item.dataset.turnedOver === "true" ||
    !!home.closest('[data-map-sheet][data-facing="back"]');

  /** Where a clip, as now drawn, sits in `top`'s own coordinates (all at rest). */
  const seatOn = (element: SVGSVGElement, top: HTMLElement) => {
    const surface = top.querySelector<HTMLElement>("[data-clip-surface]");
    const screen = element.getScreenCTM();
    if (!surface || !screen || !probes.has(surface)) return null;

    const [o, a, b] = probes
      .get(surface)!
      .map((point) => point.getBoundingClientRect());

    const style = getComputedStyle(surface),
      w = parseFloat(style.width) || 1,
      h = parseFloat(style.height) || 1;

    const frame = new DOMMatrix([
      (a!.x - o!.x) / w,
      (a!.y - o!.y) / w,
      (b!.x - o!.x) / h,
      (b!.y - o!.y) / h,
      o!.x,
      o!.y,
    ]);

    // Clip user units → the top sheet's local px, reproducing its place on screen.
    return {
      surface,
      transform: frame
        .inverse()
        .multiply(screen)
        .scale(76 / width)
        .toString(),
    };
  };

  const sit = (
    element: SVGSVGElement,
    seat: { surface: HTMLElement; transform: string },
    view: string,
  ) => {
    seat.surface.append(element);

    Object.assign(element.style, {
      left: "0",
      top: "0",
      transformOrigin: "0 0",
      transform: seat.transform,
    });

    showSide(element, view);
    aim(element);
  };

  function reseat() {
    for (const clip of clips) {
      const found = homeOf(clip);
      if (!found) continue;
      const { p, home, item } = found;
      const top = stacked(item).at(-1)!;
      const element = clip.element;
      const view = faceDown(home, item) ? "reverse" : "obverse";

      if (top === item) {
        if (
          element.closest("[data-movable-item]") !== item ||
          element.dataset.stackView
        )
          place(clip, p);

        continue;
      }

      if (
        element.closest("[data-movable-item]") === top &&
        element.dataset.stackView === view
      )
        continue;

      if (
        element.closest("[data-movable-item]") !== item ||
        element.dataset.stackView
      )
        place(clip, p);

      const seat = seatOn(element, top);
      if (seat) sit(element, seat, view);
    }
  }

  // Turning a stack over: plan each binding clip's seat while all is at rest,
  // and hand it over at the half-turn, when the stack's order reverses, so it
  // rides the turn on whichever sheet is on top and never pops in afterwards.
  let handover: (() => void)[] = [];

  canvas.addEventListener("desk:turn-start", (event) => {
    const stack = (event as CustomEvent<{ stack: HTMLElement[] }>).detail.stack;
    handover = [];

    for (const clip of clips) {
      const found = homeOf(clip);
      if (!found || !stack.includes(found.item)) continue;
      const { p, home, item } = found;
      const order = stacked(item);
      const next = order[0]!;
      const view = faceDown(home, item) ? "obverse" : "reverse";

      // Everything is at rest: take its seat on the next top sheet from its
      // home place, then put it back where it is now.
      const element = clip.element;

      const current =
        element.closest("[data-movable-item]") === item &&
        !element.dataset.stackView
          ? null
          : {
              at: element.closest<HTMLElement>("[data-movable-item]")!,
              view: element.dataset.stackView,
            };

      if (current) place(clip, p);
      const seat = next === item ? null : seatOn(element, next);

      if (current) {
        const back = seatOn(element, current.at);
        if (back) sit(element, back, current.view ?? "obverse");
      }

      // Going home mid-turn: aim it as it will rest when the turn settles, not
      // from the edge-on frame of the half-turn.
      if (next === item)
        handover.push(() => {
          place(clip, p);

          element
            .querySelectorAll<SVGFilterElement>("filter[data-ray-shadow]")
            .forEach((filter) => updateRayShadow(filter, null, false, true));
        });
      else if (seat) handover.push(() => sit(element, seat, view));
    }
  });

  canvas.addEventListener("desk:restack", () => {
    handover.forEach((run) => run());
    handover = [];
  });

  // Bindings saved under an older, looser rule: re-check them against the
  // real-world one once the desk has laid out, releasing sheets not truly held.
  let checked = false;

  const recheck = () => {
    if (checked) return;
    checked = true;
    let changed = false;

    for (const clip of clips) {
      const p = saved[clip.key];
      if (!p?.surface || !p.binds?.length) continue;

      const home = surfaces.find(
        (surface) => surfaceKeys.get(surface) === p.surface,
      );

      const item = home?.closest<HTMLElement>("[data-movable-item]");

      // Which sheets lie inside the mouth and past the edge reads the same from either side.
      if (!home || !item) continue;

      if (
        clip.element.closest("[data-movable-item]") !== item ||
        clip.element.dataset.stackView
      )
        place(clip, p);

      const held = gripped(home, p).filter((id) => p.binds!.includes(id));

      if (held.length !== p.binds.length) {
        changed = true;

        if (held.length) p.binds = held;
        else delete p.binds;

        place(clip, p);
      }
    }

    if (changed)
      try {
        localStorage.setItem(storageKey, JSON.stringify(saved));
      } catch {
        /* Optional persistence. */
      }
  };

  // Stacks settle after turning over, flipping, folding or loading.
  canvas.addEventListener("desk:settled", () => {
    recheck();
    reseat();
  });

  let reseatFrame = 0;

  window.addEventListener("resize", () => {
    cancelAnimationFrame(reseatFrame);
    reseatFrame = requestAnimationFrame(reseat);
  });

  canvas.addEventListener(
    "pointerdown",
    (event) => {
      const element =
        event.target instanceof Element
          ? event.target.closest("[data-gem-clip]")
          : null;

      const clip = clips.find((clip) => clip.element === element);
      if (!clip || event.button !== 0 || !event.isPrimary) return;
      event.preventDefault();
      event.stopPropagation();
      if (active) finish(true);

      active = {
        clip,
        before: snapshot(clip.element),
        pointer: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        startX: event.clientX,
        startY: event.clientY,
        started: false,
        target: null,
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

  // A clip click must never turn a map over, close a folder, or follow a link.
  const stopClick = (event: MouseEvent) => {
    if (
      event.target instanceof Element &&
      clips.some((clip) => clip.element.contains(event.target as Node))
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  };

  canvas.addEventListener("click", stopClick, true);

  canvas.addEventListener("dragstart", (event) => {
    if (
      event.target instanceof Element &&
      event.target.closest("[data-gem-clip]")
    )
      event.preventDefault();
  });

  window.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "Escape" && active) {
        event.preventDefault();
        finish(true);
        return;
      }

      const clip = clips.find((clip) => clip.element === event.target);
      if (!clip) return;

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        event.stopPropagation();

        if (active) finish();
        else {
          const rect = clip.element.getBoundingClientRect();

          const x = rect.x + rect.width / 2,
            y = rect.y + jaw;

          active = {
            clip,
            before: snapshot(clip.element),
            pointer: null,
            x,
            y,
            startX: x,
            startY: y,
            started: false,
            target: null,
          };

          move(x + 5, y);
          clip.element.focus({ preventScroll: true });

          announce(
            "Paper clip picked up. Use arrow keys, then Enter to put down; Escape to cancel.",
          );
        }
      } else if (active?.clip === clip && active.pointer === null) {
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

  canvas.querySelector("[data-desk-reset]")?.addEventListener("click", () => {
    finish(true);
    clips.forEach((clip) => restore(clip, clip.initial));
    saved = {};
    folders.forEach(syncFolderClips);

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
