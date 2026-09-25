import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Flag, Info, LifeBuoy, Star, Undo2 } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PaymentIcons } from "@/components/PaymentIcons";
import { ProductCard } from "@/components/ProductCard";
import { Accordion } from "@/components/product/Accordion";
import { ProductGallery } from "@/components/product/ProductGallery";
import { PurchaseForm } from "@/components/product/PurchaseForm";
import { RecentlyViewed } from "@/components/product/RecentlyViewed";
import { getProduct, getRelatedProducts, shippingOptionsFor } from "@/lib/catalog/queries";
import { getCatalog } from "@/lib/catalog/server";
import { formatPrice } from "@/lib/format";

// Productos nuevos del admin se generan al primer visitante; el resto se refresca cada minuto.
export const revalidate = 60;

export async function generateStaticParams() {
  const { products } = await getCatalog();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(props: PageProps<"/producto/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const product = getProduct(await getCatalog(), slug);
  return { title: product ? `${product.name} | Cielo Online` : "Producto no encontrado" };
}

const perks = [
  { icon: Flag, label: "Calidad garantizada" },
  { icon: LifeBuoy, label: "Atención amable" },
  { icon: Undo2, label: "Devoluciones fáciles" },
];

export default async function ProductPage(props: PageProps<"/producto/[slug]">) {
  const { slug } = await props.params;
  const catalog = await getCatalog();
  const product = getProduct(catalog, slug);
  if (!product) notFound();
  const standard = shippingOptionsFor(catalog, "Lima")[0];

  return (
    <>
      <Breadcrumbs items={[{ label: "Inicio", href: "/" }, { label: product.name }]} />

      {/* Móvil: galería → compra → descripción. Desktop: galería y descripción a la izquierda, compra a la derecha. */}
      <div className="container-page grid gap-10 pt-10 lg:grid-cols-2 lg:grid-rows-[auto_1fr] lg:gap-x-0 lg:gap-y-[60px]">
        <div className="lg:col-start-1 lg:row-start-1 lg:pr-[71px]">
          <ProductGallery images={product.gallery} alt={product.name} />
        </div>

        <div className="order-last lg:order-none lg:col-start-1 lg:row-start-2 lg:pr-[71px]">
            <Accordion title="Descripción" defaultOpen>
              {product.description.map((p) => (
                <p key={p} className="mb-5">{p}</p>
              ))}
              <ul className="list-disc pl-5 leading-[25px]">
                {product.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </Accordion>
            <Accordion title="Cuidados">
              <p className="mb-5">
                Para mantener tus flores como nuevas, retira el polvo cada cierto tiempo con un plumero suave o con aire frío de una secadora a baja velocidad.
              </p>
              <p>Evita la exposición directa y prolongada al sol y no las mojes. Guárdalas en su caja original si no las vas a exhibir.</p>
            </Accordion>
            <Accordion title="Información de envío">
              <p className="mb-5">
                <strong className="font-bold text-ink">¡Pide antes de las 2PM y recíbelo el siguiente día hábil!</strong> En Lima Metropolitana
                entregamos en 24 horas; a provincias en 2 a 5 días hábiles.
              </p>
              {standard && (
                <p>
                  El envío en Lima tiene un costo de {formatPrice(standard.amount)}
                  {standard.freeOver != null && <> en pedidos menores a {formatPrice(standard.freeOver)}</>}. Pueden aplicar cargos adicionales para
                  zonas extendidas o de difícil acceso.
                </p>
              )}
            </Accordion>
        </div>

        <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <div className="border-b border-[#dfdfdf] pb-[30px]">
            <div className="flex items-start justify-between text-[13px] leading-4 text-muted">
              <p>SKU: {product.sku}</p>
              <p className="flex items-center gap-1 text-[12px]">
                <span className="flex">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} className="size-[13px] fill-[#c4c4c4] text-[#c4c4c4]" strokeWidth={1} />
                  ))}
                </span>
                ({product.reviewCount})
              </p>
            </div>
            <h1 className="heading mt-[19px] text-[30px] leading-[1.18] text-ink md:text-[35.2px]">{product.name}</h1>
            <p className="mt-[7px] text-[14px] leading-[17px] text-muted">{product.brand}</p>
          </div>

          <div className="border-b border-[#dfdfdf] py-[30px]">
            <PurchaseForm product={product} />
          </div>

          <p className="mt-[30px] text-[15px] leading-[1.5] text-muted">
            Puedes recoger este producto en nuestra tienda -{" "}
            <Link href="/tiendas" className="text-magenta hover:underline">Ver información de la tienda</Link>
          </p>

          <ul className="mt-[30px] grid gap-5 sm:grid-cols-3">
            {perks.map(({ icon: Icon, label }) => (
              <li key={label} className="flex h-[62px] items-center justify-center gap-3 rounded-[5px] border border-[#dfdfdf] p-[13px] text-[13px] font-bold text-ink">
                <Icon className="size-7 shrink-0" strokeWidth={1.2} />
                {label}
              </li>
            ))}
          </ul>

          <div className="mt-[30px] flex gap-[15px] rounded-[5px] bg-magenta p-5 text-white">
            <Info className="size-10 shrink-0" strokeWidth={1.2} />
            <div>
              <h2 className="heading text-[16.5px] leading-5">Métodos de pago</h2>
              <PaymentIcons size="sm" className="mt-[9px]" />
              <p className="mt-2.5 text-[13px] leading-[1.5]">
                Aceptamos <strong className="font-bold">todos los métodos de pago principales</strong> para que compres con total tranquilidad.
              </p>
            </div>
          </div>
        </div>
      </div>

      <section className="container-page mt-[90px]">
        <h2 className="heading text-[26px] leading-[1.2] text-ink md:text-[28.6px]">Productos relacionados</h2>
        <div className="mt-[30px] grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {getRelatedProducts(catalog, product).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <RecentlyViewed currentSlug={product.slug} />
    </>
  );
}
