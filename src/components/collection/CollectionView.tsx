"use client";

import { useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, LayoutGrid, List, Rows2, SlidersHorizontal, X } from "lucide-react";
import { filterGroups, type FilterKey } from "@/data/collections";
import type { Product } from "@/lib/types";
import { ProductCard } from "../ProductCard";
import { CollectionSidebar, type PriceRange } from "./CollectionSidebar";
import { ProductRow } from "./ProductRow";

const PAGE_SIZE = 12;

const sorts = {
  "mas-vendidos": { label: "Más vendidos", fn: () => 0 },
  "precio-asc": { label: "Precio: menor a mayor", fn: (a: Product, b: Product) => a.price - b.price },
  "precio-desc": { label: "Precio: mayor a menor", fn: (a: Product, b: Product) => b.price - a.price },
  "nombre-asc": { label: "Nombre: A-Z", fn: (a: Product, b: Product) => a.name.localeCompare(b.name, "es") },
  "nombre-desc": { label: "Nombre: Z-A", fn: (a: Product, b: Product) => b.name.localeCompare(a.name, "es") },
};
type SortKey = keyof typeof sorts;

const views = [
  { key: "grid", label: "Cuadrícula", icon: LayoutGrid },
  { key: "rows", label: "Filas", icon: Rows2 },
  { key: "compact", label: "Filas compactas", icon: List },
] as const;
type View = (typeof views)[number]["key"];

const emptySelection = (): Record<FilterKey, string[]> => ({ occasions: [], recipients: [], colors: [] });

type Props = {
  products: Product[];
  /** Colección actual; si se omite no se muestra el bloque de categorías (búsqueda). */
  slug?: string;
  /** Búsqueda actual: cambia el texto de la barra a "Resultados para …". */
  query?: string;
};

