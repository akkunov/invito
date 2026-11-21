"use client";

import {useCallback, useEffect, useMemo, useRef, useState, type FormEvent} from "react";
import type {Session} from "@supabase/supabase-js";
import type {Locale} from "@/i18n/locales";
import {StudioV2Workspace} from "./studio-v2-workspace";
import type {RemoteSyncSettings} from "@/features/studio-v2/browser/remote-sync";
import {
  configuredSupabase, getSupabaseAccessToken, getSupabaseBrowserClient,
} from "@/features/auth/browser/supabase-session";

type Workspace = {id: string; name: string; slug: string};
type Member = {role: string; workspace: Workspace};
type Status = "checking" | "anonymous" | "connecting" | "ready" | "error";
type FormMode = "sign-in" | "sign-up";
const accent = "#FF4A0A";
const inputStyle = {
  width: "100%", boxSizing: "border-box" as const, background: "#1B1B1B",
  border: "1px solid #454545", borderRadius: 6, padding: "12px 13px",
  color: "#F7F7F4", font: "400 14px/1.4 system-ui", outlineOffset: 3,
};
const buttonStyle = {border: 0, borderRadius: 6, background: accent,
  color: "#fff", padding: "10px 16px", font: "600 13px/1.3 system-ui", cursor: "pointer"};

