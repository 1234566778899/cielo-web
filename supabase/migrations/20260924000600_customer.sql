-- =============================================================================
-- Módulo: customer (clientes, direcciones, grupos)
-- =============================================================================

create table public.customer (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  first_name text,
  last_name text,
  phone text,
  has_account boolean not null default false,
  auth_user_id uuid unique references auth.users (id) on delete set null,
  accepts_marketing boolean not null default false,
  note text,
  tags text[] not null default '{}',
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create unique index customer_email_key on public.customer (lower(email)) where deleted_at is null;
create trigger customer_updated_at before update on public.customer for each row execute function internal.set_updated_at();

create table public.customer_address (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customer (id) on delete cascade,
  first_name text,
  last_name text,
  company text,
  address_1 text not null,
  address_2 text,                 -- referencia
  district text,
  province text,
  department text,
  postal_code text,
  country_code text not null default 'pe',
  phone text,
  is_default_shipping boolean not null default false,
  is_default_billing boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index customer_address_customer_idx on public.customer_address (customer_id);
create trigger customer_address_updated_at before update on public.customer_address for each row execute function internal.set_updated_at();

create table public.customer_group (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger customer_group_updated_at before update on public.customer_group for each row execute function internal.set_updated_at();

create table public.customer_group_customer (
  customer_group_id uuid not null references public.customer_group (id) on delete cascade,
  customer_id uuid not null references public.customer (id) on delete cascade,
  primary key (customer_group_id, customer_id)
);