export function CollectionView({ slug, products, query }: Props) {
  const [showFilters, setShowFilters] = useState(true);
  // Móvil/tablet: los filtros van en un panel lateral.
  const [drawer, setDrawer] = useState(false);
  const [selected, setSelected] = useState(emptySelection);
  const [sort, setSort] = useState<SortKey>("mas-vendidos");
  const [view, setView] = useState<View>("grid");
  const [page, setPage] = useState(1);
  const [availability, setAvailability] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<PriceRange>({ min: "", max: "" });
  const topRef = useRef<HTMLDivElement>(null);

  const counts = useMemo(() => {
    const out = {} as Record<FilterKey, Record<string, number>>;
    for (const g of filterGroups) {
      out[g.key] = {};
      for (const p of products) for (const v of p[g.key]) out[g.key][v] = (out[g.key][v] ?? 0) + 1;
    }
    return out;
  }, [products]);

  const filtered = useMemo(() => {
    const min = priceRange.min ? Number(priceRange.min) : -Infinity;
    const max = priceRange.max ? Number(priceRange.max) : Infinity;
    const matches = products.filter(
      (p) =>
        filterGroups.every((g) => selected[g.key].length === 0 || p[g.key].some((v) => selected[g.key].includes(v))) &&
        (availability.length === 0 || availability.includes(p.inStock ? "disponible" : "agotado")) &&
        p.price >= min &&
        p.price <= max,
    );
    return [...matches].sort(sorts[sort].fn);
  }, [products, selected, sort, availability, priceRange]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const visible = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const activeCount = Object.values(selected).flat().length + availability.length + (priceRange.min || priceRange.max ? 1 : 0);

  const clearAll = () => {
    setSelected(emptySelection());
    setAvailability([]);
    setPriceRange({ min: "", max: "" });
    setPage(1);
  };

  const toggle = (key: FilterKey, value: string) => {
    setSelected((s) => ({ ...s, [key]: s[key].includes(value) ? s[key].filter((v) => v !== value) : [...s[key], value] }));
    setPage(1);
  };

  const sidebar = (
        <CollectionSidebar
          current={slug}
          selected={selected}
          counts={counts}
          onToggle={toggle}
          availability={{
            inStock: products.filter((p) => p.inStock).length,
            outOfStock: products.filter((p) => !p.inStock).length,
            selected: availability,
            onToggle: (v) => {
              setAvailability((a) => (a.includes(v) ? a.filter((x) => x !== v) : [...a, v]));
              setPage(1);
            },
          }}
          price={{
            highest: Math.max(0, ...products.map((p) => p.price)),
            range: priceRange,
            onChange: (r) => {
              setPriceRange(r);
              setPage(1);
            },
          }}
        />
  );

  const goTo = (n: number) => {
    setPage(n);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div ref={topRef} className={`container-page grid scroll-mt-[160px] gap-[30px] pt-[25px] ${showFilters ? "lg:grid-cols-[278px_minmax(0,1fr)]" : ""}`}>
      {showFilters && <div className="hidden lg:block">{sidebar}</div>}

      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-label="Filtros">
          <div onClick={() => setDrawer(false)} className="absolute inset-0 bg-black/50" />
          <div className="absolute inset-y-0 left-0 flex w-[88%] max-w-[360px] flex-col bg-white shadow-xl">
            <header className="flex h-16 shrink-0 items-center justify-between bg-cielo px-[15px] text-white">
              <h2 className="heading text-[16.5px]">Filtros</h2>
              <button onClick={() => setDrawer(false)} aria-label="Cerrar filtros" className="grid size-8 place-items-center rounded-[5px] border border-[#dfdfdf] bg-white text-muted">
                <X className="size-4" strokeWidth={1.5} />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto p-5">{sidebar}</div>
            <footer className="grid shrink-0 grid-cols-2 gap-3 border-t border-[#dfdfdf] p-[15px]">
              <button onClick={clearAll} className="h-11 rounded-[5px] border border-[#dfdfdf] text-[14px] text-ink">Limpiar</button>
              <button onClick={() => setDrawer(false)} className="h-11 rounded-[5px] bg-ocean text-[14px] font-bold text-white">Ver {filtered.length} {filtered.length === 1 ? "producto" : "productos"}</button>
            </footer>
          </div>
        </div>
      )}

      <div>
        {/* Móvil/tablet: botón de filtros + orden, como la plantilla. */}
        <div className="rounded-[5px] p-[15px] shadow-[inset_0_0_0_1px_#dfdfdf] lg:hidden">
          <div className="grid grid-cols-2 gap-5">
            <button onClick={() => setDrawer(true)} className="flex h-[46px] items-center justify-center gap-2 rounded-[5px] border border-[#dfdfdf] bg-white text-[14px] text-muted">
              <SlidersHorizontal className="size-4" strokeWidth={1.4} /> Filtros{activeCount > 0 ? ` (${activeCount})` : ""}
            </button>
            <span className="relative">
              <select
                aria-label="Ordenar por"
                value={sort}
                onChange={(e) => { setSort(e.target.value as SortKey); setPage(1); }}
                className="h-[46px] w-full appearance-none rounded-[5px] border border-[#dfdfdf] bg-white pr-8 pl-[15px] text-[14px] text-muted"
              >
                {Object.entries(sorts).map(([key, s]) => (
                  <option key={key} value={key}>{s.label}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 fill-muted text-muted" strokeWidth={1} />
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-[15px] text-ink">
              {query ? `“${query}”: ` : ""}
              {filtered.length} {filtered.length === 1 ? "producto" : "productos"}
            </p>
            {activeCount > 0 && (
              <button onClick={clearAll} className="text-[13px] text-cielo underline underline-offset-4">Limpiar filtros</button>
            )}
          </div>
        </div>

        <div className="relative hidden min-h-[76px] flex-wrap items-center justify-between gap-4 rounded-[5px] px-5 py-3 shadow-[inset_0_0_0_1px_#dfdfdf] lg:flex">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="absolute -top-3.5 left-5 flex h-7 items-center gap-[5px] rounded-[5px] border border-[#dfdfdf] bg-white px-2.5 text-[13px] text-muted hover:text-ink"
          >
            <SlidersHorizontal className="size-4" strokeWidth={1.4} />
            {showFilters ? "Ocultar filtros" : "Mostrar filtros"}
          </button>

          <div className="flex items-center gap-4">
            <p className="text-[15px] font-bold text-ink">
              {query ? `Resultados para “${query}”: ` : ""}
              {filtered.length} {filtered.length === 1 ? "producto" : "productos"}
            </p>
            {activeCount > 0 && (
              <button onClick={clearAll} className="text-[13px] text-cielo underline underline-offset-4">
                Limpiar filtros ({activeCount})
              </button>
            )}
          </div>

          <div className="flex items-center">
            <label className="flex items-center gap-2.5 border-r border-[#dfdfdf] pr-[15px]">
              <span className="text-[15px] font-bold text-ink">Ordenar por:</span>
              <span className="relative">
                <select
                  value={sort}
                  onChange={(e) => { setSort(e.target.value as SortKey); setPage(1); }}
                  className="h-[29px] cursor-pointer appearance-none rounded-[5px] bg-transparent pr-6 [field-sizing:content] text-[15px] text-muted focus:outline-2 focus:outline-ocean"
                >
                  {Object.entries(sorts).map(([key, s]) => (
                    <option key={key} value={key}>{s.label}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute top-1/2 right-0 size-4 -translate-y-1/2 fill-muted text-muted" strokeWidth={1} />
              </span>
            </label>
            <div className="flex items-center gap-2.5 pl-[15px]">
              <span className="text-[15px] font-bold text-ink">Ver como:</span>
              <div className="flex">
                {views.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setView(key)}
                    aria-label={label}
                    aria-pressed={view === key}
                    className={`grid size-[38px] place-items-center rounded-[5px] ${view === key ? "bg-cielo text-white" : "text-ink hover:bg-muted/5"}`}
                  >
                    <Icon className="size-5" strokeWidth={1.3} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="mt-5 rounded-[5px] px-6 py-16 text-center shadow-[inset_0_0_0_1px_#dfdfdf]">
            <p className="text-[15px] text-muted">No hay productos que coincidan con los filtros seleccionados.</p>
            <button onClick={clearAll} className="mt-4 text-[14px] text-cielo underline underline-offset-4">
              Limpiar filtros
            </button>
          </div>
        ) : view === "grid" ? (
          <div className={`mt-5 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 ${showFilters ? "lg:grid-cols-4" : "lg:grid-cols-5"}`}>
            {visible.map((p) => (
              <ProductCard key={p.id} product={p} showSku />
            ))}
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {visible.map((p) => (
              <ProductRow key={p.id} product={p} compact={view === "compact"} />
            ))}
          </div>
        )}

        {pageCount > 1 && (
          <nav aria-label="Paginación" className="mt-[30px] flex justify-center gap-[5px]">
            {current > 1 && (
              <button onClick={() => goTo(current - 1)} aria-label="Página anterior" className="grid size-[42px] place-items-center rounded-[5px] text-ink hover:bg-muted/5">
                <ChevronLeft className="size-4" strokeWidth={1.5} />
              </button>
            )}
            {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => goTo(n)}
                aria-current={n === current ? "page" : undefined}
                className={`grid size-[42px] place-items-center rounded-[5px] text-[15px] ${n === current ? "bg-ocean text-white" : "bg-white text-ink hover:bg-muted/5"}`}
              >
                {n}
              </button>
            ))}
            {current < pageCount && (
              <button onClick={() => goTo(current + 1)} aria-label="Página siguiente" className="grid size-[42px] place-items-center rounded-[5px] text-ink hover:bg-muted/5">
                <ChevronRight className="size-4" strokeWidth={1.5} />
              </button>
            )}
          </nav>
        )}
      </div>
    </div>
  );
}
