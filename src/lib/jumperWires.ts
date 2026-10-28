import { board, holes } from "./breadboardModel";
import { deskLight, shadowInk } from "./rayShadow";

/** Male–male Dupont jumper wires that plug into the breadboard.
 *
 * Each wire is a fixed length of 22 AWG insulated wire between two black
 * plastic housings with a pin. An end dragged over a breadboard hole and let
 * go plugs in: its housing then stands upright in the hole (seen from above,
 * a black square) and the wire leaves its top and arcs over. Anywhere else
 * the end lies flat on the desk, its housing and pin pointing away from the
 * wire. The wire can't stretch: it bows sideways by however much slack it
 * has (arc length ≈ d + 8s²/3d), and an end can't be pulled further than its
 * length from the other. Everything is drawn here in code: the insulation is
 * shaded as a round wire under the desk light, and its shadow is cast from
 * its height along the wire (higher where it rises out of upright housings).
 * Plugged ends ride with the board when it moves; placements are saved.
 *
 * Units: CSS px; the same scale as the pens and the board (292 px / 139.5 mm). */
type Plug = { board: string; hole: number };

type Loose = { x: number; y: number; turn: number };

type End = { plug?: Plug; loose?: Loose };

type Wire = {
  color: string;
  svg: SVGSVGElement;
  ends: [End, End];
  parts: Record<string, SVGElement>;
  handles: [SVGPathElement, SVGPathElement];
  // Which side it bows to (it keeps that as it is moved).
  bow: 1 | -1;
  lifted: number | null;
};

const NS = "http://www.w3.org/2000/svg";
const k = 292 / 139.5;
const length = 100 * k; // a 10 cm jumper
const thickness = 1.6 * k; // 22 AWG insulation
const housing = { long: 14 * k, side: 2.54 * k, pin: 6 * k };

const colours: Record<string, [string, string, string]> = {
  red: ["#5e0b0b", "#c8231d", "#ff8f7e"],
  green: ["#0b3a19", "#1f8a3a", "#8fe0a3"],
  blue: ["#0b1d4f", "#1f4fc0", "#93b5ff"],
};

const holeList = holes();

