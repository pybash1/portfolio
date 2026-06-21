import { useEffect, useRef } from "react";

const GLYPHS = "   ...,,,:::;;;ii!!**++==##%%@@";
const PORTRAIT_SOURCES = ["/portrait.webp", "/portrait.jpg", "/portrait.png"];
const SAMPLE_WIDTH = 720;
const SAMPLE_HEIGHT = 918;

type PortraitSample = {
  data: Uint8ClampedArray;
  width: number;
  height: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function hash(x: number, y: number, seed: number) {
  const n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453123;
  return n - Math.floor(n);
}

function ellipse(x: number, y: number, cx: number, cy: number, rx: number, ry: number) {
  const dx = (x - cx) / rx;
  const dy = (y - cy) / ry;
  return Math.sqrt(dx * dx + dy * dy);
}


export default function AsciiCascade() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>();
  const portraitRef = useRef<PortraitSample | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let cellX = 12;
    let cellY = 18;
    let cols = 0;
    let rows = 0;
    const fontFamily = '"Berkeley Mono", "JetBrains Mono", ui-monospace, Menlo, Monaco, "Courier New", monospace';
    const loadPortrait = (sourceIndex = 0) => {
      const src = PORTRAIT_SOURCES[sourceIndex];
      if (!src) return;

      const image = new Image();
      image.onload = () => {
        const buffer = document.createElement("canvas");
        buffer.width = SAMPLE_WIDTH;
        buffer.height = SAMPLE_HEIGHT;
        const bufferCtx = buffer.getContext("2d");
        if (!bufferCtx) return;

        const crop = {
          x: image.naturalWidth * 0.27,
          y: image.naturalHeight * 0.29,
          width: image.naturalWidth * 0.48,
          height: image.naturalHeight * 0.52,
        };

        bufferCtx.filter = "contrast(1.25) saturate(0)";
        bufferCtx.drawImage(
          image,
          crop.x,
          crop.y,
          crop.width,
          crop.height,
          0,
          0,
          SAMPLE_WIDTH,
          SAMPLE_HEIGHT
        );
        const imageData = bufferCtx.getImageData(0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT);
        portraitRef.current = {
          data: imageData.data,
          width: SAMPLE_WIDTH,
          height: SAMPLE_HEIGHT,
        };
      };
      image.onerror = () => loadPortrait(sourceIndex + 1);
      image.src = src;
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = window.devicePixelRatio || 1;
      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const ultraDensity = width < 1500;
      cellX = width < 640 ? 2.4 : ultraDensity ? 2.8 : 3.4;
      cellY = width < 640 ? 4.1 : ultraDensity ? 4.4 : 5.2;
      cols = Math.ceil(width / cellX);
      rows = Math.ceil(height / cellY);
    };

    void document.fonts?.load(`8px ${fontFamily}`);

    const draw = (timeMs: number) => {
      const t = timeMs * 0.001;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
      ctx.fillRect(0, 0, width, height);
      ctx.font = `${width < 640 ? 3.9 : width < 1500 ? 4.3 : 5.1}px ${fontFamily}`;
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";

      const frameMaxWidth = width < 760 ? width * 0.86 : width * 0.64;
      const frameMaxHeight = height * 0.84;
      const frameHeight = Math.min(frameMaxHeight, frameMaxWidth / 0.74);
      const frameWidth = frameHeight * 0.74;
      const frameLeft = width < 760 ? (width - frameWidth) / 2 : width * 0.56 - frameWidth / 2;
      const frameTop = height * 0.5 - frameHeight / 2;
      const frameRight = frameLeft + frameWidth;
      const frameBottom = frameTop + frameHeight;
      const portrait = portraitRef.current;

      if (!portrait) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const px = col * cellX + cellX * 0.5;
          const py = row * cellY + cellY * 0.5;
          const inFrame = px >= frameLeft && px <= frameRight && py >= frameTop && py <= frameBottom;
          const x = (px - frameLeft) / frameWidth;
          const y = (py - frameTop) / frameHeight;

          if (!inFrame && !portrait) {
            const drift = 1 - smoothstep(0.0, 0.03, Math.abs((px / width + py / height * 0.7 + t * 0.035) % 0.24 - 0.12));
            const noise = hash(col, row, Math.floor(t * 7));
            if (drift < 0.22 || noise > 0.35) continue;
            const alpha = drift * 0.24;
            const glyph = GLYPHS[Math.floor(drift * (GLYPHS.length - 1))] ?? ".";
            ctx.fillStyle = `rgba(226, 224, 216, ${alpha})`;
            ctx.fillText(glyph, px, py);
            continue;
          }
          if (!inFrame) continue;

          const waveX = Math.sin(y * 18 + t * 0.8) * 0.0015;
          const waveY = Math.cos(x * 12 - t * 0.65) * 0.001;
          const sx = x + waveX;
          const sy = y + waveY;

          const sampleX = clamp(Math.floor(sx * portrait.width), 0, portrait.width - 1);
          const sampleY = clamp(Math.floor(sy * portrait.height), 0, portrait.height - 1);
          const sampleIndex = (sampleY * portrait.width + sampleX) * 4;
          const r = portrait.data[sampleIndex] ?? 0;
          const g = portrait.data[sampleIndex + 1] ?? 0;
          const b = portrait.data[sampleIndex + 2] ?? 0;
          const lum = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
          const leftLum = sampleX > 0
            ? ((portrait.data[sampleIndex - 4] ?? r) * 0.299 + (portrait.data[sampleIndex - 3] ?? g) * 0.587 + (portrait.data[sampleIndex - 2] ?? b) * 0.114) / 255
            : lum;
          const rightIndex = sampleX < portrait.width - 1 ? sampleIndex + 4 : sampleIndex;
          const rightLum = ((portrait.data[rightIndex] ?? r) * 0.299 + (portrait.data[rightIndex + 1] ?? g) * 0.587 + (portrait.data[rightIndex + 2] ?? b) * 0.114) / 255;
          const topIndex = sampleY > 0 ? sampleIndex - portrait.width * 4 : sampleIndex;
          const topLum = ((portrait.data[topIndex] ?? r) * 0.299 + (portrait.data[topIndex + 1] ?? g) * 0.587 + (portrait.data[topIndex + 2] ?? b) * 0.114) / 255;
          const bottomIndex = sampleY < portrait.height - 1 ? sampleIndex + portrait.width * 4 : sampleIndex;
          const bottomLum = ((portrait.data[bottomIndex] ?? r) * 0.299 + (portrait.data[bottomIndex + 1] ?? g) * 0.587 + (portrait.data[bottomIndex + 2] ?? b) * 0.114) / 255;
          const gradientX = rightLum - leftLum;
          const gradientY = bottomLum - topLum;
          const imageEdge = clamp((Math.abs(gradientX) + Math.abs(gradientY)) * 5.8, 0, 1);
          const headMask = 1 - smoothstep(0.82, 1.02, ellipse(x, y, 0.5, 0.27, 0.31, 0.31));
          const torsoMask = 1 - smoothstep(0.78, 1.0, ellipse(x, y, 0.5, 0.77, 0.52, 0.35));
          const foreground = clamp(Math.max(headMask, torsoMask * 0.5), 0, 1);
          if (foreground < 0.18) continue;
          const glassesBand = smoothstep(0.25, 0.32, y) * (1 - smoothstep(0.43, 0.51, y));
          const glassesArea = glassesBand * (1 - smoothstep(0.18, 0.36, Math.abs(x - 0.5)));
          const bridgeLine = (1 - smoothstep(0.0, 0.012, Math.abs(x - 0.5))) *
            smoothstep(0.32, 0.36, y) * (1 - smoothstep(0.39, 0.42, y));
          const mouthLine = (1 - smoothstep(0.0, 0.022, Math.abs(y - 0.53))) *
            (1 - smoothstep(0.0, 0.17, Math.abs(x - 0.5)));
          const jawLine = (1 - smoothstep(0.0, 0.028, Math.abs(ellipse(x, y, 0.5, 0.47, 0.24, 0.23) - 0.72))) *
            smoothstep(0.42, 0.48, y) * (1 - smoothstep(0.64, 0.72, y));
          const anchorDetail = Math.max(bridgeLine * 0.72, mouthLine * 0.78, jawLine * 0.68);
          const darkFeature = clamp((0.58 - lum) * 2.2, 0, 1) * foreground;
          const featureBoost = clamp(Math.max(imageEdge * 1.25, glassesArea * darkFeature * 1.8, anchorDetail), 0, 1);
          const profile = clamp((1 - lum) * 0.68 + featureBoost * 0.92, 0, 1) * foreground;
          const features = featureBoost;
          const staticNoise = hash(col, row, Math.floor(t * 8));
          const signal = profile;

          if (signal < 0.045 && staticNoise > 0.055) continue;

          const shimmer = hash(col, row, Math.floor(t * 18));
          const density = clamp(signal + features * 0.82 + shimmer * 0.015, 0, 1);
          const glyphIndex = Math.floor(Math.pow(density, 1.18) * (GLYPHS.length - 1));
          const angle = Math.atan2(gradientY, gradientX);
          const absAngle = Math.abs(angle);
          const edgeGlyph = absAngle < 0.45 || absAngle > 2.7
            ? "|"
            : absAngle > 1.05 && absAngle < 2.1
              ? "-"
              : angle > 0
                ? "\\"
                : "/";
          const anchorGlyph = bridgeLine > 0.5
            ? "|"
            : mouthLine > 0.46
              ? "-"
              : jawLine > 0.46
                ? "_"
                : edgeGlyph;
          const glassesGlyph = glassesArea * darkFeature > 0.32 ? "#" : anchorGlyph;
          const glyph = anchorDetail > 0.42 ? anchorGlyph : features > 0.34 ? glassesGlyph : GLYPHS[glyphIndex] ?? ".";
          const accentNoise = hash(col, row, 17);
          const accentDetail = Math.max(glassesArea * darkFeature, jawLine * 0.58, mouthLine * 0.5, imageEdge * 0.46);
          const heat = accentDetail > 0.42 && accentNoise < 0.18;
          // foreground base ensures bright skin tones are visible, not just dark features
          const alpha = clamp(foreground * 0.5 + density * 0.88 + features * 0.48, 0, heat ? 0.88 : 0.99);

          ctx.fillStyle = heat
            ? `rgba(255, 91, 29, ${alpha * 0.88})`
            : `rgba(255, 255, 255, ${alpha})`;
          ctx.fillText(glyph, px, py);
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    loadPortrait();
    resize();
    rafRef.current = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden pb-14">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        aria-label="Animated ASCII portrait"
      />
    </div>
  );
}
