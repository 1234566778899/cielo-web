# Arquitectura · Cielo Online

```
cielo-online/
├── src/ …            Tienda (Next.js 16) — clientes
├── admin/            Panel de administración (Vite + React 19 + TS)
└── supabase/         Base de datos, seguridad y workflows (compartidos)
```

## Backend: módulos de comercio al estilo Medusa.js sobre Supabase

Medusa separa el comercio en **módulos** independientes (product, pricing, inventory,
customer, order, fulfillment, promotion, region, tax, sales channel, user) que se conectan
mediante **links** y se orquestan con **workflows**. Aquí se replica ese diseño en Postgres:

- **Un módulo = una migración** con sus tablas. Los módulos no se referencian "por dentro":
  se unen con tablas link (`product_variant_inventory_item`, `product_sales_channel`,
  `product_collection_product`…). Así se puede cambiar, por ejemplo, el inventario (varias
  sucursales, kits con `required_quantity`) sin tocar productos.
- **Workflows = funciones SQL transaccionales** (`admin_*`, `store_*`). Toda operación que
  toca varios módulos (crear un producto con variantes y stock, colocar un pedido, preparar
  un envío) ocurre en una sola transacción en el servidor: si algo falla, nada queda a medias.
  El cliente nunca calcula precios, descuentos ni impuestos.
- **Seguridad en la base**: RLS en todas las tablas. Los admins (tabla `admin_user`, con roles
  propietario/administrador/personal) tienen acceso completo; el público solo lee el catálogo
  activo; cada cliente ve sus pedidos. Las funciones auxiliares viven en el esquema `internal`,
  que la API no expone.
- **Instantáneas contables**: el pedido guarda precios, totales e IGV al momento de la compra,
  así los cambios de catálogo no alteran pedidos pasados.

## Panel (`admin/`)

```
admin/src/
├── app/router.tsx           Rutas (cada página se carga bajo demanda)
├── components/ui/           Sistema de diseño propio (Card, IndexTable, Badge, Modal, campos…)
├── components/layout/       Marco: barra lateral oscura, buscador global
├── lib/                     Cliente Supabase, formato S/., imágenes
└── modules/<módulo>/        auth · dashboard · orders · products · customers · promotions · settings
    ├── api.ts               Consultas + hooks de React Query (llaman a vistas y workflows)
    └── *Page.tsx            Pantallas del módulo
```

El diseño sigue los patrones del admin de Shopify (marco oscuro, panel blanco, tarjetas,
tablas de recursos, formularios de dos columnas), medidos de una tienda de prueba real.
**No usa Polaris**: su licencia prohíbe usarlo en apps independientes que se parezcan al
admin de Shopify, así que los componentes son propios y con la marca de Cielo.

## Escalar

- Nuevos módulos (p. ej. suscripciones, reseñas): nueva migración + carpeta en `admin/src/modules`.
- Pagos reales (Culqi, Mercado Pago, Niubiz): Edge Function que confirme el pago y llame a
  `admin_capture_payment` desde el webhook.
- Correos (confirmación de pedido, envío): Edge Function disparada por `order_event`.
- Tipos generados: `cd admin && SUPABASE_PROJECT_ID=… npm run types`.
