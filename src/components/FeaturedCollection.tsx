import Link from "next/link";
import type { Product } from "@/lib/types";
import { ProductCard } from "./ProductCard";
import { SectionHeading } from "./SectionHeading";
import { SmartImage } from "./SmartImage";

type Props = {
  title: string;
  subtitle: string;
  feature: { title: string; text: string; cta: string; href: string; image: string };
  products: Product[];
};

/** Tarjeta destacada en la primera columna + productos; la segunda fila arranca en la columna 2. */
export function FeaturedCollection({ title, subtitle, feature, products }: Props) {
  return (
    <section className="container-page">
      <SectionHeading title={title} subtitle={subtitle} />
      <div className="mt-[30px] grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        <div className="col-span-2 flex flex-col overflow-hidden rounded-[5px] bg-magenta text-white md:col-span-1">
          <div className="relative aspect-[4/3]">
            <SmartImage src={feature.image} alt={feature.title} fill sizes="20vw" className="object-cover" />
          </div>
          <div className="flex flex-1 flex-col p-5">
            <h3 className="heading text-[16.5px] tracking-normal">{feature.title}</h3>
            <p className="mt-2.5 text-[14px] leading-[1.5]">{feature.text}</p>
            <Link href={feature.href} className="mt-auto grid h-11 place-items-center rounded-[5px] bg-magenta-dark text-[14px] font-bold transition-colors hover:bg-navy">
              {feature.cta}
            </Link>
          </div>
        </div>
        {products.map((p, i) => (
          <ProductCard key={p.id} product={p} className={i === 4 ? "lg:col-start-2" : ""} />
        ))}
      </div>
    </section>
  );
}
