"use client";

import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { formatDate } from "@/lib/peru";
import { SmartImage } from "../SmartImage";
import { useAccount } from "./AccountProvider";
import { OrderStatusBadge } from "./OrderStatusBadge";

export function OrdersList() {
  const { orders, customer } = useAccount();

  return (
    <>
      <h1 className="heading text-[28px] leading-tight text-ink">Pedidos</h1>
      <p className="mt-1 text-[14px] text-muted">Hola{customer?.firstName ? ` ${customer.firstName}` : ""}, aquí puedes ver el estado de tus compras.</p>

      {orders.length === 0 ? (
        <div className="mt-6 rounded-[5px] bg-white px-6 py-16 text-center">
          <p className="heading text-[20px] tracking-normal text-ink">Aún no tienes pedidos</p>
          <p className="mt-2 text-[14px] text-muted">Cuando hagas una compra, la verás aquí.</p>
          <Link href="/" className="mt-5 inline-grid h-11 place-items-center rounded-[5px] bg-navy px-6 text-[14px] font-bold text-white hover:bg-navy-dark">
            Ir a la tienda
          </Link>
        </div>
      ) : (
        <ul className="mt-6 grid gap-5 md:grid-cols-2">
          {orders.map((o) => {
            const count = o.lines.reduce((n, l) => n + l.quantity, 0);
            return (
              <li key={o.id}>
                <Link href={`/cuenta/pedidos/${o.id}`} className="block rounded-[5px] bg-white p-5 transition-shadow hover:shadow-[0_4px_20px_rgba(0,0,0,.08)]">
                  <div className="flex items-center justify-between gap-3">
                    <OrderStatusBadge status={o.status} />
                    <span className="text-[13px] text-muted">{formatDate(o.createdAt)}</span>
                  </div>
                  <div className="mt-4 flex gap-2.5">
                    {o.lines.slice(0, 4).map((l) => (
                      <span key={l.key} className="relative size-20 rounded-[5px] bg-white shadow-[inset_0_0_0_1px_#dfdfdf]">
                        <SmartImage src={l.image} alt={l.name} fill sizes="80px" className="object-contain p-1.5" />
                        {l.quantity > 1 && (
                          <span className="absolute -top-2 -right-2 grid size-5 place-items-center rounded-full bg-ink text-[11px] font-bold text-white">{l.quantity}</span>
                        )}
                      </span>
                    ))}
                  </div>
                  <p className="mt-4 text-[13px] text-muted">{count} {count === 1 ? "artículo" : "artículos"}</p>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-[15px] font-bold text-ink">Pedido #{o.number}</span>
                    <span className="text-[15px] font-bold text-ink">{formatPrice(o.total)}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
