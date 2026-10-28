// Single-line felt-tip strokes, in a 12 × 20 unit writing cell (baseline
// at 20; lowercase descenders reach 25).
// Alternate forms keep repeated letters from looking mechanically identical.
export const markerGlyphs: Record<string, { width: number; paths: string[] }> =
  {
    " ": { width: 7, paths: [""] },
    A: {
      width: 15,
      paths: ["M1 19Q4 9 7 1L13 20M3 13l8-1", "M1 20 6 1Q9 7 13 19M3 13l8 .4"],
    },
    B: {
      width: 14,
      paths: [
        "M2 20 1 1Q13-1 12 6q-1 4-10 4 13-1 11 6-1 5-11 4",
        "M2 1v19M2 1q10-1 10 4 0 4-10 5 12-1 11 5 0 5-11 5",
      ],
    },
    C: {
      width: 14,
      paths: ["M12 3Q5-3 2 6q-5 17 11 12", "M12 2Q2-1 1 11 0 23 13 18"],
    },
    D: {
      width: 15,
      paths: [
        "M2 1v19M2 1q13-1 12 10-1 10-12 9",
        "M2 20 1 1q13-1 12 10Q12 20 2 20",
      ],
    },
    E: {
      width: 12,
      paths: ["M11 1 2 2 1 20l10-1M2 10l8 .5", "M11 2H2l.5 17 9 1M2 10l7-1"],
    },
    F: { width: 12, paths: ["M2 20 1 2l10-1M2 10l8 .5"] },
    G: {
      width: 16,
      paths: [
        "M13 3Q4-3 2 7q-4 15 10 12l1-8-6 1",
        "M13 2Q1-2 1 12q0 11 12 6l.3-7H8",
      ],
    },
    H: {
      width: 15,
      paths: [
        "M2 1 1 20M12 1l1 19M2 11l10-1",
        "M1 1l1 19M13 1l-1 19M2 10l10 1",
      ],
    },
    I: { width: 7, paths: ["M3 1 2 20", "M2 1l1 19"] },
    J: { width: 12, paths: ["M10 1v14q-1 9-9 2", "M11 2 9 17q-3 7-8-1"] },
    K: {
      width: 14,
      paths: ["M2 1 1 20M12 1 2 11l11 9", "M2 1v19M12 2 2 12m4-4 7 12"],
    },
    L: { width: 12, paths: ["M2 1 1 19l10 1", "M1 1l1 19 10-1"] },
    M: {
      width: 19,
      paths: ["M1 20 2 1l7 12 7-12 1 19", "M1 19 2 2l7 11L16 1l1 19"],
    },
    N: { width: 16, paths: ["M2 20 1 1q6 7 12 19L14 1", "M1 20 2 1l12 18V1"] },
    O: {
      width: 15,
      paths: [
        "M8 1Q0 0 1 12q1 10 9 8 7-2 4-14Q12 0 8 1",
        "M8 1Q0 1 1 13q1 10 9 6 7-3 3-14Q11 0 8 1",
      ],
    },
    P: {
      width: 13,
      paths: ["M2 20 1 1q12-2 11 5-1 6-10 5", "M2 20V2q11-3 10 4-1 6-10 4"],
    },
    Q: {
      width: 16,
      paths: ["M8 1Q0 0 1 12q1 10 9 7 7-3 3-14Q11 0 8 1M8 14l8 8"],
    },
    R: {
      width: 15,
      paths: [
        "M2 20 1 1q12-2 11 5-1 6-10 5m4-.5 7 10",
        "M2 20V1q11-1 10 5-1 5-10 5m4 0 8 9",
      ],
    },
    S: {
      width: 14,
      paths: [
        "M12 2Q2-2 2 5q-1 4 6 6 10 5 2 9-5 2-9-2",
        "M12 3Q3-2 2 5q-1 4 7 7 8 4 1 7-4 2-9-1",
      ],
    },
    T: { width: 14, paths: ["M1 2 13 1M7 2 6 20", "M1 1l12 1M7 2l1 18"] },
    U: {
      width: 15,
      paths: ["M1 1v13q0 8 7 6 6-1 5-19", "M2 1 1 14q0 7 7 6 6-1 5-18"],
    },
    V: { width: 15, paths: ["M1 1 6 20 13 1", "M1 2q3 11 6 18L13 1"] },
    W: {
      width: 21,
      paths: ["M1 1 5 20l5-12 5 12 5-19", "M1 1l4 19 5-13 5 13 4-19"],
    },
    X: { width: 14, paths: ["M1 1 12 20M12 1 1 19"] },
    Y: {
      width: 14,
      paths: ["M1 1 7 10 13 1M7 10 6 20", "M1 2l6 9 6-10M7 11v9"],
    },
    Z: { width: 14, paths: ["M1 2 12 1 1 20l12-1"] },
    "0": { width: 14, paths: ["M7 1Q0 0 1 12q1 11 9 7 5-3 2-14Q10 0 7 1"] },
    "1": { width: 9, paths: ["M1 5 5 1 4 20"] },
    "2": { width: 14, paths: ["M1 5Q6-3 11 2q5 4-10 17l12 1"] },
    "3": { width: 13, paths: ["M1 3q12-7 10 2-1 4-6 5 10-2 7 6-2 7-11 2"] },
    "4": { width: 14, paths: ["M8 1 1 13l12-1M10 5l-.5 15"] },
    "5": { width: 14, paths: ["M12 1 2 2 1 10q11-5 11 3 1 9-11 6"] },
    "6": { width: 14, paths: ["M11 1Q2-1 1 12q0 10 8 8 7-3 2-9-3-3-9 1"] },
    "7": { width: 13, paths: ["M1 2 12 1Q7 10 5 20M3 11l7-.5"] },
    "8": {
      width: 14,
      paths: ["M7 10Q-3 6 3 2q8-5 9 2 1 4-5 6-12 5-3 10 9 4 8-4-1-4-5-6"],
    },
    "9": { width: 14, paths: ["M12 9Q1 16 1 6 2-2 9 2q7 4 0 18"] },
    ".": { width: 5, paths: ["M2 19l.3 .3"] },
    ",": { width: 5, paths: ["M3 18 1 22"] },
    "!": { width: 6, paths: ["M3 1 2 14M2 19l.3 .2"] },
    "?": { width: 13, paths: ["M1 4Q7-3 11 3q3 4-5 8l-.5 3M5 19l.2 .2"] },
    "'": { width: 5, paths: ["M3 1 1 5"] },
    ":": { width: 5, paths: ["M2 6l.2 .2M2 16l.2 .2"] },
    "/": { width: 11, paths: ["M10 1 1 21"] },
    "-": { width: 10, paths: ["M1 11l8-.5"] },
    "&": {
      width: 17,
      paths: ["M15 19Q0 7 5 2q6-4 7 1 1 4-7 9-8 7 0 8 8 1 11-9"],
    },
    // Lowercase: x-height from y 10, ascenders to 1, descenders to 25.
    a: {
      width: 13,
      paths: [
        "M10 12Q5 8 2 13q-2 7 4 7 4 0 5-7M11 10l-.3 10",
        "M10 11q-6-3-8 3 0 6 5 6 3-1 3-6m1-3v10",
      ],
    },
    b: {
      width: 12,
      paths: [
        "M2 1l.3 19M2 14q3-5 7-3 3 3 1 7-3 3-8 1",
        "M2 2v18M2 13q5-4 8-1 1 5-2 7-3 1-6-1",
      ],
    },
    c: {
      width: 11,
      paths: ["M10 11Q4 8 2 14q0 7 8 5", "M10 12q-5-4-8 1-1 7 8 6"],
    },
    d: {
      width: 13,
      paths: [
        "M10 1l.4 19M10 13q-4-4-7-2-3 5 0 8 4 2 7-3",
        "M11 2v18M10 12q-5-3-8 1 0 7 4 7 3 0 4-3",
      ],
    },
    e: {
      width: 12,
      paths: [
        "M2 15l8-.5q0-5-4-4.5-5 1-4 6 1 5 8 3",
        "M2 15h8q-1-6-5-5-4 2-3 6 1 5 8 3",
      ],
    },
    f: {
      width: 10,
      paths: ["M9 2Q4 0 4 7v13M1 10l7-.5"],
    },
    g: {
      width: 13,
      paths: [
        "M10 11Q4 8 2 13q0 6 5 5 3-1 3-7l.3 13q-1 4-8 2",
        "M10 12q-5-4-8 1 0 6 5 5 3-2 3-6v12q-2 4-8 1",
      ],
    },
    h: {
      width: 12,
      paths: [
        "M2 1l.3 19M2 14q3-5 6-4 2 1 2 5v5",
        "M2 2v18M2 13q4-4 7-2 1 2 1 9",
      ],
    },
    i: {
      width: 7,
      paths: ["M3.5 10l.2 10M3.6 5.5v.4"],
    },
    j: {
      width: 8,
      paths: ["M5 10l.2 12q-1 4-5 2M5 5.5v.4"],
    },
    k: {
      width: 12,
      paths: ["M2 1l.3 19M9 10 3 15l7 5", "M2 2v18M9 10l-6 6 6 4"],
    },
    l: {
      width: 7,
      paths: ["M3 1q0 13 .5 18 1 1.5 3 .5", "M3 2v16q1 3 3 2"],
    },
    m: {
      width: 17,
      paths: ["M2 10v10M2 13q2-4 5-2l.3 9M7 12q4-4 6 0l.3 8"],
    },
    n: {
      width: 12,
      paths: [
        "M2 10v10M2 13q3-4 6-3 2 1 2 5v5",
        "M2 11l.3 9M2 14q4-5 7-3 1 2 1 8",
      ],
    },
    o: {
      width: 12,
      paths: [
        "M6 10q-5 0-4 6 1 5 5 4 4-1 3-6-1-4-4-4",
        "M7 10Q1 9 2 15q1 6 6 5 3-2 2-6-1-4-3-4",
      ],
    },
    p: {
      width: 12,
      paths: [
        "M2 10l.3 15M2 12q5-4 8 0 1 5-3 7-3 1-5-1",
        "M2 11v14M2 13q4-5 8-1 0 6-4 7-3 0-4-2",
      ],
    },
    q: {
      width: 12,
      paths: ["M10 10l-.3 15M10 12q-5-4-8 1 0 6 4 6 3 0 4-3"],
    },
    r: {
      width: 10,
      paths: ["M2 10l.3 10M2 14q2-5 7-4", "M2 11v9M2 15q3-6 7-4"],
    },
    s: {
      width: 11,
      paths: [
        "M9 11q-4-2-6 0-1 3 3 4 4 1 3 4-3 2-7 0",
        "M9 11Q5 9 3 11q-1 3 4 4 3 1 2 4-3 2-7 0",
      ],
    },
    t: {
      width: 10,
      paths: ["M5 3l-.3 15q1 3 4 1M1 9l8-.5", "M5 4v14q1 3 4 1M1 10h8"],
    },
    u: {
      width: 12,
      paths: [
        "M2 10v6q1 4 4 4 4 0 4-5M10 10l.3 10",
        "M2 11l.3 5q0 4 4 4 3 0 4-5m0-4v9",
      ],
    },
    v: {
      width: 12,
      paths: ["M1 10l4.5 10L11 10", "M1 11l5 9 4-10"],
    },
    w: {
      width: 16,
      paths: ["M1 10l3 10 4-7 3 7 4-10"],
    },
    x: {
      width: 12,
      paths: ["M2 10l8 10M10 10 2 20", "M2 11l7 9M10 10l-8 9"],
    },
    y: {
      width: 12,
      paths: ["M2 10l4 9M10 10 5 22q-1 3-4 2", "M2 11l4 8m4-9-5 12q-2 3-4 1"],
    },
    z: {
      width: 11,
      paths: ["M2 10.5h8L2 20l8-.5", "M2 10h8l-8 10h8"],
    },
  };
