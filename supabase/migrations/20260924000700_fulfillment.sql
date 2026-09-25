-- =============================================================================
-- Módulo: fulfillment (perfiles, zonas de servicio y tarifas de envío/recojo)
-- =============================================================================

create type public.fulfillment_type as enum ('shipping', 'pickup');
create type public.shipping_price_type as enum ('flat', 'calculated');

create table public.shipping_profile (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null default 'default',
  created_at timestamptz not null default now()
);

create table public.service_zone (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type public.fulfillment_type not null default 'shipping',
  stock_location_id uuid references public.stock_location (id) on delete cascade,  -- para recojo
  created_at timestamptz not null default now()
);

-- Qué destinos cubre una zona (país o departamento).
create table public.geo_zone (
  id uuid primary key default gen_random_uuid(),
  service_zone_id uuid not null references public.service_zone (id) on delete cascade,
  country_code text not null default 'pe',
  department text              -- null = todo el país
);

create table public.shipping_option (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  service_zone_id uuid not null references public.service_zone (id) on delete cascade,
  shipping_profile_id uuid references public.shipping_profile (id) on delete set null,
  price_type public.shipping_price_type not null default 'flat',
  amount numeric(12, 2) not null default 0,
  currency_code text not null references public.currency (code),
  free_over_amount numeric(12, 2),   -- envío gratis desde este subtotal
  delivery_estimate text,            -- "1 a 2 días hábiles"
  is_enabled boolean not null default true,
  rank int not null default 0,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create trigger shipping_option_updated_at before update on public.shipping_option for each row execute function internal.set_updated_at();
