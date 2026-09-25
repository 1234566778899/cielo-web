# Supabase · Cielo Online

Base de datos compartida por la tienda (`/`) y el panel (`/admin`).

## Puesta en marcha (cuando tengas el proyecto)

1. Crea un proyecto en [supabase.com](https://supabase.com) (región recomendada: São Paulo).
2. Vincula y aplica las migraciones:
   ```bash
   supabase login
   supabase link --project-ref <tu-project-ref>
   supabase db push                # aplica supabase/migrations/*
   psql "<connection string>" -f supabase/seed.sql   # datos de Cielo Online (opcional)
   ```
   Alternativa sin CLI: pega cada archivo de `migrations/` en orden en el **SQL Editor** y luego `seed.sql`.
3. En **Authentication → Providers → Email** deja activado el login con correo y contraseña.
4. Copia **Project URL** y **anon public key** (Settings → API) en `admin/.env.local`
   (y en `.env.local` de la tienda cuando la conectemos).
5. Abre el panel, crea tu usuario con **"Tengo una invitación"** o inicia sesión, y pulsa **"Reclamar tienda"**:
   el primer usuario queda como propietario. Los demás entran por invitación (Configuración → Usuarios).

> Nunca pongas la `service_role` key en el panel ni en la tienda: todo funciona con la anon key + RLS.

## Migraciones (una por módulo)

| Archivo | Módulo |
|---|---|
| `…0100_core_and_users` | Utilidades, admins, invitaciones, `internal.is_admin()` |
| `…0200_store_region_tax` | Tienda, monedas, regiones, canales de venta, impuestos (IGV) |
| `…0300_product` | Productos, opciones, variantes, imágenes, colecciones, categorías, etiquetas |
| `…0400_pricing` | Precios por moneda y listas de precios |
| `…0500_inventory` | Sucursales, ítems de inventario, niveles, reservas, historial |
| `…0600_customer` | Clientes, direcciones, grupos |
| `…0700_fulfillment` | Perfiles, zonas de servicio y tarifas de envío/recojo |
| `…0800_promotion` | Descuentos, reglas y campañas |
| `…0900_cart_order` | Carrito, pedidos, pagos, preparaciones, devoluciones, cronología |
| `…1000_workflows` | Operaciones transaccionales (ver abajo) |
| `…1100_admin_views` | Vistas para las listas del panel |
| `…1200_rls` | Políticas de seguridad y bucket `product-images` |
| `…1300_promotion_workflow` | Crear/editar descuentos |

## Workflows (RPC)

| Función | Qué hace |
|---|---|
| `admin_upsert_product(p)` | Crea/edita producto + opciones + variantes + precios + stock en una transacción |
| `admin_set_products_status`, `admin_delete_products` | Acciones en lote |
| `admin_adjust_inventory` | Ajusta stock con motivo e historial |
| `store_place_order(p)` / `admin_create_order(p)` | Checkout: valida precio y stock en el servidor, aplica descuentos, calcula IGV, reserva stock |
| `admin_create_fulfillment`, `admin_update_fulfillment` | Preparar, enviar, entregar o cancelar (descuenta/repone stock) |
| `admin_capture_payment`, `admin_refund_payment` | Registrar cobro o reembolso (Yape, Plin, tarjeta, transferencia) |
| `admin_cancel_order`, `admin_add_order_note` | Cancelar (libera reservas) y comentarios de la cronología |
| `admin_upsert_promotion`, `admin_delete_promotions` | Descuentos |
| `admin_dashboard(from, to)` | Métricas del tablero |

## Tienda (storefront Next.js)

Migración `20260924001400_storefront.sql`:

| RPC | Quién | Qué hace |
|---|---|---|
| `store_catalog()` | anon | Catálogo completo en un JSON (productos activos del canal principal, variantes con precio y stock de la sucursal principal, colecciones, categorías, tarifas de envío, sucursales). La tienda lo cachea 60 s (`unstable_cache`, tag `catalog`). |
| `store_validate_promotion(code, items)` | anon | Vista previa de un código de descuento con precios del servidor. |
| `store_place_order(p)` | anon | Checkout (ya existía). |
| `store_link_customer()` | authenticated | Al iniciar sesión crea el cliente o lo vincula con sus compras como invitado (mismo correo). |
| `store_update_customer(p)` | authenticated | El cliente edita nombre, teléfono y marketing (ya no puede hacer UPDATE directo a `customer`). |

### Supabase Auth para clientes (código por correo)

1. **Authentication → Email Templates → Magic Link**: agrega el código para que el cliente pueda escribirlo:
   `<p>Tu código de acceso: <strong>{{ .Token }}</strong></p>` (el enlace `{{ .ConfirmationURL }}` también funciona).
2. **Authentication → URL Configuration → Redirect URLs**: `http://localhost:3000/auth/callback` y el dominio de producción `https://TU-DOMINIO/auth/callback`.
3. Opcional, Google: habilítalo en **Providers** y pon `NEXT_PUBLIC_AUTH_GOOGLE=true` en `.env.local` de la tienda.
4. El correo integrado de Supabase tiene un límite bajo de envíos por hora; para producción configura SMTP propio (Resend, SES, etc.).
