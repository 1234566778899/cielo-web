"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, User } from "lucide-react";
import { whatsappUrl } from "@/lib/site";
import { Logo } from "../Logo";
import { useAccount } from "./AccountProvider";

const nav = [
  { href: "/", label: "Tienda" },
  { href: "/cuenta", label: "Pedidos" },
  { href: "/cuenta/perfil", label: "Perfil" },
];

/** Estructura de las páginas de cuenta: header propio (como las cuentas de la plantilla) y fondo gris. */
export function AccountShell({ children }: { children: React.ReactNode }) {
  const { ready, customer, logout } = useAccount();
  const router = useRouter();
  const pathname = usePathname();
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ready && !customer) router.replace("/cuenta/ingresar");
  }, [ready, customer, router]);

  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => !menuRef.current?.contains(e.target as Node) && setMenu(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menu]);

  const active = (href: string) => (href === "/cuenta" ? pathname === "/cuenta" || pathname.startsWith("/cuenta/pedidos") : pathname === href);
  const initials = customer ? (customer.firstName?.[0] ?? customer.email[0]).toUpperCase() : "";

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f5f5]">
      <header className="border-b border-[#dfdfdf] bg-white">
        <div className="mx-auto flex h-[72px] max-w-[1040px] items-center gap-10 px-5">
          <Logo dark markClassName="text-magenta" size="text-[22px]" />
          <nav className="hidden gap-7 text-[15px] sm:flex">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className={`py-6 ${active(n.href) ? "border-b-2 border-magenta font-bold text-ink" : "text-muted hover:text-ink"}`}>
                {n.label}
              </Link>
            ))}
          </nav>
          {customer && (
            <div ref={menuRef} className="relative ml-auto">
              <button onClick={() => setMenu(!menu)} aria-expanded={menu} className="flex items-center gap-2 rounded-[5px] px-2 py-1.5 hover:bg-muted/5">
                <span className="grid size-8 place-items-center rounded-full bg-magenta text-[14px] font-bold text-white">{initials}</span>
                <ChevronDown className="size-4 text-muted" strokeWidth={1.5} />
              </button>
              {menu && (
                <div className="absolute top-full right-0 z-10 mt-2 w-64 rounded-[5px] bg-white p-2 text-[14px] shadow-[0_8px_30px_rgba(0,0,0,.12)]">
                  <p className="truncate px-3 py-2 text-muted">{customer.email}</p>
                  <Link href="/cuenta/perfil" onClick={() => setMenu(false)} className="flex items-center gap-2 rounded-[5px] px-3 py-2 text-ink hover:bg-muted/5">
                    <User className="size-4" strokeWidth={1.5} /> Perfil
                  </Link>
                  <button
                    onClick={async () => {
                      await logout();
                      router.replace("/");
                    }}
                    className="flex w-full items-center gap-2 rounded-[5px] px-3 py-2 text-ink hover:bg-muted/5"
                  >
                    <LogOut className="size-4" strokeWidth={1.5} /> Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        <nav className="mx-auto flex max-w-[1040px] gap-6 px-5 text-[14px] sm:hidden">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className={`pb-3 ${active(n.href) ? "border-b-2 border-magenta font-bold text-ink" : "text-muted"}`}>
              {n.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="flex-1 py-10">
        <div className="mx-auto w-full max-w-[1040px] px-5">{ready && customer ? children : <div className="h-60 animate-pulse rounded-[5px] bg-white" />}</div>
      </main>

      <footer className="border-t border-[#dfdfdf] bg-white">
        <div className="mx-auto flex h-14 max-w-[1040px] items-center gap-5 px-5 text-[13px]">
          <Link href="#" className="text-magenta hover:underline">Aviso de privacidad</Link>
          <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer" className="text-magenta hover:underline">Ayuda por WhatsApp</a>
        </div>
      </footer>
    </div>
  );
}
