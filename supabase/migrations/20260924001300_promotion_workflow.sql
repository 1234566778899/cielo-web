-- =============================================================================
-- Workflow: crear/editar un descuento (promoción + método + reglas) en una transacción
-- {
--   "id", "code", "title", "is_automatic", "status", "starts_at", "ends_at", "usage_limit", "once_per_customer",
--   "method": { "type": "percentage|fixed|free_shipping", "target_type": "order|items|shipping_methods", "value": 10 },
--   "min_subtotal": 100,              -- requisito mínimo (opcional)
--   "product_ids": [uuid]             -- si target_type = items
-- }
-- =============================================================================
create or replace function public.admin_upsert_promotion(p jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid := nullif(p->>'id', '')::uuid;
  v_code text := upper(regexp_replace(coalesce(p->>'code', ''), '\s+', '', 'g'));
begin
  perform internal.assert_admin();
  if v_code = '' then raise exception 'El código es obligatorio'; end if;
  if (p->'method'->>'type') in ('percentage') and ((p->'method'->>'value')::numeric <= 0 or (p->'method'->>'value')::numeric > 100) then
    raise exception 'El porcentaje debe estar entre 1 y 100';
  end if;

  if v_id is null then
    insert into public.promotion (code, title, is_automatic, status, starts_at, ends_at, usage_limit, once_per_customer)
    values (v_code, p->>'title', coalesce((p->>'is_automatic')::boolean, false), coalesce((p->>'status')::public.promotion_status, 'active'),
            nullif(p->>'starts_at', '')::timestamptz, nullif(p->>'ends_at', '')::timestamptz, nullif(p->>'usage_limit', '')::int,
            coalesce((p->>'once_per_customer')::boolean, false))
    returning id into v_id;
  else
    update public.promotion set code = v_code, title = p->>'title', is_automatic = coalesce((p->>'is_automatic')::boolean, false),
      status = coalesce((p->>'status')::public.promotion_status, status), starts_at = nullif(p->>'starts_at', '')::timestamptz,
      ends_at = nullif(p->>'ends_at', '')::timestamptz, usage_limit = nullif(p->>'usage_limit', '')::int,
      once_per_customer = coalesce((p->>'once_per_customer')::boolean, false)
    where id = v_id;
  end if;

  insert into public.promotion_application_method (promotion_id, type, target_type, value, currency_code)
  values (v_id, (p->'method'->>'type')::public.application_method_type,
          coalesce((p->'method'->>'target_type')::public.application_target_type, 'order'),
          coalesce((p->'method'->>'value')::numeric, 0), case when p->'method'->>'type' = 'fixed' then 'pen' end)
  on conflict (promotion_id) do update set type = excluded.type, target_type = excluded.target_type, value = excluded.value, currency_code = excluded.currency_code;

  delete from public.promotion_rule where promotion_id = v_id;
  if nullif(p->>'min_subtotal', '') is not null then
    insert into public.promotion_rule (promotion_id, rule_type, attribute, operator, values)
    values (v_id, 'rules', 'subtotal', 'gte', jsonb_build_array((p->>'min_subtotal')::numeric));
  end if;
  if jsonb_array_length(coalesce(p->'product_ids', '[]')) > 0 then
    insert into public.promotion_rule (promotion_id, rule_type, attribute, operator, values)
    values (v_id, 'target_rules', 'items.product_id', 'in', p->'product_ids');
  end if;
  return v_id;
end $$;

create or replace function public.admin_delete_promotions(p_ids uuid[]) returns int
language plpgsql security definer set search_path = public as $$
declare v_count int;
begin
  perform internal.assert_admin();
  update public.promotion set deleted_at = now(), status = 'inactive' where id = any (p_ids) and deleted_at is null;
  get diagnostics v_count = row_count;
  return v_count;
end $$;
