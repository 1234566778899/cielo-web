import { img } from "@/lib/images";
import { normalize } from "@/lib/format";
import { site } from "@/lib/site";
import type { StoreLocation } from "@/lib/types";

export type Store = {
  id: string;
  name: string;
  badge?: string;
  address: string[];
  phone: string;
  hours: string;
  image: string;
  /** Texto para Google Maps (embed y "Cómo llegar"). */
  mapQuery: string;
  pickup: boolean;
};

/** Foto, horario y etiqueta de cada tienda (por distrito). La dirección y el teléfono vienen de Supabase. */
const presentation: Record<string, Pick<Store, "image" | "hours" | "badge">> = {
  miraflores: { image: img("store-miraflores"), hours: "Lun–Sáb: 10am–8pm", badge: "Nueva tienda" },
  "san isidro": { image: img("store-sanisidro"), hours: "Lun–Sáb: 10am–8pm" },
};
const fallback = { image: img("stores-intro"), hours: "Lun–Sáb: 10am–8pm" };

/** Sucursales activas de Supabase con su presentación local. */
export function buildStores(locations: StoreLocation[]): Store[] {
  return locations.map((l) => {
    const extra = presentation[normalize(l.district)] ?? fallback;
    const city = [l.district, [l.province, l.postalCode].filter(Boolean).join(" ")].filter(Boolean).join(", ");
    return {
      id: l.id,
      name: l.district ? `${l.district}, ${l.province || l.department}` : l.name,
      address: [l.address1, city, "Perú"].filter(Boolean),
      phone: l.phone || site.phoneDisplay,
      mapQuery: [l.address1, l.district, l.province, "Perú"].filter(Boolean).join(", "),
      pickup: l.pickup,
      ...extra,
    };
  });
}

export const mapEmbedUrl = (q: string) => `https://maps.google.com/maps?q=${encodeURIComponent(q)}&z=15&output=embed`;
export const directionsUrl = (q: string) => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}`;
