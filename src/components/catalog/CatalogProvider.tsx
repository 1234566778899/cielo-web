"use client";

import { createContext, useContext } from "react";
import type { Catalog } from "@/lib/types";

const CatalogContext = createContext<Catalog | null>(null);

/** Hace disponible en el cliente el catálogo que el layout cargó de Supabase. */
export function CatalogProvider({ catalog, children }: { catalog: Catalog; children: React.ReactNode }) {
  return <CatalogContext.Provider value={catalog}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error("useCatalog debe usarse dentro de <CatalogProvider>");
  return ctx;
}
