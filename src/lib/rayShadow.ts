import {
  defaultFolderLight,
  folderLightRays,
  type FolderLight,
} from "./folderShadow";

/** One light for the whole desk: the folder's small area light, above-left.
 * Every cast shadow samples the same light disc, so direction, softness and
 * umbra agree between paper, hardware and the folder's own fold shadow. */
export const deskLight: FolderLight = defaultFolderLight;

// A shadow is light taken away: it may only darken what it falls on, evenly in
// every channel. Black at opacity a multiplies the surface by (1 - a), on dark
// a dark surface and white paper alike (a tinted ink would lighten or tint it).
export const shadowInk = "#000";

type Vector = { x: number; y: number };

type Primitive = [
  tag: string,
  attributes: Record<string, string>,
  children?: Primitive[],
];

/** The penumbra is the light disc's footprint at the caster's height. Sample
 * the disc densely enough that neighbouring rays land about a pixel apart. */
export function deskRays(height: number, light = deskLight) {
  const penumbra = 2 * light.radius * Math.max(0, height);

  return folderLightRays(
    light,
    Math.max(6, Math.min(40, Math.ceil(Math.PI * penumbra * penumbra))),
  );
}

/** Alpha compositing N fully overlapping samples reproduces the umbra. */
export const rayOpacity = (count: number, light = deskLight) =>
  1 - Math.pow(1 - Math.max(0, Math.min(0.95, light.opacity)), 1 / count);

/** A flat caster `height` px above its receiver: each ray displaces the whole
 * silhouette by its own offset on the receiving plane, given in the filter's
 * user space so the light stays fixed however the caster is turned. */
function rayShadowPrimitives(
  offsets: Vector[],
  unitsPerPx: number,
): Primitive[] {
  return [
    [
      "feComponentTransfer",
      { in: "SourceAlpha", result: "a" },
      [
        [
          "feFuncA",
          { type: "linear", slope: rayOpacity(offsets.length).toFixed(5) },
        ],
      ],
    ],
    ...offsets.map(
      (o, i): Primitive => [
        "feOffset",
        { in: "a", dx: o.x.toFixed(3), dy: o.y.toFixed(3), result: `r${i}` },
      ],
    ),
    [
      "feMerge",
      { result: "m" },
      offsets.map((_, i): Primitive => ["feMergeNode", { in: `r${i}` }]),
    ],
    // Subpixel edge antialiasing only (as the folder's shadow); softness comes from the rays.
    [
      "feGaussianBlur",
      { in: "m", stdDeviation: (0.4 * unitsPerPx).toFixed(3), result: "s" },
    ],
    ["feFlood", { "flood-color": shadowInk }],
    ["feComposite", { in2: "s", operator: "in", result: "shadow" }],
    [
      "feMerge",
      {},
      [
        ["feMergeNode", { in: "shadow" }],
        ["feMergeNode", { in: "SourceGraphic" }],
      ],
    ],
  ];
}

/** Server render: no layout yet, so aim with the caster's nominal scale. */
export function rayShadowMarkup(height: number, unitsPerPx = 1) {
  const render = ([tag, attributes, children = []]: Primitive): string =>
    `<${tag}${Object.entries(attributes)
      .map(([k, v]) => ` ${k}="${v}"`)
      .join("")}>${children.map(render).join("")}</${tag}>`;

  const offsets = deskRays(height).map((ray) => ({
    x: ray.x * height * unitsPerPx,
    y: ray.y * height * unitsPerPx,
  }));

  return rayShadowPrimitives(offsets, unitsPerPx).map(render).join("");
}

/** Where an element comes to rest, not a mid-transition frame: a folding leaf
 * passes edge-on, where its projection squashes to nothing and any shadow aimed
 * from it would be wildly long. A transitioning inline transform is its target. */
