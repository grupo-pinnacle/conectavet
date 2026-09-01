// Cliente Supabase singleton (server-side) para Realtime y admin operations.
// Para cliente (browser) usá el módulo anónimo con NEXT_PUBLIC_SUPABASE_ANON_KEY.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

/**
 * Cliente server-side con service_role key. SOLO usar en server code
 * (route handlers, server components, tRPC procedures). NUNCA exponer
 * al cliente — tiene permisos totales sobre la DB.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    // No loguear en producción; es esperado durante dev sin configurar.
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.warn("[supabase] Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY — Realtime deshabilitado");
    }
    return null;
  }

  _client = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return _client;
}