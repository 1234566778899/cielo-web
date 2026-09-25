// Consultas sobre el catálogo ya cargado. Son funciones puras: sirven en el servidor y en el cliente.
import { ALL_PRODUCTS, collectionMeta, fallbackCollectionImage } from "@/data/collections";
import { normalize } from "@/lib/format";
import type { Catalog, CategoryNode, Product, ShippingOption } from "@/lib/types";

export const getProduct = (c: Catalog, slug: string) => c.products.find((p) => p.slug === slug);

export const getVariant = (c: Catalog, variantId: string) => {
  for (const product of c.products) {
    const variant = product.variants.find((v) => v.id === variantId);
    if (variant) return { product, variant };
  }
  return undefined;
};

/** Handles de una categoría y todas sus subcategorías. */
function categorySubtree(categories: CategoryNode[], slugs: string[]) {
  const out = new Set<string>();
  const visit = (id: string) => {
    const node = categories.find((c) => c.id === id);
    if (!node || out.has(node.slug)) return;
    out.add(node.slug);
    categories.filter((c) => c.parentId === id).forEach((c) => visit(c.id));
  };
  categories.filter((c) => slugs.includes(c.slug)).forEach((c) => visit(c.id));
  return out;
}

const inCategories = (c: Catalog, slugs: string[]) => {
  const tree = categorySubtree(c.categories, slugs);
  return c.products.filter((p) => p.categories.some((s) => tree.has(s)));
};

export type ResolvedCollection = { slug: string; title: string; description: string; image: string; products: Product[] };

/** Colección por handle: virtual (src/data/collections.ts), colección de Supabase o categoría de Supabase. */
export function resolveCollection(c: Catalog, slug: string): ResolvedCollection | null {
  const meta = collectionMeta[slug];
  const dbCollection = c.collections.find((x) => x.slug === slug);
  const category = c.categories.find((x) => x.slug === slug);

  let products: Product[];
  if (slug === ALL_PRODUCTS) products = c.products;
  else if (meta?.categories) products = inCategories(c, meta.categories);
  else if (dbCollection) products = dbCollection.productSlugs.flatMap((s) => getProduct(c, s) ?? []);
  else if (category) products = inCategories(c, [slug]);
  else return null;

  return {
    slug,
    title: meta?.title ?? dbCollection?.title ?? category?.name ?? slug,
    description: meta?.description ?? dbCollection?.description ?? "",
    image: meta?.image ?? dbCollection?.image ?? fallbackCollectionImage,
    products,
  };
}

/** Todos los handles navegables en /coleccion/[slug]. */
export const collectionSlugs = (c: Catalog) =>
  [...new Set([...Object.keys(collectionMeta), ...c.collections.map((x) => x.slug), ...c.categories.map((x) => x.slug)])];

export const collectionProducts = (c: Catalog, slug: string) => resolveCollection(c, slug)?.products ?? [];

/** Productos de la misma categoría primero, luego el resto del catálogo. */
export function getRelatedProducts(c: Catalog, product: Product, count = 5) {
  const others = c.products.filter((p) => p.id !== product.id);
  const score = (p: Product) => p.categories.filter((s) => product.categories.includes(s)).length + p.collections.filter((s) => product.collections.includes(s)).length / 2;
  return [...others].sort((a, b) => score(b) - score(a)).slice(0, count);
}

/** Árbol del bloque "Categorías" del sidebar. */
export function categoryTree(c: Catalog) {
  const byParent = (id: string | null) => c.categories.filter((x) => x.parentId === id);
  return byParent(null).map((root) => {
    const children = byParent(root.id).map((ch) => ({ slug: ch.slug, label: ch.name }));
    return { slug: root.slug, label: root.name, children: children.length ? children : undefined };
  });
}

// ---- Búsqueda -------------------------------------------------------------------

const haystack = (p: Product) =>
  normalize([p.name, p.brand, ...p.variants.map((v) => `${v.sku} ${v.title}`), ...p.categories, ...p.occasions, ...p.recipients, ...p.colors].join(" "));

/** Productos cuyo nombre, marca, SKU o etiquetas contienen todas las palabras buscadas. */
export function searchProducts(c: Catalog, query: string): Product[] {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];
  return c.products.filter((p) => {
    const text = haystack(p);
    return terms.every((t) => text.includes(t));
  });
}

/** Sugerencias estilo "autocompletar": la búsqueda, frases de nombres de producto y colecciones. */
export function searchSuggestions(c: Catalog, query: string, limit = 4) {
  const q = normalize(query.trim());
  if (!q) return { phrases: [] as string[], collections: [] as { title: string; slug: string }[] };

  const phrases = new Set<string>([query.trim().toLowerCase()]);
  for (const p of c.products) {
    const name = p.name.toLowerCase().split(/[/(“]/)[0].trim();
    if (normalize(name).includes(q)) phrases.add(name);
    if (phrases.size >= limit) break;
  }

  const collections = collectionSlugs(c)
    .filter((slug) => slug !== ALL_PRODUCTS)
    .map((slug) => ({ slug, title: collectionMeta[slug]?.title ?? c.collections.find((x) => x.slug === slug)?.title ?? c.categories.find((x) => x.slug === slug)?.name ?? slug }))
    .filter((x) => normalize(x.title).includes(q))
    .slice(0, 2);

  return { phrases: [...phrases].slice(0, limit), collections };
}

// ---- Envío ----------------------------------------------------------------------

/** Tarifas de envío a domicilio disponibles para un departamento. */
export const shippingOptionsFor = (c: Catalog, department: string) =>
  c.shippingOptions.filter((o) => o.type === "shipping" && (o.departments === null || o.departments.includes(department)))
    // Si hay tarifas específicas del departamento, la "todo el país" sobra.
    .filter((o, _, all) => o.departments !== null || !all.some((x) => x.departments !== null));

export const pickupOptions = (c: Catalog) => c.shippingOptions.filter((o) => o.type === "pickup");

export const shippingCost = (o: ShippingOption, subtotal: number) => (o.freeOver != null && subtotal >= o.freeOver ? 0 : o.amount);
