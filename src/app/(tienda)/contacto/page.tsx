import type { Metadata } from "next";
import { Mail, MessageCircle, Phone, Store } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Features } from "@/components/Features";
import { ContactForm } from "@/components/pages/ContactForm";
import { PageHero } from "@/components/pages/PageHero";
import { StoreCards } from "@/components/pages/StoreCards";
import { SmartImage } from "@/components/SmartImage";
import { img } from "@/lib/images";
import { site, whatsappUrl } from "@/lib/site";

export const metadata: Metadata = { title: "Contacto" };

const channels = [
  { icon: Mail, title: "Escríbenos", text: "Para consultas sobre productos, pedidos y soporte en general.", value: site.email, href: `mailto:${site.email}`, note: "Respondemos en menos de 24 horas." },
  { icon: Phone, title: "Llámanos", text: "Habla directamente con nuestro equipo de atención.", value: site.phoneDisplay, href: whatsappUrl(), note: "Lun–Sáb, 09:00–19:00." },
  { icon: Store, title: "Visítanos", text: "Ven a conocer nuestras flores y regalos en persona.", value: "Av. José Larco 345, Miraflores", href: "/tiendas", note: "Lima, Perú." },
  { icon: MessageCircle, title: "Chat por WhatsApp", text: "¿Necesitas una respuesta rápida mientras compras?", value: "Iniciar conversación", href: whatsappUrl(`Hola ${site.name}, tengo una consulta.`), note: "Disponible en horario de atención." },
];

export default function ContactPage() {
  return (
    <>
      <Breadcrumbs items={[{ label: "Inicio", href: "/" }, { label: "Contacto" }]} />
      <PageHero title="Contacto" subtitle="Siempre felices de ayudarte." image={img("contact-hero")} />

      <section className="container-page mt-[60px] grid gap-[9px] sm:grid-cols-2 lg:grid-cols-4">
        {channels.map(({ icon: Icon, title, text, value, href, note }) => {
          const external = href.startsWith("http");
          return (
            <div key={title} className="rounded-[5px] p-5 shadow-[inset_0_0_0_1px_#dfdfdf]">
              <Icon className="size-8 text-cielo" strokeWidth={1.3} />
              <h2 className="heading mt-3 text-[22px] leading-[26px] tracking-normal text-ink">{title}</h2>
              <p className="mt-1.5 text-[15px] leading-5 text-muted/75">{text}</p>
              <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="mt-4 block text-[15px] leading-5 text-ink hover:text-cielo">
                {value}
              </a>
              <p className="mt-4 text-[15px] leading-5 text-muted/75">{note}</p>
            </div>
          );
        })}
      </section>

      <section className="container-page mt-[60px] grid items-start gap-10 lg:grid-cols-2 lg:gap-[50px]">
        <div>
          <h2 className="heading text-[26px] leading-[1.2] text-ink md:text-[28.6px]">Ponte en contacto</h2>
          <p className="mt-3 mb-6 text-[15px] text-muted">Nos encantaría saber de ti. Envíanos un mensaje y te responderemos lo antes posible.</p>
          <ContactForm />
        </div>
        <div className="relative hidden aspect-[685/620] overflow-hidden rounded-[5px] lg:block">
          <SmartImage src={img("contact-form")} alt="" fill sizes="50vw" className="object-cover" />
        </div>
      </section>

      <div className="mt-[60px]">
        <StoreCards />
      </div>
      <div className="mt-[60px]">
        <Features />
      </div>
    </>
  );
}
