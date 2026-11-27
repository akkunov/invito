"use client";

import {useEffect, useMemo, useState} from "react";
import type {User} from "@supabase/supabase-js";
import {configuredSupabase, getSupabaseBrowserClient, type CustomerRequestScope} from "./supabase-session";

type SessionState =
  | {status: "unavailable" | "loading" | "signed-out"; user: null; scope: null}
  | {status: "signed-in"; user: User; scope: CustomerRequestScope};

export function useCustomerSession() {
  const config = useMemo(() => configuredSupabase(), []);
  const client = useMemo(() => config ? getSupabaseBrowserClient(config) : null, [config]);
  const [state, setState] = useState<SessionState>(() => ({
    status: config ? "loading" : "unavailable",
    user: null, scope: null,
  }));

  useEffect(() => {
    if (!client) return;
    let active: {scope: CustomerRequestScope; controller: AbortController} | undefined;
    const {data: {subscription}} = client.auth.onAuthStateChange((_event, session) => {
      const subject = session?.user.id;
      if (active && active.scope.subject !== subject) {
        active.controller.abort();
        active = undefined;
      }
      if (!session || !subject) {
        setState({status: "signed-out", user: null, scope: null});
        return;
      }
      if (!active) {
        const controller = new AbortController();
        active = {controller, scope: {subject, signal: controller.signal}};
      }
      setState({status: "signed-in", user: session.user, scope: active.scope});
    });
    return () => {
      subscription.unsubscribe();
      active?.controller.abort();
    };
  }, [client]);

  return {...state, client, config};
}
