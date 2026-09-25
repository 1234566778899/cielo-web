import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Prose } from "@/components/pages/Prose";
import { site, whatsappUrl } from "@/lib/site";

export const metadata: Metadata = { title: "Términos y condiciones" };

const updated = "25 de septiembre de 2026";

export default function TermsPage() {
  return (
    <>
      <Breadcrumbs items={[{ label: "Inicio", href: "/" }, { label: "Términos y condiciones" }]} />

      <div className="container-narrow pt-[35px] md:pt-[50px]">
        <h1 className="heading text-[26.4px] leading-[31.2px] text-ink md:text-[33px] md:leading-[39px]">Términos y condiciones</h1>
        <p className="mt-2 text-[13px] text-muted">Última actualización: {updated}</p>

        <Prose className="mt-6">
          <p>
            Estos términos regulan las compras en la tienda online de <strong>{site.legalName}</strong>
            {site.ruc && <> (RUC {site.ruc})</>}, con domicilio en {site.address}. Al hacer un pedido aceptas estas condiciones, así que te pedimos
            leerlas con atención.
          </p>

          <h2>1. Productos</h2>
          <ul>
            <li>Vendemos flores artificiales, arreglos, cajas de regalo, peluches y otros detalles.</li>
            <li>
              Cada arreglo se arma a mano, por lo que puede haber pequeñas variaciones de forma o tono respecto a las fotos, que son referenciales. Si
              alguna flor o color no está disponible, lo reemplazamos por uno equivalente o de mayor valor y te avisamos antes.
            </li>
            <li>Los pedidos personalizados necesitan 2 o 3 días de anticipación y se coordinan por WhatsApp.</li>
          </ul>

          <h2>2. Precios</h2>
          <ul>
            <li>Todos los precios están en soles (S/.) e <strong>incluyen el IGV (18 %)</strong>.</li>
            <li>El costo de envío se muestra en el checkout antes de confirmar el pedido.</li>
            <li>
              El precio que pagas es el vigente al confirmar tu pedido. Los descuentos y promociones tienen las condiciones y vigencia que se indiquen en
              cada campaña y no son acumulables salvo que se diga lo contrario.
            </li>
          </ul>

          <h2>3. Pedidos</h2>
          <ul>
            <li>Al confirmar tu pedido recibirás un número de pedido. El stock y los precios se validan en ese momento.</li>
            <li>
              Tu pedido queda <strong>confirmado cuando verificamos el pago</strong>. Si no recibimos el pago, podemos anular el pedido y liberar el
              stock reservado.
            </li>
            <li>
              Puedes modificar o cancelar tu pedido mientras no haya sido despachado. Escríbenos por{" "}
              <a href={whatsappUrl("Hola, quiero modificar mi pedido.")} target="_blank" rel="noopener noreferrer">WhatsApp</a> con tu número de pedido.
            </li>
          </ul>

          <h2>4. Métodos de pago</h2>
          <p>Por ahora aceptamos:</p>
          <ul>
            <li>
              <strong>Yape o Plin</strong> al {site.phoneDisplay}, a nombre de {site.name}. Envíanos la captura del pago por WhatsApp.
            </li>
            <li>
              <strong>Transferencia bancaria</strong> (BCP o Interbank). Te enviamos los datos de la cuenta por correo al registrar tu pedido.
            </li>
          </ul>
          <p>Nunca te pediremos claves, códigos de verificación ni datos de tarjetas.</p>

          <h2>5. Envíos y recojo</h2>
          <ul>
            <li>
              Las tarifas, zonas de cobertura y plazos están en <Link href="/opciones-de-envio">Opciones de envío</Link>. Los plazos se cuentan desde
              la confirmación del pago.
            </li>
            <li>
              Eres responsable de que la dirección, la referencia y el teléfono de contacto sean correctos. Si el courier no encuentra a nadie o la
              dirección es incorrecta, coordinaremos contigo una nueva entrega, que puede tener un costo adicional.
            </li>
            <li>Si eliges recojo en tienda, te avisaremos cuando tu pedido esté listo.</li>
          </ul>

          <h2>6. Cambios y devoluciones</h2>
          <ul>
            <li>
              Si tu pedido llegó dañado o no corresponde con lo que compraste, avísanos dentro de las <strong>48 horas</strong> de recibido, con una
              foto, y lo cambiamos o te devolvemos el dinero por el mismo medio de pago.
            </li>
            <li>Por tratarse de productos de regalo armados a pedido, no aceptamos devoluciones por cambio de opinión.</li>
          </ul>

          <h2>7. Comprobantes de pago</h2>
          <p>Emitimos boleta o factura electrónica. Si necesitas factura, indica tu RUC y razón social en las instrucciones del pedido.</p>

          <h2>8. Cuenta de cliente</h2>
          <p>
            Puedes comprar como invitado o con una cuenta. Para ingresar te enviamos un código a tu correo, sin contraseña. Eres responsable de mantener
            el acceso a tu correo y de la información que registres.
          </p>

          <h2>9. Datos personales</h2>
          <p>
            Usamos tus datos solo para procesar tus pedidos, coordinar la entrega, emitir comprobantes y, si lo aceptas, enviarte novedades. Los tratamos
            conforme a la Ley N.º 29733, Ley de Protección de Datos Personales. Puedes pedir el acceso, la corrección o la eliminación de tus datos
            escribiéndonos a {site.email}.
          </p>

          <h2>10. Propiedad intelectual</h2>
          <p>
            Las marcas, logotipos, textos, fotografías y diseños de este sitio pertenecen a {site.legalName} o a sus titulares y no pueden usarse sin
            autorización.
          </p>

          <h2>11. Libro de reclamaciones</h2>
          <p>
            Conforme al Código de Protección y Defensa del Consumidor, puedes registrar un reclamo o una queja en nuestro{" "}
            <Link href="/libro-de-reclamaciones">Libro de reclamaciones virtual</Link>. Te responderemos en un plazo máximo de 15 días hábiles.
          </p>

          <h2>12. Cambios a estos términos</h2>
          <p>
            Podemos actualizar estos términos. La versión vigente es la publicada en esta página, y cada pedido se rige por la versión vigente al
            confirmarlo. Estos términos se rigen por las leyes de la República del Perú.
          </p>

          <h2>13. Contacto</h2>
          <p>
            ¿Tienes dudas? Escríbenos por <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer">WhatsApp al {site.phoneDisplay}</a> o a{" "}
            {site.email}. Atendemos {site.hours}.
          </p>
        </Prose>
      </div>
    </>
  );
}
