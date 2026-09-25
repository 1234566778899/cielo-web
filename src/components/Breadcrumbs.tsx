import Link from "next/link";

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Migas de pan" className="border-b border-[#dfdfdf]">
      <ol className="container-page flex h-[50px] items-center gap-2 text-[13px] text-muted">
        {items.map((item, i) => (
          <li key={item.label} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden>»</span>}
            {item.href ? (
              <Link href={item.href} className="text-cielo hover:underline">{item.label}</Link>
            ) : (
              <span aria-current="page">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
