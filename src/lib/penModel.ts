/** The gel pen as a 3D model, in millimetres. The pen lies along x with the
 * cone's mouth at x = 0, its axis at y = z = 0 (z toward the viewer, y down
 * the screen). It is a solid of revolution, a profile radius(x) built from
 * segments, plus a wire clip lying along the barrel. The same numbers drive the
 * ray tracer that renders the pen (scripts/pen-render) and the shadow and dent
 * the page traces for it, so the picture and its shadow always agree. */
type Part = "body" | "button" | "refill";

type Segment = {
  part: Part;
  from: number;
  to: number;
  r0: number;
  r1?: number;
  shape?: "cone" | "swell" | "dome";
};

export const penSegments: Segment[] = [
  { part: "body", from: 0, to: 13.4, r0: 1.3, r1: 3.62, shape: "cone" }, // chrome cone
  { part: "body", from: 13.1, to: 14.3, r0: 3.88 }, // bead at the cone's base
  { part: "body", from: 14.0, to: 75.8, r0: 4.2, r1: 4.28, shape: "swell" }, // lacquered barrel
  { part: "body", from: 75.8, to: 78.6, r0: 4.3 }, // chrome band below the upper barrel
  { part: "body", from: 78.6, to: 122.6, r0: 4.32 }, // chrome upper barrel
  { part: "body", from: 122.6, to: 130.0, r0: 4.46 }, // collar
  { part: "body", from: 130.0, to: 131.0, r0: 3.15 }, // black ring
  { part: "button", from: 130.6, to: 139.5, r0: 2.72, shape: "dome" }, // push button
];

/** Steepness of a segment's ends (mm of radius per mm) and their fillet. */
const penWalls = { slope: 30, fillet: 0.16 };

/** The wire clip: along the barrel at `angle` round the axis (radians from
 * facing the viewer, negative toward the top of the screen). */
export const penClip = {
  from: 88.5,
  to: 129.5,
  angle: -0.8,
  halfWidth: [1.05, 1.32] as const,
  thickness: 0.42,
  gap: [0.05, 0.7] as const,
};

/** The refill's point and its travel when the pen is clicked. */
export const penTravel = { refill: 3.4, button: 1.5 };
export const penLength = 139.5;

/** Profile radius at x for the given parts (a smooth maximum of segments). */
export function penRadius(x: number, parts: Part[] = ["body", "button"]) {
  let r = -10;

  for (const s of penSegments) {
    if (!parts.includes(s.part)) continue;
    r = smoothMax(r, segmentRadius(s, x), penWalls.fillet);
  }

  return r;
}

function segmentRadius(s: Segment, x: number) {
  const t = Math.min(1, Math.max(0, (x - s.from) / (s.to - s.from)));
  let r = s.r0;
  if (s.shape === "cone") r = s.r0 + (s.r1! - s.r0) * Math.pow(t, 0.88);
  if (s.shape === "swell") r = s.r0 + (s.r1! - s.r0) * Math.sin(Math.PI * t);

  if (s.shape === "dome") {
    const e = Math.max(0, x - (s.to - 1.1));
    r = s.r0 - 1.1 + Math.sqrt(Math.max(0, 1.21 - e * e));
  }

  return r - penWalls.slope * Math.max(0, s.from - x, x - s.to);
}

function smoothMax(a: number, b: number, k: number) {
  const h = Math.min(1, Math.max(0, 0.5 + (0.5 * (a - b)) / k));
  return b + (a - b) * h + k * h * (1 - h);
}

/** The pen's silhouette seen from above (mm), the clip included: for shadows. */
export function penOutline(step = 1.5) {
  const top: [number, number][] = [],
    bottom: [number, number][] = [];

  const clipEdge = (x: number) => {
    if (x < penClip.from || x > penClip.to) return 0;
    const f = (x - penClip.from) / (penClip.to - penClip.from);

    const radial =
      4.32 +
      penClip.gap[0] +
      (penClip.gap[1] - penClip.gap[0]) * Math.min(1, f * 4) +
      2 * penClip.thickness;

    const half =
      penClip.halfWidth[0] + (penClip.halfWidth[1] - penClip.halfWidth[0]) * f;

    return (
      radial * Math.abs(Math.sin(penClip.angle)) +
      half * Math.abs(Math.cos(penClip.angle))
    );
  };

  for (let x = 0; x <= penLength + 1e-6; x += step) {
    const r = Math.max(0, penRadius(x));
    top.push([x, -Math.max(r, clipEdge(x))]);
    bottom.push([x, r]);
  }

  return [...top, ...bottom.reverse()];
}
