import { useEffect, useRef, useState, useCallback } from "react";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%!?&*+-=<>";

function useScramble(text: string, trigger: boolean, speed = 22, delay = 0) {
  const [output, setOutput] = useState(text);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (!trigger) {
      setOutput(text);
      return;
    }

    let frame = 0;
    const totalFrames = Math.max(1, text.replace(/ /g, "").length * 10);

    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        frame++;
        const progress = frame / totalFrames;
        const settled = Math.floor(progress * text.length);
        let result = text.slice(0, settled);

        for (let i = settled; i < text.length; i++) {
          const ch = text[i];
          result +=
            ch === " " || ch === "." || ch === "," || ch === "\n"
              ? ch
              : CHARS[Math.floor(Math.random() * CHARS.length)] ?? "";
        }

        setOutput(result);

        if (frame >= totalFrames) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setOutput(text);
        }
      }, speed);
    }, delay);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [trigger]);

  return output;
}

// Scrambles when scrolled into view (fires once)
export function ScrambleReveal({
  text,
  className,
  speed,
  delay = 0,
  threshold = 0.3,
}: {
  text: string;
  className?: string;
  speed?: number;
  delay?: number;
  threshold?: number;
}) {
  const [triggered, setTriggered] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const output = useScramble(text, triggered, speed, delay);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting) {
          setTriggered(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <span ref={ref} className={className}>
      {output}
    </span>
  );
}

// Scrambles on hover/focus
export function ScrambleHover({
  text,
  className,
  speed,
}: {
  text: string;
  className?: string;
  speed?: number;
}) {
  const [trigger, setTrigger] = useState(false);
  const output = useScramble(text, trigger, speed ?? 18);

  const handleEnter = useCallback(() => {
    setTrigger(false);
    requestAnimationFrame(() => requestAnimationFrame(() => setTrigger(true)));
  }, []);

  return (
    <span className={className} onMouseEnter={handleEnter}>
      {output}
    </span>
  );
}
