import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente sin sesión ni cookies, para leer datos públicos (catálogo) desde el servidor.
 * Al no depender de la petición, sus resultados se pueden cachear entre usuarios.
 */
export function createPublicClient() {
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
