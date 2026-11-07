import cities from "../data/india-cities.json";
import atlas from "../data/india-atlas.json";

// Map projection and atlas labels
export const projectIndia = (longitude: number, latitude: number) => ({
  x: 40 + (longitude - 67) * 15.8,
  y: 76 + (37.8 - latitude) * 17.5,
});

export const indiaCities = [
  ["New Delhi", 77.21, 28.61, 1],
  ["Mumbai", 72.88, 19.08, 1],
  ["Kolkata", 88.36, 22.57, 1],
  ["Chennai", 80.27, 13.08, 1],
  ["Bengaluru", 77.59, 12.97, 1],
  ["Hyderabad", 78.49, 17.39, 1],
  ["Ahmedabad", 72.57, 23.02, 1],
  ["Jaipur", 75.79, 26.91, 1],
  ["Srinagar", 74.8, 34.08, 0],
  ["Leh", 77.58, 34.15, 0],
  ["Jammu", 74.86, 32.73, 0],
  ["Shimla", 77.17, 31.1, 0],
  ["Amritsar", 74.87, 31.63, 0],
  ["Chandigarh", 76.78, 30.73, 0],
  ["Dehradun", 78.03, 30.32, 0],
  ["Agra", 78.01, 27.18, 0],
  ["Lucknow", 80.95, 26.85, 0],
  ["Varanasi", 82.97, 25.32, 0],
  ["Patna", 85.14, 25.61, 0],
  ["Gaya", 85.0, 24.8, 0],
  ["Jaisalmer", 70.91, 26.92, 0],
  ["Jodhpur", 73.02, 26.24, 0],
  ["Udaipur", 73.68, 24.58, 0],
  ["Bhuj", 69.67, 23.24, 0],
  ["Rajkot", 70.8, 22.3, 0],
  ["Surat", 72.83, 21.17, 0],
  ["Vadodara", 73.18, 22.31, 0],
  ["Indore", 75.86, 22.72, 0],
  ["Bhopal", 77.41, 23.26, 0],
  ["Jabalpur", 79.93, 23.18, 0],
  ["Nagpur", 79.09, 21.15, 0],
  ["Pune", 73.86, 18.52, 0],
  ["Nashik", 73.79, 20.0, 0],
  ["Raipur", 81.63, 21.25, 0],
  ["Ranchi", 85.31, 23.34, 0],
  ["Bhubaneswar", 85.82, 20.3, 0],
  ["Puri", 85.83, 19.81, 0],
  ["Visakhapatnam", 83.22, 17.69, 0],
  ["Vijayawada", 80.65, 16.51, 0],
  ["Panaji", 73.83, 15.49, 0],
  ["Mangaluru", 74.84, 12.91, 0],
  ["Mysuru", 76.64, 12.3, 0],
  ["Kochi", 76.27, 9.93, 0],
  ["Madurai", 78.12, 9.93, 0],
  ["Thiruvananthapuram", 76.94, 8.52, 0],
  ["Kanyakumari", 77.54, 8.09, 0],
  ["Coimbatore", 76.96, 11.02, 0],
  ["Guwahati", 91.74, 26.14, 0],
  ["Shillong", 91.88, 25.58, 0],
  ["Gangtok", 88.61, 27.33, 0],
  ["Darjeeling", 88.26, 27.04, 0],
  ["Imphal", 93.94, 24.82, 0],
  ["Aizawl", 92.72, 23.73, 0],
  ["Agartala", 91.29, 23.83, 0],
  ["Kohima", 94.11, 25.67, 0],
  ["Itanagar", 93.62, 27.08, 0],
  ["Dibrugarh", 94.91, 27.47, 0],
  ["Port Blair", 92.73, 11.62, 0],
] as const;

// City routes
type City = (typeof cities)[number];

export type CityOverrides = Record<
  string,
  { longitude: number; latitude: number }
>;

export type CityConnection = { from: string; to: string };

type CityPin = { x: number; y: number; name: string; state: string };

const normalize = (name: string) =>
  name
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const canonical = new Map<string, City[]>();
const aliases = new Map<string, City[]>();

for (const city of cities) {
  const key = normalize(city.name);
  canonical.set(key, [...(canonical.get(key) ?? []), city]);

  for (const alias of city.aliases)
    aliases.set(alias, [...(aliases.get(alias) ?? []), city]);
}

function resolveCity(input: string, overrides: CityOverrides = {}): City {
  const override = Object.entries(overrides).find(
    ([name]) => normalize(name) === normalize(input),
  );

  if (override) {
    const [name, point] = override;

    if (
      !Number.isFinite(point.latitude) ||
      !Number.isFinite(point.longitude) ||
      point.latitude < -90 ||
      point.latitude > 90 ||
      point.longitude < -180 ||
      point.longitude > 180
    ) {
      throw new Error(`Invalid latitude/longitude for map city "${name}".`);
    }

    const p = projectIndia(point.longitude, point.latitude);

    if (p.x < 20 || p.x > 580 || p.y < 64 || p.y > 654)
      throw new Error(
        `Map city "${name}" is outside this India atlas. Check its coordinates.`,
      );

    return {
      name,
      state: "",
      ...point,
      population: 0,
      aliases: [normalize(name)],
    };
  }

  const parts = input
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const name = normalize(parts[0] ?? "");

  const region = parts
    .slice(1)
    .filter((p) => normalize(p) !== "india")
    .map(normalize);

  const candidates = [
    ...(canonical.get(name) ?? []),
    ...(aliases.get(name) ?? []),
  ];

  const city = candidates.find((c) =>
    region.every((r) => normalize(c.state) === r),
  );

  if (!city)
    throw new Error(
      `Couldn't locate Indian city "${input}". Check its spelling, use "City, State", or add it to map.cityOverrides with longitude and latitude.`,
    );

  return city;
}

export function createCityRoute(
  names: readonly string[],
  links?: readonly CityConnection[],
  overrides: CityOverrides = {},
) {
  const selected: City[] = [];
  const index = new Map<string, number>();
  const identity = (city: City) => `${city.longitude},${city.latitude}`;

  for (const name of names) {
    const city = resolveCity(name, overrides);
    const key = identity(city);

    if (!index.has(key)) {
      index.set(key, selected.length);
      selected.push(city);
    }
  }

  const pins: CityPin[] = selected.map((city) => ({
    ...projectIndia(city.longitude, city.latitude),
    name: city.name,
    state: city.state,
  }));

  const connections =
    links === undefined
      ? pins.slice(1).map((_, i) => ({ from: i, to: i + 1 }))
      : links.map((link) => {
          const from = index.get(identity(resolveCity(link.from, overrides)));
          const to = index.get(identity(resolveCity(link.to, overrides)));

          if (from === undefined || to === undefined)
            throw new Error(
              `Map connection "${link.from}" → "${link.to}" must reference cities in map.cities.`,
            );

          if (from === to)
            throw new Error(
              `Map connection "${link.from}" → "${link.to}" connects the same city to itself.`,
            );

          return { from, to };
        });

  return { pins, connections };
}

// Pin placement
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
