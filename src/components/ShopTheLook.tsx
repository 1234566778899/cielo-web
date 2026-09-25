"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { img } from "@/lib/images";
import type { Product } from "@/lib/types";
import { SectionHeading } from "./SectionHeading";
import { SmartImage } from "./SmartImage";

// Sobre la foto look-sala: caja de regalo, ramo y peluche.
const positions = [
  { top: "72%", left: "62%" },
  { top: "34%", left: "45%" },
  { top: "60%", left: "80%" },
];

/** Foto con puntos que muestran los productos de la escena (hasta 3). */
export function ShopTheLook({ products }: { products: (Product | undefined)[] }) {
  const [active, setActive] = useState<number | null>(null);
  const hotspots = products.flatMap((product, i) => (product && positions[i] ? [{ ...positions[i], product }] : []));

  return (
    <section className="container-page">
      <SectionHeading title="Arma el regalo perfecto" />
      <div className="relative mt-[30px] aspect-[4/3] overflow-hidden rounded-[5px] md:aspect-auto md:h-[650px]">
        <SmartImage src={img("look-sala")} alt="Sala decorada con flores y regalos" fill sizes="100vw" className="object-cover" />
        {hotspots.map((h, i) => (
          <div key={h.product.id} className="absolute" style={{ top: h.top, left: h.left }}>
            <button
              onClick={() => setActive(active === i ? null : i)}
              aria-label={`Ver ${h.product.name}`}
              className="relative grid size-[34px] -translate-1/2 place-items-center rounded-full bg-cielo text-white shadow-lg transition-transform hover:scale-110"
            >
              <span className="absolute inset-0 animate-ping rounded-full bg-cielo/50" />
              <Plus className={`relative size-4 transition-transform ${active === i ? "rotate-45" : ""}`} />
            </button>
            {active === i && (
              <Link
                href={`/producto/${h.product.slug}`}
                className="absolute bottom-8 left-1/2 flex w-64 -translate-x-1/2 items-center gap-3 rounded-[5px] bg-white p-3 shadow-xl"
              >
                <span className="relative size-16 shrink-0">
                  <SmartImage src={h.product.image} alt="" fill sizes="64px" className="object-contain" />
                </span>
                <span>
                  <span className="block text-[14px] leading-tight text-ink">{h.product.name}</span>
                  <span className="mt-1 block text-[15px] text-ocean">{formatPrice(h.product.price)}</span>
                </span>
              </Link>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
