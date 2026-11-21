"use client";

import {useEffect, useMemo, useRef, useState} from "react";
import {readMedia} from "@/features/studio-v2/browser/media-store";
import {prepareCloudSnapshot, type VerifiedCloudAsset} from "@/features/studio-v2/browser/cloud-media";
import type {ProjectDocumentV2} from "@/features/studio-v2/core/document.schema.ts";
import {forkTemplateDocument} from "@/features/studio-v2/core/template-registry.ts";
import {
  createStudioRemoteClient, RemoteRequestError,
  type RemoteSyncSettings, type RemoteProject, type SyncResult,
} from "@/features/studio-v2/browser/remote-sync";
import {StudioIcon} from "./studio-icon";

type RemoteLink = {remoteId: string; revision: number};
function storageKey(settings: RemoteSyncSettings, localId: string) {
  return "invito:cloud-link:v1:" + settings.workspaceId + ":" + localId;
}
function validLink(value: unknown): value is RemoteLink {
  return !!value && typeof value === "object"
    && typeof (value as RemoteLink).remoteId === "string"
    && /^[a-f\d-]{36}$/i.test((value as RemoteLink).remoteId)
    && Number.isSafeInteger((value as RemoteLink).revision)
    && (value as RemoteLink).revision >= 1;
}
function readLink(key: string): RemoteLink | null {
  try { const data = window.localStorage.getItem(key); return data && validLink(JSON.parse(data)) ? JSON.parse(data) as RemoteLink : null; }
  catch { return null; }
}
function downloadRemoteProject(project: RemoteProject) {
  if (!project.revision) return;
  const blob = new Blob([JSON.stringify(project.revision.document, null, 2)], {type: "application/json"});
  const url = URL.createObjectURL(blob);
  const anchor = window.document.createElement("a");
  anchor.href = url;
  anchor.download = "invito-server-copy-" + project.id + ".json";
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
type Props = {
  settings: RemoteSyncSettings;
  document: ProjectDocumentV2;
  onOpenLocalCopy: (doc: ProjectDocumentV2) => Promise<void>;
  onClose: () => void;
};
export function StudioCloudPanel({settings, document, onOpenLocalCopy, onClose}: Props) {
  const client = useMemo(() => createStudioRemoteClient(settings), [settings]);
  const key = storageKey(settings, document.id);
  const [link, setLink] = useState<RemoteLink | null>(null);
  const [busy, setBusy] = useState(false);
  const verifiedCache = useRef(new Map<string, VerifiedCloudAsset>());
  const [message, setMessage] = useState("Локальный черновик сохраняется независимо от облака.");
  const [conflict, setConflict] = useState<Extract<SyncResult,{kind:"conflict"}> | null>(null);
  useEffect(() => {setLink(readLink(key)); setConflict(null);}, [key]);
  function persist(remote: RemoteLink) {
    // Link contains only a remote UUID and server revision; never access tokens.
    try {window.localStorage.setItem(key, JSON.stringify(remote));} catch {/* session still usable */}
    setLink(remote);
  }
  function describeError(error: unknown) {
    if (error instanceof RemoteRequestError) {
      if (error.status === 401) return "Требуется повторный вход.";
      if (error.status === 403) return "Недостаточно прав для сохранения.";
      if (error.status === 422) return "Сначала загрузите изображения через безопасное облачное хранилище (#29.4).";
      return "Сервер вернул ошибку " + error.status + ". Локальная версия не изменена.";
    }
    if (error instanceof TypeError) return "Нет соединения. Локальный проект сохранён.";
    return "Ошибка облачной синхронизации. Локальный проект не затронут.";
  }
  async function save(asNew = false) {
    if (busy) return;
    setBusy(true); setMessage("Обрабатываем запрос…");
    try {
      // Never replace the local document or its IndexedDB media. Upload to a
      // separate, validated snapshot only after the user explicitly clicks save.
      const prepared = await prepareCloudSnapshot(document, readMedia, client.uploadMedia, verifiedCache.current);
      const serverDocument = prepared.document;
      if (!link || asNew) {
        const created = await client.createProject(document.id, serverDocument);
        persist({remoteId: created.id, revision: created.latestRevision});
        setConflict(null);
        setMessage("Новый облачный проект создан, серверная ревизия 1. Файлов загружено: " + prepared.uploads + ".");
        return;
      }
      const result = await client.sync(link.remoteId, link.revision, serverDocument);
      if (result.kind === "synced") {
        persist({remoteId: link.remoteId, revision: result.revision});
        setConflict(null); setMessage("Сохранено на сервере. Ревизия " + result.revision + ". Новых файлов: " + prepared.uploads + ".");
      } else if (result.kind === "conflict") {
        setConflict(result);
        setMessage("Конфликт изменений: на сервере есть другая версия. Автозамена отключена.");
      } else if (result.kind === "offline") {
        setMessage("Нет сети. Локальный черновик не изменён.");
      } else {
        setMessage(result.message);
      }
    } catch (error) {setMessage(describeError(error));}
    finally {setBusy(false);}
  }
  async function openRemoteAsCopy() {
    if (busy || !conflict?.remoteProject.revision) return;
    setBusy(true);
    try {
      const copy = forkTemplateDocument(conflict.remoteProject.revision.document,"studio-"+crypto.randomUUID());
      await onOpenLocalCopy(copy);
      setMessage("Серверная версия открыта как отдельная локальная копия.");
      setConflict(null); onClose();
    } catch (error) {setMessage(describeError(error));}
    finally {setBusy(false);}
  }
  return <div className="v2-preview-overlay" role="dialog" aria-modal="true" aria-label="Облачная синхронизация">
    <header className="v2-preview-header">
      <strong>Облачная синхронизация</strong>
      <button aria-label="Закрыть облачную синхронизацию" onClick={onClose} disabled={busy}><StudioIcon name="close"/> Закрыть</button>
    </header>
    <section className="v2-cloud-panel">
      <h2>{document.id}</h2>
      <p>Хранение на устройстве остаётся включённым. Синхронизация выполняется только по кнопке.</p>
      <p role="status" aria-live="polite">{message}</p>
      <p>Связь с сервером: {link ? "ревизия " + link.revision : "ещё не создана"}</p>
      <div className="v2-cloud-actions">
        <button disabled={busy} onClick={()=>void save()}>{busy?"Сохранение…":link?"Сохранить новую ревизию":"Создать облачную копию"}</button>
        {link&&<button disabled={busy} onClick={()=>void save(true)}>Создать отдельный облачный проект</button>}
      </div>
      {conflict&&<div className="v2-cloud-conflict" role="alert">
        <h3>На сервере другая версия</h3>
        <p>Локальная версия не перезаписана. Ваша ожидаемая ревизия: {conflict.expectedRevision}. На сервере: {conflict.remoteProject.latestRevision}.</p>
        <div className="v2-cloud-actions">
          <button disabled={busy} onClick={()=>downloadRemoteProject(conflict.remoteProject)}>Скачать серверную версию</button>
          <button disabled={busy} onClick={()=>void openRemoteAsCopy()}>Открыть серверную как копию</button>
          <button disabled={busy} onClick={()=>void save(true)}>Сохранить мою как новый проект</button>
          <button disabled={busy} onClick={()=>setConflict(null)}>Оставить локальную</button>
        </div>
      </div>}
      <p className="v2-cloud-hint">При сохранении локальные фотографии сначала проверяются и загружаются в приватное хранилище R2, затем сохраняется отдельная серверная копия проекта. Оригинал IndexedDB не изменяется. Авторизация и R2 должны быть настроены администратором.</p>
    </section>
  </div>;
}

/** Visible feature affordance while the tenant identity provider is not connected.
 * No unauthenticated upload, fake session or silent IndexedDB migration occurs. */
export function StudioCloudUnavailable({onClose}:{onClose:()=>void}){
 return <div className="v2-preview-overlay" role="dialog" aria-modal="true" aria-label="Облачная синхронизация">
  <header className="v2-preview-header">
   <strong>Облачная синхронизация</strong>
   <button aria-label="Закрыть облачную синхронизацию" onClick={onClose}><StudioIcon name="close"/> Закрыть</button>
  </header>
  <section className="v2-cloud-panel">
   <h2>Облако eventiq</h2>
   <p>Модуль облачной синхронизации реализован, но в этом окружении ещё не подключена авторизация OIDC и Workspace.</p>
   <p>После настройки аккаунта, PostgreSQL и приватного Cloudflare R2 здесь будут доступны загрузка медиа, сохранение ревизий и восстановление конфликтующих версий.</p>
   <p role="status">Сейчас макеты и фотографии остаются на этом устройстве. Ничего не отправляется на сервер автоматически.</p>
   <div className="v2-cloud-actions"><button onClick={onClose}>Вернуться в Studio</button></div>
  </section>
 </div>;
}
