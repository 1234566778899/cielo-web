"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, MessageCircle, X } from "lucide-react";
import { site, whatsappUrl } from "@/lib/site";
import { infoNav, mainNav, secondaryNav } from "./nav";

/** Menú hamburguesa (< lg): panel a todo el ancho bajo la fila del header, como la plantilla. */
export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const [top, setTop] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  // Cerrar al navegar.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const toggle = () => {
    if (!open && buttonRef.current) setTop(buttonRef.current.getBoundingClientRect().bottom);
    setOpen(!open);
  };

  const row = "flex min-h-12 items-center border-b border-[#dfdfdf] text-[15px] text-ink";

  return (
    <div className="lg:hidden">
      <button
        ref={buttonRef}
        onClick={toggle}
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={open}
        aria-controls="mobile-menu"
        className={`relative z-[47] grid size-[46px] place-items-center rounded-[5px] border border-ocean/25 ${open ? "bg-mist" : "hover:bg-mist"}`}
      >
        {open ? <X className="size-5" strokeWidth={1.5} /> : <Menu className="size-5" strokeWidth={1.5} />}
      </button>

      {open && (
        <>
          <div aria-hidden onClick={() => setOpen(false)} className="fixed inset-0 z-[45] bg-black/50" />
          <nav id="mobile-menu" aria-label="Menú" style={{ top }} className="fixed inset-x-0 bottom-0 z-[46] overflow-y-auto overscroll-contain bg-white px-5 pt-5 pb-10">
            <ul>
              {mainNav.map((item) => (
                <li key={item.label}>
                  {item.children ? (
                    <>
                      <div className={row}>
                        <button onClick={() => setExpanded(expanded === item.label ? null : item.label)} aria-expanded={expanded === item.label} className="flex-1 self-stretch text-left">
                          {item.label}
                        </button>
                        <button
                          onClick={() => setExpanded(expanded === item.label ? null : item.label)}
                          aria-label={`Ver ${item.label}`}
                          className="grid w-[49px] place-items-center self-stretch border-l border-[#dfdfdf]"
                        >
                          <ChevronDown className={`size-4 transition-transform ${expanded === item.label ? "rotate-180" : ""}`} strokeWidth={1.5} />
                        </button>
                      </div>
                      {expanded === item.label && (
                        <ul className="border-b border-[#dfdfdf] bg-mist py-1.5">
                          {item.children.map((c) => (
                            <li key={c.label}>
                              <Link href={c.href} onClick={() => setOpen(false)} className="block px-4 py-2.5 text-[14px] text-muted hover:text-cielo">
                                {c.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  ) : (
                    <Link href={item.href} onClick={() => setOpen(false)} className={`${row} gap-2`}>
                      {item.label}
                      {item.badge && <span className="rounded-[5px] bg-sun px-1.5 py-0.5 text-[11px] leading-tight text-ink">{item.badge}</span>}
                    </Link>
                  )}
                </li>
              ))}
              {secondaryNav.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} onClick={() => setOpen(false)} className={row}>{l.label}</Link>
                </li>
              ))}
            </ul>

            <ul className="mt-6 space-y-3 text-[14px] text-muted">
              {infoNav.filter((l) => !secondaryNav.some((s) => s.label === l.label)).map((l) => (
                <li key={l.label}>
                  <Link href={l.href} onClick={() => setOpen(false)} className="hover:text-cielo">{l.label}</Link>
                </li>
              ))}
            </ul>

            <a
              href={whatsappUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 flex h-[46px] items-center justify-between rounded-[5px] border border-[#dfdfdf] px-[15px] text-[14px] text-ink"
            >
              <span className="flex items-center gap-2"><MessageCircle className="size-4 text-cielo" strokeWidth={1.6} /> {site.phoneDisplay}</span>
              <span className="text-[12px] text-muted">{site.hours}</span>
            </a>
            <p className="mt-3 flex h-[46px] items-center rounded-[5px] border border-[#dfdfdf] px-[15px] text-[14px] text-ink">{site.currencyLabel}</p>
          </nav>
        </>
      )}
    </div>
  );
}
