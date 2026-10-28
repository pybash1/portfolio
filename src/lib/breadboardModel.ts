/** A standard full-size solderless breadboard (830 tie points), in mm: the
 * numbers behind its render (scripts/breadboard-render) and its shadow and
 * hit area on the page. It lies with its length along x, centred on the
 * origin, rows of the terminal strip running across (y). */
export const board = {
  length: 165.1,
  width: 54.6,
  height: 8.5,
  pitch: 2.54,
  // Terminal strip: 63 columns; rows a–e and f–j either side of the channel.
  columns: 63,
  rows: 5,
  /** Distance from the centre line to the nearest terminal row (e, f). */
  channel: 3.81,
  /** Power rails: two rows a side, this far from the centre line. */
  rails: [19.05, 21.59],
  /** Rail holes come in groups of 5 with a one-hole gap between groups. */
  railGroups: 10,
  hole: 1.15,
  corner: 1.2,
};

/** Every hole (mm, board centred, +y up the board as rendered: on the page
 * (y down) a hole is at (x, −y)): terminal strip then power rails. */
export function holes() {
  const { pitch, columns, rows, channel, rails, railGroups } = board;
  const list: { x: number; y: number; name: string }[] = [];
  const letters = "abcdefghij";

  for (let i = 0; i < columns; i++) {
    const x = (i - (columns - 1) / 2) * pitch;

    for (let r = 0; r < rows; r++) {
      list.push({
        x,
        y: -(channel + r * pitch),
        name: `${letters[4 - r]}${i + 1}`,
      });

      list.push({
        x,
        y: channel + r * pitch,
        name: `${letters[5 + r]}${i + 1}`,
      });
    }
  }

  const slots = railGroups * 6 - 1;

  for (let i = 0; i < slots; i++) {
    if (i % 6 === 5) continue;
    const x = (i - (slots - 1) / 2) * pitch;

    for (const side of [-1, 1])
      rails.forEach((y, k) =>
        list.push({
          x,
          y: side * y,
          name: `${side < 0 ? "lower" : "upper"} ${k ? "+" : "−"} rail`,
        }),
      );
  }

  return list;
}
