"use client";

import { ArrowDown, ArrowUp, Eye, EyeOff } from "lucide-react";
import type { BlockKind } from "@/features/invitations/invitation.schema";
import type { InvitationEditorController } from "@/features/invitations/use-invitation-editor";
import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/locales";

export function EditorSidebar({ locale, editor, selected, onSelect }: { locale: Locale; editor: InvitationEditorController; selected: BlockKind; onSelect: (block: BlockKind) => void }) {
  const dict = getDictionary(locale);
  return (
    <aside className="editor-sidebar" aria-label={dict.editor.structure}>
      <h2>{dict.editor.structure}</h2>
      <p className="editor-sidebar-note">{locale === "ru" ? "Меняйте порядок и видимость секций" : "Бөлүктөрдүн ордун жана көрүнүшүн өзгөртүңүз"}</p>
      <ol className="editor-block-list">{editor.document.blocks.map((block, index) => (
        <li key={block.id} className={selected === block.id ? "is-selected" : ""}>
          <button type="button" className="editor-block-select" onClick={() => onSelect(block.id)} aria-current={selected === block.id ? "true" : undefined}>{dict.editor.blocks[block.id]}</button>
          <div className="editor-block-controls"><button type="button" onClick={() => editor.moveBlock(block.id, -1)} disabled={index === 0} aria-label={`${dict.editor.higher}: ${dict.editor.blocks[block.id]}`}><ArrowUp size={15} /></button><button type="button" onClick={() => editor.moveBlock(block.id, 1)} disabled={index === editor.document.blocks.length - 1} aria-label={`${dict.editor.lower}: ${dict.editor.blocks[block.id]}`}><ArrowDown size={15} /></button><button type="button" onClick={() => editor.toggleBlock(block.id)} aria-label={`${block.enabled ? dict.editor.hide : dict.editor.show}: ${dict.editor.blocks[block.id]}`} aria-pressed={block.enabled}>{block.enabled ? <Eye size={15} /> : <EyeOff size={15} />}</button></div>
        </li>
      ))}</ol>
    </aside>
  );
}
