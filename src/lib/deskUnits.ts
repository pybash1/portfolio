/** Desk items held together by paper clips or fridge magnets: hardware mounted
 * on an item lists the other items it holds (`data-binds`). Followed transitively. */
export function clippedUnit(canvas: HTMLElement, item: HTMLElement) {
  const items = [
    ...canvas.querySelectorAll<HTMLElement>("[data-movable-item]"),
  ].filter((item) => item.closest("[data-desk-canvas]") === canvas);

  const byId = new Map(items.map((item) => [item.dataset.movableId!, item]));
  const links = new Map<HTMLElement, Set<HTMLElement>>();

  const link = (a: HTMLElement, b: HTMLElement) => {
    for (const [from, to] of [
      [a, b],
      [b, a],
    ] as const) {
      if (!links.has(from)) links.set(from, new Set());
      links.get(from)!.add(to);
    }
  };

  canvas
    .querySelectorAll<
      HTMLElement | SVGElement
    >("[data-gem-clip][data-binds], [data-desk-magnet][data-binds]")
    .forEach((clip) => {
      // A clip re-seated on top of its stack still belongs to its home sheet.
      const owner =
        (clip.dataset.bindHome && byId.get(clip.dataset.bindHome)) ||
        clip.closest<HTMLElement>("[data-movable-item]");

      if (!owner || !byId.has(owner.dataset.movableId!)) return;

      for (const id of clip.dataset.binds!.split(" ")) {
        const other = byId.get(id);
        if (other && other !== owner) link(owner, other);
      }
    });

  const unit = new Set([item]);

  for (const member of unit)
    for (const next of links.get(member) ?? []) unit.add(next);

  return [...unit];
}
