import type { Metadata } from "next";
import { Grandstander, Lato } from "next/font/google";
import { AccountProvider } from "@/components/account/AccountProvider";
import { CartProvider } from "@/components/cart/CartProvider";
import { CatalogProvider } from "@/components/catalog/CatalogProvider";
import { getCatalog } from "@/lib/catalog/server";
import "./globals.css";

const lato = Lato({ variable: "--font-lato", subsets: ["latin"], weight: ["400", "700"] });
const grandstander = Grandstander({ variable: "--font-grandstander", subsets: ["latin"], weight: ["600", "700"] });

export const metadata: Metadata = {
  title: { default: "Mar del Cielo Detalles | Flores artificiales y regalos", template: "%s | Mar del Cielo" },
  description: "Flores artificiales, cajas de regalo y detalles para tu pareja, amigos y familia.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const catalog = await getCatalog();
  return (
    <html lang="es-PE" suppressHydrationWarning className={`${lato.variable} ${grandstander.variable} antialiased`}>
      <body suppressHydrationWarning className="flex min-h-full flex-col">
        <CatalogProvider catalog={catalog}>
          <AccountProvider>
            <CartProvider>{children}</CartProvider>
          </AccountProvider>
        </CatalogProvider>
      </body>
    </html>
  );
}
