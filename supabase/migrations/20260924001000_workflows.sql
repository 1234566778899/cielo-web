-- =============================================================================
-- Workflows: operaciones de negocio que tocan varios módulos en UNA transacción.
-- (Equivalente a los workflows de Medusa: createProductsWorkflow, completeCart…)
--
--   internal.*  -> implementación (sin chequeo de permisos, la usa el seed)
--   public.admin_* -> expuestas por la API; exigen ser administrador
--   public.store_* -> expuestas a la tienda (anon / clientes)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Utilidades
-- -----------------------------------------------------------------------------
create or replace function internal.store_defaults()
returns table (currency_code text, region_id uuid, sales_channel_id uuid, location_id uuid, country_code text)
language sql stable as $$
  select s.default_currency_code, s.default_region_id, s.default_sales_channel_id, s.default_location_id,
         coalesce((select rc.iso_2 from public.region_country rc where rc.region_id = s.default_region_id limit 1), 'pe')
  from public.store s limit 1
$$;

create or replace function internal.add_order_event(p_order_id uuid, p_type text, p_message text, p_data jsonb default '{}')
returns void language sql as $$
  insert into public.order_event (order_id, type, message, data, actor_id)
  values (p_order_id, p_type, p_message, coalesce(p_data, '{}'), auth.uid())
$$;

-- -----------------------------------------------------------------------------
-- Inventario: fijar o sumar/restar stock en una sucursal (con historial)
-- -----------------------------------------------------------------------------
create or replace function internal.adjust_inventory(
  p_inventory_item_id uuid, p_location_id uuid, p_quantity int,
  p_mode text default 'delta', p_reason public.inventory_adjustment_reason default 'correction',
  p_note text default null, p_reference_id uuid default null
) returns public.inventory_level
language plpgsql as $$
declare
  v_level public.inventory_level;
  v_old int;
  v_new int;
begin
  insert into public.inventory_level (inventory_item_id, location_id)
  values (p_inventory_item_id, p_location_id)
  on conflict (inventory_item_id, location_id) do nothing;

  select * into v_level from public.inventory_level
   where inventory_item_id = p_inventory_item_id and location_id = p_location_id for update;

  v_old := v_level.stocked_quantity;
  v_new := case when p_mode = 'set' then p_quantity else v_old + p_quantity end;
  if v_new = v_old then
    return v_level;
  end if;

  update public.inventory_level set stocked_quantity = v_new where id = v_level.id returning * into v_level;

  insert into public.inventory_adjustment (inventory_item_id, location_id, delta, quantity_after, reason, note, reference_id, created_by)
  values (p_inventory_item_id, p_location_id, v_new - v_old, v_new, p_reason, p_note, p_reference_id, auth.uid());
  return v_level;
end $$;

create or replace function public.admin_adjust_inventory(
  p_inventory_item_id uuid, p_location_id uuid, p_quantity int,
  p_mode text default 'delta', p_reason public.inventory_adjustment_reason default 'correction', p_note text default null
) returns public.inventory_level
language plpgsql security definer set search_path = public as $$
begin
  perform internal.assert_admin();
  if p_mode not in ('delta', 'set') then raise exception 'Modo inválido: %', p_mode; end if;
  return internal.adjust_inventory(p_inventory_item_id, p_location_id, p_quantity, p_mode, p_reason, p_note);
end $$;

-- -----------------------------------------------------------------------------
-- Productos: crear/editar un producto completo en una sola llamada
-- -----------------------------------------------------------------------------
-- Payload (todas las claves son opcionales al editar; solo se sincroniza lo enviado):
-- {
--   "id": uuid, "title", "subtitle", "handle", "description", "status": "draft|active|archived",
--   "vendor", "type": "Ramo", "discountable", "weight", "seo_title", "seo_description", "metadata": {},
--   "tags": ["rojo"], "collection_ids": [uuid], "category_ids": [uuid], "sales_channel_ids": [uuid],
--   "images": [{ "url", "alt" }],
--   "options": [{ "title": "Color", "values": ["Rosa", "Blanco"] }],
--   "variants": [{
--      "id", "title", "sku", "barcode", "allow_backorder", "manage_inventory", "weight", "cost_amount",
--      "options": { "Color": "Rosa" },
--      "prices": [{ "currency_code": "pen", "amount": 99.9, "compare_at_amount": 129.9 }],
--      "inventory": [{ "location_id": uuid, "stocked_quantity": 10 }]
--   }]
-- }
create or replace function internal.upsert_product(p jsonb) returns uuid
language plpgsql as $$
declare
  v_id uuid := nullif(p->>'id', '')::uuid;
  v_handle text;
  v_type_id uuid;
  v_opt jsonb;
  v_val text;
  v_option_id uuid;
  v_var jsonb;
  v_variant_id uuid;
  v_keep_variants uuid[] := '{}';
  v_price jsonb;
  v_inv jsonb;
  v_item_id uuid;
  v_title text;
  v_rank int := 0;
  v_defaults record;
