"use client";

import {createBrowserClient} from "@supabase/ssr";
import type {SupabaseClient} from "@supabase/supabase-js";

import type {SupabaseBrowserConfig} from "../supabase-config";
export {configuredSupabase} from "../supabase-config";
export type {SupabaseBrowserConfig} from "../supabase-config";

let browserClient: SupabaseClient | null = null;
let currentConfig: string | null = null;

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
