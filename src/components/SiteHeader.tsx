import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function SiteHeader() {
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const header = headerRef.current;
    if (!header) return;

    const lightSections = [
      "#identity-section",
      "#projects-section",
      "#project-provoke",
      "#project-journal",
      "#writing-section",
      "footer",
    ];

    const triggers: ReturnType<typeof ScrollTrigger.create>[] = [];

    lightSections.forEach((selector) => {
      const t = ScrollTrigger.create({
        trigger: selector,
        start: "top 50px",
        end: "bottom 50px",
        onEnter: () => header.setAttribute("data-theme", "light"),
        onLeave: () => header.setAttribute("data-theme", "dark"),
        onEnterBack: () => header.setAttribute("data-theme", "light"),
        onLeaveBack: () => header.setAttribute("data-theme", "dark"),
      });
      triggers.push(t);
    });

    const hideShow = ScrollTrigger.create({
      trigger: "#identity-section",
      start: "top 100px",
      onEnter: () =>
        gsap.to(header, {
          yPercent: -100,
          autoAlpha: 0,
          duration: 0.5,
          ease: "power2.inOut",
        }),
      onLeaveBack: () =>
        gsap.to(header, {
          yPercent: 0,
          autoAlpha: 1,
          duration: 0.5,
          ease: "power2.inOut",
        }),
    });
    triggers.push(hideShow);

    return () => {
      triggers.forEach((t) => t.kill());
    };
  }, []);

  return (
    <header
      ref={headerRef}
      id="main-header"
      className="fixed top-0 left-0 w-full z-50 p-6 md:p-10"
    >
      <nav className="grid grid-cols-2 md:grid-cols-5 font-sans text-white font-medium text-sm tracking-[0.1em] items-center">
        <div>Ananjan Mitra</div>
        <div className="hidden md:block text-center">
          <a
            href="https://github.com/pybash1"
            target="_blank"
            rel="noreferrer"
            className="nav-link"
          >
            GitHub <span className="nav-arrow">↗</span>
          </a>
        </div>
        <div className="hidden md:block text-center">
          <a
            href="https://instagram.com/ananjan_"
            target="_blank"
            rel="noreferrer"
            className="nav-link"
          >
            Instagram <span className="nav-arrow">↗</span>
          </a>
        </div>
        <div className="hidden md:block text-center">
          <a href="https://x.com/py_bash1" className="nav-link">
            Twitter <span className="nav-arrow">↗</span>
          </a>
        </div>
        <div className="text-right">&copy; 2026</div>
      </nav>
    </header>
  );
}
