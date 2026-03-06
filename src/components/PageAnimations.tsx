import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function PageAnimations() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // Writing section row reveals
      const writingLinks = document.querySelectorAll("#writing-section a");
      if (writingLinks.length > 0) {
        gsap.from("#writing-section a", {
          y: 30,
          opacity: 0,
          duration: 1,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: "#writing-section",
            start: "top bottom-=50",
            toggleActions: "play none none reverse",
          },
        });
      }

      // Project section reveals
      const projectSections = [
        "#featured-project",
        "#project-provoke",
        "#project-journal",
      ];

      projectSections.forEach((selector) => {
        const section = document.querySelector(selector);
        if (!section) return;

        // Image scale-in
        const img = section.querySelector("img");
        if (img) {
          gsap.from(img, {
            scale: 1.1,
            opacity: 0.6,
            duration: 1.4,
            ease: "power3.out",
            scrollTrigger: {
              trigger: img,
              start: "top bottom-=100",
              toggleActions: "play none none reverse",
            },
          });
        }

        // Text stagger reveal
        const texts = section.querySelectorAll("h2, p, .flex.flex-col.gap-1");
        if (texts.length > 0) {
          gsap.from(texts, {
            y: 40,
            opacity: 0,
            duration: 1,
            stagger: 0.08,
            ease: "power3.out",
            scrollTrigger: {
              trigger: section,
              start: "top bottom-=50",
              toggleActions: "play none none reverse",
            },
          });
        }
      });
    });

    window.addEventListener("load", () => ScrollTrigger.refresh());

    return () => {
      ctx.revert();
    };
  }, []);

  return null;
}
