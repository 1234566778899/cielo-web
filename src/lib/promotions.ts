import { createClient } from "@/lib/supabase/client";

export type PromotionCheck =
  | { valid: true; code: string; type: "percentage" | "fixed" | "free_shipping"; value: number; discount: number; free_shipping: boolean; message: string }
  | { valid: false; message: string };

/** Vista previa de un código de descuento con los precios del servidor (RPC store_validate_promotion). */
export async function validatePromotion(code: string, items: { variantId: string; quantity: number }[]): Promise<PromotionCheck> {
  const { data, error } = await createClient().rpc("store_validate_promotion", {
    p_code: code,
    p_items: items.map((i) => ({ variant_id: i.variantId, quantity: i.quantity })),
  });
  if (error) return { valid: false, message: "No pudimos validar el código. Inténtalo de nuevo." };
  const r = data as PromotionCheck & { discount?: number; value?: number };
  return r.valid ? { ...r, discount: Number(r.discount), value: Number(r.value) } : r;
}
