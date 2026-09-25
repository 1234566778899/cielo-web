"use client";

import { useState } from "react";
import { CheckCircle2, Printer } from "lucide-react";
import { fieldClass } from "../account/AddressForm";
import { departments, formatDate } from "@/lib/peru";
import { site } from "@/lib/site";
import { createClient } from "@/lib/supabase/client";

type Kind = "reclamo" | "queja";
type ItemType = "producto" | "servicio";

const empty = {
  firstName: "", lastName: "", documentType: "DNI", documentNumber: "", email: "", phone: "", address: "",
  department: "Lima", province: "", district: "", isMinor: false, guardianName: "",
  itemType: "producto" as ItemType, itemDescription: "", amount: "", orderReference: "",
  kind: "reclamo" as Kind, detail: "", request: "",
};
type Fields = typeof empty;

const label = "mb-1.5 block text-[13px] font-bold text-ink";
const textarea = "min-h-[120px] w-full rounded-[5px] border border-[#dfdfdf] bg-white px-3.5 py-3 text-[14px] text-ink placeholder:text-muted focus:outline-2 focus:outline-ocean";
const section = "rounded-[5px] p-5 shadow-[inset_0_0_0_1px_#dfdfdf] md:p-6";
const sectionTitle = "heading mb-4 text-[18px] text-ink";

function Choice({ name, checked, onChange, children }: { name: string; checked: boolean; onChange: () => void; children: React.ReactNode }) {
  return (
    <label className={`flex flex-1 cursor-pointer items-start gap-2.5 rounded-[5px] border p-3.5 text-[14px] ${checked ? "border-ocean bg-mist" : "border-[#dfdfdf]"}`}>
      <input type="radio" name={name} checked={checked} onChange={onChange} className="mt-0.5 size-[18px] shrink-0 accent-ocean" />
      <span>{children}</span>
    </label>
  );
}

