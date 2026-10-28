import type { InspoItem } from "../components/inspo/types";

const normalize = (value: string) =>
  value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

const words = (value: string) =>
  normalize(value).match(/[\p{L}\p{N}]+/gu) ?? [];

/** Damerau–Levenshtein also treats swapped letters as a single typo. */
function editDistance(a: string, b: string): number {
  const rows = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  rows[0] = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const row = rows[i]!;
      const previous = rows[i - 1]!;
      row[j] = Math.min(
        previous[j]! + 1,
        row[j - 1]! + 1,
        previous[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        row[j] = Math.min(row[j]!, rows[i - 2]![j - 2]! + 1);
      }
    }
  }
  return rows[a.length]![b.length]!;
}

function matchScore(query: string, candidate: string): number {
  if (query === candidate) return 100;
  if (candidate.startsWith(query)) return 80;
  if (query.length >= 3 && candidate.includes(query)) return 60;
  const tolerance = query.length >= 7 ? 2 : query.length >= 4 ? 1 : 0;
  if (!tolerance || Math.abs(candidate.length - query.length) > tolerance)
    return 0;
  const distance = editDistance(query, candidate);
  return distance <= tolerance ? 40 - distance * 10 : 0;
}

/** Every query word must match. Exact title matches rank above fuzzy body matches. */
export function searchInspo(
  items: readonly InspoItem[],
  query: string,
): InspoItem[] {
  const terms = words(query).slice(0, 20);
  if (!terms.length) return [...items];

  return items
    .map((item) => {
      const fields = [
        { value: item.title, weight: 3 },
        {
          value: `${item.kind} ${item.kind === "font" ? item.font.family : ""} ${item.source?.label ?? ""} ${item.source?.url ?? ""} ${item.kind === "quote" ? (item.author ?? "") : ""} ${item.kind === "email" ? (item.from ?? "") : ""} ${item.kind === "tweet" ? (item.url ?? "") : ""} ${item.kind === "embed" ? (item.embed?.url ?? "") : ""}`,
          weight: 2,
        },
        {
          value:
            "text" in item
              ? (item.text ?? "")
              : "description" in item
                ? item.description
                : "",
          weight: 1,
        },
      ];
      const tokens = fields.flatMap(({ value, weight }) =>
        words(value).map((word) => ({ word, weight })),
      );
      const scores = terms.map((term) =>
        tokens.reduce(
          (best, { word, weight }) =>
            Math.max(best, matchScore(term, word) * weight),
          0,
        ),
      );
      return {
        item,
        score: scores.every(Boolean) ? scores.reduce((a, b) => a + b, 0) : 0,
      };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item);
}
