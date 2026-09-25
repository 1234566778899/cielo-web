"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { SmartImage } from "../SmartImage";
import { useCart } from "./CartProvider";
import { CheckoutButton } from "./CheckoutButton";
import { useFreeShippingMessage } from "./FreeShippingNotice";
import { QuantityStepper } from "./QuantityStepper";
import { TermsCheckbox } from "./TermsCheckbox";

export function CartDrawer() {
  const { lines, subtotal, isOpen, close, setQuantity, remove } = useCart();
  const [accepted, setAccepted] = useState(false);
  const freeShipping = useFreeShippingMessage(subtotal);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, close]);

  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? "" : "pointer-events-none"}`} aria-hidden={!isOpen}>
      <div onClick={close} className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"}`} />
      <aside
        role="dialog"
        aria-label="Tu carrito"
        className={`absolute top-0 right-0 flex h-full w-full max-w-[400px] flex-col overflow-hidden bg-white shadow-[0_2px_10px_rgba(0,0,0,.3)] transition-transform duration-300 sm:top-[15px] sm:right-[15px] sm:h-[calc(100%-30px)] sm:rounded-[5px] ${isOpen ? "translate-x-0" : "translate-x-[calc(100%+20px)]"}`}
      >
        <header className="flex h-16 shrink-0 items-center justify-between bg-magenta px-[15px] text-white">
          <h2 className="heading text-[16.5px]">Tu carrito</h2>
          <button onClick={close} aria-label="Cerrar carrito" className="grid size-8 place-items-center rounded-[5px] border border-[#dfdfdf] bg-white text-muted">
            <X className="size-4" strokeWidth={1.5} />
          </button>
        </header>
        {freeShipping.message && <p className="flex h-[41px] shrink-0 items-center bg-magenta-dark px-[15px] text-[13px] text-white">{freeShipping.message}</p>}

        <div className="flex-1 overflow-y-auto p-[15px]">
          {lines.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-[15px] text-muted">Tu carrito está vacío.</p>
              <button onClick={close} className="mt-4 text-[14px] text-magenta underline underline-offset-4">Seguir comprando</button>
            </div>
          ) : (
            <ul className="space-y-[35px]">
              {lines.map((l) => (
                <li key={l.variantId} className="flex gap-[15px]">
                  <Link href={`/producto/${l.product.slug}`} onClick={close} className="relative size-16 shrink-0 rounded-[5px] shadow-[inset_0_0_0_1px_#dfdfdf]">
                    <SmartImage src={l.product.image} alt={l.product.name} fill sizes="64px" className="object-contain p-[5px]" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] leading-[18px] text-muted">{l.product.brand}</p>
                    <Link href={`/producto/${l.product.slug}`} onClick={close} className="mt-1 block text-[14.3px] leading-[17px] text-ink hover:underline">
                      {l.product.name}
                    </Link>
                    <p className="mt-[7px] text-[13px] leading-[21px]">
                      {l.variant.compareAtPrice && (
                        <s className="mr-1 text-muted">{formatPrice(l.variant.compareAtPrice)}</s>
                      )}
                      <strong className="font-bold text-ink">{formatPrice(l.unitPrice)}</strong>
                    </p>
                    {l.product.options.length > 0 && <p className="text-[12px] text-muted">{l.variant.title}</p>}
                    {l.giftWrap && <p className="text-[12px] text-magenta">Envuelto para regalo</p>}
                    <div className="mt-3.5 flex items-center gap-[30px]">
                      <QuantityStepper size="sm" min={0} value={l.quantity} onChange={(q) => setQuantity(l.variantId, q)} />
                      <button onClick={() => remove(l.variantId)} className="text-[13px] text-muted hover:text-magenta">Eliminar</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <footer className="shrink-0 bg-[#fff5fb] p-[15px]">
          <div className="flex justify-between text-[13px] leading-[21px] font-bold text-ink">
            <span>Total</span>
            <span>{formatPrice(subtotal)} PEN</span>
          </div>
          <div className="mt-[15px]">
            <TermsCheckbox checked={accepted} onChange={setAccepted} />
          </div>
          <div className="mt-[15px] grid grid-cols-2 gap-[15px]">
            <Link href="/carrito" onClick={close} className="grid h-11 place-items-center rounded-[5px] bg-magenta text-[14px] font-bold text-white hover:bg-magenta-dark">
              Ver carrito
            </Link>
            <CheckoutButton accepted={accepted} className="h-11 rounded-[5px] bg-navy text-[14px] font-bold text-white hover:bg-navy-dark" />
          </div>
        </footer>
      </aside>
    </div>
  );
}
