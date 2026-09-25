import type { Metadata } from "next";
import { OrderDetail } from "@/components/account/OrderDetail";

export const metadata: Metadata = { title: "Detalle del pedido" };

export default async function OrderPage(props: PageProps<"/cuenta/pedidos/[id]">) {
  const { id } = await props.params;
  return <OrderDetail id={id} />;
}
