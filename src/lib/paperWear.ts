// Paper edge wear
export type PaperWear = "paper" | "photo" | "ticket" | "card" | "sharp";

export function paperRandom(seed: string) {
  let value = 2166136261;

  for (const char of seed)
    value = Math.imul(value ^ char.charCodeAt(0), 16777619) >>> 0;

  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

export function paperEdgeMask(seed: string, wear: PaperWear = "paper") {
  if (wear === "sharp") return "none";
  const random = paperRandom(`${seed}:${wear}`);
  const depth = { paper: 3.3, photo: 1.7, ticket: 5, card: 2.2 }[wear];
  const corner = wear === "photo" ? 5 : wear === "ticket" ? 9 : 6;
  const points: string[] = [];

  const point = (x: number, y: number) =>
    points.push(`${x.toFixed(2)},${y.toFixed(2)}`);

  for (let side = 0; side < 4; side++) {
    const nick = 6 + Math.floor(random() * 34);

    for (let i = 0; i <= 48; i++) {
      const along = corner + (i / 48) * (1000 - corner * 2);

      const inset = Math.max(
        0.35,
        0.4 +
          random() * depth +
          Math.sin(i * 0.65 + side) * depth * 0.25 +
          (i === nick ? depth * 2.3 : 0),
      );

      if (side === 0) point(along, inset);
      if (side === 1) point(1000 - inset, along);
      if (side === 2) point(1000 - along, 1000 - inset);
      if (side === 3) point(inset, 1000 - along);
    }
  }

  const notches =
    wear === "ticket"
      ? `<mask id="cut"><rect width="1000" height="1000" fill="white"/><ellipse cx="860" cy="0" rx="17" ry="35" fill="black"/><ellipse cx="860" cy="1000" rx="17" ry="35" fill="black"/></mask>`
      : "";

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" preserveAspectRatio="none"><defs><filter id="soft" x="-1%" y="-1%" width="102%" height="102%"><feGaussianBlur stdDeviation=".4"/></filter>${notches}</defs><polygon points="${points.join(" ")}" fill="white" filter="url(#soft)"${notches ? ' mask="url(#cut)"' : ""}/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

// Torn clipping edges
/** Outlines for a clipping torn out of a newspaper. Two masks come from one
 * edge: the newsprint, and a paler fibrous rim just outside it where the
 * printed face peeled away and the torn core shows. A side is either torn
 * (rough at every scale, with a few bites and a long lean) or cut with
 * scissors (nearly straight, a slow wobble). Coordinates are in a
 * 1000 × 1000 box, stretched to the sheet. */
type Edge = "torn" | "cut";

const STEPS = 128;

/** Midpoint displacement: a rough line that is rough at every scale. */
function roughLine(random: () => number, amplitude: number) {
  const line = new Array<number>(STEPS + 1).fill(0);
  line[0] = (random() - 0.5) * amplitude;
  line[STEPS] = (random() - 0.5) * amplitude;

  for (let span = STEPS, size = amplitude; span > 1; span /= 2, size *= 0.56) {
    for (let i = 0; i < STEPS; i += span) {
      const mid = i + span / 2;
      line[mid] = (line[i]! + line[i + span]!) / 2 + (random() - 0.5) * size;
    }
  }

  return line;
}

function sideOffsets(random: () => number, kind: Edge) {
  if (kind === "cut") {
    const phase = random() * 6;
    const lean = (random() - 0.5) * 5;
    return Array.from(
      { length: STEPS + 1 },
      (_, i) =>
        2 +
        Math.sin(i * 0.05 + phase) * 1.1 +
        (i / STEPS) * lean +
        random() * 0.4,
    );
  }

  const rough = roughLine(random, 64);
  const bites = Array.from({ length: 3 }, () => ({
    at: 12 + random() * (STEPS - 24),
    width: 3 + random() * 7,
    depth: 6 + random() * 15,
  }));

  return rough.map((value, i) => {
    let bite = 0;
    for (const b of bites)
      bite += b.depth * Math.exp(-(((i - b.at) / b.width) ** 2));
    // Offsets are inward; never outside the sheet.
    return Math.max(0.5, 22 + value + bite);
  });
}

/** A smooth 0..1 wander, for how wide the pale rim is along an edge. */
function rimWidth(random: () => number, torn: boolean) {
  if (!torn) return new Array<number>(STEPS + 1).fill(0);
  const wander = roughLine(random, 2.4);
  return wander.map((value) => Math.max(0, 11 + value * 9 + random() * 3));
}

export function tornSheet(
  seed: string,
  edges: [Edge, Edge, Edge, Edge] = ["torn", "torn", "cut", "torn"],
) {
  const random = paperRandom(`${seed}:torn`);
  const outer: string[] = [];
  const inner: string[] = [];

  const put = (list: string[], side: number, along: number, inset: number) => {
    const x = along,
      y = inset;
    const [px, py] =
      side === 0
        ? [x, y]
        : side === 1
          ? [1000 - y, x]
          : side === 2
            ? [1000 - x, 1000 - y]
            : [y, 1000 - x];
    list.push(`${px.toFixed(1)},${py.toFixed(1)}`);
  };

  edges.forEach((kind, side) => {
    const offsets = sideOffsets(random, kind);
    const rim = rimWidth(random, kind === "torn");

    for (let i = 0; i <= STEPS; i++) {
      const along = (i / STEPS) * 1000;
      put(outer, side, along, offsets[i]!);
      put(inner, side, along, offsets[i]! + rim[i]!);
    }
  });

  const mask = (points: string[], blur: number) =>
    `url("data:image/svg+xml,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" preserveAspectRatio="none"><defs><filter id="s" x="-2%" y="-2%" width="104%" height="104%"><feGaussianBlur stdDeviation="${blur}"/></filter></defs><polygon points="${points.join(" ")}" fill="white" filter="url(#s)"/></svg>`,
    )}")`;

  return { outer: mask(outer, 0.5), inner: mask(inner, 1.4) };
}
