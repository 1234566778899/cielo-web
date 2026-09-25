"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";

export type Faq = { q: string; a: React.ReactNode };

/** Lista desplegable de preguntas (bloque "expandable-list" de la plantilla). Solo una abierta a la vez. */
export function FaqList({ items, defaultOpen = 0 }: { items: Faq[]; defaultOpen?: number | null }) {
  const [open, setOpen] = useState<number | null>(defaultOpen);

  return (
    <div className="rounded-[5px] shadow-[inset_0_0_0_1px_#dfdfdf]">
      {items.map((item, i) => {
        const expanded = open === i;
        const id = `faq-${item.q.slice(0, 24).replace(/\W+/g, "-")}-${i}`;
        return (
          <div key={item.q} className="border-t border-[#dfdfdf] px-[25px] py-5 first:border-t-0">
            <h3>
              <button
                type="button"
                onClick={() => setOpen(expanded ? null : i)}
                aria-expanded={expanded}
                aria-controls={id}
                className="flex w-full items-start justify-between gap-5 text-left"
              >
                <span className="heading pt-1.5 text-[16.5px] leading-[19.5px] text-ink">{item.q}</span>
                <span
                  className={`grid size-8 shrink-0 place-items-center rounded-[5px] border border-ocean ${expanded ? "bg-white text-ocean" : "bg-ocean text-white"}`}
                  aria-hidden
                >
                  {expanded ? <Minus className="size-4" strokeWidth={1.5} /> : <Plus className="size-4" strokeWidth={1.5} />}
                </span>
              </button>
            </h3>
            {expanded && (
              <div id={id} className="mt-2.5 text-[14px] leading-[21px] text-muted [&_a]:text-cielo [&_a]:underline [&_p+p]:mt-2.5">
                {item.a}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
