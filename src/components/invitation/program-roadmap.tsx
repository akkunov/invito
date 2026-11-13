"use client";

import { useEffect, useRef } from "react";
import type { InvitationDocument } from "@/features/invitations/invitation.schema";

function scrollContainer(start: HTMLElement): HTMLElement | null {
  let node = start.parentElement;
  while (node) {
    const overflow = window.getComputedStyle(node).overflowY;
    if ((overflow === "auto" || overflow === "scroll") && node.scrollHeight > node.clientHeight + 8) return node;
    node = node.parentElement;
  }
  return null;
}

/** Scroll-driven vertical timeline in the editor scroller or full page. */
export function ProgramRoadmap({ document }: { document: InvitationDocument }) {
  const ref = useRef<HTMLElement>(null);
  const locale = document.locale;
  const events = document.program ?? [];
  useEffect(() => {
    const element = ref.current;
    if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = scrollContainer(element);
    const target = root ?? window;
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = element.getBoundingClientRect();
      const viewportTop = root?.getBoundingClientRect().top ?? 0;
      const viewportHeight = root?.clientHeight ?? window.innerHeight;
      const start = viewportTop + viewportHeight * .74;
      const end = viewportTop + viewportHeight * .24;
      const progress = Math.max(0, Math.min(1, (start - rect.top) / Math.max(1, rect.height + start - end)));
      element.style.setProperty("--road-progress", progress.toFixed(4));
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) entry.target.classList.add("road-visible"); });
    }, { root, threshold: .15, rootMargin: "0px 0px -5% 0px" });
    element.querySelectorAll(".road-event").forEach((node) => observer.observe(node));
    element.classList.add("road-motion");
    target.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    update();
    return () => { observer.disconnect(); target.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule); if (frame) cancelAnimationFrame(frame); };
  }, [events.length]);

  return <section data-editor-block="program" className="invite-roadmap" ref={ref} aria-label={locale === "ru" ? "Программа мероприятия" : "Иш-чаранын программасы"}>
    <p className="invite-section-kicker">{locale === "ru" ? "Ждём вас" : "Сиздерди күтөбүз"}</p>
    <h3>{locale === "ru" ? "Программа вечера" : "Кеченин программасы"}</h3>
    {events.length ? <div className="road-events">
      <div className="road-track" aria-hidden="true" />
      {events.map((event, index) => <article className="road-event" key={event.id}>
        <div className="road-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</div>
        <div className="road-copy"><time>{event.time}</time><h4>{event.title[locale]}</h4><p>{event.description[locale]}</p></div>
      </article>)}
    </div> : <p className="invite-gallery-empty">{locale === "ru" ? "Добавьте пункты программы в редакторе" : "Редактордо программа пункттарын кошуңуз"}</p>}
  </section>;
}
