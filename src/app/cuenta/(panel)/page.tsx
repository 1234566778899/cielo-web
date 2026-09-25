import type { Metadata } from "next";
import { OrdersList } from "@/components/account/OrdersList";

export const metadata: Metadata = { title: "Pedidos" };

export default function OrdersPage() {
  return <OrdersList />;
}
