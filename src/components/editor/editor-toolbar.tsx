"use client";

import Link from "next/link";
import { ArrowLeft, Check, RotateCcw, RotateCw, Save } from "lucide-react";
import { routes } from "@/constants/routes";
import type { InvitationEditorController } from "@/features/invitations/use-invitation-editor";
import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/locales";

export function EditorToolbar({ locale, editor }: { locale: Locale; editor: InvitationEditorController }) {
  const dict = getDictionary(locale);
  return (
    <header className="editor-toolbar">
      <Link className="editor-back" href={routes.template(locale, editor.document.templateId)} aria-label={dict.actions.back}><ArrowLeft size={19} /></Link>
      <div className="editor-toolbar-heading"><strong>INVITO</strong><span>{dict.editor.title}</span></div>
      <span className="editor-save-status" role="status">{editor.saveError ? (locale === "ru" ? "Недостаточно места в браузере" : "Браузерде орун жетишсиз") : editor.isSaved ? <><Check size={14} />{dict.editor.saved}</> : dict.editor.autosave}</span>
      <div className="editor-toolbar-actions">
        <button type="button" className="icon-button" onClick={editor.undo} disabled={!editor.canUndo} title="Undo" aria-label="Undo"><RotateCcw size={19} /></button>
        <button type="button" className="icon-button" onClick={editor.redo} disabled={!editor.canRedo} title="Redo" aria-label="Redo"><RotateCw size={19} /></button>
        <button type="button" className="button-outline editor-save-button" onClick={editor.saveNow}><Save size={17} />{dict.actions.save}</button>
        <button type="button" className="button-primary" disabled title={dict.editor.unavailable}>{dict.actions.publish}</button>
      </div>
    </header>
  );
}
