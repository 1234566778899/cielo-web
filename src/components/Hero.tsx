import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { heroCards } from "@/data/catalog";
import { img } from "@/lib/images";
import { SmartImage } from "./SmartImage";

export function Hero() {
  return (
    <section className="relative">
      <div className="absolute inset-x-0 top-0 h-[calc(100%-230px)] overflow-hidden bg-ocean lg:h-[560px]">
        {/* Es el elemento LCP en móvil: se precarga con prioridad alta. */}
        <SmartImage
          src={img("hero-mujer")}
          alt=""
          fill
          preload
          fetchPriority="high"
          sizes="100vw"
          className="object-cover object-[72%_22%] lg:object-[center_12%]"
        />
        {/* Velo azul océano para que el texto blanco se lea: desde arriba en móvil y desde la izquierda en escritorio. */}
        <div className="absolute inset-0 bg-gradient-to-b from-ocean/85 via-ocean/55 to-ocean/10 lg:bg-gradient-to-r lg:from-ocean/85 lg:via-ocean/35 lg:to-transparent" />
      </div>

      <div className="container-page relative pt-16 lg:pt-[140px]">
        <span className="inline-block rounded-full border border-sun px-[17px] py-[7px] text-[13px] leading-[1.15] text-white">
          Favoritos
        </span>
        <h1 className="heading mt-7 max-w-[820px] text-[32px] leading-[1.18] text-white md:text-[40px]">
          Detalles que duran para siempre
        </h1>
        <p className="mt-5 max-w-[700px] text-[17px] leading-[1.5] text-white md:text-[19px]">
          Descubre flores artificiales y regalos hechos para sorprender a tu pareja, tus amigos y tu familia.
        </p>

        {/* Móvil: carrusel horizontal con la siguiente tarjeta asomando, como la plantilla. */}
        <div className="-mx-5 mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:mt-[60px] lg:grid-cols-4">
          {heroCards.map((card, i) => (
            <div key={card.title} className="w-[85%] shrink-0 snap-start scroll-ml-5 sm:w-auto">
              <Link href={card.href} className="group relative block aspect-square overflow-hidden rounded-[5px]">
                <SmartImage
                  src={card.image}
                  alt=""
                  fill
                  preload={i === 0}
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 85vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-b from-transparent to-[#023f60]/70" />
                <h2 className="heading absolute bottom-5 left-5 text-[16.5px] tracking-normal text-white">{card.title}</h2>
              </Link>
              <p className="mt-5 text-[14px] leading-[1.4] text-muted">{card.text}</p>
              <Link href={card.href} className="mt-[22px] inline-flex items-center gap-1.5 text-[15px] text-cielo hover:underline">
                {card.cta} <ArrowRight className="size-[15px]" strokeWidth={1.5} />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
