import Link from "next/link";
import { Star } from "lucide-react";
import { discountPercent, formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";
import { AddToCartButton } from "../cart/AddToCartButton";
import { SmartImage } from "../SmartImage";

/** Producto en formato de fila para las vistas "Filas" y "Filas compactas". */
export function ProductRow({ product, compact = false }: { product: Product; compact?: boolean }) {
  const discount = discountPercent(product.price, product.compareAtPrice);
  const onSale = discount > 0;

  return (
    <article className={`group relative flex items-center rounded-[5px] bg-white shadow-[inset_0_0_0_1px_#dfdfdf] ${compact ? "gap-5 p-[15px]" : "gap-[30px] p-5"}`}>
      <Link href={`/producto/${product.slug}`} className={`relative shrink-0 overflow-hidden ${compact ? "size-20" : "size-[200px]"}`}>
        <SmartImage src={product.image} alt={product.name} fill sizes={compact ? "80px" : "200px"} className="object-contain transition-transform duration-300 group-hover:scale-105" />
        {onSale && !compact && (
          <span className="absolute top-0 right-0 grid h-[22px] place-items-center rounded-[20px] bg-magenta px-2 text-[12px] leading-none text-white">-{discount}%</span>
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <p className="flex gap-3 text-[13px] text-muted">
          {product.brand}
          <span>{product.sku}</span>
        </p>
        <h3 className="mt-2 text-[15.4px] leading-[1.1] text-ink">
          <Link href={`/producto/${product.slug}`} className="hover:underline">{product.name}</Link>
        </h3>
        {!compact && (
          <>
            <p className={`mt-2.5 text-[13px] leading-none font-bold ${product.inStock ? "text-stock" : "text-sale"}`}>{product.inStock ? "Disponible" : "Agotado"}</p>
            <p className="mt-3 line-clamp-2 max-w-[520px] text-[14px] leading-[1.5] text-muted">{product.description[0]}</p>
            <div className="mt-3 flex h-3.5 items-center gap-1 text-[12px] text-muted">
              <span className="flex">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} className="size-[13px] fill-[#c4c4c4] text-[#c4c4c4]" strokeWidth={1} />
                ))}
              </span>
              ({product.reviewCount})
            </div>
          </>
        )}
      </div>

      <div className={`shrink-0 text-right ${compact ? "flex items-center gap-5" : "w-[200px]"}`}>
        <div>
          <p className="flex items-baseline justify-end gap-1.5 leading-[17px]">
            <span className={`text-[16px] ${onSale ? "text-sale" : "text-navy"}`}>{formatPrice(product.price)}</span>
            <span className="text-[11px] text-muted">IGV incl.</span>
          </p>
          {onSale && <p className="mt-0.5 text-[12px] leading-[15px] text-muted line-through">{formatPrice(product.compareAtPrice!)}</p>}
        </div>
        <AddToCartButton
          product={product}
          className={`h-11 rounded-[5px] bg-navy text-[14px] font-bold text-white transition-colors hover:bg-navy-dark ${compact ? "px-5" : "mt-3.5 w-full"}`}
        />
      </div>
    </article>
  );
}
