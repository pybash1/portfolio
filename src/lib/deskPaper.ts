// Turning sheets over
import { clippedUnit } from "./deskUnits";
import { aimRayShadowsWithin, lightingTransform, toScreen } from "./rayShadow";

/** Turning a clipped stack over. When the map flips, everything clipped to it
 * turns over with it about the same axis: each sheet is reflected across the
 * map's flip axis (animated as a turn, in step with the map's own angle), its
 * back comes up, and the stack's order reverses at the half-turn. A sheet left
 * face-down after unclipping turns over on its own when clicked.
 *
 * Each sheet keeps a `transform` in its own centred coordinates; drag
 * positions (`translate`) and authored tilt (`rotate`) are untouched. */
type Turn = { m: number[]; back: boolean };

type Member = {
  item: HTMLElement;
  from: DOMMatrix;
  frame: DOMMatrix;
  back: boolean;
};

type Vec = { x: number; y: number };

export function initializeTurnover(canvas: HTMLElement) {
  if (canvas.dataset.turnoverReady) return;
  canvas.dataset.turnoverReady = "true";
  const storageKey = `${canvas.dataset.storageKey}:turns`;
  let turns: Record<string, Turn> = {};
  const turning = new Set<HTMLElement>();

  // Zero-sized probes give the item's full on-screen frame (with any turn applied).
  const probes = new WeakMap<HTMLElement, HTMLElement[]>();

  /** Centred local px → screen px, for the item as currently drawn. */
  const frameOf = (item: HTMLElement) => {
    let points = probes.get(item);

    if (!points) {
      points = [
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

        item.append(point);
        return point;
      });

      probes.set(item, points);
    }

    const [o, a, b] = points.map((point) => point.getBoundingClientRect());
    const [w, h] = sizeOf(item);

    const m = new DOMMatrix([
      (a!.x - o!.x) / w,
      (a!.y - o!.y) / w,
      (b!.x - o!.x) / h,
      (b!.y - o!.y) / h,
      o!.x,
      o!.y,
    ]);

    return m.translate(w / 2, h / 2);
  };

  // Exact layout size: offsetWidth rounds to whole pixels and skews the frame.
  const sizeOf = (item: HTMLElement) => {
    const style = getComputedStyle(item);

    return [
      parseFloat(style.width) || 1,
      parseFloat(style.height) || 1,
    ] as const;
  };

  const turnOf = (item: HTMLElement) => {
    const value = item.style.transform;
    return value && value !== "none" ? new DOMMatrix(value) : new DOMMatrix();
  };

  /** A sheet's back: its own paper (colour, torn edge, grain), without the print. */
  const ensureBack = (item: HTMLElement) => {
    if (item.querySelector("[data-turn-back]")) return;
    const surface = item.querySelector<HTMLElement>("[data-clip-surface]");

    const backing = surface?.querySelector<HTMLElement>(
      ":scope > [data-paper-backing]",
    );

    if (!surface || !backing) return;
    const back = backing.cloneNode(true) as HTMLElement;
    back.removeAttribute("data-paper-backing");
    back.removeAttribute("data-ray-caster");
    back.dataset.turnBack = "";
    back.classList.remove("pointer-events-none");
    backing.after(back);
  };

  const showBack = (item: HTMLElement, back: boolean) => {
    if (back) {
      ensureBack(item);
      item.dataset.turnedOver = "true";
    } else delete item.dataset.turnedOver;
  };

  const save = () => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(turns));
    } catch {
      /* Optional persistence. */
    }
  };

  const record = (item: HTMLElement) => {
    const m = turnOf(item),
      [w, h] = sizeOf(item);

    const back = item.dataset.turnedOver === "true";

    // Turned and turned back lands where it began; drop measurement rounding.
    const identity =
      [m.a - 1, m.b, m.c, m.d - 1].every((v) => Math.abs(v) < 2e-3) &&
      Math.hypot(m.e, m.f) < 0.5;

    if (identity && !back) {
      item.style.removeProperty("transform");
      delete turns[item.dataset.movableId!];
    } else
      turns[item.dataset.movableId!] = {
        m: [m.a, m.b, m.c, m.d, m.e / w, m.f / h],
        back,
      };
  };

  const restore = () => {
    for (const item of canvas.querySelectorAll<HTMLElement>(
      "[data-movable-item]",
    )) {
      const turn = turns[item.dataset.movableId!];

      if (!turn) {
        item.style.removeProperty("transform");
        showBack(item, false);
        continue;
      }

      const [a, b, c, d, e, f] = turn.m;
      const [w, h] = sizeOf(item);

      item.style.transform = new DOMMatrix([
        a!,
        b!,
        c!,
        d!,
        e! * w,
        f! * h,
      ]).toString();

      showBack(item, turn.back);
    }
  };

  try {
    const data: unknown = JSON.parse(
      localStorage.getItem(storageKey) ?? "null",
    );

    if (data && typeof data === "object")
      for (const [id, turn] of Object.entries(data as Record<string, Turn>)) {
        if (
          Array.isArray(turn?.m) &&
          turn.m.length === 6 &&
          turn.m.every(Number.isFinite) &&
          typeof turn.back === "boolean"
        )
          turns[id] = turn;
      }
  } catch {
    /* Optional per-visitor persistence. */
  }

  restore();

  // Let clips re-seat on top of restored stacks once the layout has settled.
  requestAnimationFrame(() =>
    canvas.dispatchEvent(new CustomEvent("desk:settled")),
  );

  /** Turn `members` over about the screen line through `point` along `axis`,
   * as a real 3D turn seen with `perspective` px of depth (as the map is).
   * `progress()` gives the signed turn angle so far in radians (0 → ±π), or
   * null when done. */
  function turnOver(
    members: HTMLElement[],
    stack: HTMLElement[],
    point: Vec,
    axis: Vec,
    perspective: number,
    progress: () => number | null,
  ) {
    const length = Math.hypot(axis.x, axis.y) || 1;

    const d = { x: axis.x / length, y: axis.y / length },
      n = { x: -d.y, y: d.x };

    const state: Member[] = members.map((item) => ({
      item,
      from: turnOf(item),
      frame: frameOf(item),
      back: item.dataset.turnedOver === "true",
    }));

    // Still at rest: hardware riding the stack can plan its hand-over now.
    canvas.dispatchEvent(
      new CustomEvent("desk:turn-start", { detail: { stack, point, axis } }),
    );

    members.forEach((item) => {
      turning.add(item);
      item.dataset.turning = "";
    });

    let under = false;

    const about = (m: DOMMatrix) =>
      new DOMMatrix()
        .translate(point.x, point.y)
        .multiply(m)
        .translate(-point.x, -point.y);

    // At rest, a half-turn about an in-plane axis is an exact mirror across it.
    const mirror = about(
      new DOMMatrix([
        1 - 2 * n.x * n.x,
        -2 * n.x * n.y,
        -2 * n.x * n.y,
        1 - 2 * n.y * n.y,
        0,
        0,
      ]),
    );

    const depth = new DOMMatrix([
      1,
      0,
      0,
      0,
      0,
      1,
      0,
      0,
      0,
      0,
      1,
      -1 / perspective,
      0,
      0,
      0,
      1,
    ]);

    const spin = (angle: number) =>
      new DOMMatrix().rotateAxisAngle(d.x, d.y, 0, (angle * 180) / Math.PI);

    const turned = (angle: number) => about(depth.multiply(spin(angle)));

    const step = () => {
      const angle = progress();
      const cos = angle === null ? (under ? -1 : 1) : Math.cos(angle);

      canvas.dispatchEvent(
        new CustomEvent("desk:turn-progress", { detail: { cos } }),
      );

      const screen =
        angle === null ? (under ? mirror : new DOMMatrix()) : turned(angle);

      // In each sheet's own frame: X = X0 · A⁻¹ · S · A (A its frame on screen).
      const lit = angle === null ? null : about(spin(angle));

      for (const { item, from, frame, back } of state) {
        item.style.transform = from
          .multiply(frame.inverse().multiply(screen).multiply(frame))
          .toString();

        if (lit)
          lightingTransform.set(
            item,
            from.multiply(frame.inverse().multiply(lit).multiply(frame)),
          );
        else lightingTransform.delete(item);

        showBack(item, back !== cos < 0);
      }

      // Shadows on a turning sheet follow the light every frame, from whichever
      // side faces up, so they arrive at their resting aim without a snap.
      for (const { item } of state) aimRayShadowsWithin(item, true);

      if (cos < 0 !== under) {
        under = cos < 0;

        // Turned over, the bottom sheet comes up on top.
        const order = [...stack]
          .sort(
            (a, b) =>
              Number(getComputedStyle(a).zIndex) -
              Number(getComputedStyle(b).zIndex),
          )
          .reverse();

        canvas.dispatchEvent(
          new CustomEvent("desk:restack", { detail: order }),
        );
      }

      if (angle !== null) {
        requestAnimationFrame(step);
        return;
      }

      members.forEach((item) => {
        turning.delete(item);
        delete item.dataset.turning;
        aimRayShadowsWithin(item);
        record(item);
      });

      save();
      canvas.dispatchEvent(new CustomEvent("desk:settled"));
    };

    step();
  }

  // The map turns about its own vertical centre line; whatever is clipped to it turns with it.
  canvas.addEventListener("desk:flip", (event) => {
    const sheet = event.target instanceof HTMLElement ? event.target : null;
    const item = sheet?.closest<HTMLElement>("[data-movable-item]");
    const rotator = sheet?.querySelector<HTMLElement>("[data-map-rotator]");
    if (!item || !rotator) return;
    const stack = clippedUnit(canvas, item);

    const members = stack.filter(
      (member) => member !== item && !turning.has(member),
    );

    if (!members.length) return;
    const rect = rotator.getBoundingClientRect();
    const m = toScreen(rotator);

    // The map's own rotateY angle, about its local vertical (its screen axis below).
    const angleOf = () => {
      const r = new DOMMatrix(getComputedStyle(rotator).transform);
      return Math.atan2(-r.m13, r.m11);
    };

    const start = angleOf();

    const depth =
      parseFloat(getComputedStyle(rotator.parentElement!).perspective) || 1400;

    // The map's transition starts after this event: follow it once it runs
    // (or, with reduced motion, as soon as the map has simply turned).
    let settled = false,
      seen = false,
      frames = 0;

    turnOver(
      members,
      stack,
      { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 },
      { x: m.m21, y: m.m22 },
      depth,
      () => {
        if (settled) return null;
        let angle = angleOf() - start;
        angle = Math.atan2(Math.sin(angle), Math.cos(angle));

        const running = rotator
          .getAnimations()
          .some((animation) => animation.playState === "running");

        seen ||= running;

        if (!running && (seen || ++frames > 2 || Math.cos(angle) < 0)) {
          settled = true;
          return Math.cos(angle) < 0 ? Math.PI : 0;
        }

        return angle;
      },
    );
  });

  // A sheet's back is plain paper: never follow its link. Clicking it turns
  // the stack back over: with the map if clipped to one, else on its own axis.
  canvas.addEventListener("click", (event) => {
    const back =
      event.target instanceof Element
        ? event.target.closest("[data-turn-back]")
        : null;

    const item = back?.closest<HTMLElement>("[data-movable-item]");
    if (!item) return;
    event.preventDefault();
    if (turning.has(item)) return;
    const stack = clippedUnit(canvas, item);

    // Held down by a fridge magnet: the stack can't be turned over.
    if (stack.some((member) => member.dataset.pinned === "true")) {
      const live = canvas.querySelector("[data-desk-announcement]");

      if (live)
        live.textContent = `${item.getAttribute("aria-label")} is held down by a magnet. Lift the magnet off to turn it over.`;

      return;
    }

    const flip = stack
      .map((member) => member.querySelector<HTMLElement>("[data-map-flip]"))
      .find(Boolean);

    if (flip) {
      flip.click();
      return;
    }

    const frame = frameOf(item);

    const centre = frame.transformPoint(new DOMPoint(0, 0)),
      up = frame.transformPoint(new DOMPoint(0, 1));

    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

    const begin = performance.now(),
      duration = reduced ? 0 : 700;

    const ease = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    let done = false;

    turnOver(
      stack,
      stack,
      centre,
      { x: up.x - centre.x, y: up.y - centre.y },
      1400,
      () => {
        if (done) return null;
        const t = duration ? (performance.now() - begin) / duration : 1;

        if (t >= 1) {
          done = true;
          return Math.PI;
        }

        return Math.PI * ease(t);
      },
    );
  });

  canvas.querySelector("[data-desk-reset]")?.addEventListener("click", () => {
    turns = {};

    try {
      localStorage.removeItem(storageKey);
    } catch {
      /* Optional persistence. */
    }

    restore();
    canvas.dispatchEvent(new CustomEvent("desk:settled"));
  });

  window.addEventListener("resize", restore);
}

// Reading a sheet up close
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
