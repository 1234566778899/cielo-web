import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Features } from "@/components/Features";
import { Marquee } from "@/components/pages/Marquee";
import { StoresMap } from "@/components/pages/StoresMap";
import { SmartImage } from "@/components/SmartImage";
import { img } from "@/lib/images";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Tiendas" };

export default function StoresPage() {
  return (
    <>
      <Breadcrumbs items={[{ label: "Inicio", href: "/" }, { label: "Tiendas" }]} />

      <section className="container-page mt-[70px] grid items-center gap-10 lg:grid-cols-2 lg:gap-[45px]">
        <div className="relative aspect-[622/466] overflow-hidden rounded-[5px]">
          <SmartImage src={img("stores-intro")} alt={`Interior de la tienda ${site.name}`} fill priority sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
        </div>
        <div>
          <span className="inline-block rounded-full border border-cielo px-[17px] py-[7px] text-[13px] leading-[1.15] text-ink">Nuestras tiendas</span>
          <h1 className="heading mt-4 text-[28px] leading-[1.18] text-ink md:text-[33px]">Vive la experiencia {site.name}</h1>
          <p className="mt-5 text-[15px] leading-[1.5] text-muted">
            ¡Bienvenido a nuestro rincón floral! Nuestras tiendas son mucho más que un lugar para comprar: aquí nuestros floristas te ayudan a armar el
            regalo perfecto, puedes ver y tocar la calidad de nuestras flores artificiales y descubrir cajas, peluches y detalles para cada ocasión.
            Ven a visitarnos y déjanos ayudarte a sorprender a quien más quieres.
          </p>
          <h2 className="heading mt-6 text-[20px] tracking-normal text-ink">Horario de atención</h2>
          <p className="mt-3 text-[15px] leading-[1.5] text-muted">
            Lunes – Viernes: 9 AM – 7 PM
            <br />
            Sábado: 10 AM – 8 PM
            <br />
            Domingo: 11 AM – 5 PM
          </p>
        </div>
      </section>

      <div className="mt-[70px]">
        <StoresMap />
      </div>
      <div className="mt-[70px]">
        <Marquee items={["Arreglos personalizados en tienda", "Envoltura de regalo sin costo", "Recoge tu pedido el mismo día"]} />
      </div>
      <div className="mt-[60px]">
        <Features />
      </div>
    </>
  );
}
