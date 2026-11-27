import type {Locale} from "../../i18n/locales.ts";

const routeOrigin = "https://eventiq.invalid";
const returnSections = new Set(["invitations", "account", "editor"]);
const templateSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const draftUuid = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;

export function authReturnPath(value: string | null, locale: Locale): string {
  const fallback = `/${locale}/invitations`;
  if (!value || value.length > 1024 || !value.startsWith("/") || value.startsWith("//") ||
      value.includes("\\") || /[^!-~]/.test(value)) return fallback;

  const url = new URL(value, routeOrigin);
  const [, pathLocale, section, extra] = url.pathname.split("/");
  if (url.origin !== routeOrigin || pathLocale !== locale || !returnSections.has(section) || extra !== undefined) {
    return fallback;
  }
  const result = `/${locale}/${section}`;
  if (section !== "editor") return result;

  const template = url.searchParams.get("template");
  const draft = url.searchParams.get("draft");
  const params = new URLSearchParams();
  if (template && template.length <= 80 && templateSlug.test(template)) params.set("template",template);
  if (draft && draftUuid.test(draft)) params.set("draft",draft);
  if (!params.size) return fallback;
  const local = url.searchParams.get("local");
  if (!params.has("draft") && local && draftUuid.test(local)) params.set("local",local);
  const version=url.searchParams.get("version");
  if (!params.has("draft") && version && draftUuid.test(version)) params.set("version",version);
  return result + "?" + params.toString();
}

export function authCallbackUrl(origin: string, path: string, locale: Locale): string {
  const callback = new URL(`/${locale}/auth/callback`, origin);
  callback.searchParams.set("next", authReturnPath(path, locale));
  return callback.href;
}
