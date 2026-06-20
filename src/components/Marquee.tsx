import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const ITEMS = Array.from({ length: 5 });

function MarqueeItems() {
  return (
    <>
      {ITEMS.map((_, i) => (
        <div key={i} className="flex items-center gap-16 shrink-0">
          <span className="font-mono text-4xl md:text-6xl tracking-[0.08em] uppercase leading-none whitespace-nowrap">
            Selected Work
          </span>
          <span className="font-mono text-accent text-2xl md:text-4xl leading-none select-none opacity-60">
            //
          </span>
        </div>
      ))}
    </>
  );
}

export default function Marquee() {
  const group1Ref = useRef<HTMLDivElement>(null);
  const group2Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const group1 = group1Ref.current;
    const group2 = group2Ref.current;
    if (!group1 || !group2) return;
    const groups = [group1, group2];

    let xPos = 0;
    let speed = -1;
    let targetSpeed = -1;
    let rafId: number;

    let groupWidth = group1.offsetWidth;

    const onResize = () => {
      groupWidth = group1.offsetWidth;
    };
    window.addEventListener("resize", onResize);

    function tick() {
      speed += (targetSpeed - speed) * 0.05;
      xPos += speed;

      if (xPos <= -groupWidth) xPos += groupWidth;
      if (xPos >= 0) xPos -= groupWidth;

      groups.forEach((g) => {
        g.style.transform = `translateX(${xPos}px)`;
      });

      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);

    const st = ScrollTrigger.create({
      onUpdate: (self) => {
        if (self.direction !== 0) {
          targetSpeed = self.direction * 1;
        }
      },
    });

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      st.kill();
    };
  }, []);

  return (
    <section
      id="projects-section"
      className="py-8 bg-bg text-primary relative z-10 overflow-hidden border-y border-white/[0.08]"
    >
      <div className="marquee-wrapper flex whitespace-nowrap overflow-hidden py-3">
        <div
          ref={group1Ref}
          className="marquee-group flex items-center pr-16 shrink-0 gap-16 will-change-transform"
        >
          <MarqueeItems />
        </div>
        <div
          ref={group2Ref}
          className="marquee-group flex items-center pr-16 shrink-0 gap-16 will-change-transform"
          aria-hidden="true"
        >
          <MarqueeItems />
        </div>
      </div>
    </section>
  );
}