function restingTransform(node: Element, computed: string) {
  // A running transform transition's last keyframe is where it will settle,
  // whether it was set inline (folder leaves) or by a class (the map).
  const moving = node
    .getAnimations()
    .find(
      (animation) =>
        animation.playState === "running" &&
        "transitionProperty" in animation &&
        (animation as CSSTransition).transitionProperty === "transform",
    );

  const target = (moving?.effect as KeyframeEffect | null | undefined)
    ?.getKeyframes()
    .at(-1)?.transform;

  if (typeof target === "string")
    try {
      return target === "none" ? new DOMMatrix() : new DOMMatrix(target);
    } catch {
      /* relative units: use the current frame */
    }

  return computed && computed !== "none"
    ? new DOMMatrix(computed)
    : new DOMMatrix();
}

/** Lighting sees a turning sheet's true orientation, not its perspective
 * drawing (a perspective term would tilt the apparent normal). Set while a
 * sheet turns; cleared at rest. */
export const lightingTransform = new WeakMap<Element, DOMMatrix>();

/** Linear map from an element's own coordinates to screen px (3D, without
 * perspective), through CSS rotate/scale/transform and, inside SVG, its
 * user-space CTM. `resting` reads transitioning transforms at their target. */
export function toScreen(element: Element, resting = false): DOMMatrix {
  if (element instanceof SVGGraphicsElement && element.ownerSVGElement) {
    return toScreen(element.ownerSVGElement, resting).multiply(
      element.getCTM() ?? new DOMMatrix(),
    );
  }

  let total = new DOMMatrix();

  for (let node: Element | null = element; node; node = node.parentElement) {
    const style = getComputedStyle(node);
    let local = new DOMMatrix();

    if (style.rotate && style.rotate !== "none") {
      const parts = style.rotate.split(/\s+/);
      const last = parts.at(-1)!;

      const angle =
        parseFloat(last) *
        (last.endsWith("rad")
          ? 180 / Math.PI
          : last.endsWith("turn")
            ? 360
            : 1);

      const axis =
        parts.length === 4
          ? parts.slice(0, 3).map(Number)
          : parts[0] === "x"
            ? [1, 0, 0]
            : parts[0] === "y"
              ? [0, 1, 0]
              : [0, 0, 1];

      local = local.rotateAxisAngle(axis[0], axis[1], axis[2], angle);
    }

    if (style.scale && style.scale !== "none") {
      const [sx = 1, sy = sx] = style.scale.split(/\s+/).map(Number);
      local = local.scale(sx, sy);
    }

    const lit = lightingTransform.get(node);

    local = local.multiply(
      lit ??
        (resting
          ? restingTransform(node, style.transform)
          : style.transform && style.transform !== "none"
            ? new DOMMatrix(style.transform)
            : new DOMMatrix()),
    );

    total = local.multiply(total);
  }

  return total;
}

/** Screen-px → local-unit map of an element's own coordinate system. Only the
 * linear part matters for a displacement; 3D faces use their projected axes. */
export function screenToLocal(
  element: Element,
): ((v: Vector) => Vector) | null {
  const { a, b, c, d } = toScreen(element, true),
    det = a * d - b * c;

  // A face at rest edge-on has no usable inverse; keep the last shadow.
  if (Math.abs(det) < 1e-3) return null;

  return (v) => ({
    x: (d * v.x - c * v.y) / det,
    y: (-b * v.x + a * v.y) / det,
  });
}

type Vector3 = [number, number, number];

const dot = (p: Vector3, q: Vector3) => p[0] * q[0] + p[1] * q[1] + p[2] * q[2];

/** Light on a surface as it is right now, tilted in 3D or flat: a caster
 * `height` px off the surface along its normal; each desk ray (x, y, -1)
 * continues until it meets the surface plane. Returns the shadow offset in
 * the surface's own units. Flat and face-up, this is exactly ray·height. As a
 * folder leaf tilts, the light grows oblique and the shadow lengthens and
 * swings smoothly, capped where the light turns grazing. */
