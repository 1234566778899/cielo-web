import { formatPrice } from "@/lib/format";
import type { OrderLine } from "@/lib/types";
import { SmartImage } from "../SmartImage";

/** Resumen lateral: productos con insignia de cantidad, subtotal, envío y total en PEN. */
export function OrderSummary({ lines, shipping, discount = 0, discountLabel, children }: { lines: OrderLine[]; shipping: number | null; discount?: number; discountLabel?: string; children?: React.ReactNode }) {
  const subtotal = lines.reduce((n, l) => n + l.price * l.quantity, 0);
  const count = lines.reduce((n, l) => n + l.quantity, 0);
  const total = Math.max(0, subtotal - discount) + (shipping ?? 0);
  const igv = total - total / 1.18;

  return (
    <div className="text-[14px] text-ink">
      <ul className="space-y-4">
        {lines.map((l) => (
          <li key={l.key} className="flex items-center gap-3.5">
            <span className="relative size-16 shrink-0 rounded-[8px] border border-[#dfdfdf] bg-white">
              <SmartImage src={l.image} alt={l.name} fill sizes="64px" className="rounded-[8px] object-contain p-1" />
              <span className="absolute -top-2 -right-2 grid size-5 place-items-center rounded-full bg-ink text-[11px] font-bold text-white">{l.quantity}</span>
            </span>
            <span className="min-w-0 flex-1 leading-[18px]">
              {l.name}
              {l.variantTitle && <span className="block text-[12px] text-muted">{l.variantTitle}</span>}
              {l.giftWrap && <span className="block text-[12px] text-muted">Envuelto para regalo</span>}
            </span>
            <span>{formatPrice(l.price * l.quantity)}</span>
          </li>
        ))}
      </ul>
      {children}
      <dl className="mt-6 space-y-2">
        <div className="flex justify-between">
          <dt>Subtotal · {count} {count === 1 ? "artículo" : "artículos"}</dt>
          <dd>{formatPrice(subtotal)}</dd>
        </div>
        {discount > 0 && (
          <div className="flex justify-between">
            <dt>Descuento{discountLabel ? ` · ${discountLabel}` : ""}</dt>
            <dd>−{formatPrice(discount)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt>Envío</dt>
          <dd className={shipping === null ? "text-muted" : ""}>{shipping === null ? "Ingresa tu dirección" : shipping === 0 ? "Gratis" : formatPrice(shipping)}</dd>
        </div>
        <div className="flex items-baseline justify-between pt-3 text-[19px] font-bold">
          <dt>Total</dt>
          <dd>
            <span className="mr-1.5 text-[12px] font-normal text-muted">PEN</span>
            {formatPrice(total)}
          </dd>
        </div>
        <p className="text-[12px] text-muted">Incluye {formatPrice(igv)} de IGV</p>
      </dl>
    </div>
  );
}
