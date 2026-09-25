import { SmartImage } from "../SmartImage";

/** Banner a todo lo ancho con título centrado (Contacto). */
export function PageHero({ title, subtitle, image }: { title: string; subtitle?: string; image: string }) {
  return (
    <section className="relative grid h-[320px] place-items-center overflow-hidden text-center text-white lg:h-[480px]">
      <SmartImage src={image} alt="" fill priority sizes="100vw" className="object-cover" />
      <div className="absolute inset-0 bg-black/35" />
      <div className="relative px-5">
        <h1 className="heading text-[32px] leading-[1.18] md:text-[39.6px]">{title}</h1>
        {subtitle && <p className="mt-3 text-[17px] md:text-[19px]">{subtitle}</p>}
      </div>
    </section>
  );
}
