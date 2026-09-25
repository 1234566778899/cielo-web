import type { Metadata } from "next";
import { ProfileView } from "@/components/account/ProfileView";

export const metadata: Metadata = { title: "Perfil | Cielo Online" };

export default function ProfilePage() {
  return <ProfileView />;
}
