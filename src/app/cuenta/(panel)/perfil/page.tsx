import type { Metadata } from "next";
import { ProfileView } from "@/components/account/ProfileView";

export const metadata: Metadata = { title: "Perfil" };

export default function ProfilePage() {
  return <ProfileView />;
}
