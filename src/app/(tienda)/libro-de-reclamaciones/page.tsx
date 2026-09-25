import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ComplaintBookIcon } from "@/components/ComplaintBookIcon";
import { ComplaintForm } from "@/components/pages/ComplaintForm";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Libro de reclamaciones" };

export default function ComplaintBookPage() {
  return (
    <>
      <Breadcrumbs items={[{ label: "Inicio", href: "/" }, { label: "Libro de reclamaciones" }]} />

      <div className="container-narrow pt-[35px] md:pt-[50px]">
        <div className="flex items-center gap-4">
          <span className="grid size-16 shrink-0 place-items-center rounded-[5px] bg-ocean text-white">
            <ComplaintBookIcon className="size-10" />
          </span>
          <div>
            <h1 className="heading text-[26.4px] leading-[31.2px] text-ink md:text-[33px] md:leading-[39px]">Libro de reclamaciones</h1>
            <p className="mt-1 text-[14px] text-muted">Hoja de reclamación virtual</p>
          </div>
        </div>

        <dl className="mt-6 grid gap-x-6 gap-y-1 rounded-[5px] bg-mist p-5 text-[14px] sm:grid-cols-[auto_minmax(0,1fr)]">
          <dt className="font-bold text-ink">Proveedor</dt>
          <dd className="text-muted">{site.legalName}</dd>
          {site.ruc && (
            <>
              <dt className="font-bold text-ink">RUC</dt>
              <dd className="text-muted">{site.ruc}</dd>
            </>
          )}
          <dt className="font-bold text-ink">Dirección</dt>
          <dd className="text-muted">{site.address}</dd>
          <dt className="font-bold text-ink">Contacto</dt>
          <dd className="text-muted">{site.phoneDisplay} · {site.email}</dd>
        </dl>

        <p className="mt-5 text-[14px] leading-[1.5] text-muted">
          Conforme al Código de Protección y Defensa del Consumidor (Ley N.º 29571), contamos con un Libro de Reclamaciones virtual. Completa la hoja y
          al enviarla recibirás un código de registro. Responderemos en un plazo máximo de <strong className="text-ink">15 días hábiles</strong>.
        </p>

        <div className="mt-8">
          <ComplaintForm />
        </div>

        <p className="mt-6 text-[13px] leading-[1.5] text-muted">
          La formulación del reclamo no impide acudir a otras vías de solución de controversias ni es requisito previo para interponer una denuncia ante el
          INDECOPI.
        </p>
      </div>
    </>
  );
}
