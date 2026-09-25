"use client";

import Link from "next/link";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { shippingCost, shippingOptionsFor } from "@/lib/catalog/queries";
import { formatPrice } from "@/lib/format";
import { departments } from "@/lib/peru";
import { validatePromotion } from "@/lib/promotions";
import { useCatalog } from "../catalog/CatalogProvider";
import { SmartImage } from "../SmartImage";
import { useCart } from "./CartProvider";
import { CheckoutButton } from "./CheckoutButton";
import { useFreeShippingMessage } from "./FreeShippingNotice";
import { QuantityStepper } from "./QuantityStepper";
import { TermsCheckbox } from "./TermsCheckbox";

const fieldClass = "h-[46px] w-full rounded-[5px] border border-[#dfdfdf] bg-white px-4 text-[14px] text-ink focus:outline-2 focus:outline-ocean";
const labelClass = "block text-[14px] leading-[17px] font-bold text-ink";

function ShippingEstimator({ subtotal }: { subtotal: number }) {
  const catalog = useCatalog();
  const [department, setDepartment] = useState("");
  const options = department ? shippingOptionsFor(catalog, department) : [];

  return (
    <div className="w-full max-w-[500px] rounded-[5px] bg-mist p-[25px]">
      <p className={labelClass}>Calcular envío</p>
      <label className={`${labelClass} mt-[15px] font-normal text-muted`} htmlFor="department">Departamento</label>
      <select id="department" value={department} onChange={(e) => setDepartment(e.target.value)} className={`${fieldClass} mt-2`}>
        <option value="" disabled>---</option>
        {departments.map((d) => <option key={d}>{d}</option>)}
      </select>
      {department && (
        options.length === 0 ? (
          <p className="mt-3 text-[14px] text-ink">Por ahora no hacemos envíos a {department}. Escríbenos por WhatsApp y lo coordinamos.</p>
        ) : (
          <ul className="mt-3 space-y-1.5 text-[14px] text-ink">
            {options.map((o) => {
              const cost = shippingCost(o, subtotal);
              return (
                <li key={o.id}>
                  <strong className="font-bold">{o.name}</strong>
                  {o.estimate && <span className="text-muted"> ({o.estimate})</span>}: {cost === 0 ? "Gratis" : formatPrice(cost)}
                  {cost > 0 && o.freeOver != null && <span className="block text-[12px] text-muted">Gratis desde {formatPrice(o.freeOver)}</span>}
                </li>
              );
            })}
          </ul>
        )
      )}
    </div>
  );
}

