import Link from "next/link";
import { categories } from "@/data/catalog";
import { SectionHeading } from "./SectionHeading";
import { SmartImage } from "./SmartImage";

export function ShopByCategory() {
  return (
    <section className="container-page">
      <SectionHeading title="Compra por categoría" subtitle="De ramos eternos a cajas sorpresa, descubre el detalle perfecto para cada ocasión." />
      <ul className="mt-[30px] grid grid-cols-3 gap-x-4 gap-y-8 sm:grid-cols-4 lg:grid-cols-7 lg:gap-[15px]">
        {categories.map((c) => (
          <li key={c.slug}>
            <Link href={`/coleccion/${c.slug}`} className="group block text-center">
              <span className="relative block aspect-square overflow-hidden rounded-full">
                <SmartImage src={c.image} alt={c.name} fill sizes="14vw" className="object-cover transition-transform duration-500 group-hover:scale-110" />
              </span>
              <span className="mt-[15px] block heading text-[15px] tracking-normal text-ink">{c.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
