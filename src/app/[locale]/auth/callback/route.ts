import {createServerClient} from "@supabase/ssr";
import {cookies} from "next/headers";
import type {NextRequest} from "next/server";
import {authReturnPath} from "@/features/auth/return-path";
import {configuredSupabase} from "@/features/auth/supabase-config";
import {isLocale} from "@/i18n/locales";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, {params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (!isLocale(locale)) return new Response(null, {status: 404});
  const query = request.nextUrl.searchParams;
  const next = authReturnPath(query.get("next"), locale);

  function redirect(status?: "cancelled" | "failed" | "unavailable") {
    const location = status ? next + (next.includes("?") ? "&" : "?") + "auth=" + status : next;
    return new Response(null, {status: 303, headers: {
      Location: location,
      "Cache-Control": "private, no-store",
      "Referrer-Policy": "no-referrer",
    }});
  }

  if (query.get("error") === "access_denied" || query.get("error_code") === "access_denied") {
    return redirect("cancelled");
  }
  const code = query.get("code");
  if (!code || !/^[a-zA-Z0-9_-]{1,2048}$/.test(code) || query.has("error") || query.has("error_code")) {
    return redirect("failed");
  }
  const config = configuredSupabase();
  if (!config) return redirect("unavailable");

  const cookieStore = await cookies();
  const supabase = createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: items => {
        for (const {name, value, options} of items) cookieStore.set(name, value, options);
      },
    },
  });
  try {
    const {data, error} = await supabase.auth.exchangeCodeForSession(code);
    return error || !data.session ? redirect("failed") : redirect();
  } catch {
    return redirect("failed");
  }
}