export function lightOnFace(element: Element, resting = false) {
  const m = toScreen(element, resting);

  // Only something inside a backface-hidden face (a folder leaf's or the map's
  // printed side) disappears when turned away. Anything else, a clip mounted on
  // the map, a sheet turning over, shows whichever side faces up: light that.
  let showsEitherSide = true;

  for (let node: Element | null = element; node; node = node.parentElement) {
    if (getComputedStyle(node).backfaceVisibility === "hidden") {
      showsEitherSide = false;
      break;
    }
  }

  const u: Vector3 = [m.m11, m.m12, m.m13],
    v: Vector3 = [m.m21, m.m22, m.m23];

  // The surface's own z axis, not u×v: a flat mirror (scale-x -1, as the
  // folder's inside clip layer) flips u×v but leaves the paper face-up.
  const z: Vector3 = [m.m31, m.m32, m.m33];
  const length = Math.hypot(...z);

  const uu = dot(u, u),
    uv = dot(u, v),
    vv = dot(v, v),
    det = uu * vv - uv * uv;

  if (!length || det < 1e-9) return null;

  const n = z.map(
    (c) => (c / length) * (showsEitherSide && z[2] < 0 ? -1 : 1),
  ) as Vector3;

  return {
    unitsPerPx: 1 / Math.sqrt(Math.sqrt(det)),
    // Turned away from the viewer: its face is hidden, nothing to re-render.
    hidden: !showsEitherSide && n[2] < 0,
    offset(ray: Vector, height: number): Vector {
      const d: Vector3 = [ray.x, ray.y, -1];

      // Grazing light would stretch shadows across the whole leaf; the leaf
      // itself is not darkened, so keep the cast to at most twice its flat length.
      const t = height / Math.max(-dot(d, n), 0.5);

      const o: Vector3 = [
        height * n[0] + t * d[0],
        height * n[1] + t * d[1],
        height * n[2] + t * d[2],
      ];

      const ou = dot(o, u),
        ov = dot(o, v);

      return { x: (vv * ou - uv * ov) / det, y: (uu * ov - uv * ou) / det };
    },
  };
}

const build = ([tag, attributes, children = []]: Primitive): SVGElement => {
  const element = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [k, v] of Object.entries(attributes)) element.setAttribute(k, v);
  element.append(...children.map(build));
  return element;
};

/** Re-aim one filter at the light from its caster's current orientation. */
export function updateRayShadow(
  filter: SVGFilterElement,
  caster?: Element | null,
  turning = false,
  resting = false,
) {
  const target =
    caster ?? document.querySelector(`[data-ray-caster="${filter.id}"]`);

  if (!target) return;
  const face = lightOnFace(target, resting);
  if (!face || (face.hidden && filter.dataset.rayKey)) return;
  const height = Number(filter.dataset.height);
  const offsets = deskRays(height).map((ray) => face.offset(ray, height));

  // While turning, re-render only for a visible change (a quarter pixel); at
  // rest, aim exactly.
  const step = turning ? 4 / face.unitsPerPx : 100;
  const key = `${height}|${offsets.map((o) => `${Math.round(o.x * step)},${Math.round(o.y * step)}`).join(";")}`;
  if (filter.dataset.rayKey === key) return;
  filter.dataset.rayKey = key;

  // Same ray count: move the samples in place (cheap enough for every frame of a fold).
  const existing = filter.querySelectorAll("feOffset");

  if (existing.length === offsets.length) {
    existing.forEach((element, i) => {
      element.setAttribute("dx", offsets[i]!.x.toFixed(3));
      element.setAttribute("dy", offsets[i]!.y.toFixed(3));
    });

    return;
  }

  filter.replaceChildren(
    ...rayShadowPrimitives(offsets, face.unitsPerPx).map(build),
  );
}

