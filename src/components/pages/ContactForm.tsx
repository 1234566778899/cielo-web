"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { whatsappUrl } from "@/lib/site";

const field = "mt-2 h-[46px] w-full rounded-[5px] border border-[#dfdfdf] bg-white px-4 text-[14px] text-ink focus:outline-2 focus:outline-navy";
const label = "block text-[15px] leading-[18px] text-ink";

/** Arma el mensaje y lo abre en WhatsApp (hasta tener backend para enviar correos). */
export function ContactForm() {
  const [sent, setSent] = useState(false);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const text = [
          `Hola Cielo Online, soy ${data.get("name") || "un cliente"}.`,
          `Asunto: ${data.get("subject")}`,
          `${data.get("message")}`,
          `Correo: ${data.get("email")}${data.get("phone") ? ` · Tel: ${data.get("phone")}` : ""}`,
        ].join("\n");
        window.open(whatsappUrl(text), "_blank", "noopener,noreferrer");
        setSent(true);
      }}
      className="space-y-5"
    >
      <div>
        <label htmlFor="c-name" className={label}>Nombre</label>
        <input id="c-name" name="name" autoComplete="name" className={field} />
      </div>
      <div>
        <label htmlFor="c-email" className={label}>Correo <span className="text-sale">*</span></label>
        <input id="c-email" name="email" type="email" required autoComplete="email" className={field} />
      </div>
      <div>
        <label htmlFor="c-phone" className={label}>Teléfono</label>
        <input id="c-phone" name="phone" type="tel" autoComplete="tel" className={field} />
      </div>
      <div>
        <label htmlFor="c-subject" className={label}>Asunto <span className="text-sale">*</span></label>
        <input id="c-subject" name="subject" required className={field} />
      </div>
      <div>
        <label htmlFor="c-message" className={label}>Mensaje <span className="text-sale">*</span></label>
        <textarea id="c-message" name="message" required rows={5} className={`${field} h-[117px] py-3`} />
      </div>
      <button className="mt-1 flex h-11 items-center gap-1.5 rounded-[5px] bg-navy px-5 text-[14px] font-bold text-white hover:bg-navy-dark">
        Enviar mensaje <ChevronRight className="size-4" strokeWidth={2} />
      </button>
      {sent && <p role="status" className="text-[14px] text-stock">¡Gracias! Abrimos WhatsApp con tu mensaje para que lo envíes.</p>}
    </form>
  );
}
