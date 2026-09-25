import Link from "next/link";
import { ChevronDown, Smartphone, User } from "lucide-react";
import { site, whatsappUrl } from "@/lib/site";
import { HeaderCart } from "./cart/HeaderCart";
import { HeaderSearch } from "./search/HeaderSearch";
import { Logo } from "./Logo";

const nav: { label: string; href: string; dropdown?: boolean; badge?: string }[] = [
  { label: "Flores", href: "/coleccion/flores" },
  { label: "Regalos", href: "/coleccion/regalos", badge: "NUEVO" },
  { label: "Por ocasión", href: "#", dropdown: true },
  { label: "Para quién", href: "#", dropdown: true },
  { label: "Arreglos", href: "/coleccion/arreglos" },
  { label: "Peluches", href: "/coleccion/peluches" },
  { label: "Temporada", href: "#", dropdown: true },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-magenta text-white">
      <div className="container-page">
        <div className="flex h-[81px] items-center gap-6 pt-[15px] lg:gap-[45px]">
          <Logo />
          <HeaderSearch />
          <a
            href={whatsappUrl()}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Escríbenos por WhatsApp al ${site.phoneDisplay}`}
            className="hidden items-center gap-[5px] hover:opacity-85 xl:-ml-5 xl:flex"
          >
            <Smartphone className="size-[30px]" strokeWidth={1.3} />
            <span className="text-[13px] leading-[1.35]">
              <span className="block">{site.phoneDisplay}</span>
              <span className="block text-[12px]">{site.hours}</span>
            </span>
            <ChevronDown className="mb-4 ml-[5px] size-[18px]" strokeWidth={1.5} />
          </a>
          <div className="ml-auto flex items-center gap-2.5 xl:ml-0">
            <Link href="/cuenta" aria-label="Mi cuenta" className="grid size-[46px] place-items-center rounded-[5px] border border-white/30 hover:bg-white/10">
              <User className="size-5" strokeWidth={1.4} />
            </Link>
            <HeaderCart />
          </div>
        </div>
        <nav className="hidden h-[57px] items-center justify-between text-[15px] uppercase lg:flex">
          <ul className="flex items-center gap-5">
            {nav.map((item) => (
              <li key={item.label} className="relative">
                {item.badge && (
                  <span className="absolute -top-[30px] left-1/2 -translate-x-1/2 rounded-[5px] bg-sun px-1.5 py-0.5 text-[11px] leading-tight text-ink after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-x-4 after:border-t-4 after:border-x-transparent after:border-t-sun">
                    {item.badge}
                  </span>
                )}
                <Link href={item.href} className="flex items-center gap-0.5 hover:opacity-80">
                  {item.label}
                  {item.dropdown && <ChevronDown className="size-3.5" strokeWidth={1.5} />}
                </Link>
              </li>
            ))}
          </ul>
          <ul className="flex gap-5">
            <li><Link href="/tiendas">Tiendas</Link></li>
            <li><Link href="/contacto">Contacto</Link></li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
