"use client";

import { useState } from "react";
import { MapPin, Pencil, Plus, Trash2, X } from "lucide-react";
import type { Address } from "@/lib/types";
import { useAccount } from "./AccountProvider";
import { AddressFieldsGroup, emptyAddress, fieldClass, type AddressFields } from "./AddressForm";

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-5" role="dialog" aria-modal aria-label={title}>
      <div className="w-full max-w-[520px] rounded-[5px] bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="heading text-[20px] tracking-normal text-ink">{title}</h2>
          <button onClick={onClose} aria-label="Cerrar" className="grid size-8 place-items-center rounded-[5px] text-muted hover:bg-muted/5">
            <X className="size-4" />
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

export function ProfileView() {
  const { customer, updateCustomer, saveAddress, deleteAddress } = useAccount();
  const [editingProfile, setEditingProfile] = useState(false);
  const [profile, setProfile] = useState({ firstName: "", lastName: "", phone: "" });
  const [editingAddress, setEditingAddress] = useState<{ id: string; fields: AddressFields; isDefault: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Guarda en Supabase y cierra el modal solo si salió bien.
  const run = async (action: () => Promise<{ ok: boolean; error?: string }>, done: () => void) => {
    setSaving(true);
    setError(null);
    const r = await action();
    setSaving(false);
    if (r.ok) done();
    else setError(r.error ?? "No se pudo guardar.");
  };

  if (!customer) return null;
  const fullName = [customer.firstName, customer.lastName].filter(Boolean).join(" ");

  const openAddress = (a?: Address) =>
    setEditingAddress(
      a
        ? { id: a.id, fields: { firstName: a.firstName, lastName: a.lastName, address1: a.address1, reference: a.reference, district: a.district, province: a.province, department: a.department, phone: a.phone }, isDefault: !!a.isDefault }
        : { id: "", fields: { ...emptyAddress, firstName: customer.firstName, lastName: customer.lastName, phone: customer.phone }, isDefault: customer.addresses.length === 0 },
    );

  return (
    <>
      <h1 className="heading text-[28px] leading-tight text-ink">Perfil</h1>

      <section className="mt-6 rounded-[5px] bg-white p-6">
        <div className="flex items-center gap-2">
          <h2 className="heading text-[19.8px] tracking-normal text-ink">{fullName || "Agrega tu nombre"}</h2>
          <button
            onClick={() => {
              setProfile({ firstName: customer.firstName, lastName: customer.lastName, phone: customer.phone });
              setEditingProfile(true);
            }}
            aria-label="Editar perfil"
            className="grid size-8 place-items-center rounded-[5px] text-cielo hover:bg-muted/5"
          >
            <Pencil className="size-4" strokeWidth={1.5} />
          </button>
        </div>
        <dl className="mt-4 grid gap-4 text-[14px] sm:grid-cols-2">
          <div>
            <dt className="text-muted">Correo electrónico</dt>
            <dd className="mt-0.5 text-ink">{customer.email}</dd>
          </div>
          <div>
            <dt className="text-muted">Teléfono</dt>
            <dd className="mt-0.5 text-ink">{customer.phone || "—"}</dd>
          </div>
        </dl>
      </section>

      <section className="mt-5 rounded-[5px] bg-white p-6">
        {error && !editingAddress && !editingProfile && <p role="alert" className="mb-3 text-[13px] text-sale">{error}</p>}
        <div className="flex items-center justify-between">
          <h2 className="heading text-[19.8px] tracking-normal text-ink">Direcciones</h2>
          <button onClick={() => openAddress()} className="flex items-center gap-1 text-[14px] font-bold text-cielo hover:underline">
            <Plus className="size-4" strokeWidth={2} /> Agregar
          </button>
        </div>
        {customer.addresses.length === 0 ? (
          <p className="mt-4 text-[14px] text-muted">Aún no tienes direcciones guardadas.</p>
        ) : (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {customer.addresses.map((a) => (
              <li key={a.id} className="rounded-[5px] p-4 text-[14px] leading-[1.5] text-muted shadow-[inset_0_0_0_1px_#dfdfdf]">
                <div className="flex items-start justify-between gap-2">
                  <p className="flex items-center gap-1.5 font-bold text-ink">
                    <MapPin className="size-4 text-cielo" strokeWidth={1.5} />
                    {a.firstName} {a.lastName}
                  </p>
                  {a.isDefault && <span className="rounded-full bg-mist px-2 py-0.5 text-[12px] font-bold text-cielo">Predeterminada</span>}
                </div>
                <p className="mt-1">
                  {a.address1}
                  {a.reference ? ` (${a.reference})` : ""}
                  <br />
                  {a.district}, {a.province}, {a.department}
                  <br />
                  {a.phone}
                </p>
                <div className="mt-3 flex gap-4 text-[13px]">
                  <button onClick={() => openAddress(a)} className="flex items-center gap-1 text-ink hover:text-cielo"><Pencil className="size-3.5" /> Editar</button>
                  <button onClick={() => run(() => deleteAddress(a.id), () => {})} className="flex items-center gap-1 text-ink hover:text-sale"><Trash2 className="size-3.5" /> Eliminar</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {editingProfile && (
        <Modal title="Editar perfil" onClose={() => setEditingProfile(false)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void run(() => updateCustomer(profile), () => setEditingProfile(false));
            }}
            className="space-y-3"
          >
            <div className="grid grid-cols-2 gap-3">
              <input aria-label="Nombre" placeholder="Nombre" value={profile.firstName} onChange={(e) => setProfile({ ...profile, firstName: e.target.value })} className={fieldClass} />
              <input aria-label="Apellidos" placeholder="Apellidos" value={profile.lastName} onChange={(e) => setProfile({ ...profile, lastName: e.target.value })} className={fieldClass} />
            </div>
            <input aria-label="Correo" value={customer.email} disabled className={`${fieldClass} bg-[#f5f5f5] text-muted`} />
            <input aria-label="Teléfono" type="tel" placeholder="Teléfono / celular" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className={fieldClass} />
            {error && <p role="alert" className="text-[13px] text-sale">{error}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setEditingProfile(false)} className="h-11 rounded-[5px] px-5 text-[14px] font-bold text-ink hover:bg-muted/5">Cancelar</button>
              <button disabled={saving} className="h-11 rounded-[5px] bg-ocean px-6 text-[14px] font-bold text-white hover:bg-ocean-dark disabled:opacity-60">{saving ? "Guardando…" : "Guardar"}</button>
            </div>
          </form>
        </Modal>
      )}

      {editingAddress && (
        <Modal title={customer.addresses.some((a) => a.id === editingAddress.id) ? "Editar dirección" : "Agregar dirección"} onClose={() => setEditingAddress(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void run(() => saveAddress({ id: editingAddress.id, ...editingAddress.fields, isDefault: editingAddress.isDefault }), () => setEditingAddress(null));
            }}
          >
            <AddressFieldsGroup idPrefix="profile-address" value={editingAddress.fields} onChange={(fields) => setEditingAddress({ ...editingAddress, fields })} />
            <label className="mt-4 flex items-center gap-2 text-[14px] text-ink">
              <input type="checkbox" checked={editingAddress.isDefault} onChange={(e) => setEditingAddress({ ...editingAddress, isDefault: e.target.checked })} className="size-4 accent-ocean" />
              Usar como dirección predeterminada
            </label>
            {error && <p role="alert" className="mt-3 text-[13px] text-sale">{error}</p>}
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={() => setEditingAddress(null)} className="h-11 rounded-[5px] px-5 text-[14px] font-bold text-ink hover:bg-muted/5">Cancelar</button>
              <button disabled={saving} className="h-11 rounded-[5px] bg-ocean px-6 text-[14px] font-bold text-white hover:bg-ocean-dark disabled:opacity-60">{saving ? "Guardando…" : "Guardar"}</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
