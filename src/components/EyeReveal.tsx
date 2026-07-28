import { useCallback, useRef, type ReactNode } from "react";

interface EyeRevealProps {
  children: ReactNode;
  className?: string;
}

const EYE_PATH = "M0,70 Q120,-30 240,70 Q120,170 0,70 Z";
const EYE_WIDTH = 240;
const EYE_HEIGHT = 140;

const EYE_MASK = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${EYE_WIDTH} ${EYE_HEIGHT}'><path d='${EYE_PATH}' fill='white'/></svg>`
)}")`;

export default function EyeReveal({ children, className }: EyeRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback((clientX: number, clientY: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--eye-x", `${clientX - rect.left}px`);
    el.style.setProperty("--eye-y", `${clientY - rect.top}px`);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`group/eye relative ${className ?? ""}`}
      onMouseMove={(e) => updatePosition(e.clientX, e.clientY)}
      onTouchMove={(e) => {
        const t = e.touches[0];
        if (t) updatePosition(t.clientX, t.clientY);
      }}
      style={{ "--eye-x": "-999px", "--eye-y": "-999px" } as React.CSSProperties}
    >
      <div aria-hidden="true" className="blur-[16px] opacity-40 select-none">
        {children}
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-150 group-hover/eye:opacity-100"
        style={{
          WebkitMaskImage: EYE_MASK,
          maskImage: EYE_MASK,
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskSize: `${EYE_WIDTH}px ${EYE_HEIGHT}px`,
          maskSize: `${EYE_WIDTH}px ${EYE_HEIGHT}px`,
          WebkitMaskPosition: `calc(var(--eye-x) - ${EYE_WIDTH / 2}px) calc(var(--eye-y) - ${EYE_HEIGHT / 2}px)`,
          maskPosition: `calc(var(--eye-x) - ${EYE_WIDTH / 2}px) calc(var(--eye-y) - ${EYE_HEIGHT / 2}px)`,
        }}
      >
        {children}
      </div>

      <svg
        aria-hidden="true"
        className="pointer-events-none absolute opacity-0 transition-opacity duration-150 group-hover/eye:opacity-60"
        style={{
          width: EYE_WIDTH,
          height: EYE_HEIGHT,
          left: `calc(var(--eye-x) - ${EYE_WIDTH / 2}px)`,
          top: `calc(var(--eye-y) - ${EYE_HEIGHT / 2}px)`,
        }}
        viewBox={`0 0 ${EYE_WIDTH} ${EYE_HEIGHT}`}
      >
        <path d={EYE_PATH} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
      </svg>
    </div>
  );
}
