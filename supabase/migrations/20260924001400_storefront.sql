-- =============================================================================
-- API de la tienda (storefront)
--   store_catalog()           -> todo el catálogo público en una sola llamada (cacheable)
--   store_validate_promotion  -> vista previa de un código de descuento
--   store_link_customer()     -> vincula al cliente con su cuenta al iniciar sesión
-- =============================================================================

-- Catálogo público: solo productos activos publicados en el canal principal,
-- con el precio vigente (listas de precios incluidas) y el stock de la sucursal principal.
create or replace function public.store_catalog() returns jsonb
language sql stable security definer set search_path = public as $$
  with st as (select * from public.store limit 1),
  v as (
    select pv.product_id,
           jsonb_agg(jsonb_build_object(
             'id', pv.id, 'title', pv.title, 'sku', pv.sku,
             'allow_backorder', pv.allow_backorder, 'manage_inventory', pv.manage_inventory,
             'price', vp.amount, 'compare_at', vp.compare_at_amount,
             'available', coalesce((
               select min(floor(coalesce(il.available_quantity, 0)::numeric / vi.required_quantity))::int
               from public.product_variant_inventory_item vi
               left join public.inventory_level il on il.inventory_item_id = vi.inventory_item_id and il.location_id = (select default_location_id from st)
               where vi.variant_id = pv.id), 0),
             'options', coalesce((
               select jsonb_object_agg(po.title, ov.value)
               from public.product_variant_option pvo
               join public.product_option_value ov on ov.id = pvo.option_value_id
               join public.product_option po on po.id = ov.option_id
               where pvo.variant_id = pv.id), '{}')
           ) order by pv.variant_rank) as variants
    from public.product_variant pv
    cross join lateral internal.variant_price(pv.id, (select default_currency_code from st)) vp
    where pv.deleted_at is null and vp.amount is not null
    group by pv.product_id
  )
  select jsonb_build_object(
    'products', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id, 'handle', p.handle, 'title', p.title, 'description', p.description, 'vendor', p.vendor,
        'thumbnail', p.thumbnail, 'created_at', p.created_at,
        'images', (select coalesce(jsonb_agg(i.url order by i.rank), '[]') from public.product_image i where i.product_id = p.id),
        'tags', (select coalesce(jsonb_agg(t.value), '[]') from public.product_tags x join public.product_tag t on t.id = x.tag_id where x.product_id = p.id),
        'categories', (select coalesce(jsonb_agg(c.handle), '[]') from public.product_category_product cp
                       join public.product_category c on c.id = cp.category_id where cp.product_id = p.id and c.is_active and c.deleted_at is null),
        'collections', (select coalesce(jsonb_agg(c.handle), '[]') from public.product_collection_product cp
                        join public.product_collection c on c.id = cp.collection_id where cp.product_id = p.id and c.deleted_at is null),
        'options', (select coalesce(jsonb_agg(jsonb_build_object('title', o.title,
                      'values', (select coalesce(jsonb_agg(ov.value order by ov.rank), '[]') from public.product_option_value ov where ov.option_id = o.id))
                    order by o.rank), '[]') from public.product_option o where o.product_id = p.id),
        'variants', v.variants
      ) order by p.created_at)
      from public.product p
      join v on v.product_id = p.id
      where p.status = 'active' and p.deleted_at is null
        and exists (select 1 from public.product_sales_channel ps where ps.product_id = p.id and ps.sales_channel_id = (select default_sales_channel_id from st))
    ), '[]'),
    'collections', coalesce((
      select jsonb_agg(jsonb_build_object('handle', c.handle, 'title', c.title, 'description', c.description, 'image_url', c.image_url,
        'product_handles', (select coalesce(jsonb_agg(p.handle order by cp.rank), '[]') from public.product_collection_product cp
                            join public.product p on p.id = cp.product_id where cp.collection_id = c.id and p.status = 'active' and p.deleted_at is null)))
      from public.product_collection c where c.deleted_at is null), '[]'),
    'categories', coalesce((
      select jsonb_agg(jsonb_build_object('id', c.id, 'handle', c.handle, 'name', c.name, 'description', c.description,
                                          'parent_id', c.parent_category_id, 'rank', c.rank) order by c.rank)
      from public.product_category c where c.is_active and not c.is_internal and c.deleted_at is null), '[]'),
    'shipping_options', coalesce((
      select jsonb_agg(jsonb_build_object('id', so.id, 'name', so.name, 'amount', so.amount, 'free_over_amount', so.free_over_amount,
        'delivery_estimate', so.delivery_estimate, 'type', sz.type, 'location_id', sz.stock_location_id,
        'departments', (select coalesce(jsonb_agg(g.department), '[]') from public.geo_zone g where g.service_zone_id = sz.id)) order by so.rank)
      from public.shipping_option so join public.service_zone sz on sz.id = so.service_zone_id
      where so.is_enabled and so.deleted_at is null), '[]'),
    'locations', coalesce((
      select jsonb_agg(jsonb_build_object('id', l.id, 'name', l.name, 'address_1', l.address_1, 'district', l.district, 'province', l.province,
        'department', l.department, 'postal_code', l.postal_code, 'phone', l.phone, 'is_pickup_enabled', l.is_pickup_enabled) order by l.created_at)
      from public.stock_location l where l.is_active and l.deleted_at is null), '[]'),
    'store', (select jsonb_build_object('name', name, 'email', email, 'phone', phone, 'whatsapp', whatsapp, 'address', address,
                                        'currency_code', default_currency_code) from st)
  )
$$;

