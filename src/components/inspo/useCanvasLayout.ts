import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";
import { layoutCanvasCards } from "../../lib/inspoLayout";
import type { InspoItem } from "./types";

const useBrowserLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

const center = { x: 1100, y: 650 };

/** Random spot in a field that grows with the collection, centred on the home view. */
function scatter(count: number, width: number, height: number) {
  const area = Math.max(count, 1) * 520 * 420 * 2.5;
  const fieldWidth = Math.sqrt(area * 1.6);
  const fieldHeight = fieldWidth / 1.6;
  return {
    x: Math.round(
      center.x - fieldWidth / 2 + Math.random() * fieldWidth - width / 2,
    ),
    y: Math.round(
      center.y - fieldHeight / 2 + Math.random() * fieldHeight - height / 2,
    ),
  };
}

/** Measure actual card heights so fonts, captions, and embeds cannot overlap. */
export function useCanvasLayout(
  sceneRef: RefObject<HTMLDivElement | null>,
  items: InspoItem[],
  enabled: boolean,
) {
  // Fresh random spots each visit, kept for the visit so cards never jump around.
  const scattered = useRef(new Map<string, { x: number; y: number }>());

  useBrowserLayoutEffect(() => {
    const scene = sceneRef.current;
    if (!enabled || !scene) return;

    const cards = Array.from(
      scene.querySelectorAll<HTMLElement>("[data-inspo-card]"),
    );
    const itemsById = new Map(items.map((item) => [item.id, item]));
    const layout = () => {
      const boxes = cards.flatMap((card) => {
        const item = itemsById.get(card.dataset.inspoId ?? "");
        if (!item) return [];
        let spot = scattered.current.get(item.id);
        if (!spot) {
          spot = scatter(items.length, card.offsetWidth, card.offsetHeight);
          scattered.current.set(item.id, spot);
        }
        return [
          {
            id: item.id,
            ...spot,
            width: card.offsetWidth,
            height: card.offsetHeight,
          },
        ];
      });
      const positions = layoutCanvasCards(boxes);
      for (const card of cards) {
        const position = positions.get(card.dataset.inspoId ?? "");
        if (!position) continue;
        card.style.setProperty("--item-x", `${position.x}px`);
        card.style.setProperty("--item-y", `${position.y}px`);
      }
    };

    layout();
    const observer = new ResizeObserver(layout);
    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [enabled, items, sceneRef]);
}
