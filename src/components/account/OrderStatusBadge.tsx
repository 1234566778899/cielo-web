import type { OrderStatus } from "@/lib/types";

export const statusLabel: Record<OrderStatus, string> = {
  confirmado: "Confirmado",
  "en-preparacion": "En preparación",
  enviado: "En camino",
  entregado: "Entregado",
  "listo-para-recoger": "Listo para recoger",
  cancelado: "Cancelado",
};

const tone: Record<OrderStatus, string> = {
  confirmado: "bg-[#e6f1fa] text-ocean",
  "en-preparacion": "bg-[#fff6d6] text-[#7a5a00]",
  enviado: "bg-[#e6f1ff] text-[#1c5aa6]",
  entregado: "bg-[#e7ffd9] text-[#2d7a00]",
  "listo-para-recoger": "bg-mist text-cielo",
  cancelado: "bg-[#f1f1f1] text-muted",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`inline-flex h-6 items-center rounded-full px-2.5 text-[12px] font-bold ${tone[status]}`}>{statusLabel[status]}</span>;
}