begin
  select * into v_defaults from internal.store_defaults();

  if p ? 'type' then
    if nullif(p->>'type', '') is null then
      v_type_id := null;
    else
      insert into public.product_type (value) values (p->>'type') on conflict (value) do nothing;
      select id into v_type_id from public.product_type where value = p->>'type';
    end if;
  end if;

  if v_id is null then
    v_handle := coalesce(nullif(p->>'handle', ''), internal.slugify(p->>'title'));
    while exists (select 1 from public.product where handle = v_handle) loop
      v_handle := v_handle || '-' || substr(md5(random()::text), 1, 4);
    end loop;
    insert into public.product (title, subtitle, handle, description, status, vendor, type_id, discountable,
                                weight, origin_country, hs_code, material, seo_title, seo_description, metadata)
    values (p->>'title', p->>'subtitle', v_handle, p->>'description',
            coalesce((p->>'status')::public.product_status, 'draft'), p->>'vendor', v_type_id,
            coalesce((p->>'discountable')::boolean, true), (p->>'weight')::numeric, p->>'origin_country',
            p->>'hs_code', p->>'material', p->>'seo_title', p->>'seo_description', coalesce(p->'metadata', '{}'))
    returning id into v_id;
    if not p ? 'sales_channel_ids' and v_defaults.sales_channel_id is not null then
      insert into public.product_sales_channel values (v_id, v_defaults.sales_channel_id) on conflict do nothing;
    end if;
  else
    update public.product set
      title = coalesce(p->>'title', title),
      subtitle = case when p ? 'subtitle' then p->>'subtitle' else subtitle end,
      handle = coalesce(nullif(p->>'handle', ''), handle),
      description = case when p ? 'description' then p->>'description' else description end,
      status = coalesce((p->>'status')::public.product_status, status),
      vendor = case when p ? 'vendor' then p->>'vendor' else vendor end,
      type_id = case when p ? 'type' then v_type_id else type_id end,
      discountable = coalesce((p->>'discountable')::boolean, discountable),
      weight = case when p ? 'weight' then (p->>'weight')::numeric else weight end,
      origin_country = case when p ? 'origin_country' then p->>'origin_country' else origin_country end,
      seo_title = case when p ? 'seo_title' then p->>'seo_title' else seo_title end,
      seo_description = case when p ? 'seo_description' then p->>'seo_description' else seo_description end,
      metadata = case when p ? 'metadata' then p->'metadata' else metadata end
    where id = v_id and deleted_at is null;
    if not found then raise exception 'Producto no encontrado'; end if;
  end if;

  -- Etiquetas
  if p ? 'tags' then
    delete from public.product_tags where product_id = v_id;
    insert into public.product_tag (value)
      select distinct trim(t) from jsonb_array_elements_text(p->'tags') t where trim(t) <> ''
    on conflict (value) do nothing;
    insert into public.product_tags (product_id, tag_id)
      select v_id, pt.id from public.product_tag pt
      where pt.value in (select trim(t) from jsonb_array_elements_text(p->'tags') t);
  end if;

  -- Colecciones, categorías y canales de venta (links)
  if p ? 'collection_ids' then
    delete from public.product_collection_product where product_id = v_id;
    insert into public.product_collection_product (collection_id, product_id)
      select c::uuid, v_id from jsonb_array_elements_text(p->'collection_ids') c on conflict do nothing;
  end if;
  if p ? 'category_ids' then
    delete from public.product_category_product where product_id = v_id;
    insert into public.product_category_product (category_id, product_id)
      select c::uuid, v_id from jsonb_array_elements_text(p->'category_ids') c on conflict do nothing;
  end if;
  if p ? 'sales_channel_ids' then
    delete from public.product_sales_channel where product_id = v_id;
    insert into public.product_sales_channel (product_id, sales_channel_id)
      select v_id, c::uuid from jsonb_array_elements_text(p->'sales_channel_ids') c on conflict do nothing;
  end if;

  -- Imágenes (se reemplazan en el orden recibido; la primera es la miniatura)
  if p ? 'images' then
    delete from public.product_image where product_id = v_id;
    insert into public.product_image (product_id, url, alt, rank)
      select v_id, img->>'url', img->>'alt', (ord - 1)::int
      from jsonb_array_elements(p->'images') with ordinality as t(img, ord);
    update public.product set thumbnail = (select url from public.product_image where product_id = v_id order by rank limit 1)
    where id = v_id;
  end if;

  -- Opciones
  if p ? 'options' then
    delete from public.product_option
     where product_id = v_id and title not in (select o->>'title' from jsonb_array_elements(p->'options') o);
    v_rank := 0;
    for v_opt in select * from jsonb_array_elements(p->'options') loop
      insert into public.product_option (product_id, title, rank) values (v_id, v_opt->>'title', v_rank)
      on conflict (product_id, title) do update set rank = excluded.rank
      returning id into v_option_id;
      delete from public.product_option_value
       where option_id = v_option_id and value not in (select jsonb_array_elements_text(v_opt->'values'));
      insert into public.product_option_value (option_id, value, rank)
        select v_option_id, val, (ord - 1)::int from jsonb_array_elements_text(v_opt->'values') with ordinality as t(val, ord)
      on conflict (option_id, value) do update set rank = excluded.rank;
      v_rank := v_rank + 1;
    end loop;
  end if;

  -- Variantes
  if p ? 'variants' then
    v_rank := 0;
    for v_var in select * from jsonb_array_elements(p->'variants') loop
      v_variant_id := nullif(v_var->>'id', '')::uuid;
      v_title := coalesce(nullif(v_var->>'title', ''),
        (select string_agg(value, ' / ' order by ord) from jsonb_each_text(coalesce(v_var->'options', '{}')) with ordinality as t(key, value, ord)),
        'Predeterminado');

      if v_variant_id is null then
        insert into public.product_variant (product_id, title, sku, barcode, allow_backorder, manage_inventory, weight, cost_amount, variant_rank, metadata)
        values (v_id, v_title, nullif(v_var->>'sku', ''), nullif(v_var->>'barcode', ''),
                coalesce((v_var->>'allow_backorder')::boolean, false), coalesce((v_var->>'manage_inventory')::boolean, true),
                (v_var->>'weight')::numeric, (v_var->>'cost_amount')::numeric, v_rank, coalesce(v_var->'metadata', '{}'))
        returning id into v_variant_id;
      else
        update public.product_variant set
          title = v_title, sku = nullif(v_var->>'sku', ''), barcode = nullif(v_var->>'barcode', ''),
          allow_backorder = coalesce((v_var->>'allow_backorder')::boolean, allow_backorder),
          manage_inventory = coalesce((v_var->>'manage_inventory')::boolean, manage_inventory),
          weight = (v_var->>'weight')::numeric, cost_amount = (v_var->>'cost_amount')::numeric,
          variant_rank = v_rank, deleted_at = null
        where id = v_variant_id and product_id = v_id;
      end if;
      v_keep_variants := v_keep_variants || v_variant_id;

      -- Valores de opción de la variante
      if v_var ? 'options' then
        delete from public.product_variant_option where variant_id = v_variant_id;
        insert into public.product_variant_option (variant_id, option_value_id)
          select v_variant_id, ov.id
          from jsonb_each_text(v_var->'options') kv
          join public.product_option po on po.product_id = v_id and po.title = kv.key
          join public.product_option_value ov on ov.option_id = po.id and ov.value = kv.value;
      end if;

      -- Precios base por moneda
      if v_var ? 'prices' then
        delete from public.price
         where variant_id = v_variant_id and price_list_id is null and region_id is null
           and currency_code not in (select pr->>'currency_code' from jsonb_array_elements(v_var->'prices') pr);
        for v_price in select * from jsonb_array_elements(v_var->'prices') loop
          insert into public.price (variant_id, currency_code, amount, compare_at_amount)
          values (v_variant_id, v_price->>'currency_code', (v_price->>'amount')::numeric, nullif(v_price->>'compare_at_amount', '')::numeric)
          on conflict (variant_id, currency_code) where price_list_id is null and region_id is null
          do update set amount = excluded.amount, compare_at_amount = excluded.compare_at_amount;
        end loop;
      end if;

      -- Ítem de inventario (uno por variante, con el mismo SKU) y stock por sucursal
      select inventory_item_id into v_item_id from public.product_variant_inventory_item where variant_id = v_variant_id limit 1;
      if v_item_id is null then
        insert into public.inventory_item (sku, title, weight)
        values (nullif(v_var->>'sku', ''), (p->>'title') || case when v_title <> 'Predeterminado' then ' - ' || v_title else '' end, (v_var->>'weight')::numeric)
        returning id into v_item_id;
        insert into public.product_variant_inventory_item (variant_id, inventory_item_id) values (v_variant_id, v_item_id);
      else
        update public.inventory_item set sku = nullif(v_var->>'sku', ''), weight = (v_var->>'weight')::numeric where id = v_item_id;
      end if;

      if v_var ? 'inventory' then
        for v_inv in select * from jsonb_array_elements(v_var->'inventory') loop
          perform internal.adjust_inventory(v_item_id, (v_inv->>'location_id')::uuid, coalesce((v_inv->>'stocked_quantity')::int, 0), 'set', 'correction', 'Actualizado desde el producto');
        end loop;
      end if;

      v_rank := v_rank + 1;
    end loop;

    update public.product_variant set deleted_at = now()
     where product_id = v_id and deleted_at is null and not (id = any (v_keep_variants));
  end if;

  return v_id;
