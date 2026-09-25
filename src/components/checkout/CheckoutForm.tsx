"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, MapPin, Package, Smartphone, Landmark } from "lucide-react";
import { buildStores } from "@/data/stores";
import { pickupOptions, shippingCost, shippingOptionsFor } from "@/lib/catalog/queries";
import { formatPrice } from "@/lib/format";
import { addressToJson, paymentLabels, saveLastOrder } from "@/lib/orders";
import { validatePromotion, type PromotionCheck } from "@/lib/promotions";
import { site } from "@/lib/site";
import { createClient } from "@/lib/supabase/client";
import type { Order, OrderLine } from "@/lib/types";
import { useAccount } from "../account/AccountProvider";
import { useCatalog } from "../catalog/CatalogProvider";
import { AddressFieldsGroup, emptyAddress, fieldClass, type AddressFields } from "../account/AddressForm";
import { useCart } from "../cart/CartProvider";
import { CheckoutShell } from "./CheckoutShell";
import { OrderSummary } from "./OrderSummary";

type Delivery = "envio" | "recojo";
type Payment = "yape" | "transfer";
type ValidPromo = Extract<PromotionCheck, { valid: true }>;

const h2 = "text-[21px] font-bold leading-tight text-ink";

function Radio({ checked, onChange, name, children, first, last }: { checked: boolean; onChange: () => void; name: string; children: React.ReactNode; first?: boolean; last?: boolean }) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-3 border px-4 py-3.5 text-[14px] ${first ? "rounded-t-[5px]" : "-mt-px"} ${last ? "rounded-b-[5px]" : ""} ${checked ? "relative z-[1] border-ocean bg-mist" : "border-[#dfdfdf]"}`}
    >
      <input type="radio" name={name} checked={checked} onChange={onChange} className="size-[18px] shrink-0 accent-ocean" />
      {children}
    </label>
  );
}

export function CheckoutForm() {
  const router = useRouter();
  const catalog = useCatalog();
  const { ready: cartReady, lines: cartLines, subtotal, clear, note, coupon } = useCart();
  const { customer, saveAddress, refresh } = useAccount();

  const [email, setEmail] = useState("");
  const [news, setNews] = useState(false);
  const [delivery, setDelivery] = useState<Delivery>("envio");
  const [address, setAddress] = useState<AddressFields>(emptyAddress);
  const [pickupContact, setPickupContact] = useState({ firstName: "", lastName: "", phone: "" });
  const [saveInfo, setSaveInfo] = useState(false);
  const [rateId, setRateId] = useState<string | null>(null);
  const [pickupId, setPickupId] = useState<string | null>(null);
  const [payment, setPayment] = useState<Payment>("yape");
  const [discount, setDiscount] = useState("");
  const [discountMsg, setDiscountMsg] = useState<string | null>(null);
  const [promo, setPromo] = useState<ValidPromo | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prellenar con los datos de la cuenta.
  useEffect(() => {
    if (!customer) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- prellenado único al tener sesión
    setEmail((e) => e || customer.email);
    setPickupContact((c) => (c.firstName ? c : { firstName: customer.firstName, lastName: customer.lastName, phone: customer.phone }));
    const def = customer.addresses.find((a) => a.isDefault) ?? customer.addresses[0];
    if (def) setAddress({ firstName: def.firstName, lastName: def.lastName, address1: def.address1, reference: def.reference, district: def.district, province: def.province, department: def.department, phone: def.phone });
  }, [customer]);

  const lines: OrderLine[] = useMemo(
    () => cartLines.map((l) => ({
      key: l.variantId, slug: l.product.slug, variantId: l.variantId, name: l.product.name,
      variantTitle: l.product.options.length ? l.variant.title : null, image: l.product.image, price: l.unitPrice, quantity: l.quantity, giftWrap: l.giftWrap,
    })),
    [cartLines],
  );

  // Aplicar el código que se ingresó en el carrito (y revalidarlo si cambia el carrito).
  const applyCode = async (code: string) => {
    const r = await validatePromotion(code, cartLines);
    if (r.valid) {
      setPromo(r);
      setDiscount("");
      setDiscountMsg(null);
    } else {
      setPromo(null);
      setDiscountMsg(r.message);
    }
  };
  const promoCode = promo?.code ?? coupon;
  const cartKey = cartLines.map((l) => `${l.variantId}:${l.quantity}`).join(",");
  useEffect(() => {
    if (!cartReady || !promoCode || !cartKey) return;
    let stale = false;
    validatePromotion(promoCode, cartLines).then((r) => {
      if (stale) return;
      setPromo(r.valid ? r : null);
      if (!r.valid) setDiscountMsg(r.message);
    });
    return () => {
      stale = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- revalidar solo cuando cambian las líneas
  }, [cartReady, cartKey]);

  const addressReady = Boolean(address.address1 && address.district && address.department);
  const rates = useMemo(() => (addressReady ? shippingOptionsFor(catalog, address.department) : []), [catalog, addressReady, address.department]);
  const pickups = useMemo(() => pickupOptions(catalog), [catalog]);
  const stores = useMemo(() => buildStores(catalog.locations), [catalog.locations]);
  const rate = rates.find((r) => r.id === rateId) ?? rates[0];
  const pickup = pickups.find((p) => p.id === pickupId) ?? pickups[0];

  const discountAmount = promo && !promo.free_shipping ? Math.min(promo.discount, subtotal) : 0;
  const option = delivery === "recojo" ? pickup : rate;
  const shipping = !option ? null : delivery === "recojo" || promo?.free_shipping ? 0 : shippingCost(option, subtotal);
  const total = subtotal - discountAmount + (shipping ?? 0);

  if (!cartReady) return <div className="h-screen animate-pulse bg-[#f5f5f5]" />;

  if (lines.length === 0) {
    return (
      <CheckoutShell
        main={
          <div className="py-16 text-center">
            <h1 className={h2}>Tu carrito está vacío</h1>
            <p className="mt-2 text-[14px] text-muted">Agrega productos para continuar con tu compra.</p>
            <Link href="/" className="mt-6 inline-grid h-11 place-items-center rounded-[5px] bg-ocean px-6 text-[14px] font-bold text-white hover:bg-ocean-dark">
              Ir a la tienda
            </Link>
          </div>
        }
        summary={null}
      />
    );
  }

  const discountBox = (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void applyCode(discount);
      }}
      className="mt-6"
    >
      <div className="flex gap-3">
        <input aria-label="Código de descuento" value={discount} onChange={(e) => setDiscount(e.target.value.toUpperCase())} placeholder="Código de descuento" className={`${fieldClass} flex-1`} />
        <button disabled={!discount.trim()} className="h-[46px] rounded-[5px] bg-ocean px-4 text-[14px] font-bold text-white disabled:bg-[#e1e1e1] disabled:text-muted">Aplicar</button>
      </div>
      {discountMsg && <p className="mt-2 text-[13px] text-sale">{discountMsg}</p>}
      {promo && (
        <p className="mt-2 flex items-center justify-between text-[13px] text-stock">
          {promo.code} · {promo.free_shipping ? "Envío gratis" : `−${formatPrice(discountAmount)}`}
          <button type="button" onClick={() => setPromo(null)} className="text-muted underline underline-offset-2">Quitar</button>
        </p>
      )}
    </form>
  );

  const summary = <OrderSummary lines={lines} shipping={shipping} discount={discountAmount} discountLabel={promo?.code}>{discountBox}</OrderSummary>;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!option) return setError(delivery === "envio" ? "No hay métodos de envío para tu dirección." : "No hay tiendas disponibles para recojo.");
    setSubmitting(true);
    setError(null);
    const contact = delivery === "envio" ? address : pickupContact;
    const { data, error: rpcError } = await createClient().rpc("store_place_order", {
      p: {
        email,
        phone: contact.phone,
        customer: { first_name: contact.firstName, last_name: contact.lastName, accepts_marketing: news },
        shipping_address: delivery === "envio" ? addressToJson(address) : null,
        items: cartLines.map((l) => ({ variant_id: l.variantId, quantity: l.quantity, metadata: l.giftWrap ? { gift_wrap: true } : {} })),
        shipping_option_id: option.id,
        promotion_code: promo?.code ?? null,
        note: note || null,
        payment: { provider: payment },
      },
    });
    if (rpcError || !data) {
      setSubmitting(false);
      return setError(rpcError?.message ?? "No pudimos registrar tu pedido. Inténtalo de nuevo.");
    }

    const row = data as { id: string; display_id: number; created_at: string; subtotal: number; discount_total: number; shipping_total: number; tax_total: number; total: number };
    const store = stores.find((s) => s.id === option.locationId);
    const order: Order = {
      id: row.id,
      number: row.display_id,
      createdAt: row.created_at,
      status: "confirmado",
      awaitingPayment: true,
      lines,
      subtotal: Number(row.subtotal),
      discount: Number(row.discount_total),
      shipping: Number(row.shipping_total),
      tax: Number(row.tax_total),
      total: Number(row.total),
      email,
      delivery: delivery === "envio"
        ? { method: "envio", address, label: option.name }
        : { method: "recojo", storeName: store?.name ?? option.name, storeAddress: store?.address.slice(0, 2).join(", ") ?? "" },
      payment: paymentLabels[payment],
      paymentProvider: payment,
    };
    saveLastOrder(order);
    if (delivery === "envio" && saveInfo && customer) await saveAddress({ id: "", ...address, isDefault: customer.addresses.length === 0 });
    clear();
    void refresh();
    router.push(`/checkout/gracias?pedido=${order.number}`);
  };

  return (
    <CheckoutShell
      summary={summary}
      mobileSummary={
        <div className="px-5">
          <button onClick={() => setSummaryOpen(!summaryOpen)} aria-expanded={summaryOpen} className="flex h-14 w-full items-center justify-between text-[14px] text-cielo">
            <span className="flex items-center gap-1">
              {summaryOpen ? "Ocultar" : "Mostrar"} resumen del pedido <ChevronDown className={`size-4 transition-transform ${summaryOpen ? "rotate-180" : ""}`} />
            </span>
            <span className="text-[17px] font-bold text-ink">{formatPrice(total)}</span>
          </button>
          {summaryOpen && <div className="pb-6">{summary}</div>}
        </div>
      }
      main={
        <form onSubmit={submit}>
          <section>
            <div className="flex items-baseline justify-between">
              <h2 className={h2}>Contacto</h2>
              {!customer && <Link href="/cuenta/ingresar" className="text-[14px] text-cielo underline underline-offset-2">Iniciar sesión</Link>}
            </div>
            <label htmlFor="co-email" className="sr-only">Correo electrónico</label>
            <input id="co-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Correo electrónico" className={`${fieldClass} mt-3.5`} />
            <label className="mt-3 flex items-center gap-2.5 text-[14px] text-ink">
              <input type="checkbox" checked={news} onChange={(e) => setNews(e.target.checked)} className="size-[18px] accent-ocean" />
              Enviarme novedades y ofertas por correo
            </label>
          </section>

          <section className="mt-8">
            <h2 className={h2}>Entrega</h2>
            <div className="mt-3.5 grid grid-cols-2 gap-1 rounded-[8px] bg-[#f0f0f0] p-1">
              {([["envio", "Envío", Package], ["recojo", "Recojo en tienda", MapPin]] as const).map(([key, label, Icon]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setDelivery(key)}
                  aria-pressed={delivery === key}
                  className={`flex h-[42px] items-center justify-center gap-1.5 rounded-[6px] text-[14px] font-bold ${delivery === key ? "bg-white text-ink shadow-[0_1px_4px_rgba(0,0,0,.12)]" : "text-muted"}`}
                >
                  <Icon className="size-4" strokeWidth={1.8} /> {label}
                </button>
              ))}
            </div>

            {delivery === "envio" ? (
              <>
                <div className="mt-4">
                  <label htmlFor="co-country" className="sr-only">País</label>
                  <select id="co-country" className={`${fieldClass} mb-3`} defaultValue="Perú">
                    <option>Perú</option>
                  </select>
                  <AddressFieldsGroup idPrefix="checkout" value={address} onChange={setAddress} />
                </div>
                {customer && (
                  <label className="mt-3 flex items-center gap-2.5 text-[14px] text-ink">
                    <input type="checkbox" checked={saveInfo} onChange={(e) => setSaveInfo(e.target.checked)} className="size-[18px] accent-ocean" />
                    Guardar esta dirección en mi cuenta
                  </label>
                )}

                <h3 className="mt-7 text-[16px] font-bold text-ink">Método de envío</h3>
                {!addressReady ? (
                  <p className="mt-3 rounded-[5px] bg-[#f5f5f5] px-4 py-5 text-center text-[14px] text-muted">
                    Ingresa tu dirección de envío para ver los métodos disponibles.
                  </p>
                ) : (
                  rates.length === 0 ? (
                    <p className="mt-3 rounded-[5px] bg-[#f5f5f5] px-4 py-5 text-center text-[14px] text-muted">
                      Por ahora no enviamos a {address.department}. Escríbenos por WhatsApp al {site.phoneDisplay} y lo coordinamos.
                    </p>
                  ) : (
                    <div className="mt-3">
                      {rates.map((r, i) => {
                        const cost = promo?.free_shipping ? 0 : shippingCost(r, subtotal);
                        return (
                          <Radio key={r.id} name="rate" first={i === 0} last={i === rates.length - 1} checked={rate?.id === r.id} onChange={() => setRateId(r.id)}>
                            <span className="flex-1">
                              {r.name}
                              {r.estimate && <span className="block text-[13px] text-muted">{r.estimate}</span>}
                            </span>
                            <span className="font-bold">{cost === 0 ? "Gratis" : formatPrice(cost)}</span>
                          </Radio>
                        );
                      })}
                    </div>
                  )
                )}
              </>
            ) : (
              <div className="mt-4">
                <h3 className="text-[16px] font-bold text-ink">Tiendas</h3>
                <div className="mt-3">
                  {pickups.map((p, i) => {
                    const store = stores.find((s) => s.id === p.locationId);
                    return (
                      <Radio key={p.id} name="store" first={i === 0} last={i === pickups.length - 1} checked={pickup?.id === p.id} onChange={() => setPickupId(p.id)}>
                        <span className="flex-1">
                          {store?.name ?? p.name}
                          {store && <span className="block text-[13px] text-muted">{store.address.slice(0, 2).join(", ")}</span>}
                          {p.estimate && <span className="block text-[13px] text-muted">{p.estimate}</span>}
                        </span>
                        <span className="font-bold">Gratis</span>
                      </Radio>
                    );
                  })}
                </div>
                <h3 className="mt-6 text-[16px] font-bold text-ink">¿Quién recoge?</h3>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <input aria-label="Nombre" required autoComplete="given-name" placeholder="Nombre" value={pickupContact.firstName} onChange={(e) => setPickupContact({ ...pickupContact, firstName: e.target.value })} className={fieldClass} />
                  <input aria-label="Apellidos" required autoComplete="family-name" placeholder="Apellidos" value={pickupContact.lastName} onChange={(e) => setPickupContact({ ...pickupContact, lastName: e.target.value })} className={fieldClass} />
                  <input aria-label="Teléfono" required type="tel" autoComplete="tel" placeholder="Teléfono / celular" value={pickupContact.phone} onChange={(e) => setPickupContact({ ...pickupContact, phone: e.target.value })} className={`${fieldClass} col-span-2`} />
                </div>
              </div>
            )}
          </section>

          <section className="mt-8">
            <h2 className={h2}>Pago</h2>
            <p className="mt-1 text-[14px] text-muted">Todas las transacciones son seguras y encriptadas.</p>
            <div className="mt-3.5">
              <Radio name="payment" first checked={payment === "yape"} onChange={() => setPayment("yape")}>
                <span className="flex flex-1 items-center gap-2"><Smartphone className="size-4" strokeWidth={1.6} /> Yape / Plin</span>
              </Radio>
              {payment === "yape" && (
                <div className="-mt-px border border-[#dfdfdf] bg-[#f5f5f5] p-4 text-center text-[14px] leading-[1.5] text-muted">
                  Al confirmar, yapea o plinea <strong className="text-ink">{formatPrice(total)}</strong> al <strong className="text-ink">{site.phoneDisplay}</strong> a nombre de{" "}
                  {site.name} y envíanos la captura por WhatsApp. Prepararemos tu pedido en cuanto confirmemos el pago.
                </div>
              )}
              <Radio name="payment" last={payment !== "transfer"} checked={payment === "transfer"} onChange={() => setPayment("transfer")}>
                <span className="flex flex-1 items-center gap-2"><Landmark className="size-4" strokeWidth={1.6} /> Transferencia bancaria</span>
              </Radio>
              {payment === "transfer" && (
                <div className="-mt-px rounded-b-[5px] border border-[#dfdfdf] bg-[#f5f5f5] p-4 text-center text-[14px] leading-[1.5] text-muted">
                  Te enviaremos los datos de la cuenta BCP / Interbank por correo. Tu pedido se procesará al recibir la transferencia.
                </div>
              )}
            </div>
          </section>

          {error && <p role="alert" className="mt-6 rounded-[5px] bg-[#fdecec] px-4 py-3 text-[14px] text-sale">{error}</p>}
          <button disabled={submitting} className="mt-8 h-[52px] w-full rounded-[5px] bg-ocean text-[16px] font-bold text-white hover:bg-ocean-dark disabled:opacity-60">
            {submitting ? "Registrando tu pedido…" : "Confirmar pedido"}
          </button>

          <nav className="mt-10 flex flex-wrap gap-x-4 gap-y-2 border-t border-[#dfdfdf] pt-4 text-[13px]">
            {[
              { label: "Cambios y devoluciones", href: "/terminos-y-condiciones" },
              { label: "Envíos", href: "/opciones-de-envio" },
              { label: "Términos y condiciones", href: "/terminos-y-condiciones" },
              { label: "Libro de reclamaciones", href: "/libro-de-reclamaciones" },
            ].map((l) => (
              <Link key={l.label} href={l.href} className="text-cielo underline underline-offset-2">{l.label}</Link>
            ))}
          </nav>
        </form>
      }
    />
  );
}
