"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { deleteLocalAudio, readLocalAudio, saveLocalAudio } from "@/lib/local-audio-store";

interface LocalTrack { url: string; name: string }
const MAX_AUDIO_SIZE = 12 * 1024 * 1024;
const allowedAudioTypes = ["audio/mpeg", "audio/mp3", "audio/mp4", "audio/x-m4a", "audio/ogg", "audio/wav", "audio/x-wav", "audio/webm"];

/** Persist music per local draft, revoke obsolete blob URLs on replacement/unmount. */
export function useLocalAudio(templateId: string) {
  const key = `track:${templateId}`;
  const [track, setTrack] = useState<LocalTrack | null>(null);
  const [error, setError] = useState("");
  const urlRef = useRef<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    readLocalAudio(key).then((value) => {
      if (!value || cancelled) return;
      const url = URL.createObjectURL(value.blob);
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = url;
      setTrack({ url, name: value.name });
    }).catch(() => { if (!cancelled) setError("Music storage unavailable"); });
    return () => { cancelled = true; if (urlRef.current) URL.revokeObjectURL(urlRef.current); urlRef.current = null; };
  }, [key]);

  const upload = useCallback(async (file: File) => {
    setError("");
    if (!allowedAudioTypes.includes(file.type) || file.size > MAX_AUDIO_SIZE) {
      setError("Поддерживаются MP3, M4A, OGG, WAV и WebM до 12 МБ / MP3, M4A, OGG, WAV, WebM 12 МБ чейин");
      return;
    }
    try {
      await saveLocalAudio(key, { blob: file, name: file.name });
      const url = URL.createObjectURL(file);
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = url;
      setTrack({ url, name: file.name });
    } catch { setError("Не удалось сохранить музыку / Музыканы сактоо мүмкүн болгон жок"); }
  }, [key]);

  const remove = useCallback(async () => {
    try { await deleteLocalAudio(key); } catch { setError("Cannot remove audio"); return; }
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
    setTrack(null);
    setError("");
  }, [key]);

  return { audioUrl: track?.url ?? null, audioName: track?.name ?? null, audioError: error, uploadAudio: upload, removeAudio: remove };
}
