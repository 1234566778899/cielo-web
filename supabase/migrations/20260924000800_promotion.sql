-- =============================================================================
-- Módulo: promotion (descuentos por código o automáticos, reglas y campañas)
-- =============================================================================

create type public.promotion_type as enum ('standard', 'buyget');
create type public.promotion_status as enum ('draft', 'active', 'inactive');
create type public.application_method_type as enum ('percentage', 'fixed', 'free_shipping');
create type public.application_target_type as enum ('order', 'items', 'shipping_methods');
create type public.application_allocation as enum ('each', 'across');
create type public.promotion_rule_type as enum ('rules', 'target_rules', 'buy_rules');
create type public.promotion_rule_operator as enum ('in', 'eq', 'ne', 'gt', 'gte', 'lt', 'lte');

create table public.campaign (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  campaign_identifier text not null unique,
  description text,
  starts_at timestamptz,
  ends_at timestamptz,
  budget_type text check (budget_type in ('spend', 'usage')),
  budget_limit numeric(12, 2),
  budget_used numeric(12, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create trigger campaign_updated_at before update on public.campaign for each row execute function internal.set_updated_at();

create table public.promotion (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  title text,
  type public.promotion_type not null default 'standard',
  is_automatic boolean not null default false,
  status public.promotion_status not null default 'draft',
  campaign_id uuid references public.campaign (id) on delete set null,
  starts_at timestamptz,
  ends_at timestamptz,
  usage_limit int,
  usage_count int not null default 0,
  once_per_customer boolean not null default false,
  combines_with_shipping boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create unique index promotion_code_key on public.promotion (upper(code)) where deleted_at is null;
create trigger promotion_updated_at before update on public.promotion for each row execute function internal.set_updated_at();

create table public.promotion_application_method (
  id uuid primary key default gen_random_uuid(),
  promotion_id uuid not null unique references public.promotion (id) on delete cascade,
  type public.application_method_type not null default 'percentage',
  target_type public.application_target_type not null default 'order',
  allocation public.application_allocation not null default 'across',
  value numeric(12, 2) not null default 0,
  currency_code text references public.currency (code),
  max_quantity int,
  buy_rules_min_quantity int,
  apply_to_quantity int
);

-- Ejemplos de reglas:
--   rules:        attribute='subtotal', operator='gte', values='[100]'
--                 attribute='customer.group_id', operator='in', values='["<uuid>"]'
--   target_rules: attribute='items.product_id' / 'items.collection_id', operator='in'
create table public.promotion_rule (
  id uuid primary key default gen_random_uuid(),
  promotion_id uuid not null references public.promotion (id) on delete cascade,
  rule_type public.promotion_rule_type not null default 'rules',
  attribute text not null,
  operator public.promotion_rule_operator not null default 'in',
  values jsonb not null default '[]'
);
create index promotion_rule_promotion_idx on public.promotion_rule (promotion_id);
