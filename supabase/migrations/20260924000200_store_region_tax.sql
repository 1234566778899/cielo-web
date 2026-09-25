-- =============================================================================
-- Módulos: currency, region, sales channel, store, tax
-- =============================================================================

create table public.currency (
  code text primary key,               -- ISO 4217 en minúsculas: 'pen', 'usd'
  symbol text not null,                -- 'S/.'
  symbol_native text not null,
  name text not null,
  decimal_digits int not null default 2
);

create table public.region (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  currency_code text not null references public.currency (code),
  is_tax_inclusive boolean not null default true,   -- en Perú los precios incluyen IGV
  automatic_taxes boolean not null default true,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create trigger region_updated_at before update on public.region for each row execute function internal.set_updated_at();

create table public.region_country (
  iso_2 text primary key,              -- 'pe'
  name text not null,
  region_id uuid references public.region (id) on delete set null
);

create table public.sales_channel (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  is_disabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger sales_channel_updated_at before update on public.sales_channel for each row execute function internal.set_updated_at();

-- Configuración general (una sola fila).
create table public.store (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  whatsapp text,
  address jsonb not null default '{}',
  timezone text not null default 'America/Lima',
  weight_unit text not null default 'kg',
  default_currency_code text not null references public.currency (code),
  default_region_id uuid references public.region (id) on delete set null,
  default_sales_channel_id uuid references public.sales_channel (id) on delete set null,
  default_location_id uuid,            -- FK agregada en el módulo de inventario
  order_prefix text not null default '#',
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index store_singleton on public.store ((true));
create trigger store_updated_at before update on public.store for each row execute function internal.set_updated_at();

-- Impuestos (IGV 18 % en Perú)
create table public.tax_region (
  id uuid primary key default gen_random_uuid(),
  country_code text not null,
  province_code text,
  name text not null,
  parent_id uuid references public.tax_region (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (country_code, province_code)
);

create table public.tax_rate (
  id uuid primary key default gen_random_uuid(),
  tax_region_id uuid not null references public.tax_region (id) on delete cascade,
  name text not null,
  code text not null,
  rate numeric(5, 2) not null check (rate >= 0),
  is_default boolean not null default false,
  is_combinable boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger tax_rate_updated_at before update on public.tax_rate for each row execute function internal.set_updated_at();

-- Tasa por defecto de un país (0 si no hay).
create or replace function internal.default_tax_rate(p_country text) returns numeric
language sql stable as $$
  select coalesce((
    select tr.rate from public.tax_rate tr
    join public.tax_region rg on rg.id = tr.tax_region_id
    where rg.country_code = lower(p_country) and rg.province_code is null and tr.is_default
    limit 1), 0)
$$;
