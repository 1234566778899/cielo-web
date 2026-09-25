"use client";

import { useMemo } from "react";
import { buildStores } from "@/data/stores";
import { useCatalog } from "../catalog/CatalogProvider";

export function useStores() {
  const { locations } = useCatalog();
  return useMemo(() => buildStores(locations), [locations]);
}
