import { defaultDescription, defaultFeatures } from "@/data/catalog";
import { filterGroups, RECIPIENT_COLLECTIONS } from "@/data/collections";
import { site } from "@/lib/site";
import type { Catalog, Product, Variant } from "@/lib/types";

/** Forma de la respuesta de la RPC `store_catalog()` (ver supabase/migrations/…1400_storefront.sql). */
export type CatalogRow = {
  products: {
    id: string; handle: string; title: string; description: string | null; vendor: string | null; thumbnail: string | null;
    images: string[]; tags: string[]; categories: string[]; collections: string[];
    options: { title: string; values: string[] }[];
    variants: { id: string; title: string; sku: string | null; price: number; compare_at: number | null; available: number; allow_backorder: boolean; manage_inventory: boolean; options: Record<string, string> }[];
  }[];
  collections: { handle: string; title: string; description: string | null; image_url: string | null; product_handles: string[] }[];
  categories: { id: string; handle: string; name: string; parent_id: string | null }[];
  shipping_options: { id: string; name: string; amount: number; free_over_amount: number | null; delivery_estimate: string | null; type: "shipping" | "pickup"; location_id: string | null; departments: (string | null)[] }[];
  locations: { id: string; name: string; address_1: string | null; district: string | null; province: string | null; department: string | null; postal_code: string | null; phone: string | null; is_pickup_enabled: boolean }[];
};

const PLACEHOLDER = "/images/p-caja-rosas-rojas.svg";
const optionKeys = (key: (typeof filterGroups)[number]["key"]) => new Set(Object.keys(filterGroups.find((g) => g.key === key)!.options));
const OCCASIONS = optionKeys("occasions");
const COLORS = optionKeys("colors");

function mapProduct(p: CatalogRow["products"][number]): Product {
  const variants: Variant[] = p.variants.map((v) => {
    const tracked = v.manage_inventory && !v.allow_backorder;
    return {
      id: v.id,
      title: v.title,
      sku: v.sku ?? "",
      price: Number(v.price),
      compareAtPrice: v.compare_at && Number(v.compare_at) > Number(v.price) ? Number(v.compare_at) : undefined,
      available: tracked ? v.available : null,
      inStock: !tracked || v.available > 0,
      options: v.options,
    };
  });
  const main = variants.find((v) => v.inStock) ?? variants[0];
  const image = p.thumbnail ?? p.images[0] ?? PLACEHOLDER;
  const paragraphs = p.description?.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean) ?? [];

  return {
    id: p.id,
    slug: p.handle,
    sku: main.sku,
    name: p.title,
    brand: p.vendor ?? site.name,
    image,
    gallery: p.images.length ? p.images : [image],
    price: main.price,
    compareAtPrice: main.compareAtPrice,
    inStock: variants.some((v) => v.inStock),
    rating: 0,
    reviewCount: 0,
    description: paragraphs.length ? paragraphs : defaultDescription(p.title),
    features: defaultFeatures,
    categories: p.categories,
    occasions: p.tags.filter((t) => OCCASIONS.has(t)),
    recipients: p.collections.filter((c) => RECIPIENT_COLLECTIONS.includes(c)),
    colors: p.tags.filter((t) => COLORS.has(t)),
    collections: p.collections,
    // Una sola variante "Predeterminado" no se muestra como opción.
    options: variants.length > 1 ? p.options : [],
    variants,
    defaultVariantId: main.id,
  };
}

export function mapCatalog(row: CatalogRow): Catalog {
  const shippingOptions = row.shipping_options.map((o) => ({
    id: o.id,
    name: o.name,
    amount: Number(o.amount),
    freeOver: o.free_over_amount == null ? null : Number(o.free_over_amount),
    estimate: o.delivery_estimate,
    type: o.type,
    locationId: o.location_id,
    departments: o.departments.length === 0 || o.departments.includes(null) ? null : (o.departments as string[]),
  }));
  const thresholds = shippingOptions.filter((o) => o.type === "shipping" && o.freeOver != null).map((o) => o.freeOver!);

  return {
    products: row.products.filter((p) => p.variants?.length).map(mapProduct),
    collections: row.collections.map((c) => ({ slug: c.handle, title: c.title, description: c.description, image: c.image_url, productSlugs: c.product_handles })),
    categories: row.categories.map((c) => ({ id: c.id, slug: c.handle, name: c.name, parentId: c.parent_id })),
    shippingOptions,
    locations: row.locations.map((l) => ({
      id: l.id, name: l.name, address1: l.address_1 ?? "", district: l.district ?? "", province: l.province ?? "", department: l.department ?? "",
      postalCode: l.postal_code ?? "", phone: l.phone ?? "", pickup: l.is_pickup_enabled,
    })),
    freeShippingThreshold: thresholds.length ? Math.min(...thresholds) : null,
  };
}