export function CartPageContent() {
  const { ready, lines, subtotal, setQuantity, remove, note, setNote, coupon, setCoupon } = useCart();
  const [accepted, setAccepted] = useState(false);
  const [code, setCode] = useState("");
  const [couponMessage, setCouponMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [checking, setChecking] = useState(false);
  const freeShipping = useFreeShippingMessage(subtotal);

  const applyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setChecking(true);
    const r = await validatePromotion(code, lines);
    setChecking(false);
    if (r.valid) {
      setCoupon(r.code);
      setCode("");
      setCouponMessage({ ok: true, text: r.free_shipping ? `${r.code}: envío gratis en tu pedido.` : `${r.code}: ahorras ${formatPrice(r.discount)}. Se aplica en el pago.` });
    } else setCouponMessage({ ok: false, text: r.message });
  };

  return (
    <div className="container-page pt-[49px]">
      <div className="flex items-center justify-between">
        <h1 className="heading text-[30px] leading-[1.18] text-ink md:text-[35.2px]">Tu carrito</h1>
        <Link href="/" className="text-[15px] font-bold text-cielo hover:underline">Seguir comprando</Link>
      </div>

      {!ready ? (
        <div className="mt-5 h-[400px] animate-pulse rounded-[5px] bg-mist" />
      ) : lines.length === 0 ? (
        <div className="mt-5 rounded-[5px] px-6 py-20 text-center shadow-[0_0_0_1px_#dfdfdf]">
          <p className="text-[15px] text-muted">Tu carrito está vacío.</p>
          <Link href="/" className="mt-6 inline-grid h-11 place-items-center rounded-[5px] bg-ocean px-8 text-[14px] font-bold text-white hover:bg-ocean-dark">
            Descubrir productos
          </Link>
        </div>
      ) : (
        <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-5">
            <ul className="rounded-[5px] shadow-[0_0_0_1px_#dfdfdf]">
              {lines.map((l) => (
                <li key={l.variantId} className="flex min-h-[165px] flex-wrap items-center gap-x-5 gap-y-4 border-b border-[#dfdfdf] px-[15px] py-6 last:border-0 md:flex-nowrap md:gap-5 md:pr-10 md:pl-[25px]">
                  <Link href={`/producto/${l.product.slug}`} className="relative size-20 shrink-0 overflow-hidden rounded-[5px]">
                    <SmartImage src={l.product.image} alt={l.product.name} fill sizes="80px" className="object-contain" />
                  </Link>
                  <div className="min-w-0 flex-1 max-md:basis-[calc(100%-100px)]">
                    <p className="text-[12px] leading-[17px] text-muted">{l.product.brand}</p>
                    <Link href={`/producto/${l.product.slug}`} className="block text-[14px] leading-5 font-bold text-ink hover:underline">{l.product.name}</Link>
                    <p className="mt-[9px] text-[13px] leading-5 text-muted">
                      {l.variant.compareAtPrice && <s className="mr-1 text-[14px]">{formatPrice(l.variant.compareAtPrice)}</s>}
                      {formatPrice(l.unitPrice)}
                    </p>
                    {l.product.options.length > 0 && <p className="text-[13px] text-muted">{l.variant.title}</p>}
                    {l.giftWrap && <p className="text-[12px] text-cielo">Envuelto para regalo</p>}
                    <p className="mt-[15px] text-[13px] leading-4 text-muted"><span className="font-bold">SKU:</span> {l.variant.sku}</p>
                  </div>
                  <QuantityStepper value={l.quantity} onChange={(q) => setQuantity(l.variantId, q)} />
                  <button onClick={() => remove(l.variantId)} aria-label={`Eliminar ${l.product.name}`} className="text-muted hover:text-cielo md:ml-[25px]">
                    <Trash2 className="size-6" strokeWidth={1.2} />
                  </button>
                  <p className="ml-auto min-w-[56px] text-right text-[15px] text-muted md:ml-px">{formatPrice(l.lineTotal)}</p>
                </li>
              ))}
            </ul>
            <ShippingEstimator subtotal={subtotal} />
          </div>

          <aside className="rounded-[5px] bg-mist p-[25px]">
            <label htmlFor="notes" className="block text-[15px] leading-[18px] text-muted">Instrucciones especiales del pedido</label>
            <textarea id="notes" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ej. mensaje para la tarjeta de dedicatoria" className="mt-2 block h-[140px] w-full resize-y rounded-[5px] border border-[#dfdfdf] bg-white p-3 text-[14px] text-ink focus:outline-2 focus:outline-ocean" />

            <form onSubmit={applyCoupon} className="mt-[25px] flex h-[46px] rounded-[5px] border border-[#dfdfdf] bg-white p-[3px]">
              <input required value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Código de cupón" className="min-w-0 flex-1 px-3.5 text-[14px] text-ink placeholder:text-muted focus:outline-none" />
              <button disabled={checking} className="h-full rounded-[3px] bg-ocean px-5 text-[15px] font-bold text-white hover:bg-ocean-dark disabled:opacity-60">{checking ? "…" : "Aplicar"}</button>
            </form>
            {couponMessage && <p className={`mt-2 text-[12px] ${couponMessage.ok ? "text-stock" : "text-sale"}`}>{couponMessage.text}</p>}
            {coupon && !couponMessage && (
              <p className="mt-2 flex items-center justify-between text-[12px] text-muted">
                Código {coupon} aplicado
                <button onClick={() => setCoupon("")} className="text-cielo underline underline-offset-4">Quitar</button>
              </p>
            )}

            <p className="mt-[30px] text-[15px] leading-[23px] text-muted">Subtotal</p>
            <p className="heading text-[20px] leading-[30px] tracking-normal text-ink">{formatPrice(subtotal)} PEN</p>
            <p className="mt-2.5 text-[12px] leading-[18px] text-muted">IGV incluido. El envío se calcula al pagar.</p>
            <p className="mt-[5px] text-[12px] leading-[18px] font-bold text-muted">
              {freeShipping.message}{" "}
              {freeShipping.missing > 0 && (
                <>– <Link href="/" className="text-cielo hover:underline">Seguir comprando</Link></>
              )}
            </p>

            <div className="mt-[26px]">
              <TermsCheckbox checked={accepted} onChange={setAccepted} />
            </div>
            <CheckoutButton accepted={accepted} className="mt-[25px] h-[46px] w-full rounded-[5px] bg-ocean text-[14px] font-bold text-white hover:bg-ocean-dark" />
          </aside>
        </div>
      )}
    </div>
  );
}
