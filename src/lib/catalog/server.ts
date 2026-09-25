import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { mapCatalog, type CatalogRow } from "./map";

/**
 * Catálogo completo desde Supabase, cacheado 60 s y compartido entre visitantes.
 * Para refrescarlo al instante: revalidateTag("catalog").
 */
export const getCatalog = unstable_cache(
  async () => {
    const { data, error } = await createPublicClient().rpc("store_catalog");
    if (error) throw new Error(`No se pudo cargar el catálogo: ${error.message}`);
    return mapCatalog(data as CatalogRow);
  },
  ["store-catalog"],
  { tags: ["catalog"], revalidate: 60 },
);
