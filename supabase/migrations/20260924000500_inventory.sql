-- =============================================================================
-- Módulos: stock_location + inventory
-- Un inventory_item se vincula a variantes (link) y tiene niveles por sucursal.
-- =============================================================================

create table public.stock_location (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address_1 text,
  address_2 text,
  district text,
  province text,
  department text,
  country_code text not null default 'pe',
  postal_code text,
  phone text,
  is_pickup_enabled boolean not null default false,  -- recojo en tienda
  is_active boolean not null default true,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create trigger stock_location_updated_at before update on public.stock_location for each row execute function internal.set_updated_at();

alter table public.store
  add constraint store_default_location_fk foreign key (default_location_id) references public.stock_location (id) on delete set null;

create table public.inventory_item (
  id uuid primary key default gen_random_uuid(),
  sku text,
  title text,
  description text,
  thumbnail text,
  requires_shipping boolean not null default true,
  weight numeric(10, 3),
  origin_country text,
  hs_code text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create unique index inventory_item_sku_key on public.inventory_item (sku) where sku is not null and deleted_at is null;
create trigger inventory_item_updated_at before update on public.inventory_item for each row execute function internal.set_updated_at();

-- Link: variant <-> inventory item (una variante puede requerir varios ítems, p. ej. un kit)
create table public.product_variant_inventory_item (
  variant_id uuid not null references public.product_variant (id) on delete cascade,
  inventory_item_id uuid not null references public.inventory_item (id) on delete cascade,
  required_quantity int not null default 1 check (required_quantity > 0),
  primary key (variant_id, inventory_item_id)
);

create table public.inventory_level (
  id uuid primary key default gen_random_uuid(),
  inventory_item_id uuid not null references public.inventory_item (id) on delete cascade,
  location_id uuid not null references public.stock_location (id) on delete cascade,
  stocked_quantity int not null default 0,
  reserved_quantity int not null default 0 check (reserved_quantity >= 0),
  incoming_quantity int not null default 0,
  available_quantity int generated always as (stocked_quantity - reserved_quantity) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (inventory_item_id, location_id)
);
create trigger inventory_level_updated_at before update on public.inventory_level for each row execute function internal.set_updated_at();

create table public.reservation_item (
  id uuid primary key default gen_random_uuid(),
  inventory_item_id uuid not null references public.inventory_item (id) on delete cascade,
  location_id uuid not null references public.stock_location (id) on delete cascade,
  line_item_id uuid,              -- order_line_item (FK en el módulo de pedidos)
  quantity int not null check (quantity > 0),
  description text,
  created_by uuid,
  created_at timestamptz not null default now()
);
create index reservation_item_line_idx on public.reservation_item (line_item_id);

create type public.inventory_adjustment_reason as enum ('received', 'correction', 'damaged', 'sale', 'return', 'restock', 'transfer', 'other');

-- Historial de movimientos (auditoría), como el "historial de ajustes" de Shopify.
create table public.inventory_adjustment (
  id uuid primary key default gen_random_uuid(),
  inventory_item_id uuid not null references public.inventory_item (id) on delete cascade,
  location_id uuid not null references public.stock_location (id) on delete cascade,
  delta int not null,
  quantity_after int not null,
  reason public.inventory_adjustment_reason not null default 'correction',
  note text,
  reference_id uuid,              -- pedido/devolución relacionado
  created_by uuid,
  created_at timestamptz not null default now()
);
create index inventory_adjustment_item_idx on public.inventory_adjustment (inventory_item_id, created_at desc);
