interface CanvasCard {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CanvasPosition {
  x: number;
  y: number;
}

const gap = 28;

function touches(a: CanvasCard, b: CanvasCard) {
  return (
    a.x < b.x + b.width + gap &&
    a.x + a.width + gap > b.x &&
    a.y < b.y + b.height + gap &&
    a.y + a.height + gap > b.y
  );
}

function distance(a: CanvasPosition, b: CanvasPosition) {
  return (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
}

/** Keep authored positions where possible and move a colliding card nearby. */
export function layoutCanvasCards(
  cards: CanvasCard[],
): Map<string, CanvasPosition> {
  const placed: CanvasCard[] = [];
  const positions = new Map<string, CanvasPosition>();

  for (const card of cards) {
    const clear = (candidate: CanvasPosition) =>
      placed.every(
        (other) => touches({ ...card, ...candidate }, other) === false,
      );
    let position: CanvasPosition = { x: card.x, y: card.y };
    let found = clear(position);

    if (!found) {
      const candidates = placed.flatMap((other) => [
        { x: other.x + other.width + gap, y: card.y },
        { x: other.x - card.width - gap, y: card.y },
        { x: card.x, y: other.y + other.height + gap },
        { x: card.x, y: other.y - card.height - gap },
      ]);
      candidates.sort((a, b) => distance(a, card) - distance(b, card));
      const nearby = candidates.find(clear);
      if (nearby) {
        position = nearby;
        found = true;
      } else {
        // Dense clusters need a wider search than their immediate edges.
        search: for (let radius = 40; radius <= 10_000; radius += 40) {
          for (let step = 0; step < 24; step++) {
            const angle = (step * Math.PI * 2) / 24;
            const candidate = {
              x: Math.round(card.x + Math.cos(angle) * radius),
              y: Math.round(card.y + Math.sin(angle) * radius),
            };
            if (clear(candidate)) {
              position = candidate;
              found = true;
              break search;
            }
          }
        }
      }
    }

    if (!found) {
      // Last resort: below every placed card, which can never collide.
      const bottom = Math.max(...placed.map((other) => other.y + other.height));
      position = { x: card.x, y: bottom + gap };
    }

    positions.set(card.id, position);
    placed.push({ ...card, ...position });
  }
  return positions;
}
