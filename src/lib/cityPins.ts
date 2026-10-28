import cities from "../data/india-cities.json";
import { projectIndia } from "./indiaMap";

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