-- Vista previa de un código: { valid, code, type, discount, free_shipping, message }.
-- p_items: [{ "variant_id": uuid, "quantity": 1 }]  (precios leídos del servidor)
create or replace function public.store_validate_promotion(p_code text, p_items jsonb) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_currency text := (select default_currency_code from public.store limit 1);
  v_promo record;
  v_subtotal numeric := 0;
  v_eligible numeric;
  v_targets uuid[];
  v_discount numeric := 0;
begin
  select coalesce(sum(vp.amount * (i->>'quantity')::int), 0) into v_subtotal
  from jsonb_array_elements(coalesce(p_items, '[]')) i
  cross join lateral internal.variant_price((i->>'variant_id')::uuid, v_currency) vp;

  select pr.*, am.type as am_type, am.target_type, am.value into v_promo
  from public.promotion pr join public.promotion_application_method am on am.promotion_id = pr.id
  where upper(pr.code) = upper(trim(p_code)) and pr.status = 'active' and pr.deleted_at is null
    and (pr.starts_at is null or pr.starts_at <= now()) and (pr.ends_at is null or pr.ends_at > now())
    and (pr.usage_limit is null or pr.usage_count < pr.usage_limit);
  if v_promo.id is null then
    return jsonb_build_object('valid', false, 'message', 'El código no es válido o ya expiró.');
  end if;

  if exists (select 1 from public.promotion_rule r where r.promotion_id = v_promo.id and r.rule_type = 'rules'
             and r.attribute = 'subtotal' and r.operator = 'gte' and v_subtotal < (r.values->>0)::numeric) then
    return jsonb_build_object('valid', false, 'message',
      'Este código requiere una compra mínima de S/. ' || (select to_char((r.values->>0)::numeric, 'FM999G990D00') from public.promotion_rule r
        where r.promotion_id = v_promo.id and r.attribute = 'subtotal' limit 1) || '.');
  end if;

  select array_agg(x::uuid) into v_targets from public.promotion_rule r, jsonb_array_elements_text(r.values) x
  where r.promotion_id = v_promo.id and r.rule_type = 'target_rules' and r.attribute = 'items.product_id';

  v_eligible := case when v_promo.target_type = 'items' and v_targets is not null then
      (select coalesce(sum(vp.amount * (i->>'quantity')::int), 0)
       from jsonb_array_elements(p_items) i
       join public.product_variant pv on pv.id = (i->>'variant_id')::uuid
       cross join lateral internal.variant_price(pv.id, v_currency) vp
       where pv.product_id = any (v_targets))
    else v_subtotal end;

  if v_promo.target_type = 'items' and v_eligible = 0 then
    return jsonb_build_object('valid', false, 'message', 'Este código no aplica a los productos de tu carrito.');
  end if;

  v_discount := case v_promo.am_type
    when 'percentage' then round(v_eligible * v_promo.value / 100, 2)
    when 'fixed' then least(v_promo.value, v_eligible)
    else 0 end;

  return jsonb_build_object('valid', true, 'code', upper(v_promo.code), 'type', v_promo.am_type, 'value', v_promo.value,
                            'discount', v_discount, 'free_shipping', v_promo.am_type = 'free_shipping',
                            'message', case v_promo.am_type when 'free_shipping' then 'Envío gratis aplicado' else 'Descuento aplicado' end);
end $$;

-- Al iniciar sesión en la tienda: devuelve (o crea) el cliente de esa cuenta.
-- Si ya compró como invitado con el mismo correo, se vinculan sus pedidos anteriores.
create or replace function public.store_link_customer() returns public.customer
language plpgsql security definer set search_path = public as $$
declare
  v_user auth.users;
  v_customer public.customer;
begin
  if auth.uid() is null then raise exception 'Debes iniciar sesión' using errcode = '42501'; end if;
  select * into v_customer from public.customer where auth_user_id = auth.uid();
  if v_customer.id is not null then return v_customer; end if;

  select * into v_user from auth.users where id = auth.uid();
  update public.customer set auth_user_id = v_user.id, has_account = true
   where lower(email) = lower(v_user.email) and auth_user_id is null and deleted_at is null
  returning * into v_customer;
  if v_customer.id is null then
    insert into public.customer (email, auth_user_id, has_account) values (lower(v_user.email), v_user.id, true)
    returning * into v_customer;
  end if;
  return v_customer;
end $$;

grant execute on function public.store_catalog() to anon, authenticated;
grant execute on function public.store_validate_promotion(text, jsonb) to anon, authenticated;
grant execute on function public.store_link_customer() to authenticated;

-- El cliente puede ver cómo pagó sus propios pedidos.
create policy customer_self on public.order_transaction for select to authenticated
  using (exists (select 1 from public.orders o join public.customer c on c.id = o.customer_id where o.id = order_id and c.auth_user_id = auth.uid()));

-- El cliente edita su perfil solo por RPC: la política de UPDATE directa le permitía
-- cambiar también campos internos (nota del equipo, etiquetas, correo).
drop policy if exists customer_self_update on public.customer;

create or replace function public.store_update_customer(p jsonb) returns public.customer
language plpgsql security definer set search_path = public as $$
declare
  v_customer public.customer;
begin
  if auth.uid() is null then raise exception 'Debes iniciar sesión' using errcode = '42501'; end if;
  update public.customer set
    first_name = case when p ? 'first_name' then nullif(trim(p->>'first_name'), '') else first_name end,
    last_name = case when p ? 'last_name' then nullif(trim(p->>'last_name'), '') else last_name end,
    phone = case when p ? 'phone' then nullif(trim(p->>'phone'), '') else phone end,
    accepts_marketing = coalesce((p->>'accepts_marketing')::boolean, accepts_marketing)
  where auth_user_id = auth.uid()
  returning * into v_customer;
  if v_customer.id is null then raise exception 'Cliente no encontrado'; end if;
  return v_customer;
end $$;

grant execute on function public.store_update_customer(jsonb) to authenticated;
