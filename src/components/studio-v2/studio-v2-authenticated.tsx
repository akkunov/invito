"use client";

import {useCallback, useEffect, useMemo, useState} from "react";
import type {Locale} from "@/i18n/locales";
import {StudioV2Workspace} from "./studio-v2-workspace";
import type {RemoteSyncSettings} from "@/features/studio-v2/browser/remote-sync";
import {beginOidcLogin, configuredOidc, endOidcLogin, finishOidcLogin, getOidcAccessToken} from "@/features/auth/browser/oidc-session";

type Workspace = {id: string; name: string; slug: string};
type Member = {role: string; workspace: Workspace};
type Status = "checking" | "anonymous" | "connecting" | "ready" | "error";

export function StudioV2Authenticated({locale}: {locale: Locale}) {
  const config = useMemo(configuredOidc, []);
  const [status, setStatus] = useState<Status>(config ? "checking" : "anonymous");
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [message, setMessage] = useState("");
  const accessToken = useCallback(async () => config ? getOidcAccessToken(config) : null, [config]);
  const remoteSettings = useMemo<RemoteSyncSettings | undefined>(() =>
    config && status === "ready" && workspace
      ? {apiBaseUrl: config.apiBaseUrl, workspaceId: workspace.id, accessToken}
      : undefined,
    [config, status, workspace, accessToken]);

  useEffect(() => {
    if (!config) return;
    let cancelled = false;
    async function boot() {
      try {
        const authenticated = await finishOidcLogin(config!);
        if (!authenticated) {if (!cancelled) setStatus("anonymous"); return;}
        if (cancelled) return;
        setStatus("connecting");
        const token = await accessToken();
        if (!token) throw new Error("SESSION_EXPIRED");
        const api = async (path: string, init?: RequestInit) => {
          const response = await fetch(config!.apiBaseUrl + path, {
            ...init, headers: {"Authorization": "Bearer " + token, ...(init?.body ? {"Content-Type": "application/json"} : {})},
            credentials: "omit", cache: "no-store",
          });
          if (!response.ok) throw new Error("API_" + response.status);
          return response.json();
        };
        const me = await api("/me") as {displayName?: string};
        const members = await api("/me/workspaces") as Member[];
        let selected = members.find(m => m.role !== "VIEWER")?.workspace;
        if (!selected) {
          const slug = "personal-" + crypto.randomUUID();
          selected = await api("/workspaces", {
            method: "POST", body: JSON.stringify({slug, name: "Моё пространство"}),
          }) as Workspace;
        }
        if (!selected || !/^[a-f\d-]{36}$/i.test(selected.id)) throw new Error("WORKSPACE_INVALID");
        if (!cancelled) {
          setWorkspace(selected);
          setDisplayName(me.displayName || "INVITO");
          setStatus("ready");
        }
      } catch (error) {
        if (!cancelled) {
          setStatus("error");
          const code = error instanceof Error ? error.message : "UNKNOWN";
          setMessage(code.startsWith("API_")
            ? "Backend отклонил запрос (" + code.slice(4) + "). Проверьте AUTH_ISSUER, AUTH_AUDIENCE и работу PostgreSQL."
            : "Не удалось завершить вход (" + code + "). Повторите авторизацию.");
        }
      }
    }
    void boot();
    return () => {cancelled = true;};
  }, [config, accessToken]);

  return <>
    {config && <div role="region" aria-label="Учётная запись INVITO" style={{
      display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10,
      padding:"9px 18px", background:"#151515", color:"#F7F7F4", font:"500 13px/1.5 system-ui",
      borderBottom:"1px solid #333",
    }}>
      <span aria-live="polite">
        {status === "ready" ? "Аккаунт: " + displayName + " · " + workspace?.name
          : status === "connecting" ? "Подключаем рабочее пространство…"
          : status === "checking" ? "Проверяем авторизацию…"
          : "Облачное сохранение: требуется вход"}
      </span>
      <div style={{display:"flex", gap:8, alignItems:"center"}}>
        {status === "error" && <span role="alert" style={{color:"#ffb3a1",maxWidth:540}}>{message}</span>}
        {(status === "anonymous" || status === "error") &&
          <button type="button" onClick={() => {setMessage("");void beginOidcLogin(config).catch(() => setMessage("Не удалось открыть Keycloak."));}}
            style={{background:"#FF4A0A",border:0,borderRadius:6,padding:"7px 14px",color:"#fff",cursor:"pointer"}}>
            Войти через Keycloak
          </button>}
        {status === "ready" &&
          <button type="button" onClick={() => endOidcLogin(config)}
            style={{border:"1px solid #666",borderRadius:6,padding:"7px 14px",color:"inherit",background:"transparent",cursor:"pointer"}}>
            Выйти
          </button>}
      </div>
    </div>}
    <StudioV2Workspace locale={locale} remoteSettings={remoteSettings}/>
  </>;
}
