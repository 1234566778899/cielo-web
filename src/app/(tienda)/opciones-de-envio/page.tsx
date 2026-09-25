import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Prose } from "@/components/pages/Prose";
import { buildStores } from "@/data/stores";
import { pickupOptions } from "@/lib/catalog/queries";
import { getCatalog } from "@/lib/catalog/server";
import { formatPrice } from "@/lib/format";
import { site, whatsappUrl } from "@/lib/site";
import type { ShippingOption } from "@/lib/types";

export const metadata: Metadata = { title: "Opciones de envío | Cielo Online" };
export const revalidate = 60;

const coverage = (o: ShippingOption) => (o.departments ? o.departments.join(" y ") : "Todo el Perú");

export default async function ShippingOptionsPage() {
  const catalog = await getCatalog();
  const rates = catalog.shippingOptions.filter((o) => o.type === "shipping");
  const pickups = pickupOptions(catalog);
  const stores = buildStores(catalog.locations);
  const freeRates = rates.filter((o) => o.freeOver != null);

  const cell = "border border-[#dfdfdf] p-2.5 align-top";

  return (
    <>
      <Breadcrumbs items={[{ label: "Inicio", href: "/" }, { label: "Opciones de envío" }]} />

      <div className="container-narrow pt-[35px] md:pt-[50px]">
        <h1 className="heading text-[26.4px] leading-[31.2px] text-ink md:text-[33px] md:leading-[39px]">Opciones de envío</h1>

        <Prose className="mt-5">
          <p>
            En {site.name} sabemos lo importante que es que tu regalo llegue a tiempo y en perfecto estado. Por eso armamos cada pedido a mano, lo
            empacamos con protección y trabajamos con couriers de confianza para entregarlo en Lima y en todo el Perú.
          </p>

          <h2>Estado de las entregas</h2>
          <p>
            <strong>Lima Metropolitana y Callao:</strong> entregamos con normalidad de lunes a sábado. En fechas especiales (San Valentín, Día de la Madre y
            Navidad) la demanda aumenta: te recomendamos hacer tu pedido con al menos 2 días de anticipación.
          </p>
          <p>
            <strong>Provincias:</strong> enviamos a los 24 departamentos del país mediante courier. Algunas zonas alejadas pueden tomar 1 o 2 días adicionales.
          </p>

          <h2>Nuestros envíos</h2>
          <p>Estas son las tarifas vigentes. El costo final se calcula en el checkout según tu dirección.</p>
        </Prose>

        {/* La tabla sale de las tarifas configuradas en el admin (Configuración → Envíos). */}
        <table className="my-[30px] w-full table-fixed border-collapse text-[15px] leading-[1.5] text-muted">
          <thead>
            <tr>
              <th className={`${cell} text-left font-normal`}>Tipo de envío</th>
              <th className={`${cell} text-left font-normal`}>Costo</th>
            </tr>
          </thead>
          <tbody>
            {rates.map((o) => (
              <tr key={o.id}>
                <td className={cell}>
                  {o.name}
                  <span className="block text-[13px]">{coverage(o)}</span>
                </td>
                <td className={cell}>
                  {formatPrice(o.amount)}
                  {o.estimate && <span className="block">{o.estimate}</span>}
                </td>
              </tr>
            ))}
            {freeRates.map((o) => (
              <tr key={`free-${o.id}`}>
                <td className={`${cell} font-bold text-ink`}>{o.name} gratis</td>
                <td className={cell}>
                  {formatPrice(0)}
                  <span className="block">En pedidos desde {formatPrice(o.freeOver!)}</span>
                </td>
              </tr>
            ))}
            {pickups.length > 0 && (
              <tr>
                <td className={`${cell} font-bold text-ink`}>Recojo en tienda</td>
                <td className={cell}>
                  {formatPrice(0)}
                  {pickups[0].estimate && <span className="block">{pickups[0].estimate}</span>}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <Prose>
          <h2>Tiempos de preparación</h2>
          <ul>
            <li>
              <strong>Envío estándar:</strong> los pedidos se preparan y despachan en 1 día hábil. Pide antes de las 2 PM y lo recibes al día hábil siguiente en Lima.
            </li>
            <li>
              <strong>Express Lima:</strong> para entregarlo el mismo día, el pedido debe estar pagado y confirmado antes de la <strong>1 PM</strong>. Los pedidos
              posteriores se entregan al día siguiente.
            </li>
            <li>
              <strong>Pagos con Yape, Plin o transferencia:</strong> empezamos a preparar tu pedido en cuanto confirmamos el pago. Envíanos la constancia por{" "}
              <a href={whatsappUrl("Hola, les envío la constancia de pago de mi pedido.")} target="_blank" rel="noopener noreferrer">WhatsApp</a> para agilizarlo.
            </li>
          </ul>

          <h2>Seguimiento de tu pedido</h2>
          <p>
            Cuando tu pedido salga de nuestra tienda te avisaremos por correo y WhatsApp con el número de seguimiento del courier. Si tienes una cuenta,
            también puedes verlo en <Link href="/cuenta">Mis pedidos</Link>.
          </p>
          <ul>
            <li>En Lima entregamos con nuestra propia movilidad y couriers aliados; en provincias trabajamos con Olva Courier y Shalom.</li>
            <li>Por seguridad no dejamos pedidos sin una persona que los reciba.</li>
          </ul>
          <p>
            ¿Problemas con tu envío? Revisa nuestras <Link href="/preguntas-frecuentes">preguntas frecuentes</Link> o <Link href="/contacto">contáctanos</Link>.
          </p>

          <h2>Recojo en tienda</h2>
          <p>Elige “Recojo en tienda” en el checkout y te avisaremos cuando tu pedido esté listo, normalmente en 2 horas dentro del horario de atención.</p>
          <ul>
            {stores.filter((s) => s.pickup).map((s) => (
              <li key={s.id}>
                <strong>{s.name}:</strong> {s.address.slice(0, 2).join(", ")} · {s.hours}
              </li>
            ))}
          </ul>

          <h2>Notas importantes</h2>
          <ul>
            <li>
              <strong>Intentos de entrega:</strong> si no hay nadie para recibir el pedido, el courier te llamará para coordinar una nueva visita. Un segundo
              intento puede tener un costo adicional.
            </li>
            <li>
              <strong>Dirección correcta:</strong> revisa tu dirección y referencia antes de pagar. Si necesitas cambiarla, escríbenos cuanto antes.
            </li>
            <li>
              <strong>Sorpresas:</strong> si el regalo es sorpresa, indícalo en las instrucciones del pedido y no llamaremos al destinatario antes de llegar.
            </li>
          </ul>
        </Prose>
      </div>
    </>
  );
}
