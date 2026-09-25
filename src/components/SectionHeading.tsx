export function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="text-center">
      <h2 className="heading text-[26px] leading-[1.2] text-ink md:text-[28.6px]">{title}</h2>
      {subtitle && <p className="mt-[3px] text-[15px] text-muted">{subtitle}</p>}
    </div>
  );
}
