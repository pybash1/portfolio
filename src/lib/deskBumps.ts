import { clippedUnit } from "./deskUnits";
import { deskRays, rayOpacity, shadowInk, toScreen } from "./rayShadow";

/** Paper lying on a gem clip or a fridge magnet is lifted by it: the covering
 * sheet (or folder face) shows a bump in the hardware's own shape, ray-traced
 * from the desk light like every other shadow:
 *  - shading: the bump's height map (the hardware's silhouette, blurred into the
 *    paper's drape) is lit from several rays sampled across the light's disc and
 *    averaged; flat paper is neutral, brighter slopes get a white highlight and
 *    darker ones shadow ink (plain alpha painting, no blend modes);
 *  - cast shadow: the raised paper casts onto the paper around it, its outline
 *    displaced along every sampled ray by the rise (Pshadow = P + ray·z).
 * A sheet being carried presses on nothing: dents form once it is put down.
 * During a flip a lifted, turning sheet presses on nothing either: dents fade
 * as sheets lift, hand over to the sheet that will be on top at the half-turn,
 * and are fully formed again exactly as the sheets land. */
const NS = "http://www.w3.org/2000/svg";

// How far the paper rises over each kind, and how wide it drapes (CSS px).
// Paper laid loosely over something tents broadly; its slopes stay gentle.
const kinds = {
  // Paper over a clip shows a vague rise where something lies underneath, not
  // the wire's imprint: the clip's overall footprint, broadly draped.
  clip: {
    rise: 3,
    drape: 9,
    region: [-80, -80, 236, 300],
    body: (shape: string) =>
      shape === "triangle"
        ? ([
            "polygon",
            {
              points: "14,12 62,12 38,122",
              fill: "#000",
              stroke: "#000",
              "stroke-width": 8,
              "stroke-linejoin": "round",
            },
          ] as const)
        : ([
            "rect",
            { x: 15, y: 6, width: 36, height: 124, rx: 18, fill: "#000" },
          ] as const),
  },
  magnet: {
    rise: 7,
    drape: 12,
    region: [-130, -130, 360, 360],
    body: () => ["circle", { cx: 50, cy: 50.6, r: 44, fill: "#000" }] as const,
  },
  // A pen is a long round bar: paper over it tents along its length.
  pen: {
    rise: 9,
    drape: 12,
    region: [-90, -90, 472, 180],
    body: () =>
      [
        "rect",
        { x: 0, y: -9, width: 292, height: 18, rx: 9, fill: "#000" },
      ] as const,
  },
  // A breadboard is a low block: paper over it is lifted flat with soft edges.
  breadboard: {
    rise: 14,
    drape: 14,
    region: [-240, -120, 480, 240],
    body: () =>
      [
        "rect",
        {
          x: -172.8,
          y: -57.1,
          width: 345.6,
          height: 114.3,
          rx: 2.5,
          fill: "#000",
        },
      ] as const,
  },
};

const hosts =
  "[data-folder-inside], [data-folder-exterior], [data-map-front], [data-map-back], [data-clip-surface]";

type Shape = {
  kind: keyof typeof kinds;
  ctm: DOMMatrix;
  points: DOMPoint[];
  d: string;
};

type Overlay = {
  layers: HTMLElement[];
  host: HTMLElement;
  local: DOMMatrix;
  ctm: DOMMatrix;
};

