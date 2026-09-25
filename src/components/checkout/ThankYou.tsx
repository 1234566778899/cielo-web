"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/format";
import { readLastOrder } from "@/lib/orders";
import type { Order } from "@/lib/types";
import { site, whatsappUrl } from "@/lib/site";
import { useAccount } from "../account/AccountProvider";
import { CheckoutShell } from "./CheckoutShell";
import { OrderSummary } from "./OrderSummary";

export function ThankYou({ orderId }: { orderId: string }) {
  const { customer, orders } = useAccount();
  const [last, setLast] = useState<Order | null | undefined>(undefined);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- leer sessionStorage tras el montaje
    setLast(readLastOrder());
  }, []);
  // El invitado no puede leer pedidos de Supabase: se usa el resumen guardado al comprar.
  const order = orders.find((o) => String(o.number) === orderId) ?? (last && String(last.number) === orderId ? last : undefined);
  const ready = last !== undefined;

  if (!ready) return <div className="h-screen animate-pulse bg-[#f5f5f5]" />;
  if (!order) {
    return (
      <CheckoutShell
        main={
          <div className="py-16 text-center">
            <h1 className="text-[21px] font-bold text-ink">No encontramos este pedido</h1>
            <Link href="/" className="mt-4 inline-block text-[14px] text-magenta hover:underline">Volver a la tienda</Link>
          </div>
        }
        summary={null}
      />
    );
  }

  const name = order.delivery.method === "envio" ? order.delivery.address.firstName : customer?.firstName;
  const box = "rounded-[5px] border border-[#dfdfdf] p-4";

  return (
    <CheckoutShell
      summary={<OrderSummary lines={order.lines} shipping={order.shipping} discount={order.discount} />}
      main={
        <div className="text-[14px] leading-[1.5] text-muted">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="size-11 shrink-0 text-magenta" strokeWidth={1.3} />
            <div>
              <p className="text-[13px]">Pedido #{order.number}</p>
              <h1 className="text-[21px] font-bold leading-tight text-ink">¡Gracias{name ? `, ${name}` : ""}!</h1>
            </div>
          </div>

          <section className={`${box} mt-6`}>
            <h2 className="text-[16px] font-bold text-ink">Tu pedido está confirmado</h2>
            <p className="mt-1">
              Te enviamos la confirmación a <strong className="text-ink">{order.email}</strong>.{" "}
              {order.paymentProvider === "yape" && (
                <>
                  Recuerda yapear o plinear <strong className="text-ink">{formatPrice(order.total)}</strong> al {site.phoneDisplay} y enviarnos la captura.
                </>
              )}
              {order.paymentProvider === "transfer" && <>Te enviaremos los datos bancarios para la transferencia de {formatPrice(order.total)}.</>}
              {order.paymentProvider === "card" && <>En breve te enviaremos el link de pago con tarjeta por {formatPrice(order.total)}.</>}
            </p>
            <a
              href={whatsappUrl(`Hola, acabo de hacer el pedido #${order.number}.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-grid h-10 place-items-center rounded-[5px] bg-magenta px-4 text-[13px] font-bold text-white hover:bg-magenta-dark"
            >
              Escribirnos por WhatsApp
            </a>
          </section>

          <section className={`${box} mt-4 grid gap-4 sm:grid-cols-2`}>
            <div>
              <h3 className="font-bold text-ink">Contacto</h3>
              <p>{order.email}</p>
            </div>
            <div>
              <h3 className="font-bold text-ink">Pago</h3>
              <p>{order.payment} · {formatPrice(order.total)}</p>
            </div>
            <div>
              <h3 className="font-bold text-ink">{order.delivery.method === "envio" ? "Dirección de envío" : "Recojo en tienda"}</h3>
              {order.delivery.method === "envio" ? (
                <p>
                  {order.delivery.address.firstName} {order.delivery.address.lastName}
                  <br />
                  {order.delivery.address.address1}
                  <br />
                  {order.delivery.address.district}, {order.delivery.address.department}
                </p>
              ) : (
                <p>
                  {order.delivery.storeName}
                  <br />
                  {order.delivery.storeAddress}
                </p>
              )}
            </div>
            {order.delivery.method === "envio" && (
              <div>
                <h3 className="font-bold text-ink">Método de envío</h3>
                <p>{order.delivery.label}</p>
              </div>
            )}
          </section>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <p>
              ¿Necesitas ayuda?{" "}
              <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer" className="text-magenta underline underline-offset-2">Contáctanos</a>
            </p>
            <div className="flex gap-3">
              {customer && customer.email === order.email && (
                <Link href={`/cuenta/pedidos/${order.id}`} className="grid h-11 place-items-center rounded-[5px] border border-[#dfdfdf] px-5 text-[14px] font-bold text-ink hover:border-ink">
                  Ver pedido
                </Link>
              )}
              <Link href="/" className="grid h-11 place-items-center rounded-[5px] bg-navy px-5 text-[14px] font-bold text-white hover:bg-navy-dark">
                Seguir comprando
              </Link>
            </div>
          </div>
        </div>
      }
    />
  );
}
