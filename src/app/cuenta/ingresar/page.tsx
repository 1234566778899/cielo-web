import type { Metadata } from "next";
import { LoginFlow } from "@/components/account/LoginFlow";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default function LoginPage() {
  return <LoginFlow />;
}
