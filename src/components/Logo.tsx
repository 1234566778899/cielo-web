import Image from "next/image";
import Link from "next/link";
import logo from "../../public/logo.png";

/** Logo horizontal de Mar del Cielo. Es azul sobre transparente: úsalo sobre fondos claros. */
export function Logo({ className = "h-10", priority = false }: { className?: string; priority?: boolean }) {
  return (
    <Link href="/" aria-label="Mar del Cielo Detalles, ir al inicio" className="inline-flex shrink-0">
      <Image src={logo} alt="Mar del Cielo Detalles" priority={priority} className={`w-auto ${className}`} />
    </Link>
  );
}
