"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { ChevronRight, Search, X } from "lucide-react";
import { formatPrice, normalize } from "@/lib/format";
import { searchProducts, searchSuggestions } from "@/lib/catalog/queries";
import { useCatalog } from "../catalog/CatalogProvider";
import { SmartImage } from "../SmartImage";

/** Resalta en negrita lo que NO escribió el usuario, como el buscador predictivo de la plantilla. */
function Highlight({ text, query }: { text: string; query: string }) {
  const i = normalize(text).indexOf(normalize(query.trim()));
  if (i < 0 || !query.trim()) return <strong className="font-bold text-ink">{text}</strong>;
  const end = i + query.trim().length;
  return (
    <>
      {i > 0 && <strong className="font-bold text-ink">{text.slice(0, i)}</strong>}
      {text.slice(i, end)}
      {end < text.length && <strong className="font-bold text-ink">{text.slice(end)}</strong>}
    </>
  );
}

export function HeaderSearch({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  // Móvil (< md): solo se ve la lupa; al tocarla se despliega el campo bajo la fila del header.
  const [expanded, setExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const deferred = useDeferredValue(query);
  const wrapperRef = useRef<HTMLFormElement>(null);

  const q = deferred.trim();
  const catalog = useCatalog();
  const products = useMemo(() => searchProducts(catalog, q).slice(0, 8), [catalog, q]);
  const suggestions = useMemo(() => searchSuggestions(catalog, q), [catalog, q]);
  const showPanel = open && q.length > 0;

  useEffect(() => {
    if (!showPanel) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => !wrapperRef.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [showPanel]);

  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setExpanded(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [expanded]);

  const go = (href: string) => {
    setOpen(false);
    setExpanded(false);
    router.push(href);
  };

  const toggle = () => {
    if (expanded) {
      setExpanded(false);
      setOpen(false);
    } else {
      // Mostrar y enfocar en el mismo toque: iOS solo abre el teclado si el foco llega dentro del gesto.
      flushSync(() => setExpanded(true));
      inputRef.current?.focus();
    }
  };
  const resultsHref = `/buscar?q=${encodeURIComponent(query.trim())}`;

  return (
    <>
      {showPanel && <div aria-hidden className="fixed inset-0 z-[1] bg-black/50" />}
      <button
        type="button"
        onClick={toggle}
        aria-label={expanded ? "Cerrar búsqueda" : "Buscar"}
        aria-expanded={expanded}
        aria-controls="header-search"
        className={`relative z-[2] ml-auto grid size-[46px] shrink-0 place-items-center rounded-[5px] border border-ocean/25 md:hidden ${expanded ? "bg-mist" : "hover:bg-mist"}`}
      >
        {expanded ? <X className="size-5" strokeWidth={1.5} /> : <Search className="size-5" strokeWidth={1.5} />}
      </button>
      <form
        id="header-search"
        ref={wrapperRef}
        role="search"
        action="/buscar"
        onSubmit={(e) => {
          e.preventDefault();
          if (query.trim()) go(resultsHref);
        }}
        className={`relative z-[2] ${expanded ? "" : "max-md:hidden"} ${className}`}
      >
        <input
          ref={inputRef}
          type="search"
          name="q"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showPanel}
          aria-controls="predictive-search"
          placeholder="Buscar productos"
          className={`h-[46px] w-full border border-ocean/30 bg-white pr-14 pl-4 text-[14px] text-ink placeholder:text-[#6b6b6b] focus:outline-none [&::-webkit-search-cancel-button]:hidden ${showPanel ? "rounded-t-[5px]" : "rounded-[5px] focus:outline-2 focus:outline-ocean"}`}
        />
        {query && (
          <button type="button" onClick={() => setQuery("")} aria-label="Borrar búsqueda" className="absolute top-1/2 right-12 -translate-y-1/2 text-muted hover:text-ink">
            <X className="size-4" />
          </button>
        )}
        <button type="submit" aria-label="Buscar" className="absolute top-1/2 right-1.5 grid size-10 -translate-y-1/2 place-items-center text-ink">
          <Search className="size-[22px]" strokeWidth={1.5} />
        </button>

        {showPanel && (
          <div id="predictive-search" className="absolute inset-x-0 top-full overflow-hidden rounded-b-[5px] bg-white text-ink shadow-[0_10px_30px_rgba(0,0,0,.15)]">
            {products.length === 0 && suggestions.collections.length === 0 ? (
              <p className="px-[15px] py-6 text-[15px] text-muted">No se encontraron resultados para “{q}”.</p>
            ) : (
              <div className="grid max-h-[calc(100vh-220px)] overflow-y-auto md:grid-cols-[279px_minmax(0,1fr)]">
                <div className="px-[15px] pb-4">
                  <h3 className="heading flex h-[41px] items-end border-b border-[#dfdfdf] pb-[5px] text-[16.5px] tracking-normal">Sugerencias</h3>
                  <ul className="mt-2.5">
                    {suggestions.phrases.map((s) => (
                      <li key={s}>
                        <button type="button" onClick={() => { setQuery(s); go(`/buscar?q=${encodeURIComponent(s)}`); }} className="block w-full py-1.5 text-left text-[15px] leading-5 text-muted hover:text-cielo">
                          <Highlight text={s} query={q} />
                        </button>
                      </li>
                    ))}
                    {suggestions.collections.map((c) => (
                      <li key={c.slug}>
                        <Link href={`/coleccion/${c.slug}`} onClick={() => setOpen(false)} className="block py-1.5 text-[15px] leading-5 text-muted hover:text-cielo">
                          {c.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="px-[15px] pb-4">
                  <h3 className="heading flex h-[41px] items-end border-b border-[#dfdfdf] pb-[5px] text-[16.5px] tracking-normal">Productos</h3>
                  {products.length === 0 ? (
                    <p className="mt-4 text-[14px] text-muted">No hay productos para esta búsqueda.</p>
                  ) : (
                    <ul className="mt-[22px] space-y-[15px]">
                      {products.map((p) => (
                        <li key={p.id}>
                          <Link href={`/producto/${p.slug}`} onClick={() => setOpen(false)} className="group flex items-center gap-5">
                            <span className="relative size-[54px] shrink-0 rounded-[5px] shadow-[inset_0_0_0_1px_#dfdfdf]">
                              <SmartImage src={p.image} alt="" fill sizes="54px" className="object-contain p-1" />
                            </span>
                            <span>
                              <span className="block text-[15.4px] leading-[18px] group-hover:underline">{p.name}</span>
                              <span className="mt-1 flex items-baseline gap-1 text-[13px]">
                                <span className={p.compareAtPrice ? "text-sale" : "text-ocean"}>{formatPrice(p.price)}</span>
                                <span className="text-[11px] text-muted">IGV incl.</span>
                                {p.compareAtPrice && <s className="text-muted">{formatPrice(p.compareAtPrice)}</s>}
                              </span>
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
            <Link href={resultsHref} onClick={() => setOpen(false)} className="flex h-10 items-center justify-between border-t border-[#dfdfdf] px-[15px] text-[15px] hover:text-cielo">
              Buscar “{q}”
              <ChevronRight className="size-4" strokeWidth={1.5} />
            </Link>
          </div>
        )}
      </form>
    </>
  );
}
