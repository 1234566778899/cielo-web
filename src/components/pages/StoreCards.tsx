"use client";

import { directionsUrl } from "@/data/stores";
import { useStores } from "./useStores";
import { SectionHeading } from "../SectionHeading";
import { SmartImage } from "../SmartImage";

/** "Visita nuestras tiendas": tarjetas con foto, datos y botón "Cómo llegar". */
export function StoreCards() {
  const stores = useStores();
  return (
    <section className="container-page">
      <SectionHeading title="Visita nuestras tiendas" subtitle="Flores, detalles y sorpresas, todo en un solo lugar." />
      <div className="mt-[30px] grid gap-5 lg:grid-cols-2">
        {stores.map((s) => (
          <article key={s.id} className="flex gap-4 rounded-[5px] p-[13px] shadow-[inset_0_0_0_1px_#dfdfdf] sm:gap-[15px]">
            <div className="relative aspect-[235/245] w-[40%] max-w-[235px] shrink-0 overflow-hidden rounded-[5px]">
              <SmartImage src={s.image} alt={s.name} fill sizes="235px" className="object-cover" />
              {s.badge && <span className="absolute top-[13px] right-[13px] rounded-[3px] bg-sun px-2.5 py-1 text-[12px] leading-none text-ink">{s.badge}</span>}
            </div>
            <div className="flex flex-col justify-center py-2 text-[13px] leading-[1.5] text-muted">
              <h3 className="heading text-[19.8px] tracking-normal text-ink">{s.name}</h3>
              <p className="mt-2.5">{s.address.join(", ")}</p>
              <p className="mt-3">{s.phone}</p>
              <p className="mt-3">{s.hours}</p>
              <a href={directionsUrl(s.mapQuery)} target="_blank" rel="noopener noreferrer" className="mt-4 inline-grid h-10 w-fit place-items-center rounded-[5px] bg-ocean px-[18px] text-[13px] font-bold text-white hover:bg-ocean-dark">
                Cómo llegar
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