/** Change a caster's height above its receiver (e.g. a clip picked up). */
export function setRayShadowHeight(
  filter: SVGFilterElement | null,
  height: number,
  caster?: Element | null,
) {
  if (!filter) return;
  filter.dataset.height = String(height);
  updateRayShadow(filter, caster);
}

/** The metal magnet photograph, in its 100-unit square: a near-perfect disc
 * (alpha area matches πr² to 0.1%), a low puck 18% as thick as it is wide. */
export const magnetDisc = {
  x: 50,
  y: 50.6,
  radius: 44,
  thickness: 0.18 * 0.88,
};

// The photograph is lit from the upper left diagonal; the desk light sits at
// the opposite of its mean ray. Turn the face so its baked light agrees.
const photoLight = -135;

const deskLightAzimuth =
  (Math.atan2(-deskLight.y, -deskLight.x) * 180) / Math.PI;

/** Rotation for the magnet face given the magnet's own on-screen turn. A disc
 * looks the same at any angle, so only its lighting visibly changes. */
export const magnetFaceTurn = (screenTurn: number) =>
  deskLightAzimuth - photoLight - screenTurn;

/** Height (CSS px) a carried magnet is lifted off the surface. */
export const magnetCarried = 16;

/** Re-aim one magnet: its face toward the light, and its puck shadow swept
 * from the base (`data-lift` px up, e.g. while carried) to the face. */
export function aimMagnet(magnet: HTMLElement) {
  const m = toScreen(magnet);
  const face = magnet.querySelector<HTMLElement>("[data-magnet-face]");

  if (face && Math.abs(m.a * m.d - m.b * m.c) > 1e-3)
    face.style.rotate = `${magnetFaceTurn((Math.atan2(m.b, m.a) * 180) / Math.PI).toFixed(2)}deg`;

  const shadow = magnet.querySelector<SVGSVGElement>("[data-magnet-shadow]");
  const light = shadow && lightOnFace(shadow.querySelector("g")!);
  if (!shadow || !light || light.hidden) return;

  const base = Number(magnet.dataset.lift ?? 0),
    top = base + magnetDisc.thickness * shadow.clientWidth;

  const at = (ray: Vector, z: number) => {
    const o = light.offset(ray, z);
    return `${(magnetDisc.x + o.x).toFixed(2)} ${(magnetDisc.y + o.y).toFixed(2)}`;
  };

  shadow
    .querySelectorAll<SVGPathElement>("[data-magnet-ray]")
    .forEach((path) => {
      const ray = {
        x: Number(path.dataset.rayX),
        y: Number(path.dataset.rayY),
      };

      path.setAttribute("d", `M${at(ray, base)}L${at(ray, top)}`);
    });
}

/** A pen turned on the desk: show the renders lit for the nearest 15° turn
 * (each loaded before it is swapped in), and re-aim its swept shadow, whose
 * rays are fixed on screen while the pen's own frame turns. */
export function aimPen(pen: SVGSVGElement) {
  const m = pen.getScreenCTM();

  // Face-down (mirrored) it is out of sight.
  if (!m || m.a * m.d - m.b * m.c <= 0) return;

  const angle = Math.atan2(m.b, m.a),
    // Picked up, it casts from higher up.
    lift = Number(pen.dataset.lift ?? 0);

  if (Math.abs(angle - Number(pen.dataset.aimed)) < 0.002) return;
  pen.dataset.aimed = String(angle);

  const cos = Math.cos(angle),
    sin = Math.sin(angle);

  pen.querySelectorAll<SVGPathElement>("[data-pen-ray]").forEach((path) => {
    const z = Number(path.dataset.z) + lift,
      x = Number(path.dataset.rayX) * z,
      y = Number(path.dataset.rayY) * z;

    path.setAttribute(
      "transform",
      `translate(${(x * cos + y * sin).toFixed(2)} ${(-x * sin + y * cos).toFixed(2)})`,
    );
  });

  const lit = String(
    (((Math.round((angle * 180) / Math.PI / 15) * 15) % 360) + 360) % 360,
  );

  if (pen.dataset.lit === lit || pen.dataset.lighting === lit) return;
  pen.dataset.lighting = lit;

  const layers = [
    ...pen.querySelectorAll<SVGImageElement>("image[data-pen-layer]"),
  ];

  // A pen's renders come in layers; a breadboard's in one (data-sprite-base).
  const base = pen.dataset.spriteBase;

  const sources = layers.map((image) =>
    base
      ? `${base}/${lit}.webp`
      : `/hardware/pens/${pen.dataset.color}/${lit}-${image.dataset.penLayer}.webp`,
  );

  void Promise.all(
    sources.map((src) => {
      const image = new Image();
      image.src = src;
      return image.decode().catch(() => undefined);
    }),
  ).then(() => {
    if (pen.dataset.lighting !== lit) return;
    layers.forEach((image, i) => image.setAttribute("href", sources[i]!));
    pen.dataset.lit = lit;
  });
}

