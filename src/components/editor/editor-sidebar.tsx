"use client";

import { useEffect, useRef } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff } from "lucide-react";
import type { BlockKind } from "@/features/invitations/invitation.schema";
import type { InvitationEditorController } from "@/features/invitations/use-invitation-editor";
import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/locales";

export function EditorSidebar({ locale, editor, selected, onSelect }: { locale: Locale; editor: InvitationEditorController; selected: BlockKind; onSelect: (block: BlockKind) => void }) {
  const dict = getDictionary(locale);
  const listRef = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const list = listRef.current;
    if (!list || list.scrollWidth <= list.clientWidth) return;
    const active = Array.from(list.children).find((node) => node.classList.contains("is-selected"));
    if (!(active instanceof HTMLElement)) return;
    const left = active.offsetLeft - list.offsetLeft - (list.clientWidth - active.offsetWidth) / 2;
    list.scrollTo({ left, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }, [selected]);
  return (
    <aside className="editor-sidebar" aria-label={dict.editor.structure}>
      <h2>{dict.editor.structure}</h2>
      <p className="editor-sidebar-note">{locale === "ru" ? "Выберите раздел, чтобы изменить текст, фото или детали. Порядок и видимость можно настроить рядом." : "Текстти, сүрөттөрдү же маалыматтарды өзгөртүү үчүн бөлүм тандаңыз."}</p>
      <ol className="editor-block-list" ref={listRef}>{editor.document.blocks.map((block, index) => (
        <li key={block.id} className={selected === block.id ? "is-selected" : ""}>
          <button type="button" className="editor-block-select" onClick={() => onSelect(block.id)} aria-current={selected === block.id ? "true" : undefined}><span className="editor-block-index">{String(index+1).padStart(2,"0")}</span><span className="editor-block-name">{dict.editor.blocks[block.id]}</span></button>
          <div className="editor-block-controls"><button type="button" onClick={() => editor.moveBlock(block.id, -1)} disabled={index === 0} aria-label={`${dict.editor.higher}: ${dict.editor.blocks[block.id]}`}><ArrowUp size={15} /></button><button type="button" onClick={() => editor.moveBlock(block.id, 1)} disabled={index === editor.document.blocks.length - 1} aria-label={`${dict.editor.lower}: ${dict.editor.blocks[block.id]}`}><ArrowDown size={15} /></button><button type="button" onClick={() => editor.toggleBlock(block.id)} aria-label={`${block.enabled ? dict.editor.hide : dict.editor.show}: ${dict.editor.blocks[block.id]}`} aria-pressed={block.enabled}>{block.enabled ? <Eye size={15} /> : <EyeOff size={15} />}</button></div>
        </li>
      ))}</ol>
    </aside>
  );
}
