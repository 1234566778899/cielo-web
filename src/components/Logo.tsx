import Image from "next/image";
import Link from "next/link";
import logo from "../../public/logo.png";

/** Logo horizontal de Mar del Cielo. Es azul sobre transparente: úsalo sobre fondos claros. */
export function Logo({ className = "h-10", preload = false }: { className?: string; preload?: boolean }) {
  return (
    <Link href="/" aria-label="Mar del Cielo Detalles, ir al inicio" className="inline-flex shrink-0">
      {/* Se muestra a 50px de alto como máximo (~240px de ancho): sizes evita bajar el PNG de 560px. */}
      <Image src={logo} alt="Mar del Cielo Detalles" preload={preload} sizes="(min-width: 768px) 240px, 180px" className={`w-auto ${className}`} />
    </Link>
  );
}
