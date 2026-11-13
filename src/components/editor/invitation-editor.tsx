"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { EditorToolbar } from "@/components/editor/editor-toolbar";
import { EditorSidebar } from "@/components/editor/editor-sidebar";
import { EditorInspector } from "@/components/editor/editor-inspector";
import { InvitationCanvas } from "@/components/invitation/invitation-canvas";
import type { BlockKind, InvitationDocument } from "@/features/invitations/invitation.schema";
import { useInvitationEditor } from "@/features/invitations/use-invitation-editor";
import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/locales";

export function InvitationEditor({ locale, initialDocument }: { locale: Locale; initialDocument: InvitationDocument }) {
  const editor = useInvitationEditor(initialDocument);
  const [selected, setSelected] = useState<BlockKind>("cover");
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const dict = getDictionary(locale);
  const reset = () => {
    if (window.confirm(locale === "ru" ? "Сбросить все локальные изменения этого приглашения?" : "Чакыруунун бардык жергиликтүү өзгөртүүлөрүн тазалайсызбы?")) editor.reset();
  };
  return <div className="editor-app">
    <EditorToolbar locale={locale} editor={editor} />
    <div className="editor-workspace">
      <EditorSidebar locale={locale} editor={editor} selected={selected} onSelect={(kind) => { setSelected(kind); setInspectorOpen(true); }} />
      <main className="editor-stage"><div className="editor-stage-header"><span>{dict.actions.preview}</span><span className="editor-stage-badge">{dict.editor.draft}</span></div><div className="editor-phone"><InvitationCanvas document={editor.document} /></div><div className="editor-stage-footer"><span>{dict.editor.autosave}</span><button type="button" onClick={reset}><RotateCcw size={14} />{dict.editor.reset}</button></div></main>
      <div className={`editor-inspector-wrapper${inspectorOpen ? " is-open" : ""}`}><button type="button" className="mobile-inspector-toggle" onClick={() => setInspectorOpen((value) => !value)} aria-expanded={inspectorOpen}>{dict.editor.blocks[selected]} <span>{inspectorOpen ? "−" : "+"}</span></button>{inspectorOpen && <EditorInspector locale={locale} editor={editor} selected={selected} />}</div>
    </div>
  </div>;
}
