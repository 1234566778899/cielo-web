import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { heroCards } from "@/data/catalog";
import { img } from "@/lib/images";
import { SmartImage } from "./SmartImage";

const bokeh = [
  { top: "10%", left: "42%", size: 60 },
  { top: "8%", left: "50%", size: 180 },
  { top: "35%", left: "48%", size: 90 },
  { top: "5%", left: "80%", size: 140 },
  { top: "40%", left: "88%", size: 220 },
  { top: "60%", left: "62%", size: 160 },
];

function PetalPattern() {
  return (
    <svg className="absolute inset-0 size-full opacity-[0.07]" aria-hidden>
      <defs>
        <pattern id="petals" width="170" height="150" patternUnits="userSpaceOnUse">
          {[
            [30, 40],
            [115, 105],
          ].map(([x, y]) => (
            <g key={x} transform={`translate(${x} ${y}) rotate(${x})`} fill="#fff">
              {[0, 72, 144, 216, 288].map((r) => (
                <ellipse key={r} cx="0" cy="-7" rx="4.5" ry="7" transform={`rotate(${r})`} />
              ))}
            </g>
          ))}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#petals)" />
    </svg>
  );
}

/** Degradado muestreado de la imagen de fondo de la plantilla: lila a la izquierda, brillo rosado detrás del sujeto y azul a la derecha. */
const heroBackground = [
  "radial-gradient(ellipse 22% 60% at 66% 18%, rgba(242,226,252,.9), rgba(242,226,252,0) 70%)",
  "radial-gradient(ellipse 30% 70% at 58% 55%, rgba(216,184,247,.55), rgba(216,184,247,0) 70%)",
  "linear-gradient(90deg, #a479d5 0%, #a97ed8 20%, #af82dd 35%, #c497e8 55%, #c9bdf5 74%, #99b8f1 88%, #86aeee 100%)",
].join(",");

export function Hero() {
  return (
    <section className="relative">
      <div className="absolute inset-x-0 top-0 h-[calc(100%-230px)] overflow-hidden lg:h-[560px]" style={{ background: heroBackground }}>
        <PetalPattern />
        {bokeh.map((b, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-[radial-gradient(circle,rgba(255,255,255,.2),rgba(255,255,255,.04)_70%)]"
            style={{ top: b.top, left: b.left, width: b.size, height: b.size }}
          />
        ))}
        <div className="absolute top-[15px] right-[7%] hidden h-[545px] w-[36%] max-w-[700px] lg:block">
          <SmartImage src={img("hero-bouquet")} alt="" fill priority sizes="36vw" className="object-contain object-top" />
        </div>
      </div>

      <div className="container-page relative pt-16 lg:pt-[140px]">
        <span className="inline-block rounded-full border border-magenta px-[17px] py-[7px] text-[13px] leading-[1.15] text-white">
          Favoritos
        </span>
        <h1 className="heading mt-7 max-w-[820px] text-[32px] leading-[1.18] text-white md:text-[40px]">
          Detalles que duran para siempre
        </h1>
        <p className="mt-5 max-w-[700px] text-[17px] leading-[1.5] text-white md:text-[19px]">
          Descubre flores artificiales y regalos hechos para sorprender a tu pareja, tus amigos y tu familia.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:mt-[60px] lg:grid-cols-4">
          {heroCards.map((card) => (
            <div key={card.title}>
              <Link href={card.href} className="group relative block aspect-square overflow-hidden rounded-[5px]">
                <SmartImage
                  src={card.image}
                  alt={card.title}
                  fill
                  sizes="(min-width: 1024px) 25vw, 50vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-b from-transparent to-[#4b3f7a]/70" />
                <h2 className="heading absolute bottom-5 left-5 text-[16.5px] tracking-normal text-white">{card.title}</h2>
              </Link>
              <p className="mt-5 text-[14px] leading-[1.4] text-muted">{card.text}</p>
              <Link href={card.href} className="mt-[22px] inline-flex items-center gap-1.5 text-[15px] text-magenta hover:underline">
                {card.cta} <ArrowRight className="size-[15px]" strokeWidth={1.5} />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
