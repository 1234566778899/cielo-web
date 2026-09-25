"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getProduct, getVariant } from "@/lib/catalog/queries";
import type { Catalog, CartItem, Product, Variant } from "@/lib/types";
import { useCatalog } from "../catalog/CatalogProvider";

const STORAGE_KEY = "cielo-cart";
const EXTRA_KEY = "cielo-cart-extra";

export type CartLine = CartItem & { product: Product; variant: Variant; unitPrice: number; lineTotal: number };

type CartContextValue = {
  /** false hasta leer el carrito guardado en localStorage. */
  ready: boolean;
  lines: CartLine[];
  count: number;
  subtotal: number;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  add: (variantId: string, quantity?: number, giftWrap?: boolean) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
  /** Instrucciones del pedido (mensaje de la tarjeta, etc.). */
  note: string;
  setNote: (note: string) => void;
  /** Código de descuento que el cliente ingresó en el carrito; se valida de nuevo en el checkout. */
  coupon: string;
  setCoupon: (code: string) => void;
};

// Carritos guardados antes de las variantes (por slug) pasan a la variante principal.
const migrate = (catalog: Catalog, saved: (CartItem & { slug?: string })[]): CartItem[] =>
  saved.flatMap((i) => {
    const variantId = i.variantId ?? (i.slug ? getProduct(catalog, i.slug)?.defaultVariantId : undefined);
    return variantId ? [{ variantId, quantity: i.quantity, giftWrap: i.giftWrap }] : [];
  });

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const catalog = useCatalog();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [note, setNote] = useState("");
  const [coupon, setCoupon] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hidratar desde localStorage tras el montaje
      if (saved) setItems(migrate(catalog, JSON.parse(saved)));
      const extra = JSON.parse(localStorage.getItem(EXTRA_KEY) ?? "{}");
      setNote(extra.note ?? "");
      setCoupon(extra.coupon ?? "");
    } catch {}
    setLoaded(true);
  }, [catalog]);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      localStorage.setItem(EXTRA_KEY, JSON.stringify({ note, coupon }));
    } catch {}
  }, [items, note, coupon, loaded]);

  // No permitir más unidades de las que hay en stock.
  const cap = useCallback((variantId: string, quantity: number) => {
    const available = getVariant(catalog, variantId)?.variant.available;
    return available == null ? quantity : Math.min(quantity, available);
  }, [catalog]);

  const add = useCallback((variantId: string, quantity = 1, giftWrap = false) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.variantId === variantId);
      if (existing) return prev.map((i) => (i.variantId === variantId ? { ...i, quantity: cap(variantId, i.quantity + quantity), giftWrap: i.giftWrap || giftWrap } : i));
      return [...prev, { variantId, quantity: cap(variantId, quantity), giftWrap }];
    });
    setIsOpen(true);
  }, [cap]);

  const setQuantity = useCallback((variantId: string, quantity: number) => {
    setItems((prev) => (quantity <= 0 ? prev.filter((i) => i.variantId !== variantId) : prev.map((i) => (i.variantId === variantId ? { ...i, quantity: cap(variantId, quantity) } : i))));
  }, [cap]);

  const remove = useCallback((variantId: string) => setItems((prev) => prev.filter((i) => i.variantId !== variantId)), []);

  const value = useMemo<CartContextValue>(() => {
    // Líneas cuya variante ya no existe (o se desactivó en el admin) desaparecen del carrito.
    const lines = items.flatMap((item): CartLine[] => {
      const found = getVariant(catalog, item.variantId);
      if (!found || item.quantity <= 0) return [];
      return [{ ...item, product: found.product, variant: found.variant, unitPrice: found.variant.price, lineTotal: found.variant.price * item.quantity }];
    });
    return {
      ready: loaded,
      lines,
      count: lines.reduce((n, l) => n + l.quantity, 0),
      subtotal: lines.reduce((n, l) => n + l.lineTotal, 0),
      isOpen,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      add,
      setQuantity,
      remove,
      clear: () => {
        setItems([]);
        setNote("");
        setCoupon("");
      },
      note,
      setNote,
      coupon,
      setCoupon,
    };
  }, [items, loaded, isOpen, add, setQuantity, remove, catalog, note, coupon]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de <CartProvider>");
  return ctx;
}
