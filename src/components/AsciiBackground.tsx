import { useEffect, useRef } from "react";

const GLYPHS = ["-", "/", "\\", "|", "+", "=", "_", "[", "]"];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function hash(x: number, y: number, seed: number) {
  const n = Math.sin(x * 127.1 + y * 311.7 + seed * 67.3) * 43758.5453123;
  return n - Math.floor(n);
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

export default function AsciiBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const ctx = context;

    const CELL = 19;
    const FONT = 7.5;
    const fontFamily = '"Berkeley Mono", "JetBrains Mono", ui-monospace, Menlo, Monaco, "Courier New", monospace';

    let w = 0;
    let h = 0;
    let dpr = 1;
    let cols = 0;
    let rows = 0;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const onResize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(w / CELL);
      rows = Math.ceil(h / CELL);
    };

    onResize();
    window.addEventListener("resize", onResize);
    void document.fonts?.load(`${FONT}px ${fontFamily}`);

    let raf: number;

    function draw(timeMs: number) {
      ctx.clearRect(0, 0, w, h);
      ctx.font = `${FONT}px ${fontFamily}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const t = reducedMotion ? 0 : timeMs * 0.001;
      const driftSeed = Math.floor(t * 0.18);

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const px = col * CELL + CELL * 0.5;
          const py = row * CELL + CELL * 0.5;
          const staticNoise = hash(col, row, 3);
          const structure = Math.max(
            1 - smoothstep(0.0, 0.018, Math.abs((col * 0.018 + row * 0.031) % 0.31 - 0.155)),
            1 - smoothstep(0.0, 0.012, Math.abs((col * 0.041 - row * 0.019) % 0.42 - 0.21))
          );

          if (staticNoise > 0.5 && structure < 0.28) continue;

          const ambient = 0.5 + Math.sin(col * 0.11 + row * 0.07 + t * 0.12) * 0.5;
          const reveal = clamp(structure * 0.52 + ambient * 0.18, 0, 1);

          if (reveal < 0.11 && hash(col, row, driftSeed) > 0.22) continue;

          const glyphNoise = hash(col, row, driftSeed + 5);
          const glyphIndex = Math.floor(glyphNoise * GLYPHS.length);
          const glyph = GLYPHS[glyphIndex] ?? "-";
          const opacity = clamp(0.02 + structure * 0.06 + ambient * 0.03, 0, 0.26);
          ctx.fillStyle = `rgba(220, 217, 206, ${opacity})`;
          ctx.fillText(glyph, px, py);
        }
      }

      raf = requestAnimationFrame(draw);
    }

    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
}