/** Hoja de reclamación virtual. La registra store_submit_complaint y muestra la constancia con su código. */
export function ComplaintForm() {
  const [f, setF] = useState<Fields>(empty);
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<{ code: string; createdAt: string; data: Fields } | null>(null);

  const set = (k: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { data, error: rpcError } = await createClient().rpc("store_submit_complaint", {
      p: {
        first_name: f.firstName, last_name: f.lastName, document_type: f.documentType, document_number: f.documentNumber,
        email: f.email, phone: f.phone, address: f.address, department: f.department, province: f.province, district: f.district,
        is_minor: f.isMinor, guardian_name: f.isMinor ? f.guardianName : null,
        item_type: f.itemType, item_description: f.itemDescription, amount: f.amount || null, order_reference: f.orderReference || null,
        kind: f.kind, detail: f.detail, request: f.request,
      },
    });
    setSubmitting(false);
    if (rpcError || !data) return setError(rpcError?.message ?? "No pudimos registrar tu hoja de reclamación. Inténtalo de nuevo.");
    const row = data as { code: string; created_at: string };
    setReceipt({ code: row.code, createdAt: row.created_at, data: f });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (receipt) {
    const d = receipt.data;
    const rows: [string, string][] = [
      ["Fecha", formatDate(receipt.createdAt)],
      ["Consumidor", `${d.firstName} ${d.lastName}`],
      ["Documento", `${d.documentType} ${d.documentNumber}`],
      ["Correo", d.email],
      ["Teléfono", d.phone],
      ["Domicilio", [d.address, d.district, d.province, d.department].filter(Boolean).join(", ")],
      ...(d.isMinor ? [["Padre, madre o apoderado", d.guardianName] as [string, string]] : []),
      ["Bien contratado", `${d.itemType === "producto" ? "Producto" : "Servicio"}: ${d.itemDescription}`],
      ...(d.amount ? [["Monto reclamado", `S/. ${d.amount}`] as [string, string]] : []),
      ...(d.orderReference ? [["N.º de pedido", d.orderReference] as [string, string]] : []),
      ["Tipo", d.kind === "reclamo" ? "Reclamo" : "Queja"],
      ["Detalle", d.detail],
      ["Pedido del consumidor", d.request],
    ];
    return (
      <div className={section}>
        <div className="flex items-start gap-3">
          <CheckCircle2 className="size-7 shrink-0 text-stock" strokeWidth={1.6} />
          <div>
            <h2 className="heading text-[20px] text-ink">Registramos tu hoja de reclamación</h2>
            <p className="mt-1 text-[14px] text-muted">
              Código <strong className="text-ink">{receipt.code}</strong>. Te responderemos a <strong className="text-ink">{d.email}</strong> en un plazo máximo de 15 días hábiles.
              Guarda o imprime esta constancia.
            </p>
          </div>
        </div>
        <dl className="mt-5 divide-y divide-[#dfdfdf] border-y border-[#dfdfdf] text-[14px]">
          {rows.map(([k, v]) => (
            <div key={k} className="grid gap-1 py-2.5 sm:grid-cols-[200px_minmax(0,1fr)]">
              <dt className="font-bold text-ink">{k}</dt>
              <dd className="break-words whitespace-pre-line text-muted">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-5 flex flex-wrap gap-3 print:hidden">
          <button onClick={() => window.print()} className="flex h-11 items-center gap-2 rounded-[5px] bg-ocean px-5 text-[14px] font-bold text-white hover:bg-ocean-dark">
            <Printer className="size-4" /> Imprimir o guardar en PDF
          </button>
          <button
            onClick={() => {
              setReceipt(null);
              setF(empty);
              setAccepted(false);
            }}
            className="h-11 rounded-[5px] border border-[#dfdfdf] px-5 text-[14px] font-bold text-ink hover:border-ink"
          >
            Registrar otra hoja
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <fieldset className={section}>
        <legend className="sr-only">Datos del consumidor</legend>
        <h2 className={sectionTitle}>1. Identificación del consumidor reclamante</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="lr-first" className={label}>Nombres *</label>
            <input id="lr-first" required autoComplete="given-name" value={f.firstName} onChange={set("firstName")} className={fieldClass} />
          </div>
          <div>
            <label htmlFor="lr-last" className={label}>Apellidos *</label>
            <input id="lr-last" required autoComplete="family-name" value={f.lastName} onChange={set("lastName")} className={fieldClass} />
          </div>
          <div>
            <label htmlFor="lr-doctype" className={label}>Tipo de documento *</label>
            <select id="lr-doctype" value={f.documentType} onChange={set("documentType")} className={fieldClass}>
              <option value="DNI">DNI</option>
              <option value="CE">Carné de extranjería</option>
              <option value="Pasaporte">Pasaporte</option>
              <option value="RUC">RUC</option>
            </select>
          </div>
          <div>
            <label htmlFor="lr-doc" className={label}>N.º de documento *</label>
            <input id="lr-doc" required inputMode={f.documentType === "Pasaporte" ? "text" : "numeric"} value={f.documentNumber} onChange={set("documentNumber")} className={fieldClass} />
          </div>
          <div>
            <label htmlFor="lr-email" className={label}>Correo electrónico *</label>
            <input id="lr-email" required type="email" autoComplete="email" value={f.email} onChange={set("email")} className={fieldClass} />
          </div>
          <div>
            <label htmlFor="lr-phone" className={label}>Teléfono / celular *</label>
            <input id="lr-phone" required type="tel" autoComplete="tel" value={f.phone} onChange={set("phone")} className={fieldClass} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="lr-address" className={label}>Domicilio *</label>
            <input id="lr-address" required autoComplete="street-address" placeholder="Calle, número, urbanización" value={f.address} onChange={set("address")} className={fieldClass} />
          </div>
          <div>
            <label htmlFor="lr-dep" className={label}>Departamento</label>
            <select id="lr-dep" value={f.department} onChange={set("department")} className={fieldClass}>
              {departments.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="lr-prov" className={label}>Provincia</label>
              <input id="lr-prov" value={f.province} onChange={set("province")} className={fieldClass} />
            </div>
            <div>
              <label htmlFor="lr-dist" className={label}>Distrito</label>
              <input id="lr-dist" value={f.district} onChange={set("district")} className={fieldClass} />
            </div>
          </div>
          <label className="flex items-center gap-2.5 text-[14px] sm:col-span-2">
            <input type="checkbox" checked={f.isMinor} onChange={(e) => setF({ ...f, isMinor: e.target.checked })} className="size-4 accent-ocean" />
            Soy menor de edad
          </label>
          {f.isMinor && (
            <div className="sm:col-span-2">
              <label htmlFor="lr-guardian" className={label}>Nombre del padre, madre o apoderado *</label>
              <input id="lr-guardian" required value={f.guardianName} onChange={set("guardianName")} className={fieldClass} />
            </div>
          )}
        </div>
      </fieldset>

      <fieldset className={section}>
        <legend className="sr-only">Bien contratado</legend>
        <h2 className={sectionTitle}>2. Identificación del bien contratado</h2>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Choice name="itemType" checked={f.itemType === "producto"} onChange={() => setF({ ...f, itemType: "producto" })}>Producto</Choice>
          <Choice name="itemType" checked={f.itemType === "servicio"} onChange={() => setF({ ...f, itemType: "servicio" })}>Servicio</Choice>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="lr-amount" className={label}>Monto reclamado (S/.)</label>
            <input id="lr-amount" type="number" min="0" step="0.01" inputMode="decimal" value={f.amount} onChange={set("amount")} className={fieldClass} />
          </div>
          <div>
            <label htmlFor="lr-order" className={label}>N.º de pedido (si lo tienes)</label>
            <input id="lr-order" placeholder="Ej. 1024" value={f.orderReference} onChange={set("orderReference")} className={fieldClass} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="lr-item" className={label}>Descripción *</label>
            <input id="lr-item" required placeholder="Ej. Ramo de girasoles artificiales" value={f.itemDescription} onChange={set("itemDescription")} className={fieldClass} />
          </div>
        </div>
      </fieldset>

      <fieldset className={section}>
        <legend className="sr-only">Detalle</legend>
        <h2 className={sectionTitle}>3. Detalle de la reclamación y pedido del consumidor</h2>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Choice name="kind" checked={f.kind === "reclamo"} onChange={() => setF({ ...f, kind: "reclamo" })}>
            <strong className="text-ink">Reclamo</strong>
            <span className="block text-[13px] text-muted">Disconformidad relacionada con los productos o servicios.</span>
          </Choice>
          <Choice name="kind" checked={f.kind === "queja"} onChange={() => setF({ ...f, kind: "queja" })}>
            <strong className="text-ink">Queja</strong>
            <span className="block text-[13px] text-muted">Disconformidad no relacionada con los productos o servicios, o malestar por la atención al público.</span>
          </Choice>
        </div>
        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="lr-detail" className={label}>Detalle *</label>
            <textarea id="lr-detail" required maxLength={5000} placeholder="Cuéntanos qué pasó" value={f.detail} onChange={set("detail")} className={textarea} />
          </div>
          <div>
            <label htmlFor="lr-request" className={label}>Pedido *</label>
            <textarea id="lr-request" required maxLength={5000} placeholder="¿Qué solución esperas?" value={f.request} onChange={set("request")} className={textarea} />
          </div>
        </div>
      </fieldset>

      <label className="flex items-start gap-2.5 text-[14px] text-muted">
        <input type="checkbox" required checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-0.5 size-4 shrink-0 accent-ocean" />
        Declaro que los datos consignados son verdaderos y acepto que {site.legalName} use mi información para atender esta hoja de reclamación.
      </label>

      {error && <p role="alert" className="rounded-[5px] bg-[#fdecec] px-4 py-3 text-[14px] text-sale">{error}</p>}
      <button disabled={submitting} className="h-[52px] w-full rounded-[5px] bg-ocean text-[16px] font-bold text-white hover:bg-ocean-dark disabled:opacity-60 sm:w-auto sm:px-10">
        {submitting ? "Registrando…" : "Enviar hoja de reclamación"}
      </button>
    </form>
  );
}
