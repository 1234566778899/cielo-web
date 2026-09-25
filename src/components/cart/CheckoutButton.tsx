"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "./CartProvider";

/** Botón de pago siempre activo (como la plantilla); avisa si faltan los términos y si no, va al checkout. */
export function CheckoutButton({ accepted, className = "" }: { accepted: boolean; className?: string }) {
  const [warned, setWarned] = useState(false);
  const { close } = useCart();
  const router = useRouter();

  return (
    <div className="contents">
      <button
        onClick={() => {
          if (!accepted) return setWarned(true);
          close();
          router.push("/checkout");
        }}
        className={className}
      >
        Pagar
      </button>
      {warned && !accepted && (
        <p role="alert" className="col-span-full mt-2 text-[13px] text-sale">
          Debes aceptar los términos y condiciones para continuar.
        </p>
      )}
    </div>
  );
}
