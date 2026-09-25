"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { formatDate } from "@/lib/peru";
import { whatsappUrl } from "@/lib/site";
import type { OrderStatus } from "@/lib/types";
import { useCart } from "../cart/CartProvider";
import { SmartImage } from "../SmartImage";
import { useAccount } from "./AccountProvider";
import { OrderStatusBadge, statusLabel } from "./OrderStatusBadge";

const shippingSteps: OrderStatus[] = ["confirmado", "en-preparacion", "enviado", "entregado"];
const pickupSteps: OrderStatus[] = ["confirmado", "en-preparacion", "listo-para-recoger", "entregado"];

export function OrderDetail({ id }: { id: string }) {
  const { ready, orders } = useAccount();
  const { add, close } = useCart();
  const router = useRouter();
  const order = orders.find((o) => o.id === id);

  if (!ready) return <div className="h-[400px] animate-pulse rounded-[5px] bg-white" />;
  if (!order) {
    return (
      <div className="rounded-[5px] bg-white px-6 py-16 text-center">
        <p className="heading text-[20px] tracking-normal text-ink">No encontramos este pedido</p>
        <Link href="/cuenta" className="mt-4 inline-block text-[14px] text-cielo hover:underline">Volver a mis pedidos</Link>
      </div>
    );
  }

  const steps = order.delivery.method === "recojo" ? pickupSteps : shippingSteps;
  const current = steps.indexOf(order.status);

  return (
    <>
      <Link href="/cuenta" className="inline-flex items-center gap-1.5 text-[14px] text-muted hover:text-ink">
        <ArrowLeft className="size-4" strokeWidth={1.5} /> Pedidos
      </Link>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="heading text-[28px] leading-tight text-ink">Pedido #{order.number}</h1>
        <OrderStatusBadge status={order.status} />
      </div>
      <p className="mt-1 text-[14px] text-muted">Realizado el {formatDate(order.createdAt)}</p>

      <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          {order.status === "cancelado" ? (
            <section className="rounded-[5px] bg-white p-6 text-[14px] text-muted">Este pedido fue cancelado. Si ya habías pagado, te devolveremos el importe.</section>
          ) : (
          <section className="rounded-[5px] bg-white p-6">
            {order.awaitingPayment && (
              <p className="mb-5 rounded-[5px] bg-[#fff6d6] px-4 py-3 text-[14px] text-[#7a5a00]">
                Estamos esperando la confirmación de tu pago ({order.payment}). Si ya pagaste, envíanos la constancia por WhatsApp.
              </p>
            )}
            <ol className="grid grid-cols-4 gap-2">
              {steps.map((s, i) => (
                <li key={s} className="text-center">
                  <div className="flex items-center">
                    <span className={`h-[3px] flex-1 ${i === 0 ? "invisible" : i <= current ? "bg-stock" : "bg-[#dfdfdf]"}`} />
                    <span className={`grid size-8 place-items-center rounded-full ${i <= current ? "bg-stock text-white" : "bg-[#f0f0f0] text-muted"}`}>
                      {i <= current ? <Check className="size-4" strokeWidth={3} /> : <span className="text-[13px] font-bold">{i + 1}</span>}
                    </span>
                    <span className={`h-[3px] flex-1 ${i === steps.length - 1 ? "invisible" : i < current ? "bg-stock" : "bg-[#dfdfdf]"}`} />
                  </div>
                  <p className={`mt-2 text-[13px] ${i <= current ? "font-bold text-ink" : "text-muted"}`}>{statusLabel[s]}</p>
                </li>
              ))}
            </ol>
            {order.tracking && (
              <p className="mt-5 text-[14px] text-muted">
                Seguimiento: {order.tracking.company} {order.tracking.url ? <a href={order.tracking.url} target="_blank" rel="noopener noreferrer" className="text-cielo underline">{order.tracking.number ?? "ver envío"}</a> : order.tracking.number}
              </p>
            )}
          </section>
          )}

          <section className="rounded-[5px] bg-white p-6">
            <h2 className="heading text-[19.8px] tracking-normal text-ink">Productos</h2>
            <ul className="mt-4 divide-y divide-[#dfdfdf]">
              {order.lines.map((l) => (
                <li key={l.key} className="flex items-center gap-4 py-4">
                  <Link href={l.slug ? `/producto/${l.slug}` : "#"} className="relative size-16 shrink-0 rounded-[5px] shadow-[inset_0_0_0_1px_#dfdfdf]">
                    <SmartImage src={l.image} alt={l.name} fill sizes="64px" className="object-contain p-1.5" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    {l.slug ? <Link href={`/producto/${l.slug}`} className="text-[14px] leading-5 text-ink hover:underline">{l.name}</Link> : <p className="text-[14px] leading-5 text-ink">{l.name}</p>}
                    <p className="text-[13px] text-muted">{l.variantTitle ? `${l.variantTitle} · ` : ""}Cantidad: {l.quantity}{l.giftWrap ? " · Envuelto para regalo" : ""}</p>
                  </div>
                  <p className="text-[14px] text-ink">{formatPrice(l.price * l.quantity)}</p>
                </li>
              ))}
            </ul>
            <dl className="mt-2 space-y-2 border-t border-[#dfdfdf] pt-4 text-[14px]">
              <div className="flex justify-between text-muted"><dt>Subtotal</dt><dd>{formatPrice(order.subtotal)}</dd></div>
              {order.discount > 0 && <div className="flex justify-between text-muted"><dt>Descuento</dt><dd>−{formatPrice(order.discount)}</dd></div>}
              <div className="flex justify-between text-muted"><dt>Envío</dt><dd>{order.shipping === 0 ? "Gratis" : formatPrice(order.shipping)}</dd></div>
              <div className="flex justify-between pt-1 text-[16px] font-bold text-ink"><dt>Total</dt><dd>{formatPrice(order.total)}</dd></div>
              <p className="text-[12px] text-muted">Incluye {formatPrice(order.tax)} de IGV</p>
            </dl>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="rounded-[5px] bg-white p-6 text-[14px] leading-[1.5] text-muted">
            <h2 className="font-bold text-ink">Contacto</h2>
            <p>{order.email}</p>
            <h2 className="mt-4 font-bold text-ink">{order.delivery.method === "envio" ? "Dirección de envío" : "Recojo en tienda"}</h2>
            {order.delivery.method === "envio" ? (
              <p>
                {order.delivery.address.firstName} {order.delivery.address.lastName}
                <br />
                {order.delivery.address.address1}
                <br />
                {order.delivery.address.district}, {order.delivery.address.province}, {order.delivery.address.department}
                <br />
                {order.delivery.address.phone}
              </p>
            ) : (
              <p>
                {order.delivery.storeName}
                <br />
                {order.delivery.storeAddress}
              </p>
            )}
            {order.delivery.method === "envio" && (
              <>
                <h2 className="mt-4 font-bold text-ink">Método de envío</h2>
                <p>{order.delivery.label}</p>
              </>
            )}
            <h2 className="mt-4 font-bold text-ink">Pago</h2>
            <p>{order.payment}</p>
          </section>
          <button
            onClick={() => {
              order.lines.forEach((l) => l.variantId && add(l.variantId, l.quantity, l.giftWrap));
              close();
              router.push("/carrito");
            }}
            className="h-11 w-full rounded-[5px] bg-ocean text-[14px] font-bold text-white hover:bg-ocean-dark"
          >
            Comprar de nuevo
          </button>
          <a
            href={whatsappUrl(`Hola, tengo una consulta sobre mi pedido #${order.number}.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="grid h-11 w-full place-items-center rounded-[5px] border border-[#dfdfdf] bg-white text-[14px] font-bold text-ink hover:border-ink"
          >
            ¿Necesitas ayuda? Escríbenos
          </a>
        </aside>
      </div>
    </>
  );
}
