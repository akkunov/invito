"use client";

import { useId, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Eye, X } from "lucide-react";
import { routes } from "@/constants/routes";
import type { Locale } from "@/i18n/locales";

/** Native dialog owns focus trapping, Escape and focus restoration. */
export function TemplatePreviewButton({ id, name, locale }: { id: string; name: string; locale: Locale }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const ru = locale === "ru";

  function show() {
    setLoaded(false);
    setOpen(true);
    dialog.current?.showModal();
  }

  return <>
    <button type="button" className="template-quick-view" onClick={show} aria-haspopup="dialog">
      <Eye size={17} aria-hidden="true" />{ru ? "Быстрый просмотр" : "Тез көрүү"}
    </button>
    <dialog ref={dialog} className="template-preview-dialog" aria-labelledby={titleId}
      onClose={() => setOpen(false)}>
      <div className="preview-dialog-head">
        <div><small>eventiq / {ru ? "ПРЕВЬЮ" : "КӨРҮҮ"}</small><h2 id={titleId}>{name}</h2></div>
        <button type="button" className="icon-button" onClick={() => dialog.current?.close()}
          aria-label={ru ? "Закрыть просмотр" : "Көрүүнү жабуу"}><X size={22} aria-hidden="true" /></button>
      </div>
      <div className="preview-dialog-body">
        {open && <>
          {!loaded && <p className="preview-loading" role="status">{ru ? "Загружаем приглашение…" : "Чакыруу жүктөлүүдө…"}</p>}
          <iframe title={`${ru ? "Приглашение" : "Чакыруу"}: ${name}`}
            src={`${routes.template(locale, id)}?preview=1`} onLoad={() => setLoaded(true)} />
        </>}
      </div>
      <div className="preview-dialog-actions">
        <Link href={routes.template(locale, id)}>{ru ? "Открыть отдельно" : "Өзүнчө ачуу"}</Link>
        <Link className="button-primary" href={routes.editor(locale, id)}>{ru ? "Выбрать дизайн" : "Дизайн тандоо"}<ArrowUpRight size={16} aria-hidden="true" /></Link>
      </div>
    </dialog>
  </>;
}
