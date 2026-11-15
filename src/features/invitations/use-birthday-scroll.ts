"use client";

import { useEffect, useRef } from "react";

function findScrollRoot(element: HTMLElement): HTMLElement | null {
  let parent = element.parentElement;
  while (parent) {
    const overflow = window.getComputedStyle(parent).overflowY;
    if ((overflow === "auto" || overflow === "scroll") && parent.scrollHeight > parent.clientHeight) {
      return parent;
    }
    parent = parent.parentElement;
  }
  return null;
}

/** Tracks scroll progress without React state updates; also supports the editor's nested scroller. */
interface ScrollConfig {
  heroSelector?: string;
  offsetVariable?: string;
  scaleVariable?: string;
}

/** Shared scroll/reveal behavior; customized per visual family without extra listeners. */
export function useBirthdayScroll({
  heroSelector = ".bd-hero",
  offsetVariable = "--bd-photo-offset",
  scaleVariable = "--bd-photo-scale",
}: ScrollConfig = {}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches) return;

    const scrollRoot = findScrollRoot(element);
    const target: HTMLElement | Window = scrollRoot ?? window;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { root: scrollRoot, threshold: 0.08, rootMargin: "0px 0px -6% 0px" },
    );
    element.querySelectorAll<HTMLElement>("[data-birthday-reveal]").forEach((node) => observer.observe(node));
    element.classList.add("bd-motion-on");

    let frameId = 0;
    const update = () => {
      frameId = 0;
      const hero = element.querySelector<HTMLElement>(heroSelector);
      if (!hero) return;
      const viewTop = scrollRoot?.getBoundingClientRect().top ?? 0;
      const viewHeight = scrollRoot?.clientHeight ?? window.innerHeight;
      const heroTop = hero.getBoundingClientRect().top;
      const progress = Math.max(0, Math.min(1, (viewTop + viewHeight * 0.12 - heroTop) / Math.max(hero.offsetHeight, 1)));
      element.style.setProperty(offsetVariable, `${Math.round(progress * -35)}px`);
      element.style.setProperty(scaleVariable, `${(1.025 + progress * 0.095).toFixed(4)}`);

      const ageStory = element.querySelector<HTMLElement>(".bd-age-story");
      if (ageStory) {
        const rect = ageStory.getBoundingClientRect();
        const ageProgress = Math.max(0, Math.min(1, (viewTop + viewHeight - rect.top) / (rect.height + viewHeight)));
        element.style.setProperty("--bd-age-progress", ageProgress.toFixed(4));
      }
    };
    const schedule = () => {
      if (!frameId) frameId = window.requestAnimationFrame(update);
    };
    const resizeObserver = new ResizeObserver(schedule);
    resizeObserver.observe(element);
    target.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    schedule();

    return () => {
      observer.disconnect();
      resizeObserver.disconnect();
      target.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frameId) window.cancelAnimationFrame(frameId);
      element.classList.remove("bd-motion-on");
    };
  }, [heroSelector, offsetVariable, scaleVariable]);

  return ref;
}
