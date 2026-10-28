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
