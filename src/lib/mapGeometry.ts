import atlas from "../data/india-atlas.json";

// The prepared atlas contains only straight M/L/Z paths. Cache their rings so
// placement checks use the exact outlines that are drawn, in atlas coordinates.
const rings = new Map(
  atlas.states.map((state) => [
    state.name,
    state.d
      .split("Z")
      .filter(Boolean)
      .map((ring) =>
        [...ring.matchAll(/(-?[\d.]+),(-?[\d.]+)/g)].map(
          (match) => [Number(match[1]), Number(match[2])] as const,
        ),
      ),
  ]),
);

function stateContains(state: string, x: number, y: number) {
  let inside = false;

  for (const ring of rings.get(state) ?? []) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const a = ring[i]!,
        b = ring[j]!;

      if (
        a[1] > y !== b[1] > y &&
        x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]
      )
        inside = !inside;
    }
  }

  return inside;
}

export function pinRotation(
  pin: { x: number; y: number; state?: string },
  index: number,
) {
  const preferred = [-9, 7, -4, 11][index % 4]!;

  // Keep the raised cap over its own state where possible. The needle tip never
  // moves from the city: a north-leaning cap otherwise reads as the wrong location.
  return (
    [preferred, 35, -35, 60, -60, 85, -85, 120, -120, 160].find((angle) => {
      const radians = (angle * Math.PI) / 180;

      return stateContains(
        pin.state ?? "",
        pin.x + 23 * Math.sin(radians),
        pin.y - 23 * Math.cos(radians),
      );
    }) ?? preferred
  );
}
