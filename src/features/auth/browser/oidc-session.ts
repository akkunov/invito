/**
 * Browser-only OAuth2 Authorization Code + PKCE S256 client for Keycloak.
 * No passwords or tokens go to localStorage, URLs, logs or the Next.js server.
 */
export type OidcConfig = {
  issuer: string;
  clientId: string;
  apiBaseUrl: string;
};
type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  id_token?: string;
};
type Session = {accessToken: string; refreshToken?: string; expiresAt: number; idToken?: string};
let session: Session | null = null;
let refreshPromise: Promise<string | null> | null = null;
let callbackPromise: Promise<boolean> | null = null;
const pendingKey = "invito:oidc-pkce:v1";

export function configuredOidc(): OidcConfig | null {
  const issuer = process.env.NEXT_PUBLIC_AUTH_ISSUER;
  const clientId = process.env.NEXT_PUBLIC_AUTH_CLIENT_ID;
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!issuer || !clientId || !apiBaseUrl) return null;
  const idp = new URL(issuer);
  const api = new URL(apiBaseUrl);
  const trusted = (url: URL) =>
    url.protocol === "https:" || (url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname));
  if (!trusted(idp) || !trusted(api) || idp.username || idp.password || idp.search || idp.hash ||
      api.username || api.password || api.search || api.hash) return null;
  return {issuer: issuer.replace(/\/$/, ""), clientId, apiBaseUrl: apiBaseUrl.replace(/\/$/, "")};
}
function randomString() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), byte => byte.toString(16).padStart(2, "0")).join("");
}
function encodeBase64Url(bytes: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function redirectUri() {
  return location.origin + location.pathname;
}
function tokenEndpoint(config: OidcConfig) {
  return config.issuer + "/protocol/openid-connect/token";
}
function validateResponse(data: unknown): TokenResponse {
  if (!data || typeof data !== "object") throw new Error("OIDC_INVALID_RESPONSE");
  const t = data as Partial<TokenResponse>;
  if (typeof t.access_token !== "string" || !t.access_token || t.token_type?.toLowerCase() !== "bearer" ||
      !Number.isFinite(t.expires_in) || (t.expires_in ?? 0) <= 0) throw new Error("OIDC_INVALID_RESPONSE");
  return t as TokenResponse;
}
function setSession(data: TokenResponse, previousRefresh?: string) {
  session = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? previousRefresh,
    expiresAt: Date.now() + data.expires_in * 1000,
    idToken: data.id_token,
  };
}
export async function beginOidcLogin(config: OidcConfig): Promise<void> {
  const verifier = randomString();
  const challenge = encodeBase64Url(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)));
  const state = randomString();
  sessionStorage.setItem(pendingKey, JSON.stringify({verifier, state, redirect: redirectUri(), createdAt: Date.now()}));
  const url = new URL(config.issuer + "/protocol/openid-connect/auth");
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", redirectUri());
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid profile email");
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  location.assign(url.toString());
}
export function finishOidcLogin(config: OidcConfig): Promise<boolean> {
  if (callbackPromise) return callbackPromise;
  const url = new URL(location.href);
  if (!url.searchParams.has("code") && !url.searchParams.has("error")) return Promise.resolve(false);
  callbackPromise = processOidcCallback(config);
  return callbackPromise;
}
async function processOidcCallback(config: OidcConfig): Promise<boolean> {
  const url = new URL(location.href);
  const code = url.searchParams.get("code");
  const returnedState = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  // OAuth code and errors never remain in browser history, including on failure.
  for (const param of ["code", "state", "session_state", "iss", "error", "error_description"]) {
    url.searchParams.delete(param);
  }
  history.replaceState(history.state, "", url.pathname + url.search + url.hash);
  const stored = sessionStorage.getItem(pendingKey);
  sessionStorage.removeItem(pendingKey);
  if (error) throw new Error("OIDC_LOGIN_" + error);
  if (!code || !returnedState || !stored) throw new Error("OIDC_STATE_MISSING");
  const pending = JSON.parse(stored) as {verifier: string; state: string; redirect: string; createdAt: number};
  if (pending.state !== returnedState || pending.redirect !== redirectUri() ||
      !Number.isFinite(pending.createdAt) || Date.now() - pending.createdAt > 300_000) {
    throw new Error("OIDC_STATE_MISMATCH");
  }
  const response = await fetch(tokenEndpoint(config), {
    method: "POST",
    headers: {"Content-Type": "application/x-www-form-urlencoded"},
    body: new URLSearchParams({
      grant_type: "authorization_code", client_id: config.clientId,
      code, redirect_uri: pending.redirect, code_verifier: pending.verifier,
    }),
    cache: "no-store", credentials: "omit",
  });
  if (!response.ok) throw new Error("OIDC_CODE_EXCHANGE_FAILED");
  setSession(validateResponse(await response.json()));
  return true;
}
export async function getOidcAccessToken(config: OidcConfig): Promise<string | null> {
  if (!session) return null;
  if (session.expiresAt > Date.now() + 30_000) return session.accessToken;
  if (refreshPromise) return refreshPromise;
  const refreshToken = session.refreshToken;
  if (!refreshToken) { session = null; return null; }
  refreshPromise = (async () => {
    try {
      const response = await fetch(tokenEndpoint(config), {
        method: "POST",
        headers: {"Content-Type": "application/x-www-form-urlencoded"},
        body: new URLSearchParams({grant_type: "refresh_token", client_id: config.clientId, refresh_token: refreshToken}),
        cache: "no-store", credentials: "omit",
      });
      if (!response.ok) throw new Error("OIDC_REFRESH_FAILED");
      setSession(validateResponse(await response.json()), refreshToken);
      return session?.accessToken ?? null;
    } catch {
      session = null;
      return null;
    } finally { refreshPromise = null; }
  })();
  return refreshPromise;
}
export function endOidcLogin(config: OidcConfig): void {
  const idToken = session?.idToken;
  session = null;
  sessionStorage.removeItem(pendingKey);
  const url = new URL(config.issuer + "/protocol/openid-connect/logout");
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("post_logout_redirect_uri", redirectUri());
  if (idToken) url.searchParams.set("id_token_hint", idToken);
  location.assign(url.toString());
}
