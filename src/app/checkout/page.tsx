import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";

export const metadata: Metadata = { title: "Checkout | Cielo Online" };

export default function CheckoutPage() {
  return <CheckoutForm />;
}
