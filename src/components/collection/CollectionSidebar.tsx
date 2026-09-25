"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, ChevronDown, Minus, Plus } from "lucide-react";
import { filterGroups, type FilterKey } from "@/data/collections";
import { categoryTree as buildTree } from "@/lib/catalog/queries";
import { formatPrice } from "@/lib/format";
import { useCatalog } from "../catalog/CatalogProvider";

function SidebarGroup({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-[#dfdfdf] pb-[18px]">
      <button onClick={() => setOpen(!open)} aria-expanded={open} className="flex h-5 w-full items-center justify-between">
        <span className="heading text-[16.5px] leading-5 tracking-normal text-ink">{title}</span>
        {open ? <Minus className="size-[17px] text-ink" strokeWidth={2.2} /> : <Plus className="size-[17px] text-ink" strokeWidth={2.2} />}
      </button>
      {open && <div className="mt-[18px]">{children}</div>}
    </div>
  );
}

function CategoriesBox({ current }: { current: string }) {
  const categoryTree = buildTree(useCatalog());
  const [expanded, setExpanded] = useState<string | null>(
    categoryTree.find((c) => c.children?.some((ch) => ch.slug === current))?.slug ?? null,
  );
  const linkClass = (slug: string) => `block leading-[23px] hover:text-cielo ${slug === current ? "font-bold text-cielo" : ""}`;

  return (
    <ul className="space-y-1.5 rounded-[5px] bg-muted/5 p-5 text-[15px] text-muted shadow-[inset_0_0_0_1px_#dfdfdf]">
      {categoryTree.map((c) => (
        <li key={c.slug}>
          <div className="flex items-center justify-between gap-2">
            <Link href={`/coleccion/${c.slug}`} className={linkClass(c.slug)}>{c.label}</Link>
            {c.children && (
              <button
                onClick={() => setExpanded(expanded === c.slug ? null : c.slug)}
                aria-label={`Ver subcategorías de ${c.label}`}
                aria-expanded={expanded === c.slug}
                className="grid size-6 place-items-center rounded-[5px] border border-muted/15 bg-white"
              >
                <ChevronDown className={`size-3 transition-transform ${expanded === c.slug ? "rotate-180" : ""}`} strokeWidth={1.8} />
              </button>
            )}
          </div>
          {c.children && expanded === c.slug && (
            <ul className="mt-1.5 space-y-1.5 border-l border-[#dfdfdf] pl-4">
              {c.children.map((ch) => (
                <li key={ch.slug}>
                  <Link href={`/coleccion/${ch.slug}`} className={linkClass(ch.slug)}>{ch.label}</Link>
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}

export type PriceRange = { min: string; max: string };

function Checkbox({ checked, disabled, label, count, onChange }: { checked: boolean; disabled?: boolean; label: string; count: number; onChange: () => void }) {
  return (
    <label className={`flex h-[22px] items-center gap-2.5 text-[14px] ${disabled ? "cursor-not-allowed text-muted/60" : "cursor-pointer text-ink"}`}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={onChange} className="peer sr-only" />
      <span className={`grid size-5 shrink-0 place-items-center rounded-[3px] border peer-focus-visible:outline-2 peer-focus-visible:outline-ocean ${checked ? "border-cielo bg-cielo" : "border-[#dfdfdf] bg-white"}`}>
        {checked && <Check className="size-3.5 text-white" strokeWidth={3} />}
      </span>
      <span className="flex-1">{label}</span>
      <span className="pr-[3px] text-[12px] text-muted">{count}</span>
    </label>
  );
}

type Props = {
  current?: string;
  selected: Record<FilterKey, string[]>;
  counts: Record<FilterKey, Record<string, number>>;
  onToggle: (key: FilterKey, value: string) => void;
  availability: { inStock: number; outOfStock: number; selected: string[]; onToggle: (v: string) => void };
  price: { highest: number; range: PriceRange; onChange: (r: PriceRange) => void };
};

export function CollectionSidebar({ current, selected, counts, onToggle, availability, price }: Props) {
  return (
    <aside className="space-y-[18px]">
      {current && (
        <SidebarGroup title="Categorías">
          <CategoriesBox current={current} />
        </SidebarGroup>
      )}

      {filterGroups.map((group) => {
        const options = Object.entries(group.options).filter(([value]) => counts[group.key][value]);
        if (options.length === 0) return null;
        return (
          <SidebarGroup key={group.key} title={group.title}>
            <ul className="space-y-2">
              {options.map(([value, label]) => {
                const checked = selected[group.key].includes(value);
                return (
                  <li key={value}>
                    <Checkbox checked={checked} label={label} count={counts[group.key][value]} onChange={() => onToggle(group.key, value)} />
                  </li>
                );
              })}
            </ul>
          </SidebarGroup>
        );
      })}

      <SidebarGroup title="Disponibilidad">
        <ul className="space-y-2">
          <li>
            <Checkbox checked={availability.selected.includes("disponible")} label="Disponible" count={availability.inStock} onChange={() => availability.onToggle("disponible")} />
          </li>
          <li>
            <Checkbox checked={availability.selected.includes("agotado")} disabled={availability.outOfStock === 0} label="Agotado" count={availability.outOfStock} onChange={() => availability.onToggle("agotado")} />
          </li>
        </ul>
      </SidebarGroup>

      <SidebarGroup title="Precio">
        <p className="text-[14px] text-muted">El precio más alto es {formatPrice(price.highest)}</p>
        <div className="mt-3 flex items-center gap-2.5">
          {(["min", "max"] as const).map((k) => (
            <label key={k} className="flex flex-1 items-center gap-1.5 text-[14px] text-muted">
              S/.
              <input
                type="number"
                min={0}
                inputMode="decimal"
                placeholder={k === "min" ? "Desde" : "Hasta"}
                value={price.range[k]}
                onChange={(e) => price.onChange({ ...price.range, [k]: e.target.value })}
                className="h-[46px] w-full min-w-0 rounded-[5px] border border-[#dfdfdf] bg-white px-3 text-[14px] text-ink focus:outline-2 focus:outline-ocean"
              />
            </label>
          ))}
        </div>
      </SidebarGroup>
    </aside>
  );
}
