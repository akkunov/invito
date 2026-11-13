"use client";

import { useCallback, useEffect, useRef } from "react";
import type { RefObject } from "react";
import type { BlockKind, InvitationBlock } from "@/features/invitations/invitation.schema";

/** Which section currently occupies the reading position inside the editor phone. */
function visibleSectionAtReadingLine(container: HTMLElement): BlockKind | null {
  const bounds = container.getBoundingClientRect();
  const readingLine = bounds.top + bounds.height * 0.35;
  const sections = Array.from(container.querySelectorAll<HTMLElement>("[data-editor-block]"))
    .filter((element) => element.getBoundingClientRect().height > 0);
  if (!sections.length) return null;

  const crossing = sections.find((element) => {
    const rect = element.getBoundingClientRect();
    return rect.top <= readingLine && rect.bottom > readingLine;
  });
  if (crossing) return crossing.dataset.editorBlock as BlockKind;

  const nearest = sections.reduce((best, current) => {
    const distance = (element: HTMLElement) => {
      const rect = element.getBoundingClientRect();
      return Math.min(Math.abs(readingLine - rect.top), Math.abs(readingLine - rect.bottom));
    };
    return distance(current) < distance(best) ? current : best;
  });
  return nearest.dataset.editorBlock as BlockKind;
}

/** Sync sidebar/inspector with preview scroll, and navigate preview when selecting a block. */
export function useEditorSectionSync({
  previewRef,
  blocks,
  onActiveChange,
}: {
  previewRef: RefObject<HTMLDivElement | null>;
  blocks: InvitationBlock[];
  onActiveChange: (block: BlockKind) => void;
}) {
  const ignoreUntilRef = useRef(0);
  const onActiveChangeRef = useRef(onActiveChange);
  onActiveChangeRef.current = onActiveChange;

  const scrollToBlock = useCallback((block: BlockKind) => {
    const container = previewRef.current;
    if (!container) return;
    const target = Array.from(container.querySelectorAll<HTMLElement>("[data-editor-block]"))
      .find((element) => element.dataset.editorBlock === block);
    // Hidden blocks, or music with no audio yet, remain editable without a scroll jump.
    if (!target) return;
    const containerRect = container.getBoundingClientRect();
    const destination = container.scrollTop + target.getBoundingClientRect().top - containerRect.top - container.clientTop;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    ignoreUntilRef.current = performance.now() + (reducedMotion ? 80 : 950);
    container.scrollTo({ top: Math.max(0, destination), behavior: reducedMotion ? "instant" : "smooth" });
  }, [previewRef]);

  const visibleBlocksKey = blocks.map(({ id, enabled }) => `${id}:${Number(enabled)}`).join("|");

  useEffect(() => {
    const container = previewRef.current;
    if (!container) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      if (performance.now() < ignoreUntilRef.current) return;
      const active = visibleSectionAtReadingLine(container);
      if (active) onActiveChangeRef.current(active);
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    const onUserScrollIntent = () => {
      ignoreUntilRef.current = 0;
    };
    container.addEventListener("scroll", schedule, { passive: true });
    container.addEventListener("wheel", onUserScrollIntent, { passive: true });
    container.addEventListener("touchstart", onUserScrollIntent, { passive: true });
    container.addEventListener("keydown", onUserScrollIntent);
    window.addEventListener("resize", schedule);
    // A selected block might be reordered, shown, or hidden without scrolling.
    schedule();
    return () => {
      container.removeEventListener("scroll", schedule);
      container.removeEventListener("wheel", onUserScrollIntent);
      container.removeEventListener("touchstart", onUserScrollIntent);
      container.removeEventListener("keydown", onUserScrollIntent);
      window.removeEventListener("resize", schedule);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [previewRef, visibleBlocksKey]);

  return { scrollToBlock };
}
