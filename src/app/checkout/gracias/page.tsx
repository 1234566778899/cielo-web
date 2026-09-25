import type { Metadata } from "next";
import { ThankYou } from "@/components/checkout/ThankYou";

export const metadata: Metadata = { title: "¡Gracias por tu compra!" };

export default async function ThankYouPage(props: PageProps<"/checkout/gracias">) {
  const { pedido } = await props.searchParams;
  return <ThankYou orderId={(Array.isArray(pedido) ? pedido[0] : pedido) ?? ""} />;
}
