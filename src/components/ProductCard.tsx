import Link from "next/link";
import { Star } from "lucide-react";
import { discountPercent, formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";
import { AddToCartButton } from "./cart/AddToCartButton";
import { SmartImage } from "./SmartImage";

export function ProductCard({ product, className = "", footer, showSku = false }: { product: Product; className?: string; footer?: React.ReactNode; showSku?: boolean }) {
  const discount = discountPercent(product.price, product.compareAtPrice);
  const onSale = discount > 0;

  return (
    <article className={`group relative flex flex-col rounded-[5px] bg-white p-[15px] shadow-[inset_0_0_0_1px_#dfdfdf] ${className}`}>
      {onSale && (
        <span className="absolute top-2.5 right-[11px] z-10 grid h-[22px] place-items-center rounded-[20px] border border-cielo bg-cielo px-2 text-[12px] leading-none text-white">
          -{discount}%
        </span>
      )}
      <Link href={`/producto/${product.slug}`} className="relative block aspect-square overflow-hidden">
        <SmartImage
          src={product.image}
          alt={product.name}
          fill
          sizes="(min-width: 1024px) 20vw, 50vw"
          className="object-contain transition-transform duration-300 group-hover:scale-105"
        />
      </Link>
      <p className="mt-5 flex gap-3 text-[13px] text-muted">
        {product.brand}
        {showSku && <span>{product.sku}</span>}
      </p>
      <p className={`mt-2.5 text-[13px] leading-none font-bold ${product.inStock ? "text-stock" : "text-sale"}`}>
        {product.inStock ? "Disponible" : "Agotado"}
      </p>
      <h3 className="mt-2.5 text-[15.4px] leading-[1.1] text-ink">
        <Link href={`/producto/${product.slug}`} className="hover:underline">
          {product.name}
        </Link>
      </h3>

      <div className="mt-auto pt-5">
        <div className="flex h-3.5 items-center gap-1 text-[12px] text-muted">
          <span className="flex">
            {Array.from({ length: 5 }, (_, i) => (
              <Star key={i} className="size-[13px] fill-[#c4c4c4] text-[#c4c4c4]" strokeWidth={1} />
            ))}
          </span>
          ({product.reviewCount})
        </div>
        <p className="mt-2.5 flex items-baseline gap-1.5 leading-[17px]">
          <span className={`text-[16px] ${onSale ? "text-sale" : "text-ocean"}`}>{formatPrice(product.price)}</span>
          <span className="text-[11px] text-muted">IGV incl.</span>
        </p>
        {onSale && <p className="mt-0.5 text-[12px] leading-[15px] text-muted line-through">{formatPrice(product.compareAtPrice!)}</p>}
        <AddToCartButton
          product={product}
          className="mt-3.5 h-11 w-full rounded-[5px] bg-ocean text-[14px] font-bold text-white transition-colors hover:bg-ocean-dark"
        />
        {footer}
      </div>
    </article>
  );
}
