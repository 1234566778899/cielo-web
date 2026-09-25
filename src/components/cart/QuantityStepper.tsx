"use client";

import { Minus, Plus } from "lucide-react";

const sizes = {
  sm: { box: "size-9", icon: "size-3.5", value: "w-[38px] text-[15px] font-bold" },
  lg: { box: "size-[50px]", icon: "size-[18px]", value: "w-[55px] text-[15px]" },
};

export function QuantityStepper({ value, onChange, size = "lg", min = 1 }: { value: number; onChange: (v: number) => void; size?: keyof typeof sizes; min?: number }) {
  const s = sizes[size];
  return (
    <div className="flex items-center">
      <button type="button" aria-label="Disminuir cantidad" onClick={() => onChange(Math.max(min, value - 1))} className={`grid ${s.box} place-items-center rounded-[5px] border border-[#dfdfdf] text-ink hover:border-ink`}>
        <Minus className={s.icon} strokeWidth={1.3} />
      </button>
      <span className={`${s.value} text-center text-ink`} aria-live="polite">{value}</span>
      <button type="button" aria-label="Aumentar cantidad" onClick={() => onChange(value + 1)} className={`grid ${s.box} place-items-center rounded-[5px] border border-[#dfdfdf] text-ink hover:border-ink`}>
        <Plus className={s.icon} strokeWidth={1.3} />
      </button>
    </div>
  );
}
