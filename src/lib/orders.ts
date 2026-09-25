import type { Address, Order, OrderLine, OrderStatus, StoreLocation } from "@/lib/types";

export const paymentLabels: Record<string, string> = {
  card: "Tarjeta de crédito o débito (link de pago)",
  yape: "Yape / Plin",
  plin: "Yape / Plin",
  transfer: "Transferencia bancaria",
  cash: "Efectivo",
};

type Json = Record<string, unknown>;

/** Columnas que pide la cuenta del cliente (RLS: solo ve sus propios pedidos). */
export const ORDER_SELECT =
  "id, display_id, status, payment_status, fulfillment_status, email, shipping_address, subtotal, discount_total, shipping_total, tax_total, total, created_at," +
  " order_line_item(id, variant_id, title, subtitle, thumbnail, quantity, unit_price, metadata, product(handle))," +
  " order_shipping_method(name, amount, is_pickup, stock_location_id)," +
  " fulfillment(tracking_company, tracking_number, tracking_url, shipped_at, delivered_at, canceled_at)," +
  " order_transaction(provider, kind, status)";

export type OrderRow = {
  id: string; display_id: number; status: string; payment_status: string; fulfillment_status: string; email: string;
  shipping_address: Json | null; subtotal: number; discount_total: number; shipping_total: number; tax_total: number; total: number; created_at: string;
  order_line_item?: { id: string; variant_id: string | null; title: string; subtitle: string | null; thumbnail: string | null; quantity: number; unit_price: number; metadata: Json; product: { handle: string } | null }[];
  order_shipping_method?: { name: string; amount: number; is_pickup: boolean; stock_location_id: string | null }[];
  fulfillment?: { tracking_company: string | null; tracking_number: string | null; tracking_url: string | null; shipped_at: string | null; delivered_at: string | null; canceled_at: string | null }[];
  order_transaction?: { provider: string; kind: string; status: string }[];
};

const str = (v: unknown) => (typeof v === "string" ? v : "");

export const addressFromJson = (a: Json | null): Omit<Address, "id" | "isDefault"> => ({
  firstName: str(a?.first_name), lastName: str(a?.last_name), address1: str(a?.address_1), reference: str(a?.address_2),
  district: str(a?.district), province: str(a?.province), department: str(a?.department), phone: str(a?.phone),
});

export const addressToJson = (a: Omit<Address, "id" | "isDefault">) => ({
  first_name: a.firstName, last_name: a.lastName, address_1: a.address1, address_2: a.reference || null,
  district: a.district, province: a.province, department: a.department, phone: a.phone, country_code: "pe",
});

function statusOf(row: OrderRow, pickup: boolean): OrderStatus {
  if (row.status === "canceled") return "cancelado";
  switch (row.fulfillment_status) {
    case "delivered": return "entregado";
    case "shipped": return "enviado";
    case "fulfilled": return pickup ? "listo-para-recoger" : "en-preparacion";
    case "partially_fulfilled": return "en-preparacion";
    default: return "confirmado";
  }
}

export function mapOrder(row: OrderRow, locations: StoreLocation[]): Order {
  const method = row.order_shipping_method?.[0];
  const pickup = Boolean(method?.is_pickup);
  const location = locations.find((l) => l.id === method?.stock_location_id);
  const provider = row.order_transaction?.[0]?.provider ?? null;
  const shipped = row.fulfillment?.find((f) => !f.canceled_at && (f.tracking_number || f.tracking_url));

  const lines: OrderLine[] = (row.order_line_item ?? []).map((l) => ({
    key: l.id,
    slug: l.product?.handle ?? null,
    variantId: l.variant_id,
    name: l.title,
    variantTitle: l.subtitle,
    image: l.thumbnail ?? "/images/p-caja-rosas-rojas.svg",
    price: Number(l.unit_price),
    quantity: l.quantity,
    giftWrap: Boolean(l.metadata?.gift_wrap),
  }));

  return {
    id: row.id,
    number: row.display_id,
    createdAt: row.created_at,
    status: statusOf(row, pickup),
    awaitingPayment: row.status !== "canceled" && ["not_paid", "awaiting", "authorized"].includes(row.payment_status),
    lines,
    subtotal: Number(row.subtotal),
    discount: Number(row.discount_total),
    shipping: Number(row.shipping_total),
    total: Number(row.total),
    tax: Number(row.tax_total),
    delivery: pickup
      ? { method: "recojo", storeName: location?.name ?? method?.name ?? "Tienda", storeAddress: location ? `${location.address1}, ${location.district}` : "" }
      : { method: "envio", address: addressFromJson(row.shipping_address), label: method?.name ?? "Envío" },
    payment: provider ? paymentLabels[provider] ?? provider : "Por confirmar",
    paymentProvider: provider,
    email: row.email,
    tracking: shipped ? { company: shipped.tracking_company ?? undefined, number: shipped.tracking_number ?? undefined, url: shipped.tracking_url ?? undefined } : null,
  };
}

// El invitado no puede leer pedidos (RLS), así que la página de gracias usa este resumen.
const LAST_ORDER_KEY = "cielo-last-order";

export const saveLastOrder = (order: Order) => {
  try {
    sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify(order));
  } catch {}
};

export const readLastOrder = (): Order | null => {
  try {
    return JSON.parse(sessionStorage.getItem(LAST_ORDER_KEY) ?? "null");
  } catch {
    return null;
  }
};
