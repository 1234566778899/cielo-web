import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CollectionView } from "@/components/collection/CollectionView";
import { ProductCard } from "@/components/ProductCard";
import { SectionHeading } from "@/components/SectionHeading";
import { collectionProducts, searchProducts } from "@/lib/catalog/queries";
import { getCatalog } from "@/lib/catalog/server";

export async function generateMetadata(props: PageProps<"/buscar">): Promise<Metadata> {
  const { q } = await props.searchParams;
  return { title: q ? `Búsqueda: “${q}” | Cielo Online` : "Buscar | Cielo Online" };
}

export default async function SearchPage(props: PageProps<"/buscar">) {
  const { q: raw } = await props.searchParams;
  const q = (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? "";
  const catalog = await getCatalog();
  const results = searchProducts(catalog, q);
  const bestSellers = collectionProducts(catalog, "mas-vendidos").slice(0, 5);

  return (
    <>
      <Breadcrumbs items={[{ label: "Inicio", href: "/" }, { label: "Búsqueda" }]} />

      {results.length > 0 ? (
        <div className="pt-5">
          {/* key: reinicia filtros y paginación cuando cambia la búsqueda */}
          <CollectionView key={q} products={results} query={q} />
        </div>
      ) : (
        <>
          <section className="container-page pt-[50px] text-center">
            <h1 className="heading text-[30px] leading-[1.18] text-ink md:text-[35.2px]">{q ? `Sin resultados para “${q}”` : "Buscar productos"}</h1>
            <p className="mt-3 text-[15px] text-muted">
              {q ? "Revisa la ortografía o prueba con otra palabra, por ejemplo “rosas”, “peluche” o “caja”." : "Escribe lo que buscas en la barra de búsqueda."}
            </p>
            <form action="/buscar" className="mx-auto mt-6 flex max-w-[540px] rounded-[5px] border border-[#dfdfdf] p-[3px]">
              <input name="q" defaultValue={q} placeholder="Buscar productos" className="min-w-0 flex-1 px-4 text-[14px] text-ink focus:outline-none" />
              <button className="h-11 rounded-[5px] bg-navy px-6 text-[14px] font-bold text-white hover:bg-navy-dark">Buscar</button>
            </form>
            <Link href="/coleccion/todos" className="mt-4 inline-block text-[15px] text-magenta hover:underline">Ver todos los productos</Link>
          </section>
          <section className="container-page mt-[60px]">
            <SectionHeading title="Te podría gustar" subtitle="Los favoritos de nuestros clientes." />
            <div className="mt-[30px] grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
              {bestSellers.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        </>
      )}
    </>
  );
}
