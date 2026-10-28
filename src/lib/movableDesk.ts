import { clippedUnit } from "./deskUnits";
import { aimRayShadowsWithin, setRayShadowHeight } from "./rayShadow";

// `r`: degrees the item has been turned on the desk by handling, on top of
// its authored tilt.
type Position = { x: number; y: number; z: number; r?: number };

type Layouts = Record<string, Record<string, Position>>;

type Drag = {
  item: HTMLElement;
  pointerId: number | null;
  startX: number;
  startY: number;
  scrollY: number;
  original: Position;
  rect: DOMRect;
  started: boolean;
  lastX: number;
  lastY: number;
  // Everything clipped to the item, carried with it.
  group: { item: HTMLElement; original: Position }[];
  // The sheet as a body dragged by one point (see `step`).
  body?: Body;
};

type Vec = { x: number; y: number };

type Body = {
  // Where it was grabbed (page px), each member's centre from there at the
  // start, and the turn so far (radians).
  grab: Vec;
  members: { item: HTMLElement; original: Position; centre: Vec }[];
  turn: number;
  spin: number;
  velocity: Vec;
  pointer: Vec;
  time: number;
  size: number;
  heft: number;
  // Lifted off the desk (0 → 1) when picked up, set down again when let go.
  lift: number;
  lifted: number;
  shadows: { filter: SVGFilterElement; height: number; caster: Element }[];
  transforms: Map<HTMLElement, string>;
};

// How far a picked-up sheet rises (px) and how far it tips up toward the hand.
const liftHeight = 18,
  liftTilt = 4;

const mode = () =>
  innerWidth >= 1024 ? "desktop" : innerWidth >= 640 ? "tablet" : "mobile";

const interactive =
  "button,audio,video,input,textarea,select,summary,dialog,[contenteditable=true],[data-gem-clip],[data-desk-magnet]";

