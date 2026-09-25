-- =============================================================================
-- Módulo: pricing (precio base por moneda + listas de precios para campañas)
-- =============================================================================

create type public.price_list_type as enum ('sale', 'override');
create type public.price_list_status as enum ('draft', 'active');

create table public.price_list (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  type public.price_list_type not null default 'sale',
  status public.price_list_status not null default 'draft',
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create trigger price_list_updated_at before update on public.price_list for each row execute function internal.set_updated_at();

create table public.price (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.product_variant (id) on delete cascade,
  currency_code text not null references public.currency (code),
  amount numeric(12, 2) not null check (amount >= 0),
  compare_at_amount numeric(12, 2) check (compare_at_amount is null or compare_at_amount >= 0),  -- "Precio de comparación"
  region_id uuid references public.region (id) on delete cascade,
  price_list_id uuid references public.price_list (id) on delete cascade,
  min_quantity int,
  max_quantity int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Un único precio base por variante y moneda.
create unique index price_base_key on public.price (variant_id, currency_code) where price_list_id is null and region_id is null;
create index price_variant_idx on public.price (variant_id);
create trigger price_updated_at before update on public.price for each row execute function internal.set_updated_at();

-- Precio vigente de una variante en una moneda: la lista activa más barata, o el precio base.
create or replace function internal.variant_price(p_variant_id uuid, p_currency text)
returns table (amount numeric, compare_at_amount numeric)
language sql stable as $$
  with base as (
    select p.amount, p.compare_at_amount from public.price p
    where p.variant_id = p_variant_id and p.currency_code = p_currency and p.price_list_id is null and p.region_id is null
  ), sale as (
    select p.amount from public.price p
    join public.price_list pl on pl.id = p.price_list_id
    where p.variant_id = p_variant_id and p.currency_code = p_currency
      and pl.status = 'active' and pl.deleted_at is null
      and (pl.starts_at is null or pl.starts_at <= now()) and (pl.ends_at is null or pl.ends_at > now())
    order by p.amount limit 1
  )
  select coalesce((select amount from sale), (select amount from base)),
         case when exists (select 1 from sale) then (select coalesce(compare_at_amount, amount) from base)
              else (select compare_at_amount from base) end
$$;
