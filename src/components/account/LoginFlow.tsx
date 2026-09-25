"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "../Logo";
import { useAccount } from "./AccountProvider";

// Activa el botón cuando Google esté habilitado en Supabase → Authentication → Providers.
const googleEnabled = process.env.NEXT_PUBLIC_AUTH_GOOGLE === "true";

const input = "h-[46px] w-full rounded-[5px] border border-[#dfdfdf] bg-white px-3.5 text-[14px] text-ink placeholder:text-muted focus:outline-2 focus:outline-ocean";

/** Acceso sin contraseña: correo -> código de 6 dígitos (como las cuentas de la plantilla y el OTP de Supabase). */
export function LoginFlow() {
  const router = useRouter();
  const { ready, customer, pendingEmail, requestCode, verifyCode, cancelLogin } = useAccount();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const send = async (to: string) => {
    setBusy(true);
    setError(null);
    const r = await requestCode(to);
    setBusy(false);
    if (!r.ok) setError(r.error);
    return r.ok;
  };

  useEffect(() => {
    if (ready && customer) router.replace("/cuenta");
  }, [ready, customer, router]);

  return (
    <div className="flex min-h-screen flex-col items-center bg-white px-5">
      <header className="flex h-[92px] items-center">
        <Logo className="h-11" preload />
      </header>

      <main className="flex w-full flex-1 items-center justify-center pb-16">
        <div className="w-full max-w-[332px]">
          {!pendingEmail ? (
            <>
              <h1 className="heading text-[24px] leading-tight text-ink">Iniciar sesión</h1>
              <p className="mt-1.5 text-[14px] text-muted">Inicia sesión o crea una cuenta</p>

              {googleEnabled && (
                <>
                  <button
                    type="button"
                    onClick={async () => {
                      const { error } = await createClient().auth.signInWithOAuth({
                        provider: "google",
                        options: { redirectTo: `${window.location.origin}/auth/callback?next=/cuenta` },
                      });
                      if (error) setNotice(error.message);
                    }}
                    className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-[5px] bg-cielo text-[15px] font-bold text-white hover:bg-cielo-dark"
                  >
                    <svg viewBox="0 0 24 24" className="size-[18px]" aria-hidden>
                      <path fill="#fff" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3Z" />
                      <path fill="#fff" opacity=".85" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22Z" />
                      <path fill="#fff" opacity=".7" d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3.1a10 10 0 0 0 0 9.2L6.4 14Z" />
                      <path fill="#fff" opacity=".55" d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.4L6.4 10C7.2 7.7 9.4 6 12 6Z" />
                    </svg>
                    Continuar con Google
                  </button>
                  {notice && <p className="mt-2 text-[13px] text-muted">{notice}</p>}

                  <div className="my-4 flex items-center gap-3 text-[13px] text-muted">
                    <span className="h-px flex-1 bg-[#dfdfdf]" />o<span className="h-px flex-1 bg-[#dfdfdf]" />
                  </div>
                </>
              )}

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  await send(email);
                }}
                className={`relative ${googleEnabled ? "" : "mt-5"}`}
              >
                <label htmlFor="login-email" className="sr-only">Correo electrónico</label>
                <input id="login-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Correo electrónico" className={`${input} pr-12`} />
                <button aria-label="Continuar" disabled={busy} className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-[5px] text-ink hover:bg-muted/5">
                  <ArrowRight className="size-[18px]" strokeWidth={1.8} />
                </button>
              </form>
              {error && <p role="alert" className="mt-2 text-[13px] text-sale">{error}</p>}
              <p className="mt-3 text-[12px] text-muted">Te enviaremos un código de acceso a tu correo. No necesitas contraseña.</p>
            </>
          ) : (
            <>
              <h1 className="heading text-[24px] leading-tight text-ink">Ingresa el código</h1>
              <p className="mt-1.5 text-[14px] text-muted">
                Enviamos un código a <strong className="font-bold text-ink">{pendingEmail}</strong>
              </p>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setBusy(true);
                  const r = await verifyCode(code);
                  setBusy(false);
                  // Al cargar el perfil, el efecto de arriba lleva a /cuenta.
                  if (!r.ok) setError(r.error);
                }}
                className="mt-5 space-y-3"
              >
                <label htmlFor="login-code" className="sr-only">Código de acceso</label>
                <input
                  id="login-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  minLength={6}
                  maxLength={10}
                  required
                  autoFocus
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="Código de acceso"
                  className={`${input} tracking-[.3em]`}
                />
                {error && <p role="alert" className="text-[13px] text-sale">{error}</p>}
                <button disabled={busy} className="h-11 w-full rounded-[5px] bg-ocean text-[15px] font-bold text-white hover:bg-ocean-dark disabled:opacity-60">{busy ? "Verificando…" : "Continuar"}</button>
              </form>
              <p className="mt-3 text-[12px] text-muted">También puedes abrir el enlace del correo en este navegador.</p>
              {notice && <p className="mt-2 text-[13px] text-stock">{notice}</p>}
              <div className="mt-5 flex justify-between text-[13px]">
                <button onClick={async () => { if (await send(pendingEmail)) setNotice("Te enviamos un nuevo código."); }} className="text-cielo hover:underline">Reenviar código</button>
                <button onClick={() => { setCode(""); setError(null); cancelLogin(); }} className="text-cielo hover:underline">Usar otro correo</button>
              </div>
            </>
          )}
        </div>
      </main>

      <footer className="flex h-16 items-center gap-5 text-[13px]">
        <Link href="#" className="text-cielo hover:underline">Aviso de privacidad</Link>
        <Link href="/" className="text-muted hover:underline">Volver a la tienda</Link>
      </footer>
    </div>
  );
}
