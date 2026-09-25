import { Flower2 } from "lucide-react";

/** Franja rosada con textos desplazándose en bucle. */
export function Marquee({ items }: { items: string[] }) {
  const row = [...items, ...items, ...items];
  return (
    <section className="container-page">
      <div className="overflow-hidden rounded-[5px] bg-[#fdf3f8] py-[30px]">
        <div className="flex w-max animate-[marquee_30s_linear_infinite] gap-[30px] motion-reduce:animate-none">
          {[0, 1].map((copy) => (
            <ul key={copy} aria-hidden={copy === 1} className="flex shrink-0 items-center gap-[30px]">
              {row.map((t, i) => (
                <li key={i} className="flex items-center gap-[30px] text-[17px] whitespace-nowrap text-muted">
                  <Flower2 className="size-4 text-muted" strokeWidth={1.3} />
                  {t}
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </section>
  );
}
