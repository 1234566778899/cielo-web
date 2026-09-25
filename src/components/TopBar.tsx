import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { site } from "@/lib/site";
import { SocialIcons } from "./SocialIcons";

const links = [
  { label: "Opciones de envío", href: "#" },
  { label: "Preguntas frecuentes", href: "#" },
  { label: "Nosotros", href: "/tiendas" },
  { label: "Contacto", href: "/contacto" },
];

export function TopBar() {
  return (
    <div className="hidden bg-navy text-white md:block">
      <div className="container-page flex h-[45px] items-center justify-between text-[15px]">
        <nav className="flex gap-4">
          {links.map((l) => (
            <Link key={l.label} href={l.href} className="hover:underline">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-10">
          <button className="flex items-center gap-1">
            {site.currencyLabel} <ChevronDown className="size-3.5" strokeWidth={1.5} />
          </button>
          <SocialIcons />
        </div>
      </div>
    </div>
  );
}
