"use client";

import { departments } from "@/lib/peru";
import type { Address } from "@/lib/types";

export const fieldClass = "h-[46px] w-full rounded-[5px] border border-[#dfdfdf] bg-white px-3.5 text-[14px] text-ink placeholder:text-muted focus:outline-2 focus:outline-ocean";

export type AddressFields = Omit<Address, "id" | "isDefault">;

export const emptyAddress: AddressFields = { firstName: "", lastName: "", address1: "", reference: "", district: "", province: "Lima", department: "Lima", phone: "" };

/** Campos de dirección para Perú (departamento / provincia / distrito). Controlado. */
export function AddressFieldsGroup({ value, onChange, idPrefix }: { value: AddressFields; onChange: (v: AddressFields) => void; idPrefix: string }) {
  const set = (k: keyof AddressFields) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => onChange({ ...value, [k]: e.target.value });
  const id = (k: string) => `${idPrefix}-${k}`;

  return (
    <div className="grid grid-cols-2 gap-3">
      <label htmlFor={id("first")} className="sr-only">Nombre</label>
      <input id={id("first")} required autoComplete="given-name" placeholder="Nombre" value={value.firstName} onChange={set("firstName")} className={fieldClass} />
      <label htmlFor={id("last")} className="sr-only">Apellidos</label>
      <input id={id("last")} required autoComplete="family-name" placeholder="Apellidos" value={value.lastName} onChange={set("lastName")} className={fieldClass} />
      <label htmlFor={id("address")} className="sr-only">Dirección</label>
      <input id={id("address")} required autoComplete="address-line1" placeholder="Dirección (calle, número)" value={value.address1} onChange={set("address1")} className={`${fieldClass} col-span-2`} />
      <label htmlFor={id("ref")} className="sr-only">Referencia</label>
      <input id={id("ref")} placeholder="Referencia: dpto., piso, cerca de… (opcional)" value={value.reference ?? ""} onChange={set("reference")} className={`${fieldClass} col-span-2`} />
      <label htmlFor={id("dep")} className="sr-only">Departamento</label>
      <select id={id("dep")} required value={value.department} onChange={set("department")} className={fieldClass}>
        {departments.map((d) => (
          <option key={d}>{d}</option>
        ))}
      </select>
      <label htmlFor={id("prov")} className="sr-only">Provincia</label>
      <input id={id("prov")} required placeholder="Provincia" value={value.province} onChange={set("province")} className={fieldClass} />
      <label htmlFor={id("dist")} className="sr-only">Distrito</label>
      <input id={id("dist")} required autoComplete="address-level2" placeholder="Distrito" value={value.district} onChange={set("district")} className={fieldClass} />
      <label htmlFor={id("phone")} className="sr-only">Teléfono</label>
      <input id={id("phone")} required type="tel" autoComplete="tel" placeholder="Teléfono / celular" value={value.phone} onChange={set("phone")} className={fieldClass} />
    </div>
  );
}