export function initializeDesk(canvas: HTMLElement) {
  if (canvas.dataset.deskReady) return;
  canvas.dataset.deskReady = "true";

  const items = [
    ...canvas.querySelectorAll<HTMLElement>("[data-movable-item]"),
  ].filter((item) => item.closest("[data-desk-canvas]") === canvas);

  const positions = new Map<HTMLElement, Position>();
  const defaults = new Map<HTMLElement, string>();
  const storageKey = canvas.dataset.storageKey!;
  let layouts: Layouts = {};
  let drag: Drag | null = null;
  let touchId: number | null = null;
  let touchReady = false;
  let holdTimer: ReturnType<typeof setTimeout> | undefined;
  let suppressed: HTMLElement | null = null;
  let suppressUntil = 0;
  let layer = 30;
  let frame = 0;
  let resizeFrame = 0;
  const glides = new Map<HTMLElement, () => void>();

  const announce = (message: string) => {
    const live = canvas.querySelector<HTMLElement>("[data-desk-announcement]");
    if (live) live.textContent = message;
  };

  try {
    const saved: unknown = JSON.parse(
      localStorage.getItem(storageKey) ?? "null",
    );

    if (
      saved &&
      typeof saved === "object" &&
      "version" in saved &&
      saved.version === 1 &&
      "layouts" in saved &&
      saved.layouts &&
      typeof saved.layouts === "object"
    )
      layouts = saved.layouts as Layouts;
  } catch {
    /* Storage may be disabled or contain an older layout. */
  }

  let layoutFrame = 0;

  // Anything that depends on what lies over what (hardware bumps) listens.
  const layoutChanged = () => {
    cancelAnimationFrame(layoutFrame);

    layoutFrame = requestAnimationFrame(() =>
      canvas.dispatchEvent(new CustomEvent("desk:layout-changed")),
    );
  };

  // The authored tilt (CSS `rotate`, per breakpoint), read with no handling on it.
  const tilts = new Map<HTMLElement, number>();

  const tiltOf = (item: HTMLElement) => {
    let tilt = tilts.get(item);

    if (tilt === undefined) {
      const inline = item.style.rotate;
      item.style.removeProperty("rotate");
      tilt = parseFloat(getComputedStyle(item).rotate) || 0;
      if (inline) item.style.rotate = inline;
      tilts.set(item, tilt);
    }

    return tilt;
  };

  function apply(item: HTMLElement, p: Position) {
    positions.set(item, p);
    item.style.translate = `${p.x}px ${p.y}px`;
    item.style.zIndex = String(p.z);

    if (p.r) item.style.rotate = `${(tiltOf(item) + p.r).toFixed(3)}deg`;
    else item.style.removeProperty("rotate");

    layoutChanged();
  }

  /** The highest layer in use, including loose hardware lying on the desk. */
  const topLayer = () =>
    Math.max(
      layer,
      ...[
        ...canvas.querySelectorAll<HTMLElement | SVGElement>(
          "[data-desk-layer]",
        ),
      ].map((element) => Number(element.style.zIndex) || 0),
    );

  /** Items held together by paper clips, in their current stacking order. */
  const unitOf = (item: HTMLElement) =>
    clippedUnit(canvas, item)
      .filter((member) => positions.has(member))
      .sort((a, b) => positions.get(a)!.z - positions.get(b)!.z);

  /** A fridge magnet pins whatever it sits on, and everything clipped or held
   * with it, to the desk until it is lifted off. One on the hidden side of a
   * face-down sheet is underneath it and pins nothing. */
  const pinned = (item: HTMLElement) => {
    const unit = new Set(unitOf(item));

    return [...canvas.querySelectorAll<HTMLElement>("[data-desk-magnet]")].some(
      (magnet) => {
        const owner = magnet.closest<HTMLElement>("[data-movable-item]");

        return (
          !!owner &&
          unit.has(owner) &&
          getComputedStyle(magnet).visibility === "visible" &&
          !magnet.closest(
            '[data-map-sheet][data-facing="back"] [data-map-front], [data-map-sheet][data-facing="front"] [data-map-back]',
          )
        );
      },
    );
  };

  // A drag attempt on a pinned item must not turn into a click (that would,
  // say, flip the map); it is swallowed and explained instead.
  let pinnedPress: {
    item: HTMLElement;
    pointerId: number;
    x: number;
    y: number;
    moved: boolean;
  } | null = null;

  const updatePins = () => {
    for (const item of items) {
      if (pinned(item)) item.dataset.pinned = "true";
      else delete item.dataset.pinned;
    }
  };

  const pinnedNote = (item: HTMLElement) =>
    announce(
      `${item.getAttribute("aria-label")} is held in place by a magnet. Lift the magnet off to move it.`,
    );

  /** Bring an item (with anything clipped to it) to the top, keeping the clipped stack's order. */
  function raise(item: HTMLElement) {
    layer = topLayer();

    for (const member of unitOf(item))
      apply(member, { ...positions.get(member)!, z: ++layer });
  }

  const carried = (item: HTMLElement) =>
    unitOf(item)
      .filter((member) => member !== item)
      .map((member) => ({
        item: member,
        original: { ...positions.get(member)! },
      }));

  // No margins: objects can be moved anywhere, off the screen too (the
  // reset button brings everything back).
  function constrain(_rect: DOMRect, x: number, y: number) {
    return { x, y };
  }

  function persist() {
    const width = canvas.clientWidth || 1,
      height = canvas.clientHeight || 1;

    layouts[mode()] = Object.fromEntries(
      items.map((item) => {
        const p = positions.get(item)!;

        return [
          item.dataset.movableId!,
          {
            x: p.x / width,
            y: p.y / height,
            z: p.z,
            ...(p.r ? { r: p.r } : {}),
          },
        ];
      }),
    );

    try {
      localStorage.setItem(storageKey, JSON.stringify({ version: 1, layouts }));
    } catch {
      /* Dragging still works without storage. */
    }
  }

  function restore() {
    if (drag || glides.size) return;
    const saved = layouts[mode()] ?? {};
    layer = 30;

    for (const item of items) {
      item.style.removeProperty("translate");
      item.style.zIndex = defaults.get(item) ?? "";
      const base = Number.parseInt(getComputedStyle(item).zIndex) || 0;
      const p = saved[item.dataset.movableId!];
      tilts.delete(item);
      item.style.removeProperty("rotate");

      if (p && [p.x, p.y, p.z].every(Number.isFinite)) {
        const offset = constrain(
          item.getBoundingClientRect(),
          p.x * canvas.clientWidth,
          p.y * canvas.clientHeight,
        );

        const z = Math.min(1000000, Math.max(0, p.z));

        const r = Number.isFinite(p.r)
          ? Math.max(-180, Math.min(180, p.r!))
          : 0;

        apply(item, { ...offset, z, r });
        layer = Math.max(layer, z);
      } else positions.set(item, { x: 0, y: 0, z: base });
    }

    layer = topLayer();
  }

  for (const item of items) defaults.set(item, item.style.zIndex);
  restore();

  void document.fonts.ready.then(() => {
    if (!drag && !glides.size) restore();
  });

  const still = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

  const turned = (v: Vec, angle: number) => ({
    x: v.x * Math.cos(angle) - v.y * Math.sin(angle),
    y: v.x * Math.sin(angle) + v.y * Math.cos(angle),
  });

  /** Picked up at the press point: everything it carries, rigid with it. */
  function pickUp(current: Drag) {
    const grab = { x: current.startX, y: current.startY + current.scrollY };

    const members = [
      current.item,
      ...current.group.map((entry) => entry.item),
    ].map((item) => {
      const r = item.getBoundingClientRect();

      return {
        item,
        original: { ...positions.get(item)! },
        centre: {
          x: r.x + r.width / 2 - grab.x,
          y: r.y + r.height / 2 + window.scrollY - grab.y,
        },
      };
    });

    const r = current.item.getBoundingClientRect();

    current.body = {
      grab,
      members,
      turn: 0,
      spin: 0,
      velocity: { x: 0, y: 0 },
      pointer: grab,
      time: performance.now(),
      size: Math.sqrt(r.width * r.height),
      // A card folder drags round more stiffly than a loose sheet or a pen.
      heft: current.item.querySelector("[data-work-folder]") ? 0.55 : 1,
      lift: 0,
      lifted: performance.now(),
      // Each sheet's own cast shadow (its backing), raised as it lifts.
      shadows: members.flatMap(({ item }) =>
        [
          ...item.querySelectorAll<HTMLElement>(
            "[data-paper-backing][data-ray-caster]",
          ),
        ]
          .filter((backing) => backing.closest("[data-movable-item]") === item)
          .map((backing) => ({
            filter: canvas.querySelector<SVGFilterElement>(
              `filter[id="${backing.dataset.rayCaster}"]`,
            )!,
            height: Number(
              canvas.querySelector<SVGFilterElement>(
                `filter[id="${backing.dataset.rayCaster}"]`,
              )?.dataset.height ?? 8,
            ),
            caster: backing,
          }))
          .filter((shadow) => shadow.filter),
      ),
      transforms: new Map(
        members.map(({ item }) => [item, item.style.transform]),
      ),
    };
  }

  /** Set the body down with its grab point at `grab` (page px), turned `turn`. */
  function place(body: Body, grab: Vec) {
    for (const member of body.members) {
      const centre = turned(member.centre, body.turn);

      apply(member.item, {
        ...member.original,
        x:
          member.original.x +
          grab.x +
          centre.x -
          (body.grab.x + member.centre.x),
        y:
          member.original.y +
          grab.y +
          centre.y -
          (body.grab.y + member.centre.y),
        z: positions.get(member.item)!.z,
        r: (member.original.r ?? 0) + (body.turn * 180) / Math.PI,
      });
    }
  }

  /** Raise (or lower) the body: each sheet tips up toward the hand on a soft
   * perspective, its shadow cast from higher up (wider and softer), a pen's too. */
  function liftTo(body: Body, lift: number, grab: Vec) {
    const step = Math.round(lift * 4) / 4;

    if (step !== Math.round(body.lift * 4) / 4) {
      for (const shadow of body.shadows)
        setRayShadowHeight(
          shadow.filter,
          shadow.height + liftHeight * step,
          shadow.caster,
        );

      for (const { item } of body.members)
        item.querySelectorAll<SVGSVGElement>("svg[data-pen]").forEach((pen) => {
          pen.dataset.lift = String(liftHeight * step);
          delete pen.dataset.aimed;
        });
    }

    body.lift = lift;

    for (const { item } of body.members) {
      const original = body.transforms.get(item) ?? "";

      if (lift <= 0) {
        if (original) item.style.transform = original;
        else item.style.removeProperty("transform");

        continue;
      }

      // Tip up about the line through the middle square to the hand, in the
      // sheet's own (turned) frame. A folder is stiffer card: it tips less.
      const r = item.getBoundingClientRect(),
        turn = ((tiltOf(item) + (positions.get(item)!.r ?? 0)) * Math.PI) / 180;

      const g = turned(
        {
          x: grab.x - (r.x + r.width / 2),
          y: grab.y - window.scrollY - (r.y + r.height / 2),
        },
        -turn,
      );

      const length = Math.hypot(g.x, g.y);
      if (length < 1) continue;

      const tilt =
        (item.querySelector("[data-work-folder]") ? 0.35 : 1) * liftTilt * lift;

      item.style.transform =
        `perspective(1600px) rotate3d(${(g.y / length).toFixed(4)}, ${(-g.x / length).toFixed(4)}, 0, ${tilt.toFixed(3)}deg) ${original}`.trim();
    }
  }

  const aimBody = (body: Body, settled = false) => {
    for (const member of body.members)
      aimRayShadowsWithin(member.item, !settled);

    if (settled) canvas.dispatchEvent(new CustomEvent("desk:light-refresh"));
  };

  /** Dragged by one point against the desk's friction, a sheet swings round
   * that point until its middle trails behind the motion: it turns at a rate
   * set by how far off-centre it is held and how fast it is pulled
   * (ω ∝ d × −v / (|d|² + L²), d from the grab point to the middle). Held at
   * its middle it just slides. */
  function updateDrag() {
    if (!drag?.started) return;
    const scrollDelta = window.scrollY - drag.scrollY;

    const dx = drag.lastX - drag.startX,
      dy = drag.lastY - drag.startY + scrollDelta;

    const rect = new DOMRect(
      drag.rect.x,
      drag.rect.y - scrollDelta,
      drag.rect.width,
      drag.rect.height,
    );

    const delta = constrain(rect, dx, dy);

    if (!drag.body) {
      // Handling a sheet never selects its text.
      window.getSelection()?.removeAllRanges();
      pickUp(drag);
    }

    const body = drag.body!;
    const grab = { x: body.grab.x + delta.x, y: body.grab.y + delta.y };

    const now = performance.now(),
      dt = Math.min(0.05, (now - body.time) / 1000);

    if (dt > 0) {
      body.time = now;
      const blend = 1 - Math.exp(-dt * 25);

      body.velocity = {
        x:
          body.velocity.x +
          ((grab.x - body.pointer.x) / dt - body.velocity.x) * blend,
        y:
          body.velocity.y +
          ((grab.y - body.pointer.y) / dt - body.velocity.y) * blend,
      };

      body.pointer = grab;

      if (!still()) {
        const d = turned(body.members[0]!.centre, body.turn),
          v = body.velocity,
          reach = body.size * 0.45;

        body.spin = Math.max(
          -5,
          Math.min(
            5,
            (body.heft * (d.x * -v.y - d.y * -v.x)) /
              (d.x * d.x + d.y * d.y + reach * reach),
          ),
        );

        body.turn += body.spin * dt;
      }
    }

    place(body, grab);

    if (!still()) {
      const t = Math.min(1, (now - body.lifted) / 140);
      liftTo(body, 1 - (1 - t) * (1 - t), grab);
    }

    if (Math.abs(body.spin) > 0.01 || body.lift < 1) aimBody(body);
  }

  function autoScroll() {
    if (!drag?.started) return;
    const edge = 64;

    const speed =
      drag.lastY < edge
        ? -Math.ceil((edge - drag.lastY) / 5)
        : drag.lastY > innerHeight - edge
          ? Math.ceil((drag.lastY - innerHeight + edge) / 5)
          : 0;

    if (speed) {
      window.scrollBy(0, Math.max(-18, Math.min(18, speed)));
      updateDrag();
    }

    frame = requestAnimationFrame(autoScroll);
  }

  function finish(cancelled = false) {
    if (!drag) return;
    const current = drag;
    drag = null;
    clearTimeout(holdTimer);
    touchId = null;
    touchReady = false;
    cancelAnimationFrame(frame);
    delete current.item.dataset.dragging;
    const pen = !!current.item.querySelector("[data-pen]");

    if (!pen || cancelled || !current.started || still())
      for (const member of [
        current.item,
        ...current.group.map((entry) => entry.item),
      ])
        delete member.dataset.lifted;

    layoutChanged();

    if (
      current.pointerId !== null &&
      current.item.hasPointerCapture(current.pointerId)
    )
      current.item.releasePointerCapture(current.pointerId);

    if (!current.started) return;
    suppressed = current.item;
    suppressUntil = performance.now() + 350;

    if (cancelled) {
      apply(current.item, current.original);
      for (const member of current.group) apply(member.item, member.original);

      if (current.body) {
        liftTo(current.body, 0, current.body.pointer);
        aimBody(current.body, true);
      }

      return;
    }

    const body = current.body;
    window.getSelection()?.removeAllRanges();

    let glideFrame = 0;
    let settled = false;

    const done = (moved = true) => {
      if (settled) return;
      settled = true;
      cancelAnimationFrame(glideFrame);
      for (const item of [
        current.item,
        ...current.group.map((entry) => entry.item),
      ]) {
        glides.delete(item);
        delete item.dataset.lifted;
      }
      if (body) liftTo(body, 0, body.pointer);
      if (body) aimBody(body, true);
      layoutChanged();
      persist();
      if (moved) announce(`${current.item.getAttribute("aria-label")} moved.`);
    };

    if (!body || still()) {
      done();
      return;
    }

    // A thrown pen carries its momentum across the desk; paper and heavier
    // objects still settle after a short slide.
    const idle = Math.max(0, performance.now() - body.time);
    const release = Math.exp(-Math.max(0, idle - 40) / 35);
    const speed = Math.hypot(body.velocity.x, body.velocity.y) * release;
    const cap = Math.min(1, (pen ? 2400 : 700) / (speed || 1));

    let velocity = {
        x: body.velocity.x * release * cap,
        y: body.velocity.y * release * cap,
      },
      spin = body.spin * 0.6,
      grab = body.pointer,
      time = performance.now();

    const glide = (now: number) => {
      const dt = Math.min(0.05, (now - time) / 1000),
        friction = Math.exp(-dt * (pen ? 2.2 : 13));

      time = now;

      // Never off the desk: the same bounds as a drag.
      const scrollDelta = window.scrollY - current.scrollY;

      const rect = new DOMRect(
        current.rect.x,
        current.rect.y - scrollDelta,
        current.rect.width,
        current.rect.height,
      );

      spin *= friction;
      body.turn += spin * dt;
      const want = {
        x: grab.x + velocity.x * dt - body.grab.x,
        y: grab.y + velocity.y * dt - body.grab.y,
      };

      const delta = constrain(rect, want.x, want.y);
      if (delta.x !== want.x) velocity.x = 0;
      if (delta.y !== want.y) velocity.y = 0;
      grab = { x: body.grab.x + delta.x, y: body.grab.y + delta.y };
      place(body, grab);

      if (pen) {
        // Keep a tossed pen on the page and let it ricochet off its edges.
        // Use the transformed bounds so a spinning tip cannot disappear.
        const bounds = canvas.getBoundingClientRect();
        const item = current.item.getBoundingClientRect();
        let x = 0,
          y = 0;
        const overX = Math.max(0, (item.width - bounds.width) / 2);
        const overY = Math.max(0, (item.height - bounds.height) / 2);
        const minX = bounds.left - overX;
        const maxX = bounds.right - item.width + overX;
        const minY = bounds.top - overY;
        const maxY = bounds.bottom - item.height + overY;

        if (item.left < minX) x = minX - item.left;
        else if (item.left > maxX) x = maxX - item.left;
        if (item.top < minY) y = minY - item.top;
        else if (item.top > maxY) y = maxY - item.top;

        if (x || y) {
          grab = { x: grab.x + x, y: grab.y + y };
          place(body, grab);
          if (x) velocity.x = -velocity.x * 0.65;
          if (y) velocity.y = -velocity.y * 0.65;
        }
      }

      velocity = { x: velocity.x * friction, y: velocity.y * friction };
      const speed = Math.hypot(velocity.x, velocity.y),
        moving = speed > 6;

      // The pen stays aloft while moving quickly, then drops as it slows and
      // lands once it settles; exponential decay alone never reaches zero.
      liftTo(
        body,
        pen
          ? moving
            ? Math.min(1, speed / 500)
            : 0
          : Math.max(0, body.lift - dt / 0.12),
        grab,
      );
      aimBody(body);

      if (moving || Math.abs(spin) > 0.02 || body.lift > 0)
        glideFrame = requestAnimationFrame(glide);
      else done();
    };

    for (const member of body.members)
      glides.set(member.item, () => done(false));
    glideFrame = requestAnimationFrame(glide);
  }

  canvas.addEventListener("pointerdown", (event) => {
    if (
      drag ||
      event.button !== 0 ||
      !event.isPrimary ||
      event.pointerType === "touch"
    )
      return;

    const target = event.target instanceof Element ? event.target : null;
    const item = target?.closest<HTMLElement>("[data-movable-item]");
    if (!item || !positions.has(item)) return;
    if (target?.closest(interactive)) return;
    glides.get(item)?.();

    // Pinned by a magnet: a click still brings it forward, but it won't slide.
    if (pinned(item)) {
      pinnedPress = {
        item,
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        moved: false,
      };

      return;
    }

    drag = {
      item,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      scrollY: window.scrollY,
      original: { ...positions.get(item)! },
      rect: item.getBoundingClientRect(),
      started: false,
      lastX: event.clientX,
      lastY: event.clientY,
      group: carried(item),
    };
  });

  window.addEventListener(
    "pointermove",
    (event) => {
      if (
        pinnedPress?.pointerId === event.pointerId &&
        !pinnedPress.moved &&
        Math.hypot(
          event.clientX - pinnedPress.x,
          event.clientY - pinnedPress.y,
        ) >= 6
      ) {
        pinnedPress.moved = true;
        pinnedNote(pinnedPress.item);
      }

      if (!drag || drag.pointerId !== event.pointerId) return;
      drag.lastX = event.clientX;
      drag.lastY = event.clientY;

      if (
        !drag.started &&
        Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) >=
          6
      ) {
        drag.started = true;
        drag.item.dataset.dragging = "true";

        // Lifted off the desk: a carried sheet presses on nothing (no dents) until dropped.
        for (const member of [
          drag.item,
          ...drag.group.map((entry) => entry.item),
        ])
          member.dataset.lifted = "";

        drag.item.setPointerCapture(event.pointerId);
        raise(drag.item);
        frame = requestAnimationFrame(autoScroll);
      }

      if (drag.started) {
        event.preventDefault();
        updateDrag();
      }
    },
    { passive: false },
  );

  window.addEventListener("pointerup", (event) => {
    if (drag?.pointerId === event.pointerId) finish();
  });

  window.addEventListener("pointercancel", (event) => {
    if (drag?.pointerId === event.pointerId) finish(true);
  });

  // Hold to move on touch; swiping before the hold still scrolls normally.
  canvas.addEventListener(
    "touchstart",
    (event) => {
      if (event.touches.length !== 1) {
        finish(true);
        return;
      }

      if (drag) return;
      const target = event.target instanceof Element ? event.target : null;
      const item = target?.closest<HTMLElement>("[data-movable-item]");

      if (
        !item ||
        !positions.has(item) ||
        target?.closest(interactive) ||
        pinned(item)
      )
        return;

      glides.get(item)?.();

      const touch = event.touches[0]!;
      touchId = touch.identifier;

      drag = {
        item,
        pointerId: null,
        startX: touch.clientX,
        startY: touch.clientY,
        scrollY: window.scrollY,
        original: { ...positions.get(item)! },
        rect: item.getBoundingClientRect(),
        started: false,
        lastX: touch.clientX,
        lastY: touch.clientY,
        group: carried(item),
      };

      holdTimer = setTimeout(() => {
        touchReady = true;
      }, 280);
    },
    { passive: true },
  );

  window.addEventListener(
    "touchmove",
    (event) => {
      if (!drag || touchId === null) return;

      const touch = [...event.touches].find(
        (touch) => touch.identifier === touchId,
      );

      if (!touch) return;

      const distance = Math.hypot(
        touch.clientX - drag.startX,
        touch.clientY - drag.startY,
      );

      if (!touchReady) {
        if (distance >= 6) finish(true);
        return;
      }

      if (!event.cancelable) {
        finish(true);
        return;
      }

      event.preventDefault();
      drag.lastX = touch.clientX;
      drag.lastY = touch.clientY;

      if (!drag.started && distance >= 6) {
        drag.started = true;
        drag.item.dataset.dragging = "true";

        // Lifted off the desk: a carried sheet presses on nothing (no dents) until dropped.
        for (const member of [
          drag.item,
          ...drag.group.map((entry) => entry.item),
        ])
          member.dataset.lifted = "";

        raise(drag.item);
        frame = requestAnimationFrame(autoScroll);
      }

      updateDrag();
    },
    { passive: false },
  );

  window.addEventListener("touchend", (event) => {
    if (
      touchId !== null &&
      [...event.changedTouches].some((touch) => touch.identifier === touchId)
    )
      finish();
  });

  window.addEventListener("touchcancel", () => {
    if (touchId !== null) finish(true);
  });

  canvas.addEventListener("contextmenu", (event) => {
    if (touchId !== null) event.preventDefault();
  });

  window.addEventListener("blur", () => finish(true));

  canvas.addEventListener("dragstart", (event) => {
    if ((event.target as Element).closest("[data-movable-item]"))
      event.preventDefault();
  });

  canvas.addEventListener(
    "click",
    (event) => {
      const press = pinnedPress;
      pinnedPress = null;

      if (press?.moved && press.item.contains(event.target as Node)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }

      if (
        performance.now() < suppressUntil &&
        suppressed?.contains(event.target as Node)
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
      } else {
        const target = event.target instanceof Element ? event.target : null;
        const item = target?.closest<HTMLElement>("[data-movable-item]");

        // Opening or closing a folder does not lift it over what lies on it
        // (or across its edge); only picking it up does.
        if (
          item &&
          positions.has(item) &&
          !target?.closest("dialog") &&
          !target?.closest("[data-work-folder]")
        ) {
          raise(item);
          persist();
        }
      }
    },
    true,
  );

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && drag) {
      event.preventDefault();
      finish(true);
    }
  });

  canvas.addEventListener("keydown", (event) => {
    const target = event.target instanceof HTMLElement ? event.target : null;
    const item = target?.closest<HTMLElement>("[data-movable-item]");
    if (!item || !positions.has(item) || target !== item) return;

    const delta = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    }[event.key];

    if (!delta) return;
    event.preventDefault();

    if (pinned(item)) {
      pinnedNote(item);
      return;
    }

    const step = event.shiftKey ? 40 : 10;

    const offset = constrain(
      item.getBoundingClientRect(),
      delta[0]! * step,
      delta[1]! * step,
    );

    raise(item);

    for (const member of unitOf(item)) {
      const p = positions.get(member)!;
      apply(member, { ...p, x: p.x + offset.x, y: p.y + offset.y });
    }

    persist();
  });

  // Holds change when hardware is put down, lifted, reset, or stacks settle.
  for (const name of [
    "desk:holds-changed",
    "desk:settled",
    "desk:raise",
    "desk:restack",
  ])
    canvas.addEventListener(name, () => requestAnimationFrame(updatePins));

  canvas.querySelector("[data-desk-reset]")?.addEventListener("click", () => {
    finish(true);
    for (const stop of new Set(glides.values())) stop();
    layouts = {};

    try {
      localStorage.removeItem(storageKey);
    } catch {
      /* Optional persistence. */
    }

    restore();
    announce("Object arrangement reset.");
  });

  // A clipped stack turned over: its order reverses (bottom → top in detail).
  canvas.addEventListener("desk:restack", (event) => {
    layer = topLayer();

    for (const item of (event as CustomEvent<HTMLElement[]>).detail)
      if (positions.has(item))
        apply(item, { ...positions.get(item)!, z: ++layer });

    persist();
  });

  // Loose hardware put down on the desk takes the next layer, like a sheet put
  // down: anything brought forward or dragged over it later covers it.
  canvas.addEventListener("desk:lay", (event) => {
    const element = (event as CustomEvent<HTMLElement | SVGElement>).detail;
    layer = topLayer();
    element.style.zIndex = String(++layer);
    element.dataset.deskLayer = "";
    layoutChanged();
  });

  canvas.addEventListener("desk:raise", (event) => {
    const item = (event as CustomEvent<HTMLElement>).detail;

    if (positions.has(item)) {
      raise(item);
      persist();
    }
  });

  window.addEventListener("resize", () => {
    cancelAnimationFrame(resizeFrame);

    resizeFrame = requestAnimationFrame(() => {
      finish(true);
      for (const stop of new Set(glides.values())) stop();
      restore();
    });
  });
}
