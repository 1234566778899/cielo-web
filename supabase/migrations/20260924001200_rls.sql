-- =============================================================================
-- Seguridad (RLS)
--   * Administradores: acceso total a todo (internal.is_admin()).
--   * Público (anon/clientes): lectura del catálogo publicado y configuración pública.
--   * Clientes con sesión: sus datos, direcciones y pedidos.
--   * Escrituras de la tienda solo mediante funciones store_* (security definer).
-- =============================================================================

do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy admin_all on public.%I for all to authenticated using (internal.is_admin()) with check (internal.is_admin())', t);
  end loop;
end $$;

-- Catálogo público
create policy public_read on public.product for select to anon, authenticated using (status = 'active' and deleted_at is null);
create policy public_read on public.product_variant for select to anon, authenticated
  using (deleted_at is null and exists (select 1 from public.product p where p.id = product_id and p.status = 'active' and p.deleted_at is null));
create policy public_read on public.product_option for select to anon, authenticated using (true);
create policy public_read on public.product_option_value for select to anon, authenticated using (true);
create policy public_read on public.product_variant_option for select to anon, authenticated using (true);
create policy public_read on public.product_image for select to anon, authenticated using (true);
create policy public_read on public.product_tag for select to anon, authenticated using (true);
create policy public_read on public.product_tags for select to anon, authenticated using (true);
create policy public_read on public.product_type for select to anon, authenticated using (true);
create policy public_read on public.product_collection for select to anon, authenticated using (deleted_at is null);
create policy public_read on public.product_collection_product for select to anon, authenticated using (true);
create policy public_read on public.product_category for select to anon, authenticated using (is_active and not is_internal and deleted_at is null);
create policy public_read on public.product_category_product for select to anon, authenticated using (true);
create policy public_read on public.price for select to anon, authenticated using (true);
create policy public_read on public.price_list for select to anon, authenticated using (status = 'active' and deleted_at is null);
create policy public_read on public.inventory_level for select to anon, authenticated using (true);
create policy public_read on public.product_variant_inventory_item for select to anon, authenticated using (true);
create policy public_read on public.stock_location for select to anon, authenticated using (is_active and deleted_at is null);
create policy public_read on public.shipping_option for select to anon, authenticated using (is_enabled and deleted_at is null);
create policy public_read on public.service_zone for select to anon, authenticated using (true);
create policy public_read on public.geo_zone for select to anon, authenticated using (true);
create policy public_read on public.currency for select to anon, authenticated using (true);
create policy public_read on public.region for select to anon, authenticated using (deleted_at is null);
create policy public_read on public.region_country for select to anon, authenticated using (true);
create policy public_read on public.store for select to anon, authenticated using (true);
create policy public_read on public.tax_rate for select to anon, authenticated using (true);
create policy public_read on public.tax_region for select to anon, authenticated using (true);

-- Clientes con sesión: sus propios datos
create policy customer_self on public.customer for select to authenticated using (auth_user_id = auth.uid());
create policy customer_self_update on public.customer for update to authenticated using (auth_user_id = auth.uid()) with check (auth_user_id = auth.uid());
create policy customer_self on public.customer_address for all to authenticated
  using (exists (select 1 from public.customer c where c.id = customer_id and c.auth_user_id = auth.uid()))
  with check (exists (select 1 from public.customer c where c.id = customer_id and c.auth_user_id = auth.uid()));
create policy customer_self on public.orders for select to authenticated
  using (exists (select 1 from public.customer c where c.id = customer_id and c.auth_user_id = auth.uid()));
create policy customer_self on public.order_line_item for select to authenticated
  using (exists (select 1 from public.orders o join public.customer c on c.id = o.customer_id where o.id = order_id and c.auth_user_id = auth.uid()));
create policy customer_self on public.order_shipping_method for select to authenticated
  using (exists (select 1 from public.orders o join public.customer c on c.id = o.customer_id where o.id = order_id and c.auth_user_id = auth.uid()));
create policy customer_self on public.fulfillment for select to authenticated
  using (exists (select 1 from public.orders o join public.customer c on c.id = o.customer_id where o.id = order_id and c.auth_user_id = auth.uid()));

-- Un admin puede ver su propio perfil aunque aún no esté activo
create policy admin_self on public.admin_user for select to authenticated using (id = auth.uid());

-- Workflows de la tienda (anon y clientes); el resto de funciones admin_* validan permisos adentro.
grant execute on function public.store_place_order(jsonb) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Storage: imágenes de productos (lectura pública, escritura solo admins)
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'])
on conflict (id) do nothing;

create policy "admins suben imagenes" on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and internal.is_admin());
create policy "admins editan imagenes" on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and internal.is_admin());
create policy "admins borran imagenes" on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and internal.is_admin());
create policy "lectura publica imagenes" on storage.objects for select to anon, authenticated
  using (bucket_id = 'product-images');

-- -----------------------------------------------------------------------------
-- Equipo: todos los admins ven al equipo, pero solo propietario/administrador
-- invitan, cambian roles o desactivan usuarios. Nadie puede degradar al propietario.
-- -----------------------------------------------------------------------------
drop policy admin_all on public.admin_user;
drop policy admin_all on public.admin_invite;

create policy team_read on public.admin_user for select to authenticated using (internal.is_admin());
create policy team_manage on public.admin_user for update to authenticated
  using (internal.has_admin_role(array['owner', 'admin']::public.admin_role[]) and role <> 'owner')
  with check (internal.has_admin_role(array['owner', 'admin']::public.admin_role[]) and role <> 'owner');

create policy invite_read on public.admin_invite for select to authenticated using (internal.is_admin());
create policy invite_manage on public.admin_invite for all to authenticated
  using (internal.has_admin_role(array['owner', 'admin']::public.admin_role[]))
  with check (internal.has_admin_role(array['owner', 'admin']::public.admin_role[]) and role <> 'owner');
