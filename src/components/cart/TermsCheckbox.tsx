import Link from "next/link";

export function TermsCheckbox({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-start gap-2 text-[14px] leading-snug text-ink">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-[2px] size-[13px] shrink-0 accent-navy" />
      <span>
        He leído y acepto los{" "}
        <Link href="#" className="font-bold text-magenta underline underline-offset-4">términos y condiciones</Link>.
      </span>
    </label>
  );
}
