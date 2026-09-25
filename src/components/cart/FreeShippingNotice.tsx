"use client";

import { formatPrice } from "@/lib/format";
import { useCatalog } from "../catalog/CatalogProvider";

/** Mensaje de envío gratis según la tarifa configurada en Supabase (null si no hay envío gratis). */
export function useFreeShippingMessage(subtotal: number) {
  const threshold = useCatalog().freeShippingThreshold;
  if (threshold == null) return { threshold, missing: 0, message: null };
  const missing = threshold - subtotal;
  return {
    threshold,
    missing,
    message: missing > 0 ? `¡Solo te faltan ${formatPrice(missing)} para obtener envío gratis!` : "¡Felicidades! Tu pedido tiene envío gratis.",
  };
}
