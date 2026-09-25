import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { site, whatsappUrl } from "@/lib/site";
import { ComplaintBookIcon } from "./ComplaintBookIcon";
import { Logo } from "./Logo";
import { PaymentIcons } from "./PaymentIcons";
import { SocialIcons } from "./SocialIcons";

const toLinks = (labels: string[]) => labels.map((label) => ({ label, href: "#" }));

const columns = [
  { title: "Enlaces útiles", links: [{ label: "Cambios y devoluciones", href: "/preguntas-frecuentes" }, { label: "Opciones de envío", href: "/opciones-de-envio" }, { label: "Preguntas frecuentes", href: "/preguntas-frecuentes" }, ...toLinks(["Aviso de privacidad"]), { label: "Términos y condiciones", href: "/terminos-y-condiciones" }] },
  {
    title: "Categorías populares",
    links: [
      { label: "Rosas", href: "/coleccion/rosas" },
      { label: "Cajas de regalo", href: "/coleccion/cajas-de-regalo" },
      { label: "Peluches", href: "/coleccion/peluches" },
      { label: "Arreglos", href: "/coleccion/arreglos" },
      { label: "Todos los productos", href: "/coleccion/todos" },
    ],
  },
  { title: "Empresa", links: [{ label: "Nosotros", href: "/tiendas" }, { label: "Contacto", href: "/contacto" }, ...toLinks(["Blog"]), { label: "Colecciones", href: "/coleccion/todos" }, { label: "Tiendas", href: "/tiendas" }] },
];

function Newsletter() {
  return (
    <div className="container-page relative">
      <div className="grid items-center gap-8 rounded-[5px] bg-cielo px-6 py-10 text-white shadow-[0_0_20px_1px_rgba(0,0,0,.1)] md:px-20 lg:h-[229px] lg:grid-cols-[minmax(0,680px)_540px] lg:justify-between lg:py-0">
        <div>
          <h2 className="heading text-[24px] leading-[1.18] md:text-[26.4px]">Flores, detalles y sorpresas.</h2>
          <p className="mt-1.5 text-[17px] leading-[1.2] md:text-[19px]">
            ¡No te pierdas nada! Suscríbete para recibir novedades y ofertas especiales para consentir a quien más quieres.
          </p>
        </div>
        <form>
          <div className="flex h-14 rounded-[5px] border border-cielo-dark bg-white p-[3px]">
            <input type="email" required placeholder="Tu correo" className="min-w-0 flex-1 px-3.5 text-[14px] text-ink placeholder:text-muted focus:outline-none" />
            <button className="h-full w-[120px] rounded-[5px] bg-cielo-dark text-[14px] font-bold transition-colors hover:bg-ocean">Suscribirme</button>
          </div>
          <label className="mt-3 flex items-center gap-2.5 text-[15px]">
            <input type="checkbox" className="size-4 accent-ocean" />
            Acepto recibir correos con promociones y ofertas especiales.
          </label>
        </form>
      </div>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="mt-[60px] bg-[linear-gradient(#fff_0_156px,var(--color-cielo)_156px_189px,var(--color-ocean)_189px)] text-white">
      <Newsletter />
      <div className="container-page pt-[61px]">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[240px_240px_240px_240px_382px] lg:justify-between lg:gap-5">
          <div>
            <div className="inline-block rounded-[5px] bg-white px-3 py-2.5">
              <Logo className="h-9" />
            </div>
            <p className="mt-5 text-[14px] leading-[1.5]">
              Flores artificiales y regalos, {site.address}
            </p>
            <p className="mt-5 text-[14px] leading-[1.5]">{site.hours}</p>
            <Link
              href="/libro-de-reclamaciones"
              className="mt-5 inline-flex items-center gap-3 rounded-[5px] bg-white py-2 pr-4 pl-3 text-ocean transition-colors hover:bg-mist"
            >
              <ComplaintBookIcon className="size-9" />
              <span className="text-[13px] leading-tight font-bold">Libro de<br />Reclamaciones</span>
            </Link>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="heading text-[15px]">{col.title}</h3>
              <ul className="mt-[19px] text-[14px] leading-[1.5]">
                {col.links.map((l) => (
                  <li key={l.label}>
                    {/* py-[3px]: objetivo táctil de al menos 24px de alto. */}
                    <Link href={l.href} className="inline-block py-[3px] hover:underline">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <h3 className="heading text-[15px]">¿Necesitas ayuda?</h3>
            <p className="mt-5 text-[14px] leading-[1.5]">
              ¿Tienes una pregunta sobre tu pedido, un producto o necesitas ideas para regalar? Nuestro equipo de {site.name} está
              listo para ayudarte. ¡Escríbenos por WhatsApp al {site.phoneDisplay}!
            </p>
            <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer" className="mt-5 inline-block text-[14px] underline underline-offset-4">Escríbenos por WhatsApp</a>
          </div>
        </div>

        <div className="mt-[76px] flex h-7 items-center gap-6">
          <span className="h-px flex-1 bg-white/10" />
          <SocialIcons className="gap-[23px]" />
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <div className="flex flex-col items-center justify-between gap-4 py-5 text-[13px] md:h-16 md:flex-row md:py-0">
          <button className="flex items-center gap-1">{site.currencyLabel} <ChevronDown className="size-4 opacity-70" strokeWidth={1.5} /></button>
          <p>© {new Date().getFullYear()}, {site.name} Detalles</p>
          <PaymentIcons />
        </div>
      </div>
    </footer>
  );
}
