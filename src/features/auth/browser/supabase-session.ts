"use client";

import {createBrowserClient} from "@supabase/ssr";
import type {SupabaseClient} from "@supabase/supabase-js";

export type SupabaseBrowserConfig = {
  url: string;
  publishableKey: string;
  apiBaseUrl: string;
};
let browserClient: SupabaseClient | null = null;
let currentConfig: string | null = null;

/**
 * Studio's private cloud API always receives a short-lived Supabase Auth
 * access token. The publishable key can be public; NEVER put a secret or
 * service-role key in NEXT_PUBLIC_*.
 */
export function configuredSupabase(): SupabaseBrowserConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!url || !publishableKey || !apiBaseUrl) return null;
  if (publishableKey.startsWith("sb_secret_") || !publishableKey.trim()) return null;
  let project: URL, api: URL;
  try {project = new URL(url); api = new URL(apiBaseUrl);} catch {return null;}
  const trusted = (target: URL) => target.protocol === "https:" ||
    (target.protocol === "http:" && ["localhost","127.0.0.1"].includes(target.hostname));
  if (!trusted(project) || !trusted(api) || project.username || project.password ||
      project.search || project.hash || api.username || api.password || api.search || api.hash) return null;
  return {
    url: project.href.replace(/\/$/, ""),
    publishableKey,
    apiBaseUrl: api.href.replace(/\/$/, ""),
  };
}

export function getSupabaseBrowserClient(config: SupabaseBrowserConfig): SupabaseClient {
  const fingerprint = config.url + ":" + config.publishableKey;
  if (browserClient && currentConfig === fingerprint) return browserClient;
  browserClient = createBrowserClient(config.url, config.publishableKey, {
    auth: {flowType: "pkce", autoRefreshToken: true, persistSession: true, detectSessionInUrl: true},
  });
  currentConfig = fingerprint;
  return browserClient;
}

export async function getSupabaseAccessToken(config: SupabaseBrowserConfig): Promise<string | null> {
  const {data, error} = await getSupabaseBrowserClient(config).auth.getSession();
  if (error) return null;
  return data.session?.access_token ?? null;
}
