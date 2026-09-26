import Link from "next/link";
import { ChevronDown, Smartphone, User } from "lucide-react";
import { site, whatsappUrl } from "@/lib/site";
import { HeaderCart } from "./cart/HeaderCart";
import { HeaderSearch } from "./search/HeaderSearch";
import { Logo } from "./Logo";
import { MobileMenu } from "./MobileMenu";
import { mainNav as nav, secondaryNav } from "./nav";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-ocean/10 bg-white text-ocean lg:border-b-0">
      <div className="container-page">
        {/* Móvil: menú + logo + cuenta/carrito y el buscador en una segunda fila. */}
        <div className="flex flex-wrap items-center gap-x-2.5 pt-5 pb-[21px] md:h-[81px] md:flex-nowrap md:gap-6 md:pt-[15px] md:pb-0 lg:gap-[45px]">
          <MobileMenu />
          <Logo className="h-[30px] sm:h-11 md:h-[50px]" preload />
          <HeaderSearch className="order-last mt-1.5 w-full md:order-none md:mt-0 md:w-auto md:flex-1" />
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
          {/* En móvil la lupa (HeaderSearch) empuja este grupo a la derecha y "Mi cuenta" pasa al menú hamburguesa. */}
          <div className="flex items-center gap-2.5 md:ml-auto xl:ml-0">
            <Link href="/cuenta" aria-label="Mi cuenta" className="hidden size-[46px] place-items-center rounded-[5px] border border-ocean/25 hover:bg-mist md:grid">
              <User className="size-5" strokeWidth={1.4} />
            </Link>
            <HeaderCart />
          </div>
        </div>
      </div>
      {/* Menú principal en una franja celeste, bajo el logo. */}
      <div className="hidden bg-cielo text-white lg:block">
        <nav className="container-page flex h-[57px] items-center justify-between text-[15px] uppercase">
          <ul className="flex items-center gap-5">
            {nav.map((item) => (
              <li key={item.label} className="group relative">
                {item.badge && (
                  <span className="absolute -top-[19px] left-1/2 -translate-x-1/2 rounded-[5px] bg-sun px-1.5 py-0.5 text-[11px] leading-tight text-ink after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-x-4 after:border-t-4 after:border-x-transparent after:border-t-sun">
                    {item.badge}
                  </span>
                )}
                {item.children ? (
                  <>
                    <button className="flex items-center gap-0.5 uppercase hover:opacity-80" aria-haspopup="true">
                      {item.label}
                      <ChevronDown className="size-3.5" strokeWidth={1.5} />
                    </button>
                    {/* Submenú al pasar el mouse o con el foco del teclado. */}
                    <ul className="invisible absolute top-full left-0 z-10 min-w-[220px] rounded-[5px] bg-white py-2 text-[14px] normal-case text-ink opacity-0 shadow-[0_8px_30px_rgba(0,0,0,.15)] transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                      {item.children.map((c) => (
                        <li key={c.label}>
                          <Link href={c.href} className="block px-4 py-2 hover:bg-mist hover:text-cielo">{c.label}</Link>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <Link href={item.href} className="flex items-center gap-0.5 hover:opacity-80">
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
          <ul className="flex gap-5">
            {secondaryNav.map((l) => (
              <li key={l.label}><Link href={l.href}>{l.label}</Link></li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
