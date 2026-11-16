"use client";
import { getEditorialVariant } from "@/features/invitations/editorial-templates";

import { getBirthdayVariant } from "@/features/invitations/birthday-templates";
import { getReferenceTemplate } from "@/features/invitations/reference-templates";
import { MusicUploader } from "@/components/editor/music-uploader";
import { BirthdayPhotoUploader } from "@/components/editor/birthday-photo-uploader";
import { BirthdayGalleryUploader } from "@/components/editor/birthday-gallery-uploader";

import type { BlockKind } from "@/features/invitations/invitation.schema";
import type { InvitationEditorController } from "@/features/invitations/use-invitation-editor";
import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/locales";

export function EditorInspector({ locale, editor, selected }: { locale: Locale; editor: InvitationEditorController; selected: BlockKind }) {
  const dict = getDictionary(locale);
  const activeLocale = editor.document.locale;
  const { content } = editor.document;
  const editorial = getEditorialVariant(editor.document.templateId);
  const isBirthday = editorial === "birthday" || getBirthdayVariant(editor.document.templateId) !== null || getReferenceTemplate(editor.document.templateId)?.category === "birthday";
  return (
    <aside className="editor-inspector" aria-label={dict.editor.content}>
      <h2>{dict.editor.blocks[selected]}</h2>
      <p className="inspector-subtitle">{dict.editor.content}</p>
      <div className="inspector-language"><span>{dict.editor.mode}</span><div className="inspector-toggle"><button type="button" className={activeLocale === "ru" ? "selected" : ""} onClick={() => editor.changeLanguage("ru")} aria-pressed={activeLocale === "ru"}>Русский</button><button type="button" className={activeLocale === "ky" ? "selected" : ""} onClick={() => editor.changeLanguage("ky")} aria-pressed={activeLocale === "ky"}>Кыргызча</button></div></div>
      {selected === "cover" && <div className="inspector-fields"><label>{dict.editor.name1}<input value={content.name1} maxLength={100} onChange={(event) => editor.updateText("name1", event.target.value)} /></label><label>{dict.editor.name2}<input value={content.name2} maxLength={100} onChange={(event) => editor.updateText("name2", event.target.value)} /></label><label>{dict.editor.eventTitle}<input value={content.title[activeLocale]} maxLength={100} onChange={(event) => editor.updateLocalized("title", activeLocale, event.target.value)} /></label></div>}
      {selected === "cover" && <div className="birthday-inspector-photo">{isBirthday && <label className="birthday-inspector-label">{locale === "ru" ? "Возраст" : "Жашы"}<input type="number" min={1} max={120} value={content.age ?? 25} onChange={(event) => editor.updateAge(Number(event.target.value))} /></label>}<BirthdayPhotoUploader locale={locale} hasPhoto={Boolean(editor.document.media?.portraitDataUrl)} onChange={editor.updatePortrait} /><label className="birthday-inspector-label">{locale === "ru" ? "Положение фото по вертикали" : "Сүрөттү тигинен жайгаштыруу"}<input type="range" min={0} max={100} step={1} value={editor.document.media?.focalY ?? 50} onChange={(event) => editor.updateFocalY(Number(event.target.value))} /></label></div>}
      {selected === "message" && <div className="inspector-fields"><label>{dict.editor.message}<textarea rows={5} maxLength={500} value={content.message[activeLocale]} onChange={(event) => editor.updateLocalized("message", activeLocale, event.target.value)} /></label></div>}
      {selected === "location" && editorial && <div className="inspector-fields"><label>{locale === "ru" ? "Дресс-код" : "Кийим үлгүсү"}<textarea rows={2} maxLength={500} value={content.dressCode?.[activeLocale] ?? ""} onChange={(event) => editor.updateLocalized("dressCode", activeLocale, event.target.value)} /></label></div>}
      {selected === "rsvp" && editorial && <div className="inspector-fields"><label>{locale === "ru" ? "Пожелание гостям" : "Конокторго каалоо"}<textarea rows={2} maxLength={500} value={content.giftNote?.[activeLocale] ?? ""} onChange={(event) => editor.updateLocalized("giftNote", activeLocale, event.target.value)} /></label></div>}
      {(selected === "details" || selected === "countdown") && <div className="inspector-fields"><label>{dict.editor.date}<input type="datetime-local" value={content.dateTimeLocal} onChange={(event) => editor.updateText("dateTimeLocal", event.target.value)} /></label><p className="inspector-help">Asia/Bishkek (UTC+06:00)</p></div>}
      {selected === "location" && <div className="inspector-fields"><label>{dict.editor.city}<input value={content.city[activeLocale]} maxLength={100} onChange={(event) => editor.updateLocalized("city", activeLocale, event.target.value)} /></label><label>{dict.editor.venue}<input value={content.venue[activeLocale]} maxLength={100} onChange={(event) => editor.updateLocalized("venue", activeLocale, event.target.value)} /></label></div>}
      {selected === "gallery" && <BirthdayGalleryUploader locale={locale} photos={editor.document.media?.galleryDataUrls ?? []} onChange={editor.updateGallery} />}
      {selected === "music" && <MusicUploader locale={locale} name={editor.audioName} error={editor.audioError} onUpload={editor.uploadAudio} onRemove={editor.removeAudio} />}
      {selected === "program" && <div className="inspector-fields inspector-program"><p className="inspector-help">{locale === "ru" ? "Этапы анимируются при прокрутке. Редактируйте текст отдельно для RU и KY." : "Этаптар жылдырганда жанданып ачылат. RU жана KY өзүнчө түзөтүлөт."}</p>
      {(editor.document.program ?? []).map((item, index) => <fieldset className="inspector-program-item" key={item.id}><legend>{locale === "ru" ? "Этап" : "Этап"} {index + 1}</legend>
        <label>{locale === "ru" ? "Время" : "Убактысы"}<input value={item.time} maxLength={30} onChange={(event) => editor.updateProgramTime(item.id, event.target.value)} /></label>
        <label>{locale === "ru" ? "Название" : "Аталышы"}<input value={item.title[activeLocale]} maxLength={100} onChange={(event) => editor.updateProgramLocalized(item.id, "title", activeLocale, event.target.value)} /></label>
        <label>{locale === "ru" ? "Описание" : "Сүрөттөмө"}<textarea rows={2} maxLength={500} value={item.description[activeLocale]} onChange={(event) => editor.updateProgramLocalized(item.id, "description", activeLocale, event.target.value)} /></label>
        <button type="button" className="inspector-program-remove" onClick={() => editor.removeProgramItem(item.id)}>{locale === "ru" ? "Удалить этап" : "Этапты өчүрүү"}</button>
      </fieldset>)}
      <button type="button" className="birthday-upload-button" disabled={(editor.document.program?.length ?? 0) >= 8} onClick={editor.addProgramItem}>{locale === "ru" ? "Добавить этап" : "Этап кошуу"}</button>
      </div>}
      {selected === "rsvp" && <p className="inspector-help">{dict.invitation.rsvpNote}</p>}
      {selected === "cover" && <p className="inspector-help">{locale === "ru" ? "Орнаменты закреплены за шаблоном. Можно менять фото, сохраняя пропорции оформления." : "Каптал оймо-чиймелер шаблонго бекитилген жана мукаба өзгөргөндө сакталат."}</p>}
      <div className="inspector-design"><label>{dict.editor.accent}<span className="accent-input"><input type="color" value={editor.document.accent} onChange={(event) => editor.updateAccent(event.target.value)} /><code>{editor.document.accent}</code></span></label></div>
      <p className="inspector-footer">{dict.editor.autosave}</p>
    </aside>
  );
}
