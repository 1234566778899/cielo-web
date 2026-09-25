"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { mapEmbedUrl } from "@/data/stores";
import { whatsappUrl } from "@/lib/site";
import { useStores } from "./useStores";

/** Tarjetas de tiendas + mapa; al elegir una tienda el mapa se centra en ella. */
export function StoresMap() {
  const stores = useStores();
  const [active, setActive] = useState<string | null>(null);
  const store = stores.find((s) => s.id === active) ?? stores[0];

  return (
    <section className="container-page">
      <h2 className="heading text-[26px] leading-[1.2] text-ink md:text-[28.6px]">Visita nuestras tiendas</h2>
      <div className="mt-[30px] grid gap-5 lg:grid-cols-2">
        <ul className="grid content-start gap-5 sm:grid-cols-2">
          {stores.map((s) => (
            <li key={s.id}>
              <button
                onClick={() => setActive(s.id)}
                aria-pressed={store?.id === s.id}
                className={`block w-full rounded-[5px] p-[15px] text-left text-[13px] leading-[1.35] text-muted transition-shadow ${store?.id === s.id ? "shadow-[inset_0_0_0_2px_var(--color-cielo)]" : "shadow-[inset_0_0_0_1px_#dfdfdf] hover:shadow-[inset_0_0_0_1px_var(--color-muted)]"}`}
              >
                <MapPin className="size-7 text-cielo" strokeWidth={1.3} />
                <span className="heading mt-3 block text-[15px] tracking-normal text-ink">{s.name}</span>
                <span className="mt-2.5 block">
                  {s.address.map((line) => (
                    <span key={line} className="block">{line}</span>
                  ))}
                </span>
                <span className="mt-2.5 block">{s.phone}</span>
              </button>
            </li>
          ))}
          <li className="sm:col-span-2">
            <a href={whatsappUrl("Hola, quiero información sobre sus tiendas.")} target="_blank" rel="noopener noreferrer" className="text-[14px] text-cielo hover:underline">
              ¿Tienes dudas? Escríbenos por WhatsApp
            </a>
          </li>
        </ul>
        {store && <div className="overflow-hidden rounded-[5px] shadow-[inset_0_0_0_1px_#dfdfdf]">
          <iframe
            key={store.id}
            title={`Mapa de ${store.name}`}
            src={mapEmbedUrl(store.mapQuery)}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-[400px] w-full border-0"
          />
        </div>}
      </div>
    </section>
  );
}
