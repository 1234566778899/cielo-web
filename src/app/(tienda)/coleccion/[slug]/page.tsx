import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CollectionView } from "@/components/collection/CollectionView";
import { PromoBanners, type Banner } from "@/components/PromoBanners";
import { SmartImage } from "@/components/SmartImage";
import { collectionSlugs, resolveCollection } from "@/lib/catalog/queries";
import { getCatalog } from "@/lib/catalog/server";
import { img } from "@/lib/images";

// Colecciones y categorías nuevas del admin se generan al primer visitante.
export const revalidate = 60;

export async function generateStaticParams() {
  return collectionSlugs(await getCatalog()).map((slug) => ({ slug }));
}

export async function generateMetadata(props: PageProps<"/coleccion/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const collection = resolveCollection(await getCatalog(), slug);
  return { title: collection ? `${collection.title} | Cielo Online` : "Colección no encontrada" };
}

const banners: Banner[] = [
  { title: "Cajas de regalo", image: img("hero-card-cajas"), href: "/coleccion/cajas-de-regalo" },
  { title: "Peluches y detalles", image: img("promo-celebra"), href: "/coleccion/detalles" },
];

export default async function CollectionPage(props: PageProps<"/coleccion/[slug]">) {
  const { slug } = await props.params;
  const collection = resolveCollection(await getCatalog(), slug);
  if (!collection) notFound();

  return (
    <>
      <Breadcrumbs items={[{ label: "Inicio", href: "/" }, { label: collection.title, href: `/coleccion/${collection.slug}` }]} />

      <section className="container-page grid items-center gap-8 pt-10 pb-[25px] lg:grid-cols-[minmax(0,710px)_minmax(0,670px)] lg:justify-between lg:gap-10">
        <div>
          <h1 className="heading text-[30px] leading-[1.18] text-ink md:text-[35.2px]">{collection.title}</h1>
          <p className="mt-[15px] text-[16px] leading-[1.35] text-muted md:text-[17px]">{collection.description}</p>
        </div>
        <div className="relative aspect-[670/285] overflow-hidden">
          <SmartImage src={collection.image} alt={collection.title} fill priority sizes="(min-width: 1024px) 670px, 100vw" className="object-cover" />
        </div>
      </section>

      <CollectionView slug={collection.slug} products={collection.products} />

      <div className="mt-[60px]">
        <PromoBanners banners={banners} heightClass="lg:h-[340px]" />
      </div>
    </>
  );
}
