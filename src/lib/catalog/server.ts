import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { mapCatalog, type CatalogRow } from "./map";

/**
 * Catálogo completo desde Supabase, cacheado 60 s y compartido entre visitantes.
 * Para refrescarlo al instante: revalidateTag("catalog").
 */
export const getCatalog = unstable_cache(
  async () => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY (en Vercel: Settings → Environment Variables).");
    }
    const { data, error } = await createPublicClient().rpc("store_catalog");
    if (error) {
      const hint = error.code === "PGRST202" ? " Aplica las migraciones de supabase/ (supabase db push)." : "";
      throw new Error(`No se pudo cargar el catálogo de Supabase: ${error.message}.${hint}`);
    }
    return mapCatalog(data as CatalogRow);
  },
  ["store-catalog"],
  { tags: ["catalog"], revalidate: 60 },
);
