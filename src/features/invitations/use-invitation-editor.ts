"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { invitationDocumentSchema, type BlockKind, type InvitationDocument } from "@/features/invitations/invitation.schema";
import type { Locale } from "@/i18n/locales";
import { useLocalAudio } from "@/features/invitations/use-local-audio";

type LocalizedField = "title" | "message" | "venue" | "city" | "dressCode" | "giftNote";
type TextField = "name1" | "name2" | "dateTimeLocal";
interface EditorHistory { past: InvitationDocument[]; present: InvitationDocument; future: InvitationDocument[] }

type DocumentChange = (document: InvitationDocument) => InvitationDocument;

export function useInvitationEditor(initialDocument: InvitationDocument) {
  const storageKey = `invito:draft:v1:${initialDocument.templateId}`;
  const music = useLocalAudio(initialDocument.templateId);
  const [history, setHistory] = useState<EditorHistory>({ past: [], present: initialDocument, future: [] });
  const [isHydrated, setIsHydrated] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        const result = invitationDocumentSchema.safeParse(JSON.parse(stored));
        if (result.success && result.data.templateId === initialDocument.templateId) {
          const old = result.data;
          const missing = initialDocument.blocks.filter((block) => !old.blocks.some((saved) => saved.id === block.id));
          const beforeRsvp = old.blocks.findIndex((block) => block.id === "rsvp");
          const blocks = old.blocks.map((block) => block.id === "gallery" && (old.media?.galleryDataUrls?.length ?? 0) > 0 ? { ...block, enabled: true } : block);
          blocks.splice(beforeRsvp < 0 ? blocks.length : beforeRsvp, 0, ...missing);
          setHistory({ past: [], present: { ...old, blocks, program: old.program ?? initialDocument.program }, future: [] });
        }
      }
    } catch {
      // Invalid or unavailable browser storage must not prevent editing.
    }
    setIsHydrated(true);
  }, [initialDocument.templateId, storageKey]);

  useEffect(() => {
    if (!isHydrated) return;
    setIsSaved(false);
    const timeoutId = window.setTimeout(() => {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(history.present));
        setIsSaved(true);
        setSaveError(false);
      } catch {
        setIsSaved(false);
        setSaveError(true);
      }
    }, 650);
    return () => window.clearTimeout(timeoutId);
  }, [history.present, isHydrated, storageKey]);

  const change = useCallback((changeDocument: DocumentChange) => {
    setHistory((previous) => {
      const next = changeDocument(previous.present);
      if (next === previous.present) return previous;
      return { past: [...previous.past, previous.present].slice(-30), present: next, future: [] };
    });
  }, []);

  const updateText = useCallback((field: TextField, value: string) => {
    change((document) => ({ ...document, content: { ...document.content, [field]: value } }));
  }, [change]);

  const updateLocalized = useCallback((field: LocalizedField, locale: Locale, value: string) => {
    change((document) => ({ ...document, content: { ...document.content, [field]: { ...(document.content[field] ?? {ru: "", ky: ""}), [locale]: value } } }));
  }, [change]);

  const updateAge = useCallback((age: number) => {
    if (!Number.isInteger(age) || age < 1 || age > 120) return;
    change((document) => ({ ...document, content: { ...document.content, age } }));
  }, [change]);

  const updatePortrait = useCallback((portraitDataUrl: string | null) => {
    change((document) => ({ ...document, media: { portraitDataUrl, focalY: document.media?.focalY ?? 50, galleryDataUrls: document.media?.galleryDataUrls ?? [] } }));
  }, [change]);

  const updateFocalY = useCallback((focalY: number) => {
    change((document) => ({ ...document, media: { portraitDataUrl: document.media?.portraitDataUrl ?? null, galleryDataUrls: document.media?.galleryDataUrls ?? [], focalY } }));
  }, [change]);

  const updateGallery = useCallback((galleryDataUrls: string[]) => {
    change((document) => ({
      ...document,
      media: { portraitDataUrl: document.media?.portraitDataUrl ?? null, focalY: document.media?.focalY ?? 50, galleryDataUrls: galleryDataUrls.slice(0, 6) },
      // Photos must become visible immediately even for legacy drafts where gallery was disabled.
      blocks: galleryDataUrls.length > 0 ? document.blocks.map((block) => block.id === "gallery" ? { ...block, enabled: true } : block) : document.blocks,
    }));
  }, [change]);

  const updateProgramTime = useCallback((id: string, time: string) => {
    change((document) => ({ ...document, program: (document.program ?? []).map((item) => item.id === id ? { ...item, time } : item) }));
  }, [change]);

  const updateProgramLocalized = useCallback((id: string, field: "title" | "description", locale: Locale, value: string) => {
    change((document) => ({ ...document, program: (document.program ?? []).map((item) => item.id === id ? { ...item, [field]: { ...item[field], [locale]: value } } : item) }));
  }, [change]);

  const addProgramItem = useCallback(() => {
    change((document) => {
      if ((document.program?.length ?? 0) >= 8) return document;
      const item = { id: `step-${crypto.randomUUID()}`, time: "20:00", title: { ru: "Новый этап", ky: "Жаңы этап" }, description: { ru: "Описание события", ky: "Иш-чаранын сүрөттөлүшү" } };
      return { ...document, program: [...(document.program ?? []), item] };
    });
  }, [change]);

  const removeProgramItem = useCallback((id: string) => {
    change((document) => ({ ...document, program: (document.program ?? []).filter((item) => item.id !== id) }));
  }, [change]);

  const updateAccent = useCallback((accent: string) => {
    change((document) => ({ ...document, accent }));
  }, [change]);

  const toggleBlock = useCallback((id: BlockKind) => {
    change((document) => ({ ...document, blocks: document.blocks.map((block) => block.id === id ? { ...block, enabled: !block.enabled } : block) }));
  }, [change]);

  const moveBlock = useCallback((id: BlockKind, direction: -1 | 1) => {
    change((document) => {
      const position = document.blocks.findIndex((block) => block.id === id);
      const nextIndex = position + direction;
      if (position < 0 || nextIndex < 0 || nextIndex >= document.blocks.length) return document;
      const blocks = [...document.blocks];
      [blocks[position], blocks[nextIndex]] = [blocks[nextIndex], blocks[position]];
      return { ...document, blocks };
    });
  }, [change]);

  const changeLanguage = useCallback((locale: Locale) => {
    change((document) => document.locale === locale ? document : { ...document, locale });
  }, [change]);

  const undo = useCallback(() => {
    setHistory((previous) => {
      if (previous.past.length === 0) return previous;
      const last = previous.past[previous.past.length - 1];
      return { past: previous.past.slice(0, -1), present: last, future: [previous.present, ...previous.future] };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((previous) => {
      if (previous.future.length === 0) return previous;
      const [next, ...future] = previous.future;
      return { past: [...previous.past, previous.present].slice(-30), present: next, future };
    });
  }, []);

  const saveNow = useCallback(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(history.present));
      setIsSaved(true);
      setSaveError(false);
    } catch {
      setIsSaved(false);
      setSaveError(true);
    }
  }, [history.present, storageKey]);

  const reset = useCallback(() => {
    try { window.localStorage.removeItem(storageKey); } catch { /* No storage permission. */ }
    setHistory({ past: [], present: initialDocument, future: [] });
    setSaveError(false);
    void music.removeAudio();
  }, [initialDocument, storageKey, music.removeAudio]);

  return useMemo(() => ({
    document: history.present, isHydrated, isSaved, saveError, canUndo: history.past.length > 0, canRedo: history.future.length > 0,
    updateText, updateLocalized, updateAge, updatePortrait, updateFocalY, updateGallery, updateProgramTime, updateProgramLocalized, addProgramItem, removeProgramItem, updateAccent, toggleBlock, moveBlock, changeLanguage, undo, redo, saveNow, reset, ...music,
  }), [history, isHydrated, isSaved, saveError, updateText, updateLocalized, updateAge, updatePortrait, updateFocalY, updateGallery, updateProgramTime, updateProgramLocalized, addProgramItem, removeProgramItem, updateAccent, toggleBlock, moveBlock, changeLanguage, undo, redo, saveNow, reset, music]);
}

export type InvitationEditorController = ReturnType<typeof useInvitationEditor>;