export function initializeBumps(canvas: HTMLElement) {
  if (canvas.dataset.bumpsReady) return;
  canvas.dataset.bumpsReady = "true";

  let frame = 0,
    count = 0;

  const overlays = new Map<Element, Overlay>();

  const schedule = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(update);
  };

  for (const name of [
    "desk:layout-changed",
    "desk:holds-changed",
    "desk:folder-toggle",
    "desk:raise",
  ])
    canvas.addEventListener(name, schedule);

  window.addEventListener("resize", schedule);

  // Zero-sized probes give a host's local px → screen map, rotated or mirrored.
  const probes = new WeakMap<HTMLElement, HTMLElement[]>();

  const frameOf = (host: HTMLElement) => {
    let points = probes.get(host);

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

        host.append(point);
        return point;
      });

      probes.set(host, points);
    }

    const [o, a, b] = points.map((point) => point.getBoundingClientRect());

    const style = getComputedStyle(host),
      w = parseFloat(style.width) || 1,
      h = parseFloat(style.height) || 1;

    return new DOMMatrix([
      (a!.x - o!.x) / w,
      (a!.y - o!.y) / w,
      (b!.x - o!.x) / h,
      (b!.y - o!.y) / h,
      o!.x,
      o!.y,
    ]);
  };

  /** The folder's whole silhouette (the die-cut outline of each of its
   * faces, unioned) as a CSS clip path in `face`'s local px. Shut, the cover
   * is cut narrower than the leaf under it, so a dent must reach past the
   * cover's own outline to the card that shows beyond it. */
  const outlineIn = (face: HTMLElement) => {
    const folder = face.closest("[data-work-folder]");
    const toFace = frameOf(face).inverse();
    const shapes: string[] = [];

    for (const stock of folder?.querySelectorAll<SVGSVGElement>(
      "[data-folder-inside] > [data-folder-stock], [data-folder-exterior] > [data-folder-stock]",
    ) ?? []) {
      const path = stock.querySelector<SVGPathElement>("clipPath path");
      const m = stock.getScreenCTM();
      if (!path || !m || Math.abs(m.a * m.d - m.b * m.c) < 1e-3) continue;

      const toLocal = toFace.multiply(
        new DOMMatrix([m.a, m.b, m.c, m.d, m.e, m.f]),
      );

      const length = path.getTotalLength();
      const points: DOMPoint[] = [];

      for (let i = 0; i < 160; i++) {
        const at = path.getPointAtLength((length * i) / 160);
        points.push(new DOMPoint(at.x, at.y).matrixTransform(toLocal));
      }

      // Same winding for every outline, so overlapping ones unite (nonzero).
      const area = points.reduce((sum, p, i) => {
        const q = points[(i + 1) % points.length]!;
        return sum + p.x * q.y - q.x * p.y;
      }, 0);

      if (area < 0) points.reverse();

      shapes.push(
        `M${points.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join("L")}Z`,
      );
    }

    return shapes.length ? `path(nonzero, "${shapes.join("")}")` : null;
  };

  /** The hardware's user space → screen, its kind, and points along it. */
  const describe = (hardware: Element): Shape | null => {
    if (hardware.matches("[data-desk-magnet]")) {
      const ctm = hardware
        .querySelector<SVGSVGElement>("[data-magnet-shadow]")
        ?.getScreenCTM();

      if (!ctm) return null;

      return {
        kind: "magnet",
        ctm,
        d: "",
        points: [
          [50, 50.6],
          [22, 50.6],
          [78, 50.6],
          [50, 22],
          [50, 78],
        ].map(([x, y]) => new DOMPoint(x, y).matrixTransform(ctm)),
      };
    }

    if (hardware.matches("[data-breadboard]")) {
      const ctm = (hardware as SVGSVGElement).getScreenCTM();
      if (!ctm) return null;

      return {
        kind: "breadboard",
        ctm,
        d: "",
        points: [-140, -70, 0, 70, 140].flatMap((x) =>
          [-35, 35].map((y) => new DOMPoint(x, y).matrixTransform(ctm)),
        ),
      };
    }

    if (hardware.matches("[data-pen]")) {
      const ctm = (hardware as SVGSVGElement).getScreenCTM();
      if (!ctm) return null;

      return {
        kind: "pen",
        ctm,
        d: "",
        points: [20, 70, 120, 170, 220, 270].map((x) =>
          new DOMPoint(x, 0).matrixTransform(ctm),
        ),
      };
    }

    const ctm = (hardware as SVGSVGElement).getScreenCTM(),
      wire = hardware.querySelector<SVGPathElement>("[data-gem-rear] path");

    if (!ctm || !wire) return null;
    const length = wire.getTotalLength();

    const points = [0.1, 0.25, 0.4, 0.55, 0.7, 0.85].map((t) => {
      const at = wire.getPointAtLength(length * t);
      return new DOMPoint(at.x, at.y).matrixTransform(ctm);
    });

    return {
      kind: "clip",
      ctm,
      d: (hardware as SVGSVGElement).dataset.shape ?? "gem",
      points,
    };
  };

  const itemOf = (element: Element) =>
    element.closest<HTMLElement>("[data-movable-item]");

  const carried = (element: Element) => !!element.closest("[data-lifted]");
  const zOf = (item: HTMLElement) => Number(getComputedStyle(item).zIndex) || 0;

  /** Sheets lying over the hardware, topmost first, with the host face touched. */
  const coversOf = (hardware: Element, points: DOMPoint[]) => {
    const own = itemOf(hardware);
    const votes = new Map<HTMLElement, number>();

    for (const point of points) {
      const stack = document.elementsFromPoint(point.x, point.y);
      const at = stack.findIndex((element) => hardware.contains(element));
      if (at <= 0) continue;

      for (const element of stack.slice(0, at)) {
        if (element.closest("[data-hardware], [data-bump-layer]")) continue;
        const item = itemOf(element);

        // A sheet being carried over it is in the air: look past it.
        if (
          !item ||
          item === own ||
          item.closest("[data-desk-canvas]") !== canvas ||
          carried(item)
        )
          continue;

        const found = element.closest<HTMLElement>(hosts);

        // Inside the folder, the papers tucked in its leaf are lifted with the
        // card under them: the dent is drawn on the whole folder face, not cut
        // off at the edge of one insert's box (its papers overhang it).
        const host =
          found?.parentElement?.closest<HTMLElement>(
            "[data-folder-inside], [data-folder-exterior]",
          ) ?? found;

        if (!host || !item.contains(host)) continue;
        votes.set(host, (votes.get(host) ?? 0) + 1);
        break;
      }
    }

    return [...votes].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  };

  const svgNode = (
    tag: string,
    attributes: Record<string, string | number>,
  ) => {
    const node = document.createElementNS(NS, tag);

    for (const [k, v] of Object.entries(attributes))
      node.setAttribute(k, String(v));

    return node;
  };

  /** Build a dent: hardware user units → host px is `local`; `ctm` (user →
   * screen, as it will rest) aims the light rays in the hardware's own units. */
  function build(
    shape: Shape,
    host: HTMLElement,
    local: DOMMatrix,
    ctm: DOMMatrix,
  ) {
    const kind = kinds[shape.kind];
    const back = ctm.inverse();
    const unitsPerPx = 1 / Math.sqrt(Math.abs(ctm.a * ctm.d - ctm.b * ctm.c));

    const toLocal = (x: number, y: number) => ({
      x: back.a * x + back.c * y,
      y: back.b * x + back.d * y,
    });

    const [rx, ry, rw, rh] = kind.region;

    const region = {
      filterUnits: "userSpaceOnUse",
      x: rx!,
      y: ry!,
      width: rw!,
      height: rh!,
      "color-interpolation-filters": "sRGB",
    };

    const layer = (blend: string) => {
      const div = document.createElement("div");
      div.dataset.bumpLayer = "";
      div.setAttribute("aria-hidden", "true");

      Object.assign(div.style, {
        position: "absolute",
        inset: "0",
        overflow: "hidden",
        pointerEvents: "none",
        mixBlendMode: blend,
        zIndex: "1000000",
      });

      const svg = svgNode("svg", {
        width: 1,
        height: 1,
        overflow: "visible",
      }) as SVGSVGElement;

      Object.assign(svg.style, {
        position: "absolute",
        left: "0",
        top: "0",
        overflow: "visible",
        transformOrigin: "0 0",
        transform: local.toString(),
      });

      div.append(svg);
      return { div, svg };
    };

    const body = (filter: string) => {
      const [tag, attributes] = kind.body(shape.d);
      return svgNode(tag, { ...attributes, filter: `url(#${filter})` });
    };

    // Shading: the drape lit by rays sampled across the light disc, averaged.
    const shadeId = `bump-${++count}`;
    const shade = svgNode("filter", { id: shadeId, ...region });

    shade.append(
      svgNode("feGaussianBlur", {
        in: "SourceAlpha",
        stdDeviation: (kind.drape * unitsPerPx).toFixed(3),
        result: "h",
      }),
    );

    const all = deskRays(kind.rise);

    const lights = [0, 0.33, 0.66, 0.99].map(
      (t) => all[Math.min(all.length - 1, Math.floor(t * all.length))]!,
    );

    lights.forEach((ray, i) => {
      const toward = toLocal(-ray.x, -ray.y);
      const elevation = Math.atan(1 / Math.hypot(ray.x, ray.y));

      const lighting = svgNode("feDiffuseLighting", {
        in: "h",
        surfaceScale: (kind.rise * unitsPerPx).toFixed(3),
        diffuseConstant: (0.5 / Math.sin(elevation)).toFixed(4),
        "lighting-color": "#fff",
        result: `l${i}`,
      });

      lighting.append(
        svgNode("feDistantLight", {
          azimuth: ((Math.atan2(toward.y, toward.x) * 180) / Math.PI).toFixed(
            2,
          ),
          elevation: ((elevation * 180) / Math.PI).toFixed(2),
        }),
      );

      shade.append(lighting);
    });

    // Averaged light: 0.5 on flat paper. Above that, paint a white highlight;
    // below, shadow ink, each more opaque the further from flat. No blend modes
    // (they silently fail inside 3D-transformed or separately composited layers).
    const k = 0.45,
      [ir, ig, ib] = [0, 0, 0];

    shade.append(
      svgNode("feComposite", {
        in: "l0",
        in2: "l1",
        operator: "arithmetic",
        k2: 0.5,
        k3: 0.5,
        result: "a",
      }),
      svgNode("feComposite", {
        in: "l2",
        in2: "l3",
        operator: "arithmetic",
        k2: 0.5,
        k3: 0.5,
        result: "b",
      }),
      svgNode("feComposite", {
        in: "a",
        in2: "b",
        operator: "arithmetic",
        k2: 0.5,
        k3: 0.5,
        result: "lit",
      }),
      svgNode("feColorMatrix", {
        in: "lit",
        type: "matrix",
        result: "hi",
        values: `0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  ${2 * k} 0 0 0 ${-k}`,
      }),
      svgNode("feColorMatrix", {
        in: "lit",
        type: "matrix",
        result: "lo",
        values: `0 0 0 0 ${ir.toFixed(3)}  0 0 0 0 ${ig.toFixed(3)}  0 0 0 0 ${ib.toFixed(3)}  ${-2 * k} 0 0 0 ${k}`,
      }),
    );

    const both = svgNode("feMerge", {});

    both.append(
      svgNode("feMergeNode", { in: "lo" }),
      svgNode("feMergeNode", { in: "hi" }),
    );

    shade.append(both);
    const shading = layer("normal");
    const shadeDefs = svgNode("defs", {});
    shadeDefs.append(shade);
    shading.svg.append(shadeDefs, body(shadeId));

    // Cast shadow: the raised paper, displaced along every sampled ray.
    const castId = `bump-${++count}`;
    const cast = svgNode("filter", { id: castId, ...region });

    cast.append(
      svgNode("feGaussianBlur", {
        in: "SourceAlpha",
        stdDeviation: (kind.drape * 0.8 * unitsPerPx).toFixed(3),
        result: "raised",
      }),
      svgNode("feComponentTransfer", { in: "raised", result: "faint" }),
    );

    // A loosely draped sheet occludes far less than a solid object: a faint umbra.
    (cast.lastElementChild as SVGElement).append(
      svgNode("feFuncA", {
        type: "linear",
        slope: (rayOpacity(all.length) * 0.45).toFixed(5),
      }),
    );

    all.forEach((ray, i) => {
      const o = toLocal(ray.x * kind.rise, ray.y * kind.rise);

      cast.append(
        svgNode("feOffset", {
          in: "faint",
          dx: o.x.toFixed(3),
          dy: o.y.toFixed(3),
          result: `r${i}`,
        }),
      );
    });

    const merge = svgNode("feMerge", { result: "rays" });

    all.forEach((_, i) =>
      merge.append(svgNode("feMergeNode", { in: `r${i}` })),
    );

    cast.append(
      merge,
      // Only where it falls beyond the raised paper itself.
      svgNode("feComposite", {
        in: "rays",
        in2: "raised",
        operator: "out",
        result: "fall",
      }),
      svgNode("feFlood", { "flood-color": shadowInk }),
      svgNode("feComposite", { in2: "fall", operator: "in" }),
    );

    const casting = layer("normal");
    const castDefs = svgNode("defs", {});
    castDefs.append(cast);
    casting.svg.append(castDefs, body(castId));

    const layers = [shading.div, casting.div];
    // On a folder face the dent runs right up to the card's die-cut edge
    // (its tab overhangs the face's box): clipped to that outline, not the box.
    const cut = host.matches("[data-folder-inside], [data-folder-exterior]")
      ? outlineIn(host)
      : null;

    if (cut)
      layers.forEach((div) => {
        div.style.overflow = "visible";
        div.style.clipPath = cut;
      });

    layers.forEach((div) => host.append(div));
    return layers;
  }

  // The same dent (within half a pixel, and the same light) needs no rebuild:
  // a dent planned before a turn is kept when the settled desk agrees with it.
  const same = (a: DOMMatrix, b: DOMMatrix) =>
    [a.a - b.a, a.b - b.b, a.c - b.c, a.d - b.d].every(
      (v) => Math.abs(v) < 2e-3,
    ) && Math.hypot(a.e - b.e, a.f - b.f) < 0.5;

  const place = (
    hardware: Element,
    shape: Shape,
    host: HTMLElement,
    local: DOMMatrix,
    ctm: DOMMatrix,
    fade: "in" | "none" | number,
  ) => {
    const existing = overlays.get(hardware);

    const direction = (m: DOMMatrix) =>
      new DOMMatrix([m.a, m.b, m.c, m.d, 0, 0]);

    if (
      existing &&
      existing.host === host &&
      same(existing.local, local) &&
      same(direction(existing.ctm), direction(ctm))
    )
      return existing;

    existing?.layers.forEach((layer) => layer.remove());
    const layers = build(shape, host, local, ctm);

    // Which hardware this dent belongs to (for inspection).
    const tagged = hardware as HTMLElement | SVGElement;
    tagged.dataset.bumpId ||= String(++count);

    layers.forEach((layer) => {
      layer.dataset.bumpFor = tagged.dataset.bumpId!;
    });

    // A new dent eases in as the sheet settles; a rebuild of the same one swaps silently.
    if (fade === "in" && !(existing && existing.host === host)) {
      layers.forEach((layer) => {
        layer.style.opacity = "0";
        layer.style.transition = "opacity .25s ease-out";
      });

      requestAnimationFrame(() =>
        requestAnimationFrame(() =>
          layers.forEach((layer) => {
            layer.style.opacity = "1";
          }),
        ),
      );
    } else if (typeof fade === "number")
      layers.forEach((layer) => {
        layer.style.opacity = String(fade);
      });

    const overlay = { layers, host, local, ctm };
    overlays.set(hardware, overlay);
    return overlay;
  };

  const drop = (hardware: Element) => {
    overlays.get(hardware)?.layers.forEach((layer) => layer.remove());
    overlays.delete(hardware);
  };

  const everyHardware = () =>
    [
      ...canvas.querySelectorAll(
        "[data-gem-clip], [data-desk-magnet], [data-pen], [data-breadboard]",
      ),
    ].filter(
      (hardware) =>
        !hardware.closest("[data-work-folder]") &&
        getComputedStyle(hardware).visibility === "visible",
    );

  /** Hardware shut inside a closed folder (on a leaf's inside or an insert):
   * it lifts the cover lying over it. */
  const shutIn = () =>
    [
      ...canvas.querySelectorAll<HTMLElement>(
        '[data-work-folder][data-open="false"][data-fold-rest="closed"]',
      ),
    ].flatMap((folder) => {
      const cover = folder.querySelector<HTMLElement>(
        `[data-folder-leaf="${folder.dataset.foldSide}"] [data-folder-exterior]`,
      );

      if (!cover) return [];

      return [
        ...folder.querySelectorAll(
          "[data-gem-clip], [data-desk-magnet], [data-pen], [data-breadboard]",
        ),
      ]
        .filter(
          (hardware) =>
            hardware.closest("[data-folder-inside]") &&
            !hardware.closest("[data-folder-exterior]"),
        )
        .map((hardware) => ({ hardware, host: cover }));
    });

  let turn: {
    involved: Set<Element>;
    rigid: Set<Element>;
    plan: {
      hardware: Element;
      shape: Shape;
      host: HTMLElement | null;
      local: DOMMatrix;
      ctm: DOMMatrix;
    }[];
    swapped: boolean;
  } | null = null;

  function update() {
    // Up close (deskFocus) the stacking is not the desk's: dents wait.
    if (canvas.dataset.deskFocused !== undefined) return;

    // Mid-fold or mid-flip, surfaces are tilted: settled dents are recomputed after.
    if (
      turn ||
      canvas.querySelector(
        '[data-turning], [data-work-folder][data-animating="true"]',
      )
    )
      return;

    const seen = new Set<Element>();

    for (const hardware of everyHardware()) {
      const shape = describe(hardware);
      const host = shape && coversOf(hardware, shape.points);
      if (!shape || !host || carried(hardware)) continue;
      seen.add(hardware);

      const overlay = place(
        hardware,
        shape,
        host,
        frameOf(host).inverse().multiply(shape.ctm),
        shape.ctm,
        "in",
      );

      // A dent let go during a fold or flip forms again once the sheet lies still.
      overlay.layers.forEach((layer) => {
        if (
          layer.style.opacity &&
          layer.style.opacity !== "1" &&
          layer.style.transition === "none"
        ) {
          layer.style.transition = "opacity .25s ease-out";
          layer.style.opacity = "1";
        }
      });
    }

    for (const { hardware, host } of shutIn()) {
      const shape = describe(hardware);
      if (!shape) continue;
      seen.add(hardware);

      place(
        hardware,
        shape,
        host,
        frameOf(host).inverse().multiply(shape.ctm),
        shape.ctm,
        "in",
      );
    }

    for (const hardware of [...overlays.keys()])
      if (!seen.has(hardware)) drop(hardware);
  }

  /** Before a turn, with everything at rest: which sheet will lie over each
   * piece of hardware afterwards, and where. The turning stack is reflected
   * across the axis and its order reverses, landing above everything else. */
  function plan(
    stack: HTMLElement[],
    point: { x: number; y: number },
    axis: { x: number; y: number },
    mapSheet: HTMLElement | null,
  ) {
    const length = Math.hypot(axis.x, axis.y) || 1,
      n = { x: -axis.y / length, y: axis.x / length };

    const mirror = new DOMMatrix()
      .translate(point.x, point.y)
      .multiply(
        new DOMMatrix([
          1 - 2 * n.x * n.x,
          -2 * n.x * n.y,
          -2 * n.x * n.y,
          1 - 2 * n.y * n.y,
          0,
          0,
        ]),
      )
      .translate(-point.x, -point.y);

    const members = new Set(stack);

    const involved = new Set<Element>(),
      rigid = new Set<Element>();

    const steps: NonNullable<typeof turn>["plan"] = [];
    const mapFaceUp = mapSheet?.dataset.facing !== "back";

    for (const hardware of everyHardware()) {
      const shape = describe(hardware);
      if (!shape) continue;

      const own = itemOf(hardware),
        inStack = !!own && members.has(own);

      // Hardware riding the stack is pressed by the same sheets all the way round.
      if (inStack) rigid.add(hardware);

      // A clip binding the turning stack is re-seated on its new top sheet at the
      // half-turn: it lies over the stack, never under it, so it never dents it.
      if (
        hardware.matches("[data-gem-clip][data-bind-home]") &&
        members.has(
          canvas.querySelector<HTMLElement>(
            `[data-movable-id="${(hardware as SVGElement).dataset.bindHome}"]`,
          )!,
        )
      ) {
        if (overlays.has(hardware)) {
          involved.add(hardware);

          steps.push({
            hardware,
            shape,
            host: null,
            local: new DOMMatrix(),
            ctm: shape.ctm,
          });
        }

        continue;
      }

      // Which stack members will overlap it. Hardware riding the stack turns
      // with it, so today's overlaps hold. Hardware lying still is covered after
      // the turn by whatever now covers its mirror image (the turn mirrors the stack).
      const over = new Set<HTMLElement>();

      const probe = inStack
        ? shape.points
        : shape.points.map((point) => point.matrixTransform(mirror));

      for (const p of probe)
        for (const element of document.elementsFromPoint(p.x, p.y)) {
          const item = itemOf(element);

          if (
            item &&
            members.has(item) &&
            item !== own &&
            !element.closest("[data-hardware], [data-bump-layer]")
          )
            over.add(item);
        }

      // After the turn: the lowest of those (relative to its own sheet, if it rides the stack) comes up on top.
      const candidates = [...over]
        .filter((item) => !inStack || zOf(item) < zOf(own!))
        .sort((a, b) => zOf(a) - zOf(b));

      const next = candidates[0] ?? null;
      const current = overlays.get(hardware);

      if (!next && !inStack && !(current && members.has(itemOf(current.host)!)))
        continue;

      involved.add(hardware);

      if (!next) {
        steps.push({
          hardware,
          shape,
          host: null,
          local: new DOMMatrix(),
          ctm: shape.ctm,
        });

        continue;
      }

      // The face of `next` that will be up, and its frame once landed.
      const map = next.querySelector<HTMLElement>("[data-map-sheet]");

      const face = map
        ? map.querySelector<HTMLElement>(
            mapFaceUp ? "[data-map-back]" : "[data-map-front]",
          )
        : next.querySelector<HTMLElement>("[data-clip-surface]");

      if (!face) continue;

      // The map turns in place: its other face lands exactly where this one lies.
      // Other sheets are mirrored across the axis.
      const landed = map
        ? frameOf(
            map.querySelector<HTMLElement>(
              mapFaceUp ? "[data-map-front]" : "[data-map-back]",
            )!,
          )
        : mirror.multiply(frameOf(face));

      // Hardware riding the stack turns with it; hardware below stays put.
      const ctm = inStack ? mirror.multiply(shape.ctm) : shape.ctm;

      const local = inStack
        ? frameOf(face).inverse().multiply(shape.ctm)
        : landed.inverse().multiply(shape.ctm);

      steps.push({ hardware, shape, host: face, local, ctm });
    }

    for (const [hardware, overlay] of overlays)
      if (members.has(itemOf(overlay.host)!) || involved.has(hardware))
        involved.add(hardware);

    turn = { involved, rigid, plan: steps, swapped: false };
  }

  // Hardware riding a turning stack stays pressed: its dent keeps its strength
  // and changes sheets at the half-turn, edge-on. Hardware lying still on the
  // desk is let go the moment a sheet lifts off it: its dent vanishes within the
  // first few degrees of lift and forms again only in the last few as the sheet
  // lands, so it is never seen away from the hardware it marks.
  const pressed = (flat: number) => {
    const t = Math.max(0, Math.min(1, (flat - 0.996) / 0.0035));
    return t * t * (3 - 2 * t);
  };

  canvas.addEventListener("desk:turn-progress", (event) => {
    if (!turn) return;
    const flat = Math.abs((event as CustomEvent<{ cos: number }>).detail.cos);

    const strength = (hardware: Element) =>
      turn!.rigid.has(hardware) ? 1 : pressed(flat);

    if (!turn.swapped && flat < 0.12) {
      turn.swapped = true;

      for (const step of turn.plan) {
        drop(step.hardware);

        if (step.host)
          place(
            step.hardware,
            step.shape,
            step.host,
            step.local,
            step.ctm,
            strength(step.hardware),
          );
      }
    }

    for (const hardware of turn.involved)
      overlays.get(hardware)?.layers.forEach((layer) => {
        layer.style.transition = "none";
        layer.style.opacity = String(strength(hardware));
      });
  });

  // A folder leaf folding over is in the air too: dents it carries for hardware
  // lying beneath it let go as it lifts (the folder's own hardware never dents).
  // Once folded over, the leaf lies somewhere else entirely: what it carried stays
  // hidden until the folder settles and its dents are worked out afresh.
  const folding = new Map<HTMLElement, number>();

  canvas.addEventListener("desk:turning", (event) => {
    const leaf =
      event.target instanceof HTMLElement &&
      event.target.matches("[data-folder-leaf]")
        ? event.target
        : null;

    if (!leaf) return;
    const cos = new DOMMatrix(getComputedStyle(leaf).transform).m11;
    if (!folding.has(leaf)) folding.set(leaf, Math.sign(cos) || 1);

    const strength =
      Math.sign(cos) === folding.get(leaf) ? pressed(Math.abs(cos)) : 0;

    for (const overlay of overlays.values())
      if (leaf.contains(overlay.host))
        overlay.layers.forEach((layer) => {
          layer.style.transition = "none";
          layer.style.opacity = String(strength);
        });
  });

  canvas.addEventListener("desk:folder-toggle", () => folding.clear());

  canvas.addEventListener("desk:flip", (event) => {
    const sheet = event.target instanceof HTMLElement ? event.target : null;

    const item = sheet && itemOf(sheet),
      rotator = sheet?.querySelector<HTMLElement>("[data-map-rotator]");

    if (!item || !rotator || item.dataset.pinned === "true") return;

    const r = rotator.getBoundingClientRect(),
      m = toScreen(rotator);

    plan(
      clippedUnit(canvas, item),
      { x: r.x + r.width / 2, y: r.y + r.height / 2 },
      { x: m.m21, y: m.m22 },
      sheet,
    );
  });

  canvas.addEventListener("desk:turn-start", (event) => {
    if (turn) return; // a map flip already planned this turn

    const { stack, point, axis } = (
      event as CustomEvent<{
        stack: HTMLElement[];
        point: { x: number; y: number };
        axis: { x: number; y: number };
      }>
    ).detail;

    plan(stack, point, axis, null);
  });

  canvas.addEventListener("desk:settled", () => {
    if (turn) {
      for (const hardware of turn.involved)
        overlays.get(hardware)?.layers.forEach((layer) => {
          layer.style.opacity = "1";
        });

      turn = null;
    }

    schedule();
  });

  schedule();
}
