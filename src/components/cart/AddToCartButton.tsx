"use client";

import Link from "next/link";
import type { Product } from "@/lib/types";
import { useCart } from "./CartProvider";

/** Agrega la variante principal; si el producto tiene opciones, lleva a la ficha para elegirlas. */
export function AddToCartButton({ product, className = "" }: { product: Product; className?: string }) {
  const { add } = useCart();
  if (!product.inStock)
    return (
      <button disabled className={`${className} cursor-not-allowed opacity-50`}>
        Agotado
      </button>
    );
  if (product.variants.length > 1)
    return (
      <Link href={`/producto/${product.slug}`} className={`${className} grid place-items-center`}>
        Ver opciones
      </Link>
    );
  return (
    <button onClick={() => add(product.defaultVariantId)} className={className}>
      Agregar al carrito
    </button>
  );
}
