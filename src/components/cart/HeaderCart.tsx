"use client";

import { ShoppingCart } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { useCart } from "./CartProvider";

export function HeaderCart() {
  const { count, subtotal, open } = useCart();
  return (
    <>
      <button onClick={open} aria-label="Abrir carrito" className="grid size-[46px] place-items-center rounded-[5px] border border-white/30 hover:bg-white/10">
        <ShoppingCart className="size-5" strokeWidth={1.5} />
      </button>
      <button onClick={open} className="min-w-[68px] text-left text-[11px] leading-tight">
        <span className="block">{count === 1 ? "1 artículo" : `${count} artículos`}</span>
        <span className="block text-[13px]">{formatPrice(subtotal)}</span>
      </button>
    </>
  );
}
