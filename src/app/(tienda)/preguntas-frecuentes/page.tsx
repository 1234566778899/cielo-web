import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { FaqList, type Faq } from "@/components/pages/FaqList";
import { SmartImage } from "@/components/SmartImage";
import { getCatalog } from "@/lib/catalog/server";
import { formatPrice } from "@/lib/format";
import { img } from "@/lib/images";
import { site, whatsappUrl } from "@/lib/site";

export const metadata: Metadata = { title: "Preguntas frecuentes" };
export const revalidate = 60;

const wa = (text: string, label = "WhatsApp") => (
  <a href={whatsappUrl(text)} target="_blank" rel="noopener noreferrer">{label}</a>
);

export default async function FaqPage() {
  const { freeShippingThreshold } = await getCatalog();

  const sections: { title: string; items: Faq[] }[] = [
    {
      title: "Nuestros productos",
      items: [
        {
          q: "¿De qué material son sus flores artificiales?",
          a: <p>Usamos flores de seda y tela premium con tallos de alambre forrado. Tienen textura y color muy parecidos a los naturales, no se marchitan, no necesitan agua y no provocan alergias.</p>,
        },
        {
          q: "¿Cuánto tiempo duran los arreglos?",
          a: <p>Con cuidados básicos lucen como nuevos durante años. Evita el sol directo prolongado y la humedad, y retira el polvo con un plumero suave o aire frío de secadora.</p>,
        },
        {
          q: "¿Las fotos son iguales a lo que voy a recibir?",
          a: <p>Cada arreglo se arma a mano, así que puede haber pequeñas variaciones en la posición de las flores o el tono del papel. Si alguna flor o color no está disponible, lo reemplazamos por uno equivalente o de mayor valor y te avisamos antes.</p>,
        },
        {
          q: "¿Puedo personalizar un arreglo o pedir uno especial?",
          a: <p>¡Claro! Escríbenos por {wa("Hola, quiero un arreglo personalizado.")} con la ocasión, colores y presupuesto, y te enviamos opciones. Los pedidos personalizados necesitan 2 o 3 días de anticipación.</p>,
        },
      ],
    },
    {
      title: "Pedidos, envíos y devoluciones",
      items: [
        {
          q: "¿Cuánto cuesta el envío y cuándo llega mi pedido?",
          a: (
            <p>
              En Lima entregamos en 24 horas (o el mismo día con Express Lima) y en provincias en 2 a 5 días hábiles.
              {freeShippingThreshold != null && <> El envío es gratis en pedidos desde {formatPrice(freeShippingThreshold)} en Lima.</>} Revisa todas las tarifas en{" "}
              <Link href="/opciones-de-envio">Opciones de envío</Link>.
            </p>
          ),
        },
        {
          q: "¿Puedo enviar el regalo a otra persona con una dedicatoria?",
          a: <p>Sí. Pon la dirección de la persona que lo recibe y escribe tu mensaje en las instrucciones del pedido: lo imprimimos en una tarjeta sin costo. Los precios no se incluyen en el paquete.</p>,
        },
        {
          q: "¿Cómo hago seguimiento a mi pedido?",
          a: <p>Te enviamos el número de seguimiento por correo y WhatsApp cuando el pedido sale. Si tienes cuenta, también lo ves en <Link href="/cuenta">Mis pedidos</Link>.</p>,
        },
        {
          q: "¿Puedo cambiar o cancelar mi pedido?",
          a: <p>Mientras no lo hayamos despachado, sí. Escríbenos por {wa("Hola, quiero modificar mi pedido.")} con tu número de pedido lo antes posible.</p>,
        },
        {
          q: "¿Aceptan devoluciones?",
          a: (
            <>
              <p>Si tu pedido llegó dañado o no es lo que compraste, avísanos dentro de las 48 horas con una foto y lo cambiamos o te devolvemos el dinero.</p>
              <p>Por ser productos de regalo armados a pedido, no aceptamos devoluciones por cambio de opinión.</p>
            </>
          ),
        },
      ],
    },
    {
      title: "Pagos y cuenta",
      items: [
        {
          q: "¿Qué métodos de pago aceptan?",
          a: <p>Por ahora aceptamos Yape, Plin y transferencia bancaria (BCP e Interbank). Todos los precios están en soles e incluyen IGV.</p>,
        },
        {
          q: "¿Cómo pago con Yape o Plin?",
          a: <p>Al confirmar tu pedido, yapea o plinea el total al {site.phoneDisplay} a nombre de {site.name} y envíanos la captura por {wa("Hola, les envío la captura de mi pago.")}. Preparamos tu pedido en cuanto confirmamos el pago.</p>,
        },
        {
          q: "¿Emiten boleta o factura?",
          a: <p>Sí, emitimos boleta o factura electrónica. Si necesitas factura, escríbenos tu RUC y razón social en las instrucciones del pedido.</p>,
        },
        {
          q: "¿Necesito una cuenta para comprar?",
          a: <p>No, puedes comprar como invitado. Con una cuenta ves tus pedidos y guardas tus direcciones; para entrar solo necesitas tu correo, sin contraseña. <Link href="/cuenta/ingresar">Crear cuenta</Link>.</p>,
        },
      ],
    },
  ];

  return (
    <>
      <Breadcrumbs items={[{ label: "Inicio", href: "/" }, { label: "Preguntas frecuentes" }]} />

      <section className="container-page pt-[35px] md:pt-[50px]">
        <div className="relative grid h-[348px] place-items-center overflow-hidden rounded-[5px] text-center text-white md:h-[440px]">
          <SmartImage src={img("faq-hero")} alt="" fill preload sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-black/35" />
          <div className="relative px-5">
            <h1 className="heading text-[26.4px] leading-[31.2px] md:text-[39.6px] md:leading-[1.18]">Preguntas frecuentes</h1>
            <p className="mt-3 text-[15px] md:text-[17px]">¿Tienes una duda? Aquí está la respuesta.</p>
          </div>
        </div>
      </section>

      {sections.map((s, i) => (
        <section key={s.title} className="container-narrow mt-[50px]">
          <h2 className="heading text-center text-[26.4px] leading-[31.2px] text-ink md:text-[30.8px] md:leading-[1.2]">{s.title}</h2>
          <div className="mt-5">
            <FaqList items={s.items} defaultOpen={i === 0 ? 0 : null} />
          </div>
        </section>
      ))}

      <section className="container-narrow mt-[50px] text-center">
        <p className="text-[15px] text-muted">¿No encontraste lo que buscabas?</p>
        <a
          href={whatsappUrl(`Hola ${site.name}, tengo una consulta.`)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-grid h-11 place-items-center rounded-[5px] bg-ocean px-6 text-[14px] font-bold text-white hover:bg-ocean-dark"
        >
          Escríbenos por WhatsApp
        </a>
      </section>
    </>
  );
}
