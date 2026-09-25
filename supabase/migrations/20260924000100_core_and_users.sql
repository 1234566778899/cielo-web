-- =============================================================================
-- Núcleo + módulo de usuarios (administradores).
--
-- Arquitectura (inspirada en los módulos de Medusa.js):
--   * Cada módulo de comercio tiene su propia migración (store, product, pricing,
--     inventory, customer, fulfillment, promotion, order).
--   * Los módulos se relacionan con tablas "link" en vez de acoplarse entre sí.
--   * Las operaciones que tocan varias tablas son "workflows": funciones SQL
--     transaccionales (ver *_workflows.sql). El admin nunca escribe en varias
--     tablas desde el cliente.
--   * El esquema `internal` guarda funciones auxiliares que NO expone la API.
-- =============================================================================

create schema if not exists internal;
grant usage on schema internal to anon, authenticated, service_role;

-- Mantiene updated_at en todas las tablas que lo tengan.
create or replace function internal.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- Genera un handle/slug a partir de un texto ("Rosas Eternas" -> "rosas-eternas").
create or replace function internal.slugify(value text) returns text
language sql immutable as $$
  select trim(both '-' from regexp_replace(
    lower(translate(value, 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunAEIOUUN')),
    '[^a-z0-9]+', '-', 'g'))
$$;

-- -----------------------------------------------------------------------------
-- Usuarios del panel (vinculados a auth.users)
-- -----------------------------------------------------------------------------
create type public.admin_role as enum ('owner', 'admin', 'staff');

create table public.admin_user (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  first_name text,
  last_name text,
  role public.admin_role not null default 'staff',
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger admin_user_updated_at before update on public.admin_user
  for each row execute function internal.set_updated_at();

create table public.admin_invite (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  role public.admin_role not null default 'staff',
  invited_by uuid references public.admin_user (id) on delete set null,
  accepted_at timestamptz,
  expires_at timestamptz not null default now() + interval '7 days',
  created_at timestamptz not null default now()
);

-- ¿El usuario autenticado es administrador activo? (se usa en todas las políticas RLS)
create or replace function internal.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_user where id = auth.uid() and is_active)
$$;

create or replace function internal.has_admin_role(roles public.admin_role[]) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_user where id = auth.uid() and is_active and role = any (roles))
$$;

grant execute on function internal.is_admin() to anon, authenticated;
grant execute on function internal.has_admin_role(public.admin_role[]) to anon, authenticated;

-- Abortar si quien llama no es admin (se usa al inicio de cada workflow admin_*).
create or replace function internal.assert_admin() returns void
language plpgsql stable as $$
begin
  if not internal.is_admin() then
    raise exception 'No autorizado' using errcode = '42501';
  end if;
end $$;
grant execute on function internal.assert_admin() to anon, authenticated;

-- Perfil del admin conectado (o null). Lo usa el panel al iniciar sesión.
create or replace function public.current_admin() returns public.admin_user
language sql stable security definer set search_path = public as $$
  select * from public.admin_user where id = auth.uid()
$$;

-- El primer usuario que inicia sesión puede reclamar la tienda como propietario
-- (solo funciona mientras no exista ningún admin).
create or replace function public.bootstrap_first_admin(p_first_name text default null, p_last_name text default null)
returns public.admin_user
language plpgsql security definer set search_path = public as $$
declare
  v_user auth.users;
  v_admin public.admin_user;
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesión' using errcode = '42501';
  end if;
  if exists (select 1 from public.admin_user) then
    raise exception 'La tienda ya tiene propietario' using errcode = '42501';
  end if;
  select * into v_user from auth.users where id = auth.uid();
  insert into public.admin_user (id, email, first_name, last_name, role)
  values (v_user.id, v_user.email, p_first_name, p_last_name, 'owner')
  returning * into v_admin;
  return v_admin;
end $$;

-- Al iniciar sesión, un usuario invitado se convierte en admin automáticamente.
create or replace function public.accept_admin_invite() returns public.admin_user
language plpgsql security definer set search_path = public as $$
declare
  v_email text;
  v_invite public.admin_invite;
  v_admin public.admin_user;
begin
  select email into v_email from auth.users where id = auth.uid();
  select * into v_invite from public.admin_invite
   where lower(email) = lower(v_email) and accepted_at is null and expires_at > now();
  if v_invite.id is null then
    raise exception 'No tienes una invitación vigente' using errcode = '42501';
  end if;
  insert into public.admin_user (id, email, role) values (auth.uid(), v_email, v_invite.role)
  on conflict (id) do update set is_active = true, role = excluded.role
  returning * into v_admin;
  update public.admin_invite set accepted_at = now() where id = v_invite.id;
  return v_admin;
end $$;

-- ¿Ya existe algún admin? (para mostrar "Reclamar tienda" en el login)
create or replace function public.store_has_owner() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_user)
$$;