export function StudioV2Authenticated({locale}: {locale: Locale}) {
  const config = useMemo(configuredSupabase, []);
  const client = useMemo(() => config ? getSupabaseBrowserClient(config) : null, [config]);
  const [status, setStatus] = useState<Status>(config ? "checking" : "anonymous");
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [message, setMessage] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<FormMode>("sign-in");
  const [submitting, setSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState("");
  const emailRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const accessToken = useCallback(async () => config ? getSupabaseAccessToken(config) : null, [config]);

  const remoteSettings = useMemo<RemoteSyncSettings | undefined>(() =>
    config && status === "ready" && workspace
      ? {apiBaseUrl: config.apiBaseUrl, workspaceId: workspace.id, accessToken}
      : undefined,
    [config, status, workspace, accessToken]);

  useEffect(() => {
    if (!config || !client) return;
    let cancelled = false;
    let requestId = 0;
    let connectedSubject: string | null = null;

    async function connect(session: Session | null) {
      if (cancelled) return;
      const subject = session?.user.id ?? null;
      if (subject && subject === connectedSubject) return; // INITIAL_SESSION and getSession may race.
      const id = ++requestId;
      connectedSubject = subject;
      if (!session) {
        setWorkspace(null);
        setDisplayName("");
        setStatus("anonymous");
        return;
      }
      setStatus("connecting");
      setWorkspace(null);
      setMessage("");
      try {
        const api = async (path: string, init?: RequestInit) => {
          const response = await fetch(config!.apiBaseUrl + path, {
            ...init,
            headers: {
              "Authorization": "Bearer " + session.access_token,
              ...(init?.body ? {"Content-Type": "application/json"} : {}),
            },
            credentials: "omit", cache: "no-store",
          });
          if (!response.ok) throw new Error("API_" + response.status);
          return response.json();
        };
        const me = await api("/me") as {displayName?: string};
        const members = await api("/me/workspaces") as Member[];
        let selected = members.find(m => m.role !== "VIEWER")?.workspace;
        if (!selected) {
          // Runs once for a signed-in identity, never per access-token refresh.
          selected = await api("/workspaces", {
            method: "POST",
            body: JSON.stringify({slug: "personal-" + crypto.randomUUID(), name: "Моё пространство"}),
          }) as Workspace;
        }
        if (!selected || !/^[a-f\d-]{36}$/i.test(selected.id)) throw new Error("WORKSPACE_INVALID");
        if (!cancelled && id === requestId) {
          setWorkspace(selected);
          setDisplayName(me.displayName || "INVITO");
          setStatus("ready");
        }
      } catch (error) {
        if (!cancelled && id === requestId) {
          setStatus("error");
          const code = error instanceof Error ? error.message : "UNKNOWN";
          setMessage(code.startsWith("API_")
            ? "Backend отклонил запрос (" + code.slice(4) + "). Проверьте Supabase JWT Signing Keys и настройки AUTH_ISSUER / AUTH_AUDIENCE."
            : "Облачное сохранение сейчас недоступно (" + code + "). Локальные проекты сохранены.");
        }
      }
    }

    const {data: {subscription}} = client.auth.onAuthStateChange((event, session) => {
      if (event === "TOKEN_REFRESHED") return; // getSession() reads the fresh token when saving.
      // Do not await Supabase Auth methods synchronously inside this callback.
      queueMicrotask(() => {if (!cancelled) void connect(session);});
    });
    void client.auth.getSession().then(({data, error}) => {
      if (cancelled) return;
      if (error) {setMessage("Не удалось восстановить сессию Supabase.");setStatus("error");return;}
      void connect(data.session);
    }).catch(() => {if (!cancelled) setStatus("error");});
    return () => {cancelled = true; subscription.unsubscribe(); requestId++;};
  }, [client, config]);

  useEffect(() => {
    // Native modal dialog provides focus trapping, Escape handling and accessibility.
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (dialogOpen && !dialog.open) {
      dialog.showModal();
      emailRef.current?.focus();
    } else if (!dialogOpen && dialog.open) {
      dialog.close();
    }
  }, [dialogOpen]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!client || submitting) return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    const email = String(fields.get("email") ?? "").trim();
    const password = String(fields.get("password") ?? "");
    if (!email || password.length < 6) {setFormMessage("Введите email и пароль не короче 6 символов.");return;}
    setFormMessage("");
    setSubmitting(true);
    try {
      if (mode === "sign-up") {
        const {data, error} = await client.auth.signUp({
          email, password,
          options: {emailRedirectTo: window.location.origin + window.location.pathname},
        });
        if (error) throw error;
        form.reset();
        if (data.session) {
          setDialogOpen(false);
        } else {
          setFormMessage("Если регистрация разрешена, проверьте почту и подтвердите email. Затем войдите.");
          setMode("sign-in");
        }
      } else {
        const {error} = await client.auth.signInWithPassword({email, password});
        if (error) throw error;
        form.reset();
        setDialogOpen(false);
      }
    } catch (error) {
      // Never log credentials or full provider errors in production.
      const code = error && typeof error === "object" && "status" in error ? Number(error.status) : 0;
      setFormMessage(code === 429 ? "Слишком много попыток. Повторите позже."
        : "Не удалось выполнить вход. Проверьте email, пароль или подтверждение почты.");
    } finally {setSubmitting(false);}
  }

  async function signOut() {
    if (!client) return;
    setMessage("");
    const {error} = await client.auth.signOut();
    if (error) setMessage("Не удалось завершить сессию. Попробуйте ещё раз.");
  }

  return <>
    {config && <div role="region" aria-label="Учётная запись INVITO" style={{
      display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10,
      padding:"9px 18px", background:"#151515", color:"#F7F7F4", font:"500 13px/1.5 system-ui",
      borderBottom:"1px solid #333",
    }}>
      <span aria-live="polite">
        {status === "ready" ? "Аккаунт: " + displayName + " · " + workspace?.name
          : status === "connecting" ? "Подключаем рабочее пространство…"
          : status === "checking" ? "Проверяем сессию Supabase…"
          : "Облачное сохранение: требуется вход"}
      </span>
      <div style={{display:"flex", gap:8, alignItems:"center"}}>
        {status === "error" && <span role="alert" style={{color:"#ffb3a1",maxWidth:540}}>{message}</span>}
        {(status === "anonymous" || status === "error") &&
          <button type="button" onClick={() => {setFormMessage("");setDialogOpen(true);}}
            style={buttonStyle}>Войти в INVITO</button>}
        {status === "ready" &&
          <button type="button" onClick={() => {void signOut();}}
            style={{border:"1px solid #666",borderRadius:6,padding:"8px 14px",color:"inherit",background:"transparent",cursor:"pointer"}}>
            Выйти
          </button>}
      </div>
    </div>}

    <StudioV2Workspace locale={locale} remoteSettings={remoteSettings}/>

    {config && <dialog ref={dialogRef} aria-labelledby="invito-auth-title"
      onClose={() => setDialogOpen(false)}
      onCancel={event => {if (submitting) event.preventDefault();}}
      className="invito-auth-dialog"
      style={{background:"#101010",border:"1px solid #373737",color:"#F7F7F4",
        borderRadius:12,width:"calc(100% - 32px)",maxWidth:420,padding:28,
        boxShadow:"0 24px 80px rgba(0,0,0,.6)",font:"400 14px/1.5 system-ui"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:16}}>
          <h2 id="invito-auth-title" style={{font:"600 24px/1.2 system-ui",letterSpacing:"-.03em",margin:0}}>
            {mode === "sign-in" ? "Вход в INVITO" : "Создать аккаунт"}
          </h2>
          <button type="button" aria-label="Закрыть" onClick={() => setDialogOpen(false)} disabled={submitting}
            style={{border:0,color:"#F7F7F4",background:"transparent",fontSize:25,cursor:"pointer"}}>×</button>
        </div>
        <p style={{color:"#ADADAA",margin:"12px 0 24px"}}>
          Сохраняйте приглашения и изображения в защищённом облачном пространстве.
        </p>
        <form onSubmit={event => {void submit(event);}} style={{display:"grid",gap:15}}>
          <label style={{display:"grid",gap:6}}>Email
            <input ref={emailRef} required autoComplete="email" type="email" name="email" maxLength={320}
              placeholder="name@example.com" style={inputStyle}/>
          </label>
          <label style={{display:"grid",gap:6}}>Пароль
            <input required minLength={6} autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
              type="password" name="password" style={inputStyle}/>
          </label>
          {formMessage && <p role="status" aria-live="polite" style={{color:"#FFAE96",margin:0}}>{formMessage}</p>}
          <button type="submit" disabled={submitting} style={{...buttonStyle,padding:"13px 16px",
            opacity:submitting ? 0.65 : 1}}>
            {submitting ? "Отправляем…" : mode === "sign-in" ? "Войти" : "Зарегистрироваться"}
          </button>
        </form>
        <button type="button" onClick={() => {setMode(mode === "sign-in" ? "sign-up" : "sign-in");setFormMessage("");}}
          style={{display:"block",margin:"18px auto 0",border:0,background:"transparent",
            color:"#F7F7F4",textDecoration:"underline",textUnderlineOffset:4,cursor:"pointer"}}>
          {mode === "sign-in" ? "Нет аккаунта? Создать" : "Уже есть аккаунт? Войти"}
        </button>
    </dialog>}
  </>;
}
