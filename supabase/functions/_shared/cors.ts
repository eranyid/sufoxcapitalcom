/**
 * Shared CORS helper for Supabase Edge Functions.
 *
 * Reads ALLOWED_ORIGINS from environment (comma-separated list).
 * Falls back to wildcard only if the env var is not set, so existing
 * deployments keep working until the var is configured.
 */

const _allowedOrigins: string[] | null = (() => {
  const raw = Deno.env.get("ALLOWED_ORIGINS");
  if (!raw) return null; // not configured → permissive fallback
  return raw.split(",").map((o) => o.trim()).filter(Boolean);
})();

export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";

  let allowOrigin = "";
  if (_allowedOrigins === null) {
    // Env var not set – allow the requesting origin (backward-compat)
    allowOrigin = origin || "*";
  } else if (_allowedOrigins.includes(origin)) {
    allowOrigin = origin;
  }
  // If the origin is not in the allowlist, allowOrigin stays "" and the
  // browser will block the cross-origin request.

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    ...(allowOrigin && allowOrigin !== "*"
      ? { Vary: "Origin" }
      : {}),
  };
}

/** Standard preflight response. */
export function handleCorsOptions(req: Request): Response {
  return new Response(null, { headers: getCorsHeaders(req) });
}
