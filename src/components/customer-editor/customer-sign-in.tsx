"use client";

import {useId, useState, useSyncExternalStore, type FormEvent} from "react";
import type {SupabaseClient} from "@supabase/supabase-js";
import {authCallbackUrl, authReturnPath} from "@/features/auth/return-path";
import type {Locale} from "@/i18n/locales";

const googleEnabled = process.env.NEXT_PUBLIC_SUPABASE_GOOGLE_ENABLED === "true";

function getAuthReturnStatus() {
  const callback = new URL(window.location.href).searchParams.get("auth");
  if (callback === "cancelled" || callback === "unavailable") return callback;
  return callback === "failed" ? "invalid" : null;
}

function subscribeToNavigation(listener: () => void) {
  window.addEventListener("popstate", listener);
  return () => window.removeEventListener("popstate", listener);
}

type Props = {
  locale: Locale;
  client: SupabaseClient;
  beforeRedirect?: () => void;
  className?: string;
  actionClassName?: string;
};

export function CustomerSignIn({locale, client, beforeRedirect, className, actionClassName}: Props) {
  const id = useId();
  const ru = locale === "ru";
  const copy = ru ? {
    google: "Войти через Google", email: "Отправить ссылку на email",
    emailSent: "Проверьте почту. Мы отправили ссылку для входа.",
    invalid: "Не удалось войти. Попробуйте ещё раз.",
    cancelled: "Вход отменён. Вы можете попробовать ещё раз.",
    unavailable: "Вход сейчас недоступен.",
    save: "Не удалось сохранить черновик на этом устройстве. Освободите место и повторите попытку.",
  } : {
    google: "Google аркылуу кирүү", email: "Шилтемени email'ге жөнөтүү",
    emailSent: "Почтаңызды текшериңиз. Кирүү шилтемесин жөнөттүк.",
    invalid: "Кирүү мүмкүн болгон жок. Кайра аракет кылыңыз.",
    cancelled: "Кирүү токтотулду. Кайра аракет кылсаңыз болот.",
    unavailable: "Кирүү азыр жеткиликсиз.",
    save: "Бул түзмөктө черновик сакталган жок. Орун бошотуп, кайра аракет кылыңыз.",
  };
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<keyof typeof copy | null>(null);

  const callbackStatus = useSyncExternalStore(subscribeToNavigation, getAuthReturnStatus, () => null);
  const feedback = status ?? (busy ? null : callbackStatus);

  async function signIn(provider: "google" | "email") {
    if (busy) return;
    try {
      beforeRedirect?.();
    } catch {
      setStatus("save");
      return;
    }
    const {origin, pathname, search} = window.location;
    const redirectTo = authCallbackUrl(origin, pathname + search, locale);
    setBusy(true);
    setStatus(null);
    try {
      if (provider === "google") {
        const {data, error} = await client.auth.signInWithOAuth({provider: "google", options: {redirectTo}});
        if (error || !data.url) throw new Error("OAUTH_START_FAILED");
        return;
      }
      const emailRedirectTo = new URL(authReturnPath(pathname + search, locale), origin).href;
      const {error} = await client.auth.signInWithOtp({email: email.trim(), options: {emailRedirectTo}});
      if (error) throw error;
      setStatus("emailSent");
    } catch {
      setStatus("invalid");
    } finally {
      setBusy(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (email.trim()) void signIn("email");
  }

  return <form className={className} onSubmit={submit}>
    {googleEnabled && <button type="button" className={actionClassName} disabled={busy} onClick={() => void signIn("google")}>{copy.google}</button>}
    <label htmlFor={id}>Email</label>
    <input id={id} type="email" value={email} required maxLength={320} autoComplete="email"
      onChange={event => setEmail(event.target.value)} />
    <button type="submit" className={actionClassName} disabled={busy}>{copy.email}</button>
    {feedback && <p role={feedback === "emailSent" || feedback === "cancelled" ? "status" : "alert"}>{copy[feedback]}</p>}
  </form>;
}
