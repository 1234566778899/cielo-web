import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Logo } from "../Logo";

/** Layout de dos columnas del checkout (formulario / resumen gris), como el checkout de la plantilla. */
export function CheckoutShell({ main, summary, mobileSummary }: { main: React.ReactNode; summary: React.ReactNode; mobileSummary?: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="relative border-b border-[#dfdfdf]">
        <div className="grid h-[57px] lg:grid-cols-2">
          <div className="flex items-center px-5 lg:justify-end lg:pr-9">
            <div className="w-full lg:max-w-[436px]">
              <Logo className="h-8" />
            </div>
          </div>
          <div className="absolute right-5 flex h-[57px] items-center lg:static lg:px-9 lg:pl-9">
            <div className="flex w-full justify-end lg:max-w-[350px]">
              <Link href="/carrito" aria-label="Volver al carrito" className="text-cielo hover:opacity-80">
                <ShoppingBag className="size-6" strokeWidth={1.5} />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {mobileSummary && <div className="border-b border-[#dfdfdf] bg-[#f5f5f5] lg:hidden">{mobileSummary}</div>}

      <div className="grid flex-1 lg:grid-cols-2">
        <main className="flex px-5 py-8 lg:justify-end lg:py-[38px] lg:pr-9">
          <div className="w-full lg:max-w-[436px]">{main}</div>
        </main>
        <aside className="hidden border-l border-[#dfdfdf] bg-[#f5f5f5] px-9 py-[38px] lg:block">
          <div className="sticky top-[38px] max-w-[350px]">{summary}</div>
        </aside>
      </div>
    </div>
  );
}
