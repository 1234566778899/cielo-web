"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { mapOrder, ORDER_SELECT, type OrderRow } from "@/lib/orders";
import { createClient } from "@/lib/supabase/client";
import type { Address, Customer, Order } from "@/lib/types";
import { useCatalog } from "../catalog/CatalogProvider";

// Cuentas de clientes con Supabase Auth (sin contraseña):
//   requestCode -> supabase.auth.signInWithOtp({ email })   (envía código + enlace mágico)
//   verifyCode  -> supabase.auth.verifyOtp({ email, token, type: "email" })
// Al iniciar sesión, store_link_customer() crea el cliente o lo vincula con sus compras como invitado.
// Perfil, direcciones y pedidos se leen con RLS: cada cliente solo ve lo suyo.

type Result = { ok: true } | { ok: false; error: string };

type AccountContextValue = {
  ready: boolean;
  customer: Customer | null;
  orders: Order[];
  pendingEmail: string | null;
  requestCode: (email: string) => Promise<Result>;
  verifyCode: (code: string) => Promise<Result>;
  cancelLogin: () => void;
  logout: () => Promise<void>;
  updateCustomer: (patch: Partial<Pick<Customer, "firstName" | "lastName" | "phone" | "acceptsMarketing">>) => Promise<Result>;
  saveAddress: (address: Address) => Promise<Result>;
  deleteAddress: (id: string) => Promise<Result>;
  /** Vuelve a leer perfil y pedidos (p. ej. después de comprar). */
  refresh: () => Promise<void>;
};

const AccountContext = createContext<AccountContextValue | null>(null);
const PENDING_KEY = "cielo-login-email";

type CustomerRow = { id: string; email: string; first_name: string | null; last_name: string | null; phone: string | null; accepts_marketing: boolean };
type AddressRow = {
  id: string; first_name: string | null; last_name: string | null; address_1: string; address_2: string | null; district: string | null;
  province: string | null; department: string | null; phone: string | null; is_default_shipping: boolean;
};

const toAddress = (a: AddressRow): Address => ({
  id: a.id, firstName: a.first_name ?? "", lastName: a.last_name ?? "", address1: a.address_1, reference: a.address_2 ?? "",
  district: a.district ?? "", province: a.province ?? "", department: a.department ?? "", phone: a.phone ?? "", isDefault: a.is_default_shipping,
});

const authError = (message: string) => {
  if (/rate limit|seconds/i.test(message)) return "Espera un momento antes de pedir otro código.";
  if (/expired|invalid/i.test(message)) return "El código no es válido o ya expiró. Pide uno nuevo.";
  return message;
};

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const { locations } = useCatalog();
  const supabase = useMemo(() => createClient(), []);
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  // Usuario cuyo perfil ya se intentó cargar: evita que /cuenta redirija al login mientras carga.
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const locationsRef = useRef(locations);

  const load = useCallback(async () => {
    const { data: auth } = await supabase.auth.getSession();
    const userId = auth.session?.user.id ?? null;
    const { data: linked, error } = await supabase.rpc("store_link_customer");
    if (error || !linked) {
      setCustomer(null);
      setOrders([]);
      setLoadedFor(userId);
      return;
    }
    const c = linked as CustomerRow;
    const [{ data: addresses }, { data: orderRows }] = await Promise.all([
      supabase.from("customer_address").select("*").eq("customer_id", c.id).order("created_at"),
      supabase.from("orders").select(ORDER_SELECT).eq("customer_id", c.id).order("created_at", { ascending: false }),
    ]);
    setCustomer({
      id: c.id, email: c.email, firstName: c.first_name ?? "", lastName: c.last_name ?? "", phone: c.phone ?? "", acceptsMarketing: c.accepts_marketing,
      addresses: ((addresses ?? []) as AddressRow[]).map(toAddress),
    });
    setOrders(((orderRows ?? []) as unknown as OrderRow[]).map((o) => mapOrder(o, locationsRef.current)));
    setLoadedFor(userId);
  }, [supabase]);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- recuperar el correo al que se envió el código
      setPendingEmail(sessionStorage.getItem(PENDING_KEY));
    } catch {}
    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      // Llamar a Supabase dentro del callback puede bloquear el cliente de auth: se difiere.
      setTimeout(async () => {
        if (next) await load();
        else {
          setCustomer(null);
          setOrders([]);
        }
        setReady(true);
      }, 0);
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase, load]);

  const rememberPending = (email: string | null) => {
    setPendingEmail(email);
    try {
      if (email) sessionStorage.setItem(PENDING_KEY, email);
      else sessionStorage.removeItem(PENDING_KEY);
    } catch {}
  };

  const value = useMemo<AccountContextValue>(
    () => ({
      ready: ready && (!session || loadedFor === session.user.id),
      customer: session ? customer : null,
      orders: session ? orders : [],
      pendingEmail,
      requestCode: async (raw) => {
        const email = raw.trim().toLowerCase();
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { shouldCreateUser: true, emailRedirectTo: `${window.location.origin}/auth/callback?next=/cuenta` },
        });
        if (error) return { ok: false, error: authError(error.message) };
        rememberPending(email);
        return { ok: true };
      },
      verifyCode: async (code) => {
        if (!pendingEmail) return { ok: false, error: "Vuelve a ingresar tu correo." };
        const { error } = await supabase.auth.verifyOtp({ email: pendingEmail, token: code, type: "email" });
        if (error) return { ok: false, error: authError(error.message) };
        rememberPending(null);
        await load();
        return { ok: true };
      },
      cancelLogin: () => rememberPending(null),
      logout: async () => {
        await supabase.auth.signOut();
      },
      updateCustomer: async (patch) => {
        const { error } = await supabase.rpc("store_update_customer", {
          p: { first_name: patch.firstName, last_name: patch.lastName, phone: patch.phone, accepts_marketing: patch.acceptsMarketing },
        });
        if (error) return { ok: false, error: error.message };
        await load();
        return { ok: true };
      },
      saveAddress: async (a) => {
        if (!customer) return { ok: false, error: "Inicia sesión para guardar direcciones." };
        const isDefault = Boolean(a.isDefault) || customer.addresses.length === 0;
        const row = {
          customer_id: customer.id, first_name: a.firstName, last_name: a.lastName, address_1: a.address1, address_2: a.reference || null,
          district: a.district, province: a.province, department: a.department, phone: a.phone, is_default_shipping: isDefault,
        };
        const exists = customer.addresses.some((x) => x.id === a.id);
        const { data, error } = exists
          ? await supabase.from("customer_address").update(row).eq("id", a.id).select("id").single()
          : await supabase.from("customer_address").insert(row).select("id").single();
        if (error) return { ok: false, error: error.message };
        if (isDefault) await supabase.from("customer_address").update({ is_default_shipping: false }).eq("customer_id", customer.id).neq("id", data.id);
        await load();
        return { ok: true };
      },
      deleteAddress: async (id) => {
        const { error } = await supabase.from("customer_address").delete().eq("id", id);
        if (error) return { ok: false, error: error.message };
        await load();
        return { ok: true };
      },
      refresh: load,
    }),
    [ready, session, loadedFor, customer, orders, pendingEmail, supabase, load],
  );

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount() {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error("useAccount debe usarse dentro de <AccountProvider>");
  return ctx;
}
