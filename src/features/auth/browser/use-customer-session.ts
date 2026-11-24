"use client";

import {useEffect, useMemo, useState} from "react";
import type {User} from "@supabase/supabase-js";
import {configuredSupabase, getSupabaseBrowserClient} from "./supabase-session";

type SessionState =
  | {status: "unavailable" | "loading" | "signed-out"; user: null}
  | {status: "signed-in"; user: User};

export function useCustomerSession() {
  const config = useMemo(() => configuredSupabase(), []);
  const client = useMemo(() => config ? getSupabaseBrowserClient(config) : null, [config]);
  const [state, setState] = useState<SessionState>(() => ({
    status: config ? "loading" : "unavailable",
    user: null,
  }));

  useEffect(() => {
    if (!client) return;
    const {data: {subscription}} = client.auth.onAuthStateChange((_event, session) => {
      setState(session ? {status: "signed-in", user: session.user} : {status: "signed-out", user: null});
    });
    return () => subscription.unsubscribe();
  }, [client]);

  return {...state, client, config};
}
