/** Texto enriquecido de páginas informativas (estilos del .rte de la plantilla). */
export function Prose({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`text-[15px] leading-[1.5] text-muted [&_a]:text-cielo [&_a]:underline [&_a]:underline-offset-2 [&_h2]:font-[family-name:var(--font-grandstander)] [&_h2]:font-semibold [&_h2]:tracking-[-0.02em] [&_h2]:mt-[30px] [&_h2]:mb-5 [&_h2]:text-[22px] [&_h2]:leading-[26px] [&_h2]:text-ink md:[&_h2]:text-[26.4px] md:[&_h2]:leading-[31.2px] [&_li]:mb-2 [&_p]:mb-5 [&_strong]:font-bold [&_strong]:text-ink [&_ul]:mb-5 [&_ul]:list-disc [&_ul]:pl-5 ${className}`}
    >
      {children}
    </div>
  );
}
