-- =============================================================================
-- Vistas para las listas del panel (security_invoker => respetan RLS)
-- =============================================================================

create view public.admin_product_list with (security_invoker = true) as
select
  p.id, p.title, p.handle, p.status, p.thumbnail, p.vendor, p.created_at, p.updated_at,
  pt.value as product_type,
  (select count(*) from public.product_variant v where v.product_id = p.id and v.deleted_at is null)::int as variant_count,
  (select coalesce(sum(il.available_quantity), 0)
     from public.product_variant v
     join public.product_variant_inventory_item vi on vi.variant_id = v.id
     join public.inventory_level il on il.inventory_item_id = vi.inventory_item_id
    where v.product_id = p.id and v.deleted_at is null and v.manage_inventory)::int as inventory_quantity,
  (select bool_or(v.manage_inventory) from public.product_variant v where v.product_id = p.id and v.deleted_at is null) as tracks_inventory,
  (select min(pr.amount) from public.price pr join public.product_variant v on v.id = pr.variant_id
    where v.product_id = p.id and v.deleted_at is null and pr.price_list_id is null) as min_price,
  (select max(pr.amount) from public.price pr join public.product_variant v on v.id = pr.variant_id
    where v.product_id = p.id and v.deleted_at is null and pr.price_list_id is null) as max_price,
  coalesce((select array_agg(c.title order by c.title) from public.product_collection_product cp
     join public.product_collection c on c.id = cp.collection_id where cp.product_id = p.id), '{}') as collections,
  coalesce((select array_agg(c.id) from public.product_category_product cp
     join public.product_category c on c.id = cp.category_id where cp.product_id = p.id), '{}') as category_ids,
  coalesce((select array_agg(t.value order by t.value) from public.product_tags x join public.product_tag t on t.id = x.tag_id where x.product_id = p.id), '{}') as tags
from public.product p
left join public.product_type pt on pt.id = p.type_id
where p.deleted_at is null;

create view public.admin_order_list with (security_invoker = true) as
select
  o.id, o.display_id, o.status, o.payment_status, o.fulfillment_status, o.email, o.currency_code,
  o.total, o.item_count, o.source, o.tags, o.created_at, o.customer_id,
  nullif(trim(coalesce(c.first_name, '') || ' ' || coalesce(c.last_name, '')), '') as customer_name,
  (select sm.name from public.order_shipping_method sm where sm.order_id = o.id limit 1) as shipping_method,
  (select bool_or(sm.is_pickup) from public.order_shipping_method sm where sm.order_id = o.id) as is_pickup,
  sc.name as sales_channel
from public.orders o
left join public.customer c on c.id = o.customer_id
left join public.sales_channel sc on sc.id = o.sales_channel_id;

create view public.admin_customer_list with (security_invoker = true) as
select
  c.id, c.email, c.first_name, c.last_name, c.phone, c.accepts_marketing, c.has_account, c.tags, c.note, c.created_at,
  (select count(*) from public.orders o where o.customer_id = c.id and o.status <> 'canceled')::int as orders_count,
  (select coalesce(sum(o.total - o.refunded_total), 0) from public.orders o where o.customer_id = c.id and o.status <> 'canceled') as amount_spent,
  (select max(o.created_at) from public.orders o where o.customer_id = c.id) as last_order_at,
  (select concat_ws(', ', a.district, a.department) from public.customer_address a
     where a.customer_id = c.id order by a.is_default_shipping desc, a.created_at limit 1) as location
from public.customer c
where c.deleted_at is null;

-- Una fila por variante y sucursal.
create view public.admin_inventory_list with (security_invoker = true) as
select
  v.id as variant_id, v.title as variant_title, v.sku, v.manage_inventory, v.allow_backorder,
  p.id as product_id, p.title as product_title, p.thumbnail, p.status as product_status,
  vi.inventory_item_id, l.id as location_id, l.name as location_name,
  coalesce(il.stocked_quantity, 0) as stocked_quantity,
  coalesce(il.reserved_quantity, 0) as reserved_quantity,
  coalesce(il.available_quantity, 0) as available_quantity,
  coalesce(il.incoming_quantity, 0) as incoming_quantity
from public.product_variant v
join public.product p on p.id = v.product_id and p.deleted_at is null
join public.product_variant_inventory_item vi on vi.variant_id = v.id
cross join public.stock_location l
left join public.inventory_level il on il.inventory_item_id = vi.inventory_item_id and il.location_id = l.id
where v.deleted_at is null and l.deleted_at is null and l.is_active;
