import { readFileSync, writeFileSync } from "node:fs";

const atlas = JSON.parse(
  readFileSync(
    new URL("../src/data/india-atlas.json", import.meta.url),
    "utf8",
  ),
);

const palette = [
  "#b8c38f",
  "#d7b77c",
  "#cc9788",
  "#bec8af",
  "#d6a975",
  "#b3c4ac",
  "#c6a3a0",
];

const northeastColors = {
  AR: "#c5977f",
  AS: "#b4bf8d",
  ML: "#c7b895",
  NL: "#bda3b9",
  MN: "#abc3c1",
  MZ: "#c79b8a",
  TR: "#d4b37a",
  SK: "#d3a18b",
};

const neighbors = atlas.neighbors.map((n) => `<path d="${n.d}"/>`).join("");
const states = atlas.states
  .map((state, index) => {
    const fill =
      northeastColors[state.code] ??
      palette[(index * 3 + state.name.length) % palette.length];
    return `<path d="${state.d}" fill="${fill}"/>`;
  })
  .join("");
const rivers = atlas.rivers.map((r) => `<path d="${r.d}"/>`).join("");

const svg = [
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 676">',
  '<g fill="#e0cc9c" fill-opacity=".7" stroke="#737456" stroke-width=".8">',
  neighbors,
  "</g>",
  '<g fill-opacity=".9" stroke="#71694e" stroke-width=".75" stroke-linejoin="round">',
  states,
  "</g>",
  '<g fill="none" stroke="#789998" stroke-width=".75" opacity=".9">',
  rivers,
  "</g></svg>\n",
].join("");

writeFileSync(
  new URL("../public/maps/india-geography.svg", import.meta.url),
  svg,
);
