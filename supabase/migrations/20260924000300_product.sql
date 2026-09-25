-- =============================================================================
-- Módulo: product (productos, opciones, variantes, imágenes, organización)
-- =============================================================================

create type public.product_status as enum ('draft', 'active', 'archived');

create table public.product_type (
  id uuid primary key default gen_random_uuid(),
  value text not null unique,
  created_at timestamptz not null default now()
);

create table public.product (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  handle text not null unique,
  description text,
  status public.product_status not null default 'draft',
  thumbnail text,
  vendor text,                                   -- "Proveedor" / marca
  type_id uuid references public.product_type (id) on delete set null,
  is_giftcard boolean not null default false,
  discountable boolean not null default true,
  weight numeric(10, 3),                         -- kg
  length numeric(10, 2), height numeric(10, 2), width numeric(10, 2),   -- cm
  origin_country text,
  hs_code text,
  material text,
  seo_title text,
  seo_description text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index product_status_idx on public.product (status) where deleted_at is null;
create index product_title_search_idx on public.product using gin (to_tsvector('spanish', title));
create trigger product_updated_at before update on public.product for each row execute function internal.set_updated_at();

create table public.product_tag (
  id uuid primary key default gen_random_uuid(),
  value text not null unique,
  created_at timestamptz not null default now()
);
create table public.product_tags (
  product_id uuid not null references public.product (id) on delete cascade,
  tag_id uuid not null references public.product_tag (id) on delete cascade,
  primary key (product_id, tag_id)
);

create table public.product_collection (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  handle text not null unique,
  description text,
  image_url text,
  sort_order text not null default 'manual',     -- manual | best_selling | price_asc | created_desc
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create trigger product_collection_updated_at before update on public.product_collection for each row execute function internal.set_updated_at();

create table public.product_collection_product (
  collection_id uuid not null references public.product_collection (id) on delete cascade,
  product_id uuid not null references public.product (id) on delete cascade,
  rank int not null default 0,
  primary key (collection_id, product_id)
);

create table public.product_category (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  handle text not null unique,
  description text,
  parent_category_id uuid references public.product_category (id) on delete cascade,
  rank int not null default 0,
  is_active boolean not null default true,
  is_internal boolean not null default false,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create trigger product_category_updated_at before update on public.product_category for each row execute function internal.set_updated_at();

create table public.product_category_product (
  category_id uuid not null references public.product_category (id) on delete cascade,
  product_id uuid not null references public.product (id) on delete cascade,
  primary key (category_id, product_id)
);

create table public.product_option (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.product (id) on delete cascade,
  title text not null,
  rank int not null default 0,
  unique (product_id, title)
);

create table public.product_option_value (
  id uuid primary key default gen_random_uuid(),
  option_id uuid not null references public.product_option (id) on delete cascade,
  value text not null,
  rank int not null default 0,
  unique (option_id, value)
);

create table public.product_variant (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.product (id) on delete cascade,
  title text not null,
  sku text,
  barcode text,
  allow_backorder boolean not null default false,  -- "Vender sin existencias"
  manage_inventory boolean not null default true,  -- "Inventario con seguimiento"
  weight numeric(10, 3),
  cost_amount numeric(12, 2),                      -- "Costo por artículo"
  variant_rank int not null default 0,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create unique index product_variant_sku_key on public.product_variant (sku) where sku is not null and deleted_at is null;
create index product_variant_product_idx on public.product_variant (product_id);
create trigger product_variant_updated_at before update on public.product_variant for each row execute function internal.set_updated_at();

create table public.product_variant_option (
  variant_id uuid not null references public.product_variant (id) on delete cascade,
  option_value_id uuid not null references public.product_option_value (id) on delete cascade,
  primary key (variant_id, option_value_id)
);

create table public.product_image (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.product (id) on delete cascade,
  url text not null,
  alt text,
  rank int not null default 0,
  created_at timestamptz not null default now()
);
create index product_image_product_idx on public.product_image (product_id, rank);

-- Link: product <-> sales_channel
create table public.product_sales_channel (
  product_id uuid not null references public.product (id) on delete cascade,
  sales_channel_id uuid not null references public.sales_channel (id) on delete cascade,
  primary key (product_id, sales_channel_id)
);
