import Link from "next/link";
import { img } from "@/lib/images";
import { SmartImage } from "./SmartImage";

export type Banner = { title: string; text?: string; image: string; href: string };

const homeBanners: Banner[] = [
  { title: "Elegancia que no se marchita", text: "Arreglos de rosas y orquídeas para decorar cualquier espacio.", image: img("promo-elegancia"), href: "/coleccion/arreglos" },
  { title: "¡Que empiece la celebración!", text: "Encuentra globos, peluches y cajas sorpresa para cumpleaños y aniversarios.", image: img("promo-celebra"), href: "/coleccion/regalos" },
];

/** Cuadrícula de 2 banners (460 / 940) con franja translúcida inferior. */
export function PromoBanners({ banners = homeBanners, heightClass = "lg:h-[460px]" }: { banners?: Banner[]; heightClass?: string }) {
  return (
    <section className="container-page grid gap-5 lg:grid-cols-[460fr_940fr]">
      {banners.map((b) => (
        <Link key={b.title} href={b.href} className={`group relative block h-[300px] overflow-hidden rounded-[5px] ${heightClass}`}>
          <SmartImage src={b.image} alt={b.title} fill sizes="(min-width: 1024px) 66vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
          <div className="absolute inset-x-0 bottom-0 bg-black/25 px-[25px] py-5 backdrop-blur-[4.6px]">
            <h2 className="heading text-[20.9px] leading-[1.1] text-white">{b.title}</h2>
            {b.text && <p className="mt-2.5 text-[14px] text-white">{b.text}</p>}
          </div>
        </Link>
      ))}
    </section>
  );
}
