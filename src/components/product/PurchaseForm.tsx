"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { discountPercent, formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";
import { useCart } from "../cart/CartProvider";
import { QuantityStepper } from "../cart/QuantityStepper";

/** Stock, precio, selector de variantes y botones de compra de la ficha de producto. */
export function PurchaseForm({ product }: { product: Product }) {
  const { add, close } = useCart();
  const router = useRouter();
  const [variantId, setVariantId] = useState(product.defaultVariantId);
  const [quantity, setQuantity] = useState(1);
  const [giftWrap, setGiftWrap] = useState(false);

  const variant = product.variants.find((v) => v.id === variantId) ?? product.variants[0];
  const discount = discountPercent(variant.price, variant.compareAtPrice);
  const onSale = discount > 0;
  const max = variant.available ?? 99;
  const lowStock = variant.available != null && variant.available > 0 && variant.available <= 5;

  // Elegir un valor de opción: busca la variante con esa combinación.
  const choose = (title: string, value: string) => {
    const wanted = { ...variant.options, [title]: value };
    const match = product.variants.find((v) => Object.entries(wanted).every(([k, val]) => v.options[k] === val))
      ?? product.variants.find((v) => v.options[title] === value);
    if (match) {
      setVariantId(match.id);
      setQuantity((q) => Math.min(q, match.available ?? 99) || 1);
    }
  };

  const addToCart = () => add(variant.id, quantity, giftWrap);

  return (
    <>
      <div className="max-w-[440px]">
        <p className="flex gap-4 text-[15px] leading-[18px]">
          <span className={`font-bold ${variant.inStock ? "text-stock" : "text-sale"}`}>{variant.inStock ? "Disponible" : "Agotado"}</span>
          <span className="text-muted">{lowStock ? `¡Solo quedan ${variant.available}!` : "Normalmente se envía en 24 horas"}</span>
        </p>
        <div className={`mt-2.5 h-[5px] ${variant.inStock ? "bg-stock" : "bg-sale"}`} />
      </div>

      {onSale && (
        <span className="mt-[30px] inline-grid h-8 place-items-center rounded-[20px] bg-cielo px-5 text-[13px] font-bold text-white">
          Ahorra {discount}%
        </span>
      )}
      <p className={`flex items-baseline gap-1.5 ${onSale ? "mt-[15px]" : "mt-[30px]"}`}>
        <span className={`text-[24px] leading-none ${onSale ? "text-sale" : "text-ocean"}`}>{formatPrice(variant.price)}</span>
        <span className="text-[11px] text-muted">IGV incl.</span>
      </p>
      {onSale && <p className="mt-[5px] text-[15px] leading-[18px] text-muted line-through">{formatPrice(variant.compareAtPrice!)}</p>}

      <div className="mt-8 max-w-[440px]">
        {product.options.map((option) => (
          <fieldset key={option.title} className="mb-[30px]">
            <legend className="text-[15px] font-bold text-ink">
              {option.title}: <span className="font-normal text-muted">{variant.options[option.title]}</span>
            </legend>
            <div className="mt-2.5 flex flex-wrap gap-2.5">
              {option.values.map((value) => {
                const selected = variant.options[option.title] === value;
                const candidate = product.variants.find((v) => v.options[option.title] === value);
                const soldOut = candidate ? !candidate.inStock : true;
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => choose(option.title, value)}
                    className={`h-[42px] min-w-[70px] rounded-[5px] border px-4 text-[14px] transition-colors ${
                      selected ? "border-ocean bg-ocean text-white" : "border-[#dfdfdf] bg-white text-ink hover:border-ocean"
                    } ${soldOut ? "line-through opacity-60" : ""}`}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}

        <label className="flex items-center gap-2.5 text-[15px] font-bold text-ink">
          <input type="checkbox" checked={giftWrap} onChange={(e) => setGiftWrap(e.target.checked)} className="size-[13px] accent-ocean" />
          ¿Envolver para regalo?
        </label>
        <div className="mt-[30px] flex gap-[15px]">
          <QuantityStepper value={quantity} onChange={(q) => setQuantity(Math.min(Math.max(1, q), max))} />
          <button
            onClick={addToCart}
            disabled={!variant.inStock}
            className="h-[50px] flex-1 rounded-[5px] bg-cielo text-[15px] font-bold text-white transition-colors hover:bg-cielo-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {variant.inStock ? "Agregar al carrito" : "Agotado"}
          </button>
        </div>
        <button
          onClick={() => {
            addToCart();
            close();
            router.push("/carrito");
          }}
          disabled={!variant.inStock}
          className="mt-[15px] h-[50px] w-full rounded-[5px] bg-ocean text-[15px] font-bold text-white transition-colors hover:bg-ocean-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          Comprar ahora
        </button>
      </div>
    </>
  );
}
