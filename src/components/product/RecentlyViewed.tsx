"use client";

import { useEffect, useState } from "react";
import { getProduct } from "@/lib/catalog/queries";
import { useCatalog } from "../catalog/CatalogProvider";
import { ProductCard } from "../ProductCard";

const STORAGE_KEY = "cielo-recently-viewed";
const MAX_ITEMS = 5;

type Entry = { slug: string; viewedAt: number };

const read = (): Entry[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
};

const write = (entries: Entry[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {}
};

const rtf = new Intl.RelativeTimeFormat("es-PE", { numeric: "auto" });

function timeAgo(ts: number) {
  const minutes = Math.round((Date.now() - ts) / 60000);
  if (minutes < 60) return rtf.format(-minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (hours < 24) return rtf.format(-hours, "hour");
  return rtf.format(-Math.round(hours / 24), "day");
}

/** Registra el producto actual y muestra los vistos antes (guardados en este navegador). */
export function RecentlyViewed({ currentSlug }: { currentSlug: string }) {
  const catalog = useCatalog();
  const [entries, setEntries] = useState<Entry[]>([]);

  useEffect(() => {
    const previous = read().filter((e) => e.slug !== currentSlug);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- leer localStorage tras el montaje
    setEntries(previous);
    write([{ slug: currentSlug, viewedAt: Date.now() }, ...previous].slice(0, MAX_ITEMS + 1));
  }, [currentSlug]);

  const dismiss = (slug: string) => {
    setEntries((prev) => prev.filter((e) => e.slug !== slug));
    write(read().filter((e) => e.slug !== slug));
  };

  const items = entries.flatMap((e) => {
    const product = getProduct(catalog, e.slug);
    return product ? [{ ...e, product }] : [];
  }).slice(0, MAX_ITEMS);

  if (items.length === 0) return null;

  return (
    <section className="container-page mt-[60px]">
      <h2 className="heading text-[26px] leading-[1.2] text-ink md:text-[28.6px]">Vistos recientemente</h2>
      <div className="mt-[30px] grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {items.map(({ product, viewedAt }) => (
          <ProductCard
            key={product.id}
            product={product}
            footer={
              <div className="mt-4 flex items-center justify-between text-[13px] text-muted">
                <span>{timeAgo(viewedAt)}</span>
                <button onClick={() => dismiss(product.slug)} className="text-magenta underline underline-offset-4">Descartar</button>
              </div>
            }
          />
        ))}
      </div>
    </section>
  );
}
