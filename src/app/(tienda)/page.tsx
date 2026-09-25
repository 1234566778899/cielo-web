import { Features } from "@/components/Features";
import { FeaturedCollection } from "@/components/FeaturedCollection";
import { Hero } from "@/components/Hero";
import { ProductCard } from "@/components/ProductCard";
import { PromoBanners } from "@/components/PromoBanners";
import { SectionHeading } from "@/components/SectionHeading";
import { ShopByCategory } from "@/components/ShopByCategory";
import { ShopTheLook } from "@/components/ShopTheLook";
import { collectionProducts } from "@/lib/catalog/queries";
import { getCatalog } from "@/lib/catalog/server";
import { img } from "@/lib/images";

export default async function Home() {
  const catalog = await getCatalog();
  const bestSellers = collectionProducts(catalog, "mas-vendidos").slice(0, 5);
  const coupleGifts = collectionProducts(catalog, "regalos-para-enamorar").slice(0, 8);
  return (
    <>
      <Hero />

      <section className="container-page mt-[60px]">
        <SectionHeading title="Más vendidos" subtitle="Los favoritos de nuestros clientes para sorprender a quien más quieren." />
        <div className="mt-[30px] grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {bestSellers.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <div className="mt-[60px]">
        <PromoBanners />
      </div>

      <div className="mt-[60px]">
        <FeaturedCollection
          title="Regalos para enamorar"
          subtitle="Los detalles más románticos, elegidos por parejas como tú."
          feature={{
            title: "Para tu pareja",
            text: "Desde rosas eternas y cajas de chocolates hasta peluches y lámparas, tenemos todo para decir “te amo” de una forma que dure para siempre.",
            cta: "Ver regalos para pareja",
            href: "/coleccion/pareja",
            image: img("feature-pareja"),
          }}
          products={coupleGifts}
        />
      </div>

      <div className="mt-[60px]">
        <ShopByCategory />
      </div>

      <div className="mt-[60px]">
        <ShopTheLook products={[bestSellers[0], coupleGifts[4], bestSellers[2]]} />
      </div>

      <div className="mt-[60px]">
        <Features />
      </div>
    </>
  );
}
