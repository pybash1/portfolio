import { useEffect, useRef } from "react";

interface Point {
  x: number;
  y: number;
}
interface Camera extends Point {
  scale: number;
}
const clampScale = (scale: number) => Math.max(0.5, Math.min(1.6, scale));

/** The camera moves a DOM layer; panning never rerenders the collection. */
export function useCanvas(enabled: boolean) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const camera = useRef<Camera>({ x: 0, y: 0, scale: 1 });
  const frame = useRef(0);

  function paint() {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const { x, y, scale } = camera.current;
      if (sceneRef.current)
        sceneRef.current.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    });
  }

  function zoomAt(factor: number, point?: Point) {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const anchor = point ?? {
      x: viewport.clientWidth / 2,
      y: viewport.clientHeight / 2,
    };
    const previous = camera.current;
    const nextScale = clampScale(previous.scale * factor);
    const ratio = nextScale / previous.scale;
    camera.current = {
      x: anchor.x - (anchor.x - previous.x) * ratio,
      y: anchor.y - (anchor.y - previous.y) * ratio,
      scale: nextScale,
    };
    paint();
  }

  function reset() {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const homeScale = Math.max(
      0.65,
      Math.min(0.82, viewport.clientWidth / 1700),
    );
    camera.current = {
      x: viewport.clientWidth / 2 - 1100 * homeScale,
      y: viewport.clientHeight / 2 - 650 * homeScale,
      scale: homeScale,
    };
    paint();
  }

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!enabled || !viewport) return;
    reset();
    const points = new Map<number, Point>();
    let origin: Point = { x: 0, y: 0 };
    let dragging = false;
    let suppressClickUntil = 0;

    const local = (point: Point) => {
      const rect = viewport.getBoundingClientRect();
      return { x: point.x - rect.left, y: point.y - rect.top };
    };
    const pair = () => [...points.values()].slice(0, 2) as [Point, Point];
    const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
    const midpoint = (a: Point, b: Point) => ({
      x: (a.x + b.x) / 2,
      y: (a.y + b.y) / 2,
    });

    const down = (event: PointerEvent) => {
      if (event.button !== 0 || points.size >= 2) return;
      points.set(event.pointerId, { x: event.clientX, y: event.clientY });
      origin = { x: event.clientX, y: event.clientY };
      dragging = points.size > 1;
    };
    const move = (event: PointerEvent) => {
      const previous = points.get(event.pointerId);
      if (!previous) return;
      const next = { x: event.clientX, y: event.clientY };
      if (!dragging && distance(origin, next) < 5) return;
      dragging = true;
      viewport.dataset.dragging = "true";
      viewport.setPointerCapture(event.pointerId);
      event.preventDefault();
      if (points.size === 2) {
        const [a, b] = pair();
        const previousCenter = midpoint(a, b);
        const previousDistance = distance(a, b);
        points.set(event.pointerId, next);
        const [c, d] = pair();
        const nextCenter = midpoint(c, d);
        if (previousDistance > 0)
          zoomAt(distance(c, d) / previousDistance, local(previousCenter));
        camera.current.x += nextCenter.x - previousCenter.x;
        camera.current.y += nextCenter.y - previousCenter.y;
      } else {
        camera.current.x += next.x - previous.x;
        camera.current.y += next.y - previous.y;
        points.set(event.pointerId, next);
      }
      paint();
    };
    const up = (event: PointerEvent) => {
      if (!points.has(event.pointerId)) return;
      points.delete(event.pointerId);
      if (dragging) suppressClickUntil = performance.now() + 150;
      if (viewport.hasPointerCapture(event.pointerId))
        viewport.releasePointerCapture(event.pointerId);
      if (!points.size) {
        dragging = false;
        delete viewport.dataset.dragging;
      }
    };
    const click = (event: MouseEvent) => {
      if (performance.now() < suppressClickUntil) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      if (event.ctrlKey || event.metaKey) {
        zoomAt(
          Math.exp(-event.deltaY * 0.01),
          local({ x: event.clientX, y: event.clientY }),
        );
      } else {
        const unit =
          event.deltaMode === 1
            ? 16
            : event.deltaMode === 2
              ? viewport.clientHeight
              : 1;
        camera.current.x -=
          (event.shiftKey ? event.deltaY : event.deltaX) * unit;
        camera.current.y -= (event.shiftKey ? 0 : event.deltaY) * unit;
        paint();
      }
    };
    const key = (event: KeyboardEvent) => {
      if (event.target !== viewport) return;
      const movement: Record<string, Point> = {
        ArrowLeft: { x: 70, y: 0 },
        ArrowRight: { x: -70, y: 0 },
        ArrowUp: { x: 0, y: 70 },
        ArrowDown: { x: 0, y: -70 },
      };
      const delta = movement[event.key];
      if (delta) {
        event.preventDefault();
        camera.current.x += delta.x;
        camera.current.y += delta.y;
        paint();
      } else if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        zoomAt(1.2);
      } else if (event.key === "-") {
        event.preventDefault();
        zoomAt(1 / 1.2);
      } else if (event.key === "Home" || event.key === "0") {
        event.preventDefault();
        reset();
      }
    };
    const focus = (event: FocusEvent) => {
      if (!(event.target instanceof Element)) return;
      // Reveal keyboard navigation without shifting an item under a pointer.
      if (!event.target.matches(":focus-visible")) return;
      const card = event.target.closest<HTMLElement>("[data-inspo-card]");
      if (!card) return;
      // Native focus scrolling must not move the canvas's hidden scroll area.
      viewport.scrollLeft = 0;
      viewport.scrollTop = 0;
      const rect = card.getBoundingClientRect();
      const bounds = viewport.getBoundingClientRect();
      if (
        rect.left < bounds.left + 12 ||
        rect.right > bounds.right - 12 ||
        rect.top < bounds.top + 12 ||
        rect.bottom > bounds.bottom - 12
      ) {
        camera.current.x +=
          bounds.left + bounds.width / 2 - (rect.left + rect.width / 2);
        camera.current.y +=
          bounds.top + bounds.height / 2 - (rect.top + rect.height / 2);
        paint();
      }
    };
    let width = viewport.clientWidth;
    let height = viewport.clientHeight;
    const observer = new ResizeObserver(() => {
      camera.current.x += (viewport.clientWidth - width) / 2;
      camera.current.y += (viewport.clientHeight - height) / 2;
      width = viewport.clientWidth;
      height = viewport.clientHeight;
      paint();
    });
    observer.observe(viewport);
    viewport.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    viewport.addEventListener("click", click, true);
    viewport.addEventListener("wheel", wheel, { passive: false });
    viewport.addEventListener("keydown", key);
    viewport.addEventListener("focusin", focus);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame.current);
      viewport.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      viewport.removeEventListener("click", click, true);
      viewport.removeEventListener("wheel", wheel);
      viewport.removeEventListener("keydown", key);
      viewport.removeEventListener("focusin", focus);
      delete viewport.dataset.dragging;
      if (sceneRef.current) sceneRef.current.style.transform = "";
    };
    // Event handlers read the camera ref. Only changing view installs a new gesture session.
  }, [enabled]);

  function reveal(card: HTMLElement) {
    const bounds = viewportRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const rect = card.getBoundingClientRect();
    camera.current.x +=
      bounds.left + bounds.width / 2 - (rect.left + rect.width / 2);
    camera.current.y +=
      bounds.top + bounds.height / 2 - (rect.top + rect.height / 2);
    paint();
  }

  return { viewportRef, sceneRef, reveal };
}
