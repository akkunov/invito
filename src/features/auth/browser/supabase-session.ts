"use client";

import {createBrowserClient} from "@supabase/ssr";
import type {SupabaseClient} from "@supabase/supabase-js";

import type {SupabaseBrowserConfig} from "../supabase-config";
export {configuredSupabase} from "../supabase-config";
export type {SupabaseBrowserConfig} from "../supabase-config";

/** Identifies the signed-in session that started a private browser operation. */
export type CustomerRequestScope = {subject: string; signal: AbortSignal};

export function cancelCustomerRequestWith(scope: CustomerRequestScope, signal: AbortSignal): CustomerRequestScope {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (scope.signal.aborted || signal.aborted) abort();
  else {
    const options = {once: true, signal: controller.signal};
    scope.signal.addEventListener("abort", abort, options);
    signal.addEventListener("abort", abort, options);
  }
  return {...scope, signal: controller.signal};
}

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

export async function getSupabaseAccessToken(config: SupabaseBrowserConfig, subject: string): Promise<string | null> {
  const {data, error} = await getSupabaseBrowserClient(config).auth.getSession();
  if (error || data.session?.user.id !== subject) return null;
  return data.session.access_token;
}