/** Re-aim everything riding on a surface; `turning` while a leaf or the map moves. */
export function aimRayShadowsWithin(root: Element, turning = false) {
  root
    .querySelectorAll<SVGFilterElement>("filter[data-ray-shadow]")
    .forEach((filter) => updateRayShadow(filter, null, turning));

  root
    .querySelectorAll<HTMLElement>("[data-hardware=magnet]")
    .forEach(aimMagnet);

  root
    .querySelectorAll<SVGSVGElement>("svg[data-pen], svg[data-breadboard]")
    .forEach(aimPen);
}

/** Flat casters re-aim here; projected (3D) casters listen for the event. */
export function refreshRayShadows(root: HTMLElement) {
  aimRayShadowsWithin(root);
  root.dispatchEvent(new CustomEvent("desk:light-refresh"));
}

/** A pushpin: the needle runs from its tip in the paper up to a cap
 * `capHeight` px above it, leaning `lean` units toward local -y (as drawn).
 * Each ray projects the needle and the cap body onto the paper. */
export function pinShadowSamples(
  toLocal: (v: Vector) => Vector,
  capHeight = 12,
  lean = 23,
) {
  const rays = deskRays(capHeight);

  const at = (t: number, ray: Vector) => {
    const o = toLocal({ x: ray.x * capHeight * t, y: ray.y * capHeight * t });
    return `${o.x.toFixed(2)} ${(o.y - lean * t).toFixed(2)}`;
  };

  return {
    opacity: rayOpacity(rays.length),
    samples: rays.map((ray) => ({
      needle: `M0 0L${at(0.55, ray)}`,
      cap: `M${at(0.55, ray)}L${at(1, ray)}`,
    })),
  };
}

/** Shadow of a sheet turning about an axis (map flip, folder cover), one
 * affine projection per ray as in the folder's fold shadow. Local units are
 * the shadow SVG's; `pxPerUnit` is its CSS px per horizontal unit; `toLocal`
 * maps a screen-px displacement into those units. A point `d` units from the
 * hinge on a leaf at cos/sin of its turn stands d·sin·pxPerUnit + lift px up. */
export function turningSheetMatrix(
  ray: Vector,
  toLocal: (v: Vector) => Vector,
  pxPerUnit: number,
  hinge: number,
  direction: 1 | -1,
  cos: number,
  sin: number,
  lift: number,
) {
  const r = toLocal(ray);

  // X = hinge − (x − hinge)·cos + r.x·z,  Y = y + r.y·z,  z = lift + direction·(x − hinge)·k
  const k = pxPerUnit * sin;

  const a = -cos + direction * r.x * k,
    b = direction * r.y * k;

  const e = hinge + hinge * cos - direction * r.x * k * hinge + r.x * lift;
  const f = -direction * r.y * k * hinge + r.y * lift;
  return [a, b, 0, 1, e, f];
}