end $$;

create or replace function public.admin_upsert_product(p jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
begin
  perform internal.assert_admin();
  if coalesce(nullif(trim(p->>'title'), ''), case when p ? 'id' then 'x' end) is null then
    raise exception 'El título es obligatorio';
  end if;
  return internal.upsert_product(p);
end $$;

create or replace function public.admin_set_products_status(p_ids uuid[], p_status public.product_status) returns int
language plpgsql security definer set search_path = public as $$
declare v_count int;
begin
  perform internal.assert_admin();
  update public.product set status = p_status where id = any (p_ids) and deleted_at is null;
  get diagnostics v_count = row_count;
  return v_count;
end $$;

create or replace function public.admin_delete_products(p_ids uuid[]) returns int
language plpgsql security definer set search_path = public as $$
declare v_count int;
begin
  perform internal.assert_admin();
  update public.product set deleted_at = now(), handle = handle || '-deleted-' || substr(md5(random()::text), 1, 6)
   where id = any (p_ids) and deleted_at is null;
  get diagnostics v_count = row_count;
  update public.product_variant set deleted_at = now() where product_id = any (p_ids) and deleted_at is null;
  return v_count;
end $$;

-- -----------------------------------------------------------------------------
-- Pedidos: estado de preparación y estado general a partir de los datos
-- -----------------------------------------------------------------------------
create or replace function internal.recalc_order_status(p_order_id uuid) returns void
language plpgsql as $$
declare
  v_order public.orders;
  v_total int; v_done int;
  v_active int; v_shipped int; v_delivered int;
  v_fs public.fulfillment_status;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if v_order.status = 'canceled' then return; end if;

  select coalesce(sum(quantity), 0), coalesce(sum(fulfilled_quantity), 0) into v_total, v_done
    from public.order_line_item where order_id = p_order_id;
  select count(*), count(*) filter (where shipped_at is not null), count(*) filter (where delivered_at is not null)
    into v_active, v_shipped, v_delivered
    from public.fulfillment where order_id = p_order_id and canceled_at is null;

  v_fs := case
    when v_done = 0 then 'not_fulfilled'
    when v_done < v_total then 'partially_fulfilled'
    when v_active > 0 and v_delivered = v_active then 'delivered'
    when v_active > 0 and v_shipped = v_active then 'shipped'
    else 'fulfilled' end;

  update public.orders set
    fulfillment_status = v_fs,
    status = case
      when v_fs in ('fulfilled', 'shipped', 'delivered') and payment_status in ('captured', 'partially_refunded', 'refunded') then 'completed'::public.order_status
      when status = 'archived' then status
      else 'pending'::public.order_status end
  where id = p_order_id;
end $$;

-- Reserva stock para una línea en una sucursal (según los ítems de inventario de la variante).
create or replace function internal.reserve_line(p_line public.order_line_item, p_location_id uuid) returns void
language plpgsql as $$
declare v_link record;
begin
  for v_link in
    select vi.inventory_item_id, vi.required_quantity
    from public.product_variant_inventory_item vi
    join public.product_variant pv on pv.id = vi.variant_id
    where vi.variant_id = p_line.variant_id and pv.manage_inventory
  loop
    insert into public.inventory_level (inventory_item_id, location_id) values (v_link.inventory_item_id, p_location_id)
    on conflict (inventory_item_id, location_id) do nothing;
    update public.inventory_level set reserved_quantity = reserved_quantity + p_line.quantity * v_link.required_quantity
     where inventory_item_id = v_link.inventory_item_id and location_id = p_location_id;
    insert into public.reservation_item (inventory_item_id, location_id, line_item_id, quantity, description)
    values (v_link.inventory_item_id, p_location_id, p_line.id, p_line.quantity * v_link.required_quantity, 'Pedido');
  end loop;
end $$;

-- Libera hasta p_qty unidades reservadas de una línea (todas si es null).
create or replace function internal.release_line(p_line_id uuid, p_qty int default null) returns void
language plpgsql as $$
declare
  v_res record;
  v_take int;
  v_left int := p_qty;
begin
  for v_res in select r.*, vi.required_quantity from public.reservation_item r
               join public.order_line_item li on li.id = r.line_item_id
               join public.product_variant_inventory_item vi on vi.variant_id = li.variant_id and vi.inventory_item_id = r.inventory_item_id
               where r.line_item_id = p_line_id for update of r loop
    v_take := case when v_left is null then v_res.quantity else least(v_res.quantity, v_left * v_res.required_quantity) end;
    exit when v_take <= 0;
    update public.inventory_level set reserved_quantity = greatest(0, reserved_quantity - v_take)
     where inventory_item_id = v_res.inventory_item_id and location_id = v_res.location_id;
    if v_take >= v_res.quantity then
      delete from public.reservation_item where id = v_res.id;
    else
      update public.reservation_item set quantity = quantity - v_take where id = v_res.id;
    end if;
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- Crear pedido (checkout de la tienda o pedido manual desde el admin)
-- -----------------------------------------------------------------------------
-- {
--   "email", "phone", "customer": { "first_name", "last_name", "accepts_marketing" },
--   "shipping_address": { first_name, last_name, address_1, address_2, district, province, department, phone },
--   "items": [{ "variant_id", "quantity", "metadata": { "gift_wrap": true } }],
--   "shipping_option_id", "promotion_code", "note", "source",
--   "payment": { "provider": "card|yape|plin|transfer|cash", "captured": false, "reference" },
--   "created_at"   (solo seed: fechar pedidos en el pasado)
-- }
create or replace function internal.place_order(p jsonb) returns public.orders
language plpgsql as $$
declare
  v_def record;
  v_customer_id uuid;
  v_order public.orders;
  v_item jsonb;
  v_variant record;
  v_price record;
  v_lines jsonb := '[]';
  v_subtotal numeric := 0;
  v_discount numeric := 0;
  v_shipping numeric := 0;
  v_option record;
  v_location_id uuid;
  v_is_pickup boolean := false;
  v_promo record;
  v_promo_id uuid;
  v_promo_code text;
  v_free_shipping boolean := false;
  v_target_ids uuid[];
  v_eligible numeric;
  v_rate numeric;
  v_total numeric;
  v_line public.order_line_item;
  v_line_json jsonb;
  v_available int;
  v_count int := 0;
  v_created timestamptz := coalesce((p->>'created_at')::timestamptz, now());
begin
  select * into v_def from internal.store_defaults();
  if v_def.currency_code is null then raise exception 'La tienda no está configurada'; end if;
  if jsonb_array_length(coalesce(p->'items', '[]')) = 0 then raise exception 'El pedido no tiene productos'; end if;
  if nullif(trim(p->>'email'), '') is null then raise exception 'El correo es obligatorio'; end if;

  -- Envío / recojo
  if p ? 'shipping_option_id' then
    select so.*, sz.type as zone_type, sz.stock_location_id into v_option
    from public.shipping_option so join public.service_zone sz on sz.id = so.service_zone_id
    where so.id = (p->>'shipping_option_id')::uuid and so.is_enabled and so.deleted_at is null;
    if v_option.id is null then raise exception 'Método de envío no disponible'; end if;
    v_is_pickup := v_option.zone_type = 'pickup';
  end if;
  v_location_id := coalesce(case when v_is_pickup then v_option.stock_location_id end, v_def.location_id);

  -- Líneas: precio real del servidor + validación de stock
  for v_item in select * from jsonb_array_elements(p->'items') loop
    select pv.*, pr.title as product_title, pr.thumbnail, pr.status as product_status, pr.id as pid
      into v_variant
      from public.product_variant pv join public.product pr on pr.id = pv.product_id
     where pv.id = (v_item->>'variant_id')::uuid and pv.deleted_at is null and pr.deleted_at is null;
    if v_variant.id is null or v_variant.product_status <> 'active' then
      raise exception 'Producto no disponible: %', v_item->>'variant_id';
    end if;
    select * into v_price from internal.variant_price(v_variant.id, v_def.currency_code);
    if v_price.amount is null then raise exception 'El producto % no tiene precio', v_variant.product_title; end if;

    if v_variant.manage_inventory and not v_variant.allow_backorder then
      select min(floor(coalesce(il.available_quantity, 0)::numeric / vi.required_quantity))::int into v_available
        from public.product_variant_inventory_item vi
        left join public.inventory_level il on il.inventory_item_id = vi.inventory_item_id and il.location_id = v_location_id
       where vi.variant_id = v_variant.id;
      if coalesce(v_available, 0) < (v_item->>'quantity')::int then
        raise exception 'Stock insuficiente para %', v_variant.product_title;
      end if;
    end if;

    v_lines := v_lines || jsonb_build_object(
      'variant_id', v_variant.id, 'product_id', v_variant.pid, 'title', v_variant.product_title,
      'subtitle', nullif(v_variant.title, 'Predeterminado'), 'sku', v_variant.sku, 'thumbnail', v_variant.thumbnail,
      'quantity', (v_item->>'quantity')::int, 'unit_price', v_price.amount, 'compare_at', v_price.compare_at_amount,
      'metadata', coalesce(v_item->'metadata', '{}'));
    v_subtotal := v_subtotal + v_price.amount * (v_item->>'quantity')::int;
    v_count := v_count + (v_item->>'quantity')::int;
  end loop;

  -- Promoción
  if nullif(trim(p->>'promotion_code'), '') is not null then
    select pr.*, am.type as am_type, am.target_type, am.value into v_promo
      from public.promotion pr join public.promotion_application_method am on am.promotion_id = pr.id
     where upper(pr.code) = upper(trim(p->>'promotion_code')) and pr.status = 'active' and pr.deleted_at is null
       and (pr.starts_at is null or pr.starts_at <= now()) and (pr.ends_at is null or pr.ends_at > now())
       and (pr.usage_limit is null or pr.usage_count < pr.usage_limit);
    if v_promo.id is null then raise exception 'El código de descuento no es válido'; end if;
    if exists (select 1 from public.promotion_rule r where r.promotion_id = v_promo.id and r.rule_type = 'rules'
               and r.attribute = 'subtotal' and r.operator = 'gte' and v_subtotal < (r.values->>0)::numeric) then
      raise exception 'Tu compra no alcanza el mínimo para este descuento';
    end if;

    select array_agg(v::uuid) into v_target_ids from public.promotion_rule r, jsonb_array_elements_text(r.values) v
     where r.promotion_id = v_promo.id and r.rule_type = 'target_rules' and r.attribute = 'items.product_id';
    v_eligible := case when v_promo.target_type = 'items' and v_target_ids is not null
      then (select coalesce(sum((l->>'unit_price')::numeric * (l->>'quantity')::int), 0) from jsonb_array_elements(v_lines) l
            where (l->>'product_id')::uuid = any (v_target_ids))
      else v_subtotal end;
    v_discount := case v_promo.am_type
      when 'percentage' then round(v_eligible * v_promo.value / 100, 2)
      when 'fixed' then least(v_promo.value, v_eligible)
      else 0 end;
    v_promo_id := v_promo.id;
    v_promo_code := upper(v_promo.code);
    v_free_shipping := v_promo.am_type = 'free_shipping';
  end if;

  if v_option.id is not null then
    v_shipping := case
      when v_free_shipping then 0
      when v_option.free_over_amount is not null and v_subtotal - v_discount >= v_option.free_over_amount then 0
      else v_option.amount end;
  end if;

  v_total := v_subtotal - v_discount + v_shipping;
  v_rate := internal.default_tax_rate(v_def.country_code);
  -- Cliente
  select id into v_customer_id from public.customer where lower(email) = lower(trim(p->>'email')) and deleted_at is null;
  if v_customer_id is null then
    insert into public.customer (email, first_name, last_name, phone, accepts_marketing, created_at)
    values (lower(trim(p->>'email')), coalesce(p->'customer'->>'first_name', p->'shipping_address'->>'first_name'),
            coalesce(p->'customer'->>'last_name', p->'shipping_address'->>'last_name'),
            coalesce(p->>'phone', p->'shipping_address'->>'phone'),
            coalesce((p->'customer'->>'accepts_marketing')::boolean, false), v_created)
    returning id into v_customer_id;
  end if;

  insert into public.orders (customer_id, email, phone, region_id, sales_channel_id, currency_code,
                             shipping_address, billing_address, subtotal, discount_total, shipping_total, tax_total, total,
                             item_count, note, source, created_at, payment_status)
  values (v_customer_id, lower(trim(p->>'email')), coalesce(p->>'phone', p->'shipping_address'->>'phone'),
          v_def.region_id, v_def.sales_channel_id, v_def.currency_code,
          p->'shipping_address', coalesce(p->'billing_address', p->'shipping_address'),
          v_subtotal, v_discount, v_shipping, round(v_total - v_total / (1 + v_rate / 100), 2), v_total,
          v_count, p->>'note', coalesce(p->>'source', 'web'), v_created,
          case when p->'payment'->>'provider' is not null then 'awaiting'::public.payment_status else 'not_paid' end)
  returning * into v_order;

  for v_line_json in select * from jsonb_array_elements(v_lines) loop
    insert into public.order_line_item (order_id, variant_id, product_id, title, subtitle, sku, thumbnail, quantity,
                                        unit_price, compare_at_unit_price, metadata, created_at)
    values (v_order.id, (v_line_json->>'variant_id')::uuid, (v_line_json->>'product_id')::uuid, v_line_json->>'title',
            v_line_json->>'subtitle', v_line_json->>'sku', v_line_json->>'thumbnail', (v_line_json->>'quantity')::int,
            (v_line_json->>'unit_price')::numeric, nullif(v_line_json->>'compare_at', '')::numeric, v_line_json->'metadata', v_created)
    returning * into v_line;
    perform internal.reserve_line(v_line, v_location_id);
  end loop;

  if v_option.id is not null then
    insert into public.order_shipping_method (order_id, shipping_option_id, name, amount, is_pickup, stock_location_id)
    values (v_order.id, v_option.id, v_option.name, v_shipping, v_is_pickup, case when v_is_pickup then v_location_id end);
  end if;

  if v_promo_id is not null then
    insert into public.order_promotion (order_id, promotion_id, code, amount) values (v_order.id, v_promo_id, v_promo_code, v_discount);
    update public.promotion set usage_count = usage_count + 1 where id = v_promo_id;
  end if;

  insert into public.order_event (order_id, type, message, created_at)
  values (v_order.id, 'placed', 'Pedido realizado desde ' || case v_order.source when 'admin' then 'el panel' when 'whatsapp' then 'WhatsApp' else 'la tienda online' end, v_created);

  if p->'payment'->>'provider' is not null then
    insert into public.order_transaction (order_id, kind, status, provider, amount, currency_code, reference, created_at)
    values (v_order.id, case when (p->'payment'->>'captured')::boolean then 'capture' else 'authorization' end::public.transaction_kind,
            case when (p->'payment'->>'captured')::boolean then 'success' else 'pending' end::public.transaction_status,
            p->'payment'->>'provider', v_total, v_def.currency_code, p->'payment'->>'reference', v_created);
    if (p->'payment'->>'captured')::boolean then
      update public.orders set payment_status = 'captured', paid_total = v_total where id = v_order.id;
      insert into public.order_event (order_id, type, message, created_at)
      values (v_order.id, 'paid', 'Pago de ' || v_total || ' recibido (' || (p->'payment'->>'provider') || ')', v_created);
    end if;
  end if;

  select * into v_order from public.orders where id = v_order.id;
  return v_order;
end $$;

-- Checkout de la tienda: nunca marca el pago como cobrado desde el cliente.
create or replace function public.store_place_order(p jsonb) returns public.orders
language plpgsql security definer set search_path = public as $$
declare
  v_order public.orders;
  v_email text;
begin
  v_order := internal.place_order((p - 'created_at') || jsonb_build_object('source', 'web',
               'payment', coalesce(p->'payment', '{}') - 'captured'));
  -- Vincula el cliente con su cuenta si inició sesión con el mismo correo.
  if auth.uid() is not null then
    select email into v_email from auth.users where id = auth.uid();
    update public.customer set auth_user_id = auth.uid(), has_account = true
     where id = v_order.customer_id and auth_user_id is null and lower(email) = lower(v_email);
  end if;
  return v_order;
end $$;

create or replace function public.admin_create_order(p jsonb) returns public.orders
language plpgsql security definer set search_path = public as $$
begin
  perform internal.assert_admin();
  return internal.place_order((p - 'created_at') || jsonb_build_object('source', coalesce(p->>'source', 'admin')));
end $$;

-- -----------------------------------------------------------------------------
-- Preparar pedido (fulfillment): descuenta stock y libera la reserva
-- -----------------------------------------------------------------------------
-- p_items: [{ "line_item_id": uuid, "quantity": 1 }]   (vacío/null = todo lo pendiente)
-- p_tracking: { "company": "Olva Courier", "number": "…", "url": "…" }
create or replace function internal.create_fulfillment(p_order_id uuid, p_location_id uuid, p_items jsonb, p_tracking jsonb, p_mark_shipped boolean)
returns uuid
language plpgsql as $$
declare
  v_order public.orders;
  v_f_id uuid;
  v_it record;
  v_link record;
  v_count int := 0;
  v_location uuid;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if v_order.id is null then raise exception 'Pedido no encontrado'; end if;
  if v_order.status = 'canceled' then raise exception 'El pedido está cancelado'; end if;
  v_location := coalesce(p_location_id, (select location_id from internal.store_defaults()));

  insert into public.fulfillment (order_id, location_id, tracking_company, tracking_number, tracking_url, packed_at, shipped_at, created_by)
  values (p_order_id, v_location, p_tracking->>'company', p_tracking->>'number', p_tracking->>'url', now(),
          case when p_mark_shipped then now() end, auth.uid())
  returning id into v_f_id;

  for v_it in
    select li.*, coalesce((sel->>'quantity')::int, li.quantity - li.fulfilled_quantity) as take
    from public.order_line_item li
    left join lateral (select s from jsonb_array_elements(coalesce(p_items, '[]')) s where (s->>'line_item_id')::uuid = li.id) x(sel) on true
    where li.order_id = p_order_id
      and (jsonb_array_length(coalesce(p_items, '[]')) = 0 or sel is not null)
  loop
    continue when v_it.take <= 0;
    if v_it.take > v_it.quantity - v_it.fulfilled_quantity then
      raise exception 'No puedes preparar más unidades de las pendientes (%).', v_it.title;
    end if;
    insert into public.fulfillment_item (fulfillment_id, line_item_id, quantity) values (v_f_id, v_it.id, v_it.take);
    update public.order_line_item set fulfilled_quantity = fulfilled_quantity + v_it.take where id = v_it.id;
    perform internal.release_line(v_it.id, v_it.take);
    for v_link in select vi.inventory_item_id, vi.required_quantity from public.product_variant_inventory_item vi
                  join public.product_variant pv on pv.id = vi.variant_id
                  where vi.variant_id = v_it.variant_id and pv.manage_inventory loop
      perform internal.adjust_inventory(v_link.inventory_item_id, v_location, -(v_it.take * v_link.required_quantity), 'delta', 'sale',
                                        'Pedido ' || v_order.display_id, p_order_id);
    end loop;
    v_count := v_count + v_it.take;
  end loop;

  if v_count = 0 then raise exception 'No hay artículos pendientes por preparar'; end if;

  perform internal.add_order_event(p_order_id, 'fulfilled',
    case when v_count = 1 then 'Se preparó 1 artículo' else 'Se prepararon ' || v_count || ' artículos' end,
    jsonb_build_object('fulfillment_id', v_f_id, 'tracking', p_tracking));
  if p_mark_shipped then
    perform internal.add_order_event(p_order_id, 'shipped', 'Pedido enviado' || coalesce(' con ' || (p_tracking->>'company'), ''));
  end if;
  perform internal.recalc_order_status(p_order_id);
  return v_f_id;
end $$;

create or replace function public.admin_create_fulfillment(p_order_id uuid, p_location_id uuid default null, p_items jsonb default null,
                                                           p_tracking jsonb default null, p_mark_shipped boolean default false)
returns uuid language plpgsql security definer set search_path = public as $$
begin
  perform internal.assert_admin();
  return internal.create_fulfillment(p_order_id, p_location_id, p_items, p_tracking, p_mark_shipped);
end $$;

-- Acciones sobre una preparación: 'ship' | 'deliver' | 'cancel'
create or replace function public.admin_update_fulfillment(p_fulfillment_id uuid, p_action text, p_tracking jsonb default null)
returns public.fulfillment language plpgsql security definer set search_path = public as $$
declare
  v_f public.fulfillment;
  v_it record;
  v_link record;
begin
  perform internal.assert_admin();
  select * into v_f from public.fulfillment where id = p_fulfillment_id for update;
  if v_f.id is null or v_f.canceled_at is not null then raise exception 'Preparación no encontrada'; end if;

  if p_action = 'ship' then
    update public.fulfillment set shipped_at = coalesce(shipped_at, now()),
      tracking_company = coalesce(p_tracking->>'company', tracking_company),
      tracking_number = coalesce(p_tracking->>'number', tracking_number),
      tracking_url = coalesce(p_tracking->>'url', tracking_url)
    where id = v_f.id returning * into v_f;
    perform internal.add_order_event(v_f.order_id, 'shipped', 'Pedido enviado' || coalesce(' con ' || v_f.tracking_company, ''));
  elsif p_action = 'deliver' then
    update public.fulfillment set shipped_at = coalesce(shipped_at, now()), delivered_at = now() where id = v_f.id returning * into v_f;
    perform internal.add_order_event(v_f.order_id, 'delivered', 'Pedido entregado');
  elsif p_action = 'cancel' then
    if v_f.shipped_at is not null then raise exception 'No puedes cancelar un envío que ya salió'; end if;
    for v_it in select fi.quantity, li.* from public.fulfillment_item fi join public.order_line_item li on li.id = fi.line_item_id
                where fi.fulfillment_id = v_f.id loop
      update public.order_line_item set fulfilled_quantity = fulfilled_quantity - v_it.quantity where id = v_it.id;
      for v_link in select vi.inventory_item_id, vi.required_quantity from public.product_variant_inventory_item vi
                    where vi.variant_id = v_it.variant_id loop
        perform internal.adjust_inventory(v_link.inventory_item_id, v_f.location_id, v_it.quantity * v_link.required_quantity, 'delta', 'restock', 'Preparación cancelada', v_f.order_id);
      end loop;
      perform internal.reserve_line((select l from public.order_line_item l where l.id = v_it.id) , v_f.location_id);
    end loop;
    update public.fulfillment set canceled_at = now() where id = v_f.id returning * into v_f;
    perform internal.add_order_event(v_f.order_id, 'fulfillment_canceled', 'Se canceló una preparación');
  else
    raise exception 'Acción inválida: %', p_action;
  end if;

  perform internal.recalc_order_status(v_f.order_id);
  return v_f;
end $$;

-- -----------------------------------------------------------------------------
-- Pagos
-- -----------------------------------------------------------------------------
create or replace function public.admin_capture_payment(p_order_id uuid, p_amount numeric default null, p_provider text default null, p_reference text default null)
returns public.orders language plpgsql security definer set search_path = public as $$
declare
  v_order public.orders;
  v_amount numeric;
begin
  perform internal.assert_admin();
  select * into v_order from public.orders where id = p_order_id for update;
  if v_order.status = 'canceled' then raise exception 'El pedido está cancelado'; end if;
  v_amount := coalesce(p_amount, v_order.total - v_order.paid_total);
  if v_amount <= 0 or v_order.paid_total + v_amount > v_order.total then raise exception 'Monto inválido'; end if;

  insert into public.order_transaction (order_id, kind, provider, amount, currency_code, reference, created_by)
  values (p_order_id, 'capture',
          coalesce(p_provider, (select provider from public.order_transaction where order_id = p_order_id order by created_at limit 1), 'manual'),
          v_amount, v_order.currency_code, p_reference, auth.uid());
  update public.order_transaction set status = 'success' where order_id = p_order_id and kind = 'authorization' and status = 'pending';

  update public.orders set paid_total = paid_total + v_amount,
    payment_status = case when paid_total + v_amount >= total then 'captured'::public.payment_status else 'partially_captured' end
  where id = p_order_id returning * into v_order;
  perform internal.add_order_event(p_order_id, 'paid', 'Pago de S/. ' || to_char(v_amount, 'FM999G990D00') || ' registrado');
  perform internal.recalc_order_status(p_order_id);
  select * into v_order from public.orders where id = p_order_id;
  return v_order;
end $$;

create or replace function public.admin_refund_payment(p_order_id uuid, p_amount numeric, p_note text default null)
returns public.orders language plpgsql security definer set search_path = public as $$
declare v_order public.orders;
begin
  perform internal.assert_admin();
  select * into v_order from public.orders where id = p_order_id for update;
  if p_amount <= 0 or p_amount > v_order.paid_total - v_order.refunded_total then
    raise exception 'El reembolso supera lo cobrado';
  end if;
  insert into public.order_transaction (order_id, kind, provider, amount, currency_code, note, created_by)
  values (p_order_id, 'refund', coalesce((select provider from public.order_transaction where order_id = p_order_id and kind = 'capture' order by created_at limit 1), 'manual'),
          p_amount, v_order.currency_code, p_note, auth.uid());
  update public.orders set refunded_total = refunded_total + p_amount,
    payment_status = case when refunded_total + p_amount >= paid_total then 'refunded'::public.payment_status else 'partially_refunded' end
  where id = p_order_id returning * into v_order;
  perform internal.add_order_event(p_order_id, 'refunded', 'Reembolso de S/. ' || to_char(p_amount, 'FM999G990D00') || coalesce(': ' || p_note, ''));
  return v_order;
end $$;

-- -----------------------------------------------------------------------------
-- Cancelar pedido: libera reservas (no se permite si ya hay envíos)
-- -----------------------------------------------------------------------------
create or replace function public.admin_cancel_order(p_order_id uuid, p_reason text default null)
returns public.orders language plpgsql security definer set search_path = public as $$
declare
  v_order public.orders;
  v_line record;
begin
  perform internal.assert_admin();
  select * into v_order from public.orders where id = p_order_id for update;
  if v_order.status = 'canceled' then return v_order; end if;
  if exists (select 1 from public.fulfillment where order_id = p_order_id and canceled_at is null) then
    raise exception 'Cancela primero las preparaciones del pedido';
  end if;
  for v_line in select id from public.order_line_item where order_id = p_order_id loop
    perform internal.release_line(v_line.id, null);
  end loop;
  update public.orders set status = 'canceled', canceled_at = now(), fulfillment_status = 'canceled',
    payment_status = case when paid_total > refunded_total then payment_status else 'canceled' end
  where id = p_order_id returning * into v_order;
  perform internal.add_order_event(p_order_id, 'canceled', 'Pedido cancelado' || coalesce(': ' || p_reason, ''));
  return v_order;
end $$;

create or replace function public.admin_add_order_note(p_order_id uuid, p_message text) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform internal.assert_admin();
  if nullif(trim(p_message), '') is null then raise exception 'El comentario está vacío'; end if;
  perform internal.add_order_event(p_order_id, 'note', trim(p_message));
end $$;

-- -----------------------------------------------------------------------------
-- Tablero: métricas del período y comparación con el período anterior
-- -----------------------------------------------------------------------------
create or replace function public.admin_dashboard(p_from timestamptz, p_to timestamptz) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_tz text := coalesce((select timezone from public.store limit 1), 'America/Lima');
  v_len interval := p_to - p_from;
  v_result jsonb;
begin
  perform internal.assert_admin();
  with cur as (
    select * from public.orders where created_at >= p_from and created_at < p_to and status <> 'canceled'
  ), prev as (
    select * from public.orders where created_at >= p_from - v_len and created_at < p_from and status <> 'canceled'
  ), days as (
    select generate_series(date_trunc('day', p_from at time zone v_tz), date_trunc('day', (p_to - interval '1 second') at time zone v_tz), interval '1 day')::date as d
  ), series as (
    select d.d, coalesce(sum(o.total), 0) as total, count(o.id) as orders
    from days d left join cur o on (o.created_at at time zone v_tz)::date = d.d
    group by d.d order by d.d
  ), buyers as (
    select customer_id, (select count(*) from public.orders o2 where o2.customer_id = c.customer_id and o2.status <> 'canceled') as n
    from cur c where customer_id is not null group by customer_id
  )
  select jsonb_build_object(
    'total_sales', (select coalesce(sum(total), 0) from cur),
    'gross_sales', (select coalesce(sum(subtotal), 0) from cur),
    'discounts', (select coalesce(sum(discount_total), 0) from cur),
    'shipping', (select coalesce(sum(shipping_total), 0) from cur),
    'taxes', (select coalesce(sum(tax_total), 0) from cur),
    'refunds', (select coalesce(sum(refunded_total), 0) from cur),
    'orders', (select count(*) from cur),
    'items', (select coalesce(sum(item_count), 0) from cur),
    'average_order_value', (select coalesce(round(avg(total), 2), 0) from cur),
    'returning_customer_rate', (select case when count(*) = 0 then 0 else round(100.0 * count(*) filter (where n > 1) / count(*), 1) end from buyers),
    'previous', jsonb_build_object(
      'total_sales', (select coalesce(sum(total), 0) from prev),
      'orders', (select count(*) from prev),
      'average_order_value', (select coalesce(round(avg(total), 2), 0) from prev)),
    'series', (select coalesce(jsonb_agg(jsonb_build_object('date', d, 'total', total, 'orders', orders) order by d), '[]') from series),
    'top_products', (select coalesce(jsonb_agg(t), '[]') from (
        select li.title, li.thumbnail, sum(li.quantity) as quantity, sum(li.subtotal) as total
        from public.order_line_item li join cur on cur.id = li.order_id
        group by li.title, li.thumbnail order by sum(li.subtotal) desc limit 5) t),
    'to_fulfill', (select count(*) from public.orders where status = 'pending' and fulfillment_status in ('not_fulfilled', 'partially_fulfilled')),
    'awaiting_payment', (select count(*) from public.orders where status <> 'canceled' and payment_status in ('awaiting', 'not_paid', 'authorized')),
    'low_stock', (select count(*) from public.inventory_level where available_quantity <= 3)
  ) into v_result;
  return v_result;
end $$;