export function initializeJumperWires(canvas: HTMLElement) {
  if (canvas.dataset.wiresReady) return;
  canvas.dataset.wiresReady = "true";
  const storageKey = `${canvas.dataset.storageKey}:wires`;

  const announce = (text: string) => {
    const live = canvas.querySelector("[data-desk-announcement]");
    if (live) live.textContent = text;
  };

  const node = <T extends SVGElement>(
    tag: string,
    attributes: Record<string, string | number> = {},
  ) => {
    const element = document.createElementNS(NS, tag) as T;

    for (const [key, value] of Object.entries(attributes))
      element.setAttribute(key, String(value));

    return element;
  };

  const boards = () => [
    ...canvas.querySelectorAll<SVGSVGElement>("svg[data-breadboard]"),
  ];

  const boardId = (svg: SVGSVGElement) =>
    svg.closest<HTMLElement>("[data-movable-item]")?.dataset.movableId ?? "";

  const canvasBox = () => canvas.getBoundingClientRect();

  /** A hole on a board → canvas px, or null if the board isn't laid out. */
  const holeAt = (plug: Plug) => {
    const svg = boards().find((b) => boardId(b) === plug.board);
    const m = svg?.getScreenCTM();
    const hole = holeList[plug.hole];
    if (!m || !hole) return null;
    const p = new DOMPoint(hole.x * k, -hole.y * k).matrixTransform(m);
    const box = canvasBox();
    return { x: p.x - box.left, y: p.y - box.top, turn: Math.atan2(m.b, m.a) };
  };

  /** The hole nearest a canvas point, if one is close enough and free. */
  const holeNear = (x: number, y: number, except?: End) => {
    const box = canvasBox();
    let best: { plug: Plug; d: number } | null = null;

    for (const svg of boards()) {
      const m = svg.getScreenCTM();
      if (!m) continue;

      const local = new DOMPoint(x + box.left, y + box.top).matrixTransform(
        m.inverse(),
      );

      const mx = local.x / k,
        my = -local.y / k;

      if (Math.abs(mx) > board.length / 2 || Math.abs(my) > board.width / 2)
        continue;

      holeList.forEach((hole, index) => {
        const d = Math.hypot(hole.x - mx, hole.y - my);

        if (
          d < 1.9 &&
          (!best || d < best.d) &&
          !taken(boardId(svg), index, except)
        )
          best = { plug: { board: boardId(svg), hole: index }, d };
      });
    }

    return (best as { plug: Plug } | null)?.plug ?? null;
  };

  const taken = (id: string, index: number, except?: End) =>
    wires.some((wire) =>
      wire.ends.some(
        (end) =>
          end !== except && end.plug?.board === id && end.plug.hole === index,
      ),
    );

  /** Where an end is now: canvas px, height (px) the wire leaves it at, and
   * which way a lying housing points. */
  const where = (wire: Wire, i: 0 | 1) => {
    const end = wire.ends[i];

    if (end.plug) {
      const at = holeAt(end.plug);

      if (at)
        return { x: at.x, y: at.y, z: housing.long, turn: 0, plugged: true };
    }

    const loose = end.loose ?? { x: 0, y: 0, turn: 0 };

    return {
      x: loose.x,
      y: loose.y,
      z: wire.lifted === i ? 26 : thickness / 2,
      turn: loose.turn,
      plugged: false,
    };
  };

  // --- drawing ----------------------------------------------------------------
  const wires: Wire[] = [];

  const blur = node<SVGFilterElement>("filter", {
    id: "jumper-soft",
    x: "-20%",
    y: "-20%",
    width: "140%",
    height: "140%",
  });

  blur.append(node("feGaussianBlur", { stdDeviation: 1.1 }));

  for (const host of canvas.querySelectorAll<SVGSVGElement>(
    "svg[data-jumper]",
  )) {
    const color = host.dataset.color ?? "red";
    const [dark, mid, light] = colours[color] ?? colours.red!;
    const defs = node("defs");
    if (!canvas.querySelector("#jumper-soft")) defs.append(blur);

    // Black plastic housing, lying: a shine along its length.
    const gradient = node("linearGradient", {
      id: `jumper-housing-${color}`,
      x1: 0,
      y1: 0,
      x2: 0,
      y2: 1,
    });

    for (const [offset, colour] of [
      [0, "#000"],
      [0.3, "#3b3b3d"],
      [0.45, "#151516"],
      [1, "#000"],
    ] as const)
      gradient.append(node("stop", { offset, "stop-color": colour }));

    const cap = node("radialGradient", {
      id: `jumper-cap-${color}`,
      cx: 0.35,
      cy: 0.3,
      r: 0.9,
    });

    for (const [offset, colour] of [
      [0, "#4a4a4c"],
      [0.5, "#161617"],
      [1, "#000"],
    ] as const)
      cap.append(node("stop", { offset, "stop-color": colour }));

    defs.append(gradient, cap);

    const parts: Record<string, SVGElement> = {
      shadow: node("path", {
        fill: "none",
        stroke: shadowInk,
        "stroke-width": thickness * 0.9,
        "stroke-linecap": "round",
        opacity: 0.38,
        filter: "url(#jumper-soft)",
      }),
      shadowA: node("path", {
        fill: shadowInk,
        opacity: 0.4,
        filter: "url(#jumper-soft)",
      }),
      shadowB: node("path", {
        fill: shadowInk,
        opacity: 0.4,
        filter: "url(#jumper-soft)",
      }),
      base: node("path", {
        fill: "none",
        stroke: dark,
        "stroke-width": thickness,
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
      }),
      body: node("path", {
        fill: "none",
        stroke: mid,
        "stroke-width": thickness * 0.66,
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
      }),
      shine: node("path", {
        fill: "none",
        stroke: light,
        "stroke-width": thickness * 0.2,
        "stroke-linecap": "round",
        opacity: 0.75,
      }),
      endA: node("g"),
      endB: node("g"),
      hit: node("path", {
        fill: "none",
        stroke: "transparent",
        "stroke-width": 12,
        "pointer-events": "stroke",
        class: "cursor-grab",
      }),
    };

    const handle = (i: 0 | 1) => {
      // The whole housing and pin take the pointer (see draw).
      const circle = node<SVGPathElement>("path", {
        fill: "none",
        stroke: "transparent",
        "stroke-width": 16,
        "stroke-linecap": "round",
        "pointer-events": "stroke",
        tabindex: 0,
        role: "button",
        class: "cursor-grab outline-none",
        "aria-label": `${color} jumper wire, ${i ? "second" : "first"} end. Drag onto a breadboard hole to plug it in. Enter to pick up or put down; arrow keys move it a hole at a time; Escape to cancel.`,
      });

      return circle;
    };

    const handles: [SVGPathElement, SVGPathElement] = [handle(0), handle(1)];

    host.append(
      defs,
      parts.shadow!,
      parts.shadowA!,
      parts.shadowB!,
      parts.base!,
      parts.body!,
      parts.shine!,
      parts.endA!,
      parts.endB!,
      parts.hit!,
      ...handles,
    );

    wires.push({
      color,
      svg: host,
      ends: [{}, {}],
      parts,
      handles,
      bow: color === "green" ? -1 : 1,
      lifted: null,
    });
  }

  if (!wires.length) return;

  /** The wire's centre line between where it leaves its two ends (canvas px),
   * with the height of each point. */
  const centreLine = (wire: Wire) => {
    const a = where(wire, 0),
      b = where(wire, 1);

    // A lying end's wire leaves the back of its housing.
    const leave = (e: typeof a) =>
      e.plugged
        ? { x: e.x, y: e.y }
        : {
            x: e.x - Math.cos(e.turn) * housing.long,
            y: e.y - Math.sin(e.turn) * housing.long,
          };

    const p = leave(a),
      q = leave(b);

    const d = Math.hypot(q.x - p.x, q.y - p.y) || 1;
    const slack = Math.max(0, length - d);

    // Slack goes mostly up into an arc (a wire from upright housings rises
    // out of them), a little sideways: seen from above it bows gently and
    // its height shows in its shadow.
    const loop = Math.sqrt((3 * d * slack) / 8);
    const sag = loop * 0.35 * wire.bow;
    const n = { x: -(q.y - p.y) / d, y: (q.x - p.x) / d };

    // Through the bowed middle: where the wire heads from a plugged end.
    const c = {
      x: (p.x + q.x) / 2 + n.x * sag * 2,
      y: (p.y + q.y) / 2 + n.y * sag * 2,
    };

    // A cubic: out of a lying housing the wire runs straight on from it (no
    // kink), then curves; out of an upright one it heads for the bow.
    const reach = 0.3 * d + 0.6 * loop;

    const out = (e: typeof a, from: { x: number; y: number }) => {
      if (!e.plugged) return { x: -Math.cos(e.turn), y: -Math.sin(e.turn) };

      const dx = c.x - from.x,
        dy = c.y - from.y,
        l = Math.hypot(dx, dy) || 1;

      return { x: dx / l, y: dy / l };
    };

    const ta = out(a, p),
      tb = out(b, q);

    const c1 = { x: p.x + ta.x * reach, y: p.y + ta.y * reach },
      c2 = { x: q.x + tb.x * reach, y: q.y + tb.y * reach };

    const points: { x: number; y: number; z: number }[] = [];

    const lift =
      loop *
      (a.plugged && b.plugged ? 0.9 : a.plugged || b.plugged ? 0.5 : 0.08);

    for (let i = 0; i <= 40; i++) {
      const t = i / 40,
        u = 1 - t;

      points.push({
        x:
          u * u * u * p.x +
          3 * u * u * t * c1.x +
          3 * u * t * t * c2.x +
          t * t * t * q.x,
        y:
          u * u * u * p.y +
          3 * u * u * t * c1.y +
          3 * u * t * t * c2.y +
          t * t * t * q.y,
        z: a.z * u + b.z * t + lift * Math.sin(Math.PI * t),
      });
    }

    return { points, a, b };
  };

  const line = (points: { x: number; y: number }[]) =>
    `M${points.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join("L")}`;

  /** One end's housing (and pin), drawn at its place. */
  const drawEnd = (
    group: SVGElement,
    shadow: SVGElement,
    e: ReturnType<typeof where>,
    color: string,
  ) => {
    group.replaceChildren();
    const s = housing.side;

    if (e.plugged) {
      // Upright in its hole: from above, the square top of the housing.
      group.append(
        node("rect", {
          x: e.x - s / 2,
          y: e.y - s / 2,
          width: s,
          height: s,
          rx: 0.6,
          fill: `url(#jumper-cap-${color})`,
          stroke: "#000",
          "stroke-width": 0.4,
        }),
      );

      const ox = deskLight.x * housing.long,
        oy = deskLight.y * housing.long;

      // Its shadow: the standing housing cast along the light.
      shadow.setAttribute(
        "d",
        `M${e.x - s / 2} ${e.y - s / 2}l${s} 0l${ox} ${oy}l0 ${s}l${-s} 0l${-ox} ${-oy}Z`,
      );

      return;
    }

    const cos = Math.cos(e.turn),
      sin = Math.sin(e.turn);

    const box = node("g", {
      transform: `translate(${e.x} ${e.y}) rotate(${(e.turn * 180) / Math.PI})`,
    });

    // The housing from the end back toward the wire; the pin out beyond it.
    box.append(
      node("rect", {
        x: 0.5,
        y: -0.35,
        width: housing.pin,
        height: 0.7,
        rx: 0.3,
        fill: "#d9d6cd",
      }),
      node("rect", {
        x: 0.5,
        y: -0.12,
        width: housing.pin,
        height: 0.18,
        fill: "#fff",
        opacity: 0.6,
      }),
      node("rect", {
        x: -housing.long,
        y: -s / 2,
        width: housing.long + 0.6,
        height: s,
        rx: 0.8,
        fill: `url(#jumper-housing-${color})`,
      }),
    );

    group.append(box);
    const lift = e.z + s / 2;

    const ox = deskLight.x * lift,
      oy = deskLight.y * lift;

    const corners = [
      [-housing.long, -s / 2],
      [housing.pin, -s / 2],
      [housing.pin, s / 2],
      [-housing.long, s / 2],
    ].map(
      ([u, v]) =>
        `${(e.x + u! * cos - v! * sin + ox).toFixed(1)} ${(e.y + u! * sin + v! * cos + oy).toFixed(1)}`,
    );

    shadow.setAttribute("d", `M${corners.join("L")}Z`);
  };

  const draw = (wire: Wire) => {
    const { points, a, b } = centreLine(wire);
    const path = line(points);

    for (const name of ["base", "body", "hit"])
      wire.parts[name]!.setAttribute("d", path);

    // The highlight runs along the side facing the light.
    const toward = { x: -deskLight.x, y: -deskLight.y },
      len = Math.hypot(toward.x, toward.y) || 1;

    const shift = (thickness * 0.22) / len;

    wire.parts.shine!.setAttribute(
      "d",
      line(
        points.map((p) => ({
          x: p.x + toward.x * shift,
          y: p.y + toward.y * shift,
        })),
      ),
    );

    wire.parts.shadow!.setAttribute(
      "d",
      line(
        points.map((p) => ({
          x: p.x + deskLight.x * p.z,
          y: p.y + deskLight.y * p.z,
        })),
      ),
    );

    drawEnd(wire.parts.endA!, wire.parts.shadowA!, a, wire.color);
    drawEnd(wire.parts.endB!, wire.parts.shadowB!, b, wire.color);

    wire.handles.forEach((handle, i) => {
      const e = i ? b : a;

      // Upright: its square top; lying: from the pin tip back along the housing.
      const cos = Math.cos(e.turn),
        sin = Math.sin(e.turn);

      handle.setAttribute(
        "d",
        e.plugged
          ? `M${e.x - 0.01} ${e.y}L${e.x + 0.01} ${e.y}`
          : `M${e.x + cos * housing.pin} ${e.y + sin * housing.pin}L${e.x - cos * housing.long} ${e.y - sin * housing.long}`,
      );
    });
  };

  /** A wire plugged into a board lies on it: drawn just above the board
   * (whatever its layer), and a loose end the board pulls further than the
   * wire reaches is dragged along with it. */
  const settle = (wire: Wire) => {
    const plugged = wire.ends.find((end) => end.plug)?.plug;

    const item =
      plugged &&
      canvas.querySelector<HTMLElement>(`[data-movable-id="${plugged.board}"]`);

    if (item) {
      wire.svg.style.zIndex = String(
        (Number(getComputedStyle(item).zIndex) || 0) + 1,
      );

      // Counted as a desk layer, so whatever is laid later goes above it.
      wire.svg.dataset.deskLayer = "";
    }

    if (grab?.wire === wire) return;

    for (const i of [0, 1] as const) {
      const end = wire.ends[i]!,
        other = where(wire, (1 - i) as 0 | 1);

      if (!end.loose || !other.plugged) continue;
      const reach = length + housing.long;
      const d = Math.hypot(end.loose.x - other.x, end.loose.y - other.y);

      if (d > reach) {
        end.loose.x = other.x + ((end.loose.x - other.x) * reach) / d;
        end.loose.y = other.y + ((end.loose.y - other.y) * reach) / d;

        end.loose.turn = Math.atan2(
          end.loose.y - other.y,
          end.loose.x - other.x,
        );
      }
    }
  };

  const drawAll = () =>
    wires.forEach((wire) => {
      settle(wire);
      draw(wire);
    });

  // --- placement, saving ---------------------------------------------------------
  const save = () => {
    const box = canvasBox();

    const data = Object.fromEntries(
      wires.map((wire) => [
        wire.color,
        wire.ends.map((end) =>
          end.plug
            ? { plug: end.plug }
            : {
                x: (end.loose?.x ?? 0) / box.width,
                y: (end.loose?.y ?? 0) / box.height,
                turn: end.loose?.turn ?? 0,
              },
        ),
      ]),
    );

    try {
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch {
      /* Optional persistence. */
    }
  };

  /** As authored: red across the board from a rail, green from the board
   * out onto the desk, blue lying loose beside it. */
  const defaults = () => {
    const id = boards()[0] ? boardId(boards()[0]!) : "";

    const index = (name: string, nth = 0) =>
      holeList.map((h, i) => [h, i] as const).filter(([h]) => h.name === name)[
        nth
      ]?.[1] ?? 0;

    // Laid out from the board's middle (on the page, x along it, y down).
    const svg = boards()[0],
      m = svg?.getScreenCTM(),
      box = canvasBox();

    const at = (x: number, y: number) => {
      const p = m
        ? new DOMPoint(x, y).matrixTransform(m)
        : new DOMPoint(200 + x, 200 + y);

      return { x: p.x - (m ? box.left : 0), y: p.y - (m ? box.top : 0) };
    };

    const loose = (x: number, y: number, turn: number): End => ({
      loose: { ...at(x, y), turn },
    });

    const plug = (hole: number): End => ({ plug: { board: id, hole } });

    const [red, green, blue] = ["red", "green", "blue"].map((c) =>
      wires.find((w) => w.color === c),
    );

    if (red && id)
      red.ends = [plug(index("upper + rail", 2)), plug(index("j18"))];

    if (green && id) green.ends = [plug(index("c24")), loose(150, 95, 0.5)];

    if (blue)
      blue.ends = [loose(-120, 44, Math.PI + 0.1), loose(60, 47, -0.05)];
  };

  const restore = () => {
    defaults();

    try {
      const data = JSON.parse(
        localStorage.getItem(storageKey) ?? "null",
      ) as Record<string, (Plug | (Loose & { plug?: Plug }))[]> | null;

      const box = canvasBox();

      if (data)
        for (const wire of wires) {
          const saved = data[wire.color];
          if (!Array.isArray(saved) || saved.length !== 2) continue;

          wire.ends = saved.map(
            (end): End =>
              "plug" in end && end.plug
                ? { plug: end.plug }
                : {
                    loose: {
                      x: (end as Loose).x * box.width,
                      y: (end as Loose).y * box.height,
                      turn: (end as Loose).turn,
                    },
                  },
          ) as unknown as [End, End];
        }
    } catch {
      /* Optional persistence. */
    }

    drawAll();
  };

  // --- handling ------------------------------------------------------------------
  type Grab = {
    wire: Wire;
    i: 0 | 1 | null;
    id: number | null;
    x: number;
    y: number;
    before: [End, End];
    offset: { x: number; y: number }[];
  };

  let grab: Grab | null = null;

  const toCanvas = (clientX: number, clientY: number) => {
    const box = canvasBox();
    return { x: clientX - box.left, y: clientY - box.top };
  };

  const copy = (ends: [End, End]) =>
    ends.map((e) => ({ ...e, loose: e.loose && { ...e.loose } })) as [End, End];

  const pickUp = (
    wire: Wire,
    i: 0 | 1 | null,
    at: { x: number; y: number },
    id: number | null,
  ) => {
    canvas.dispatchEvent(new CustomEvent("desk:lay", { detail: wire.svg }));
    wire.svg.style.zIndex = "1000001";
    const ends = [where(wire, 0), where(wire, 1)];

    grab = {
      wire,
      i,
      id,
      x: at.x,
      y: at.y,
      before: copy(wire.ends),
      offset: ends.map((e) => ({ x: e.x - at.x, y: e.y - at.y })),
    };

    // Pulled out: the picked ends come out of their holes and lie (lifted).
    const moving = i === null ? [0, 1] : [i];

    for (const j of moving as (0 | 1)[]) {
      const e = ends[j]!,
        other = ends[1 - j]!;

      const turn = e.plugged
        ? Math.atan2(e.y - other.y, e.x - other.x)
        : e.turn;

      wire.ends[j] = { loose: { x: e.x, y: e.y, turn } };
    }

    wire.lifted = i;
    draw(wire);
  };

  const moveTo = (at: { x: number; y: number }) => {
    if (!grab) return;
    const { wire, i } = grab;
    const moving = (i === null ? [0, 1] : [i]) as (0 | 1)[];

    for (const j of moving) {
      const end = wire.ends[j]!;

      let x = at.x + grab.offset[j]!.x,
        y = at.y + grab.offset[j]!.y;

      // It can't be pulled further than its length from the other end.
      if (i !== null) {
        const other = where(wire, (1 - j) as 0 | 1);
        const d = Math.hypot(x - other.x, y - other.y);
        const reach = length + housing.long * (other.plugged ? 1 : 2);

        if (d > reach) {
          x = other.x + ((x - other.x) * reach) / d;
          y = other.y + ((y - other.y) * reach) / d;
        }

        end.loose = { x, y, turn: Math.atan2(y - other.y, x - other.x) };
      } else end.loose = { x, y, turn: end.loose?.turn ?? 0 };
    }

    draw(wire);
  };

  const putDown = () => {
    if (!grab) return;
    const { wire, i } = grab;
    grab = null;
    wire.lifted = null;
    const plugged: string[] = [];

    for (const j of (i === null ? [0, 1] : [i]) as (0 | 1)[]) {
      const end = wire.ends[j]!;
      if (!end.loose) continue;
      const plug = holeNear(end.loose.x, end.loose.y, end);

      if (plug) {
        wire.ends[j] = { plug };
        plugged.push(holeList[plug.hole]!.name);
      }
    }

    // Put down, it lies on top of what is there now, under what comes later.
    // (Not counting the lift it was carried at.)
    wire.svg.style.removeProperty("z-index");
    delete wire.svg.dataset.deskLayer;
    canvas.dispatchEvent(new CustomEvent("desk:lay", { detail: wire.svg }));
    draw(wire);
    save();

    announce(
      plugged.length
        ? `${wire.color} jumper wire plugged into ${plugged.join(" and ")}.`
        : `${wire.color} jumper wire put down on the desk.`,
    );
  };

  const cancelGrab = () => {
    if (!grab) return;
    const { wire, before } = grab;
    grab = null;
    wire.lifted = null;
    wire.ends = before;
    wire.svg.style.removeProperty("z-index");
    delete wire.svg.dataset.deskLayer;
    canvas.dispatchEvent(new CustomEvent("desk:lay", { detail: wire.svg }));
    draw(wire);
    announce(`${wire.color} jumper wire move cancelled.`);
  };

  canvas.addEventListener(
    "pointerdown",
    (event) => {
      if (event.button !== 0 || !event.isPrimary || grab) return;
      const target = event.target instanceof Element ? event.target : null;
      const wire = wires.find((w) => w.svg.contains(target));
      if (!wire || !target) return;
      const i = wire.handles.indexOf(target as SVGPathElement);
      event.preventDefault();
      event.stopPropagation();

      pickUp(
        wire,
        i === -1 ? null : (i as 0 | 1),
        toCanvas(event.clientX, event.clientY),
        event.pointerId,
      );

      (target as SVGElement).setPointerCapture?.(event.pointerId);
      document.documentElement.style.cursor = "grabbing";
    },
    true,
  );

  window.addEventListener("pointermove", (event) => {
    if (grab?.id !== event.pointerId) return;
    moveTo(toCanvas(event.clientX, event.clientY));
  });

  window.addEventListener("pointerup", (event) => {
    if (grab?.id !== event.pointerId) return;
    document.documentElement.style.removeProperty("cursor");
    putDown();
  });

  window.addEventListener("pointercancel", (event) => {
    if (grab?.id === event.pointerId) cancelGrab();
  });

  // Keyboard: Enter/Space picks an end up or puts it down; arrows move it a
  // hole (2.54 mm) at a time, Shift for ten; Escape cancels.
  window.addEventListener(
    "keydown",
    (event) => {
      const wire = wires.find((w) =>
        w.handles.includes(event.target as SVGPathElement),
      );

      if (event.key === "Escape" && grab && grab.id === null) {
        event.preventDefault();
        cancelGrab();
        return;
      }

      if (!wire) return;
      const i = wire.handles.indexOf(event.target as SVGPathElement) as 0 | 1;

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();

        if (grab) putDown();
        else {
          const e = where(wire, i);
          pickUp(wire, i, { x: e.x, y: e.y }, null);

          announce(
            `${wire.color} jumper wire end picked up. Arrow keys to move, Enter to put down or plug in, Escape to cancel.`,
          );
        }

        return;
      }

      const step = {
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
      }[event.key];

      if (!step || !grab || grab.id !== null) return;
      event.preventDefault();
      const e = where(grab.wire, grab.i ?? 0);
      const by = board.pitch * k * (event.shiftKey ? 10 : 1);

      grab.offset = [
        { x: 0, y: 0 },
        { x: 0, y: 0 },
      ];

      moveTo({ x: e.x + step[0]! * by, y: e.y + step[1]! * by });
    },
    true,
  );

  // A wire is not a sheet: clicking it never flips, toggles or follows anything.
  canvas.addEventListener(
    "click",
    (event) => {
      if (wires.some((w) => w.svg.contains(event.target as Node))) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true,
  );

  // Plugged ends ride with the board; everything follows the layout.
  let frame = 0;

  const follow = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(drawAll);
  };

  for (const name of [
    "desk:layout-changed",
    "desk:settled",
    "desk:folder-toggle",
  ])
    canvas.addEventListener(name, follow);

  window.addEventListener("resize", follow);

  canvas.querySelector("[data-desk-reset]")?.addEventListener("click", () => {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      /* Optional persistence. */
    }

    requestAnimationFrame(() => {
      defaults();
      drawAll();
    });
  });

  // After the board has its saved place.
  requestAnimationFrame(() => requestAnimationFrame(restore));
}
