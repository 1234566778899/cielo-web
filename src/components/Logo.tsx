import Link from "next/link";

function FlowerMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      {[0, 72, 144, 216, 288].map((r) => (
        <ellipse key={r} cx="20" cy="10.5" rx="6.5" ry="9" fill="currentColor" transform={`rotate(${r} 20 20)`} />
      ))}
      <circle cx="20" cy="20" r="5" fill="#ffcc00" />
    </svg>
  );
}

export function Logo({ markClassName = "text-navy", className = "", dark = false, size = "text-[29px]" }: { markClassName?: string; className?: string; dark?: boolean; size?: string }) {
  return (
    <Link href="/" className={`flex items-center font-display ${size} leading-none font-bold tracking-tight ${dark ? "text-ink" : "text-white"} ${className}`}>
      Cielo
      <FlowerMark className={`mx-0.5 size-8 -translate-y-1 ${markClassName}`} />
      Online
    </Link>
  );
}
