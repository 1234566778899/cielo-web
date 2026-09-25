import { CircleMinus, CirclePlus } from "lucide-react";

export function Accordion({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  return (
    <details open={defaultOpen} className="group mb-[30px] last:mb-0">
      <summary className="flex cursor-pointer list-none items-center justify-between border-b border-[#dfdfdf] pt-0.5 pb-3 [&::-webkit-details-marker]:hidden">
        <h2 className="heading text-[19.8px] leading-[23.4px] text-ink">{title}</h2>
        <span className="mr-[5px] text-ink">
          <CirclePlus className="size-[18px] group-open:hidden" strokeWidth={1.2} />
          <CircleMinus className="hidden size-[18px] group-open:block" strokeWidth={1.2} />
        </span>
      </summary>
      <div className="pt-[30px] text-[15px] leading-[1.5] text-muted">{children}</div>
    </details>
  );
}
