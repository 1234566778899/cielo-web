import Link from "next/link";

export function TermsCheckbox({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    // py-1.5 y casilla de 18px: más fácil de marcar con el dedo.
    <label className="flex cursor-pointer items-start gap-2.5 py-1.5 text-[14px] leading-snug text-ink">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-[18px] shrink-0 accent-ocean" />
      <span>
        He leído y acepto los{" "}
        <Link href="/terminos-y-condiciones" target="_blank" className="font-bold text-cielo underline underline-offset-4">términos y condiciones</Link>.
      </span>
    </label>
  );
}
