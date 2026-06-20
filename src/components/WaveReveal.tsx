import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

interface WaveRevealProps {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
}

export default function WaveReveal({
  text,
  className,
  delay = 0,
  stagger = 0.018,
}: WaveRevealProps) {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const container = containerRef.current;
    if (!container) return;

    const chars = container.querySelectorAll<HTMLElement>(".wc");

    gsap.fromTo(
      chars,
      {
        y: (i: number) => -50 - Math.sin(i * 0.55) * 35,
        opacity: 0,
      },
      {
        y: 0,
        opacity: 1,
        stagger,
        duration: 0.38,
        ease: "power3.out",
        delay,
        scrollTrigger: {
          trigger: container,
          start: "top 82%",
        },
      }
    );

    return () => ScrollTrigger.getAll().forEach((t) => t.kill());
  }, []);

  return (
    <span ref={containerRef} className={`inline-block ${className ?? ""}`} aria-label={text}>
      {text.split("").map((ch, i) => (
        <span
          key={i}
          className="wc inline-block"
          style={{ opacity: 0, whiteSpace: ch === " " ? "pre" : undefined }}
          aria-hidden="true"
        >
          {ch}
        </span>
      ))}
    </span>
  );
}
