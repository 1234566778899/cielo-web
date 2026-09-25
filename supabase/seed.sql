-- =============================================================================
-- Datos iniciales de Cielo Online (Perú, soles, IGV 18 %).
-- Se ejecuta con `supabase db reset` o pegándolo en el SQL Editor después de las migraciones.
-- Usa las funciones internal.* (workflows) para que los datos sean consistentes.
-- =============================================================================

do $seed$
declare
  v_region uuid;
  v_channel uuid;
  v_whatsapp uuid;
  v_mira uuid;
  v_sanisidro uuid;
  v_profile uuid;
  v_zone_lima uuid;
  v_zone_prov uuid;
  v_zone_pick_mira uuid;
  v_zone_pick_si uuid;
  v_ship_lima uuid;
  v_ship_express uuid;
  v_pick_mira uuid;
  v_tax_region uuid;
  v_cat jsonb := '{}';
  v_col jsonb := '{}';
  v_prod jsonb := '{}';
  v_id uuid;
  v_order public.orders;
  r record;
begin
  -- Monedas, región, canales ------------------------------------------------
  insert into public.currency (code, symbol, symbol_native, name) values
    ('pen', 'S/.', 'S/.', 'Sol peruano'),
    ('usd', '$', 'US$', 'Dólar estadounidense')
  on conflict do nothing;

  insert into public.region (name, currency_code, is_tax_inclusive) values ('Perú', 'pen', true) returning id into v_region;
  insert into public.region_country (iso_2, name, region_id) values ('pe', 'Perú', v_region) on conflict (iso_2) do update set region_id = excluded.region_id;

  insert into public.sales_channel (name, description) values ('Tienda online', 'cieloonline.pe') returning id into v_channel;
  insert into public.sales_channel (name, description) values ('WhatsApp', 'Pedidos por WhatsApp') returning id into v_whatsapp;

  -- Sucursales ----------------------------------------------------------------
  insert into public.stock_location (name, address_1, district, province, department, postal_code, phone, is_pickup_enabled)
  values ('Tienda Miraflores', 'Av. José Larco 345', 'Miraflores', 'Lima', 'Lima', '15074', '+51 904 435 631', true)
  returning id into v_mira;
  insert into public.stock_location (name, address_1, district, province, department, postal_code, phone, is_pickup_enabled)
  values ('Tienda San Isidro', 'Av. Conquistadores 810', 'San Isidro', 'Lima', 'Lima', '15073', '+51 904 435 631', true)
  returning id into v_sanisidro;

  insert into public.store (name, email, phone, whatsapp, address, default_currency_code, default_region_id, default_sales_channel_id, default_location_id)
  values ('Cielo Online', 'hola@cieloonline.pe', '+51 904 435 631', '51904435631',
          '{"address_1":"Av. José Larco 345","district":"Miraflores","province":"Lima","department":"Lima","country_code":"pe"}',
          'pen', v_region, v_channel, v_mira);

  -- Impuestos -----------------------------------------------------------------
  insert into public.tax_region (country_code, name) values ('pe', 'Perú') returning id into v_tax_region;
  insert into public.tax_rate (tax_region_id, name, code, rate, is_default) values (v_tax_region, 'IGV', 'IGV', 18, true);

  -- Envíos ----------------------------------------------------------------------
  insert into public.shipping_profile (name) values ('Predeterminado') returning id into v_profile;
  insert into public.service_zone (name, type) values ('Lima Metropolitana', 'shipping') returning id into v_zone_lima;
  insert into public.geo_zone (service_zone_id, department) values (v_zone_lima, 'Lima'), (v_zone_lima, 'Callao');
  insert into public.service_zone (name, type) values ('Provincias', 'shipping') returning id into v_zone_prov;
  insert into public.geo_zone (service_zone_id) values (v_zone_prov);
  insert into public.service_zone (name, type, stock_location_id) values ('Recojo en Miraflores', 'pickup', v_mira) returning id into v_zone_pick_mira;
  insert into public.service_zone (name, type, stock_location_id) values ('Recojo en San Isidro', 'pickup', v_sanisidro) returning id into v_zone_pick_si;

  insert into public.shipping_option (name, service_zone_id, shipping_profile_id, amount, currency_code, free_over_amount, delivery_estimate, rank)
  values ('Envío estándar', v_zone_lima, v_profile, 15, 'pen', 199, '1 a 2 días hábiles', 0) returning id into v_ship_lima;
  insert into public.shipping_option (name, service_zone_id, shipping_profile_id, amount, currency_code, delivery_estimate, rank)
  values ('Express Lima', v_zone_lima, v_profile, 25, 'pen', 'Mismo día (pedidos antes de la 1 PM)', 1) returning id into v_ship_express;
  insert into public.shipping_option (name, service_zone_id, shipping_profile_id, amount, currency_code, free_over_amount, delivery_estimate, rank)
  values ('Envío a provincias', v_zone_prov, v_profile, 25, 'pen', 299, '2 a 5 días hábiles', 2);
  insert into public.shipping_option (name, service_zone_id, shipping_profile_id, amount, currency_code, delivery_estimate, rank)
  values ('Recojo en tienda Miraflores', v_zone_pick_mira, v_profile, 0, 'pen', 'Listo en 2 horas', 3) returning id into v_pick_mira;
  insert into public.shipping_option (name, service_zone_id, shipping_profile_id, amount, currency_code, delivery_estimate, rank)
  values ('Recojo en tienda San Isidro', v_zone_pick_si, v_profile, 0, 'pen', 'Listo en 2 horas', 4);

  -- Categorías (árbol) --------------------------------------------------------
  insert into public.product_category (name, handle, rank) values ('Flores', 'flores', 0) returning id into v_id;
  v_cat := v_cat || jsonb_build_object('flores', v_id);
  for r in select * from (values ('Rosas','rosas',0), ('Girasoles','girasoles',1), ('Tulipanes','tulipanes',2), ('Orquídeas','orquideas',3)) t(name, handle, rank) loop
    insert into public.product_category (name, handle, rank, parent_category_id) values (r.name, r.handle, r.rank, (v_cat->>'flores')::uuid) returning id into v_id;
    v_cat := v_cat || jsonb_build_object(r.handle, v_id);
  end loop;
  for r in select * from (values ('Cajas de regalo','cajas-de-regalo',1), ('Peluches','peluches',2), ('Globos','globos',3), ('Arreglos','arreglos',4), ('Detalles','detalles',5)) t(name, handle, rank) loop
    insert into public.product_category (name, handle, rank) values (r.name, r.handle, r.rank) returning id into v_id;
    v_cat := v_cat || jsonb_build_object(r.handle, v_id);
  end loop;

  -- Colecciones -----------------------------------------------------------------
  for r in select * from (values
      ('Más vendidos', 'mas-vendidos', 'Los favoritos de nuestros clientes.'),
      ('Regalos para enamorar', 'regalos-para-enamorar', 'Los detalles más románticos.'),
      ('Para tu pareja', 'pareja', 'Rosas eternas, cajas y peluches para decir te amo.'),
      ('Para tus amigos', 'amigos', 'Girasoles, tazas y globos para celebrar la amistad.'),
      ('Para la familia', 'familia', 'Tulipanes y orquídeas para mamá y toda la familia.')) t(title, handle, descr) loop
    insert into public.product_collection (title, handle, description) values (r.title, r.handle, r.descr) returning id into v_id;
    v_col := v_col || jsonb_build_object(r.handle, v_id);
  end loop;

  -- Productos (mismo catálogo que la tienda) ----------------------------------------
  for r in select * from (values
    ('caja-9-rosas-eternas-rojas', 'Caja de lujo con 9 rosas eternas rojas', 'Eterna', 'Caja de regalo', 'p-caja-rosas-rojas', 179.9, 215.9, 'CO001', 14, '["rosas","cajas-de-regalo"]', '["mas-vendidos","pareja"]', '["aniversario","san-valentin","rojo"]', null),
    ('ramo-girasoles', 'Ramo de girasoles artificiales / Papel kraft', 'Jardín Cielo', 'Ramo', 'p-girasoles', 109.9, null, 'CO002', 22, '["girasoles"]', '["mas-vendidos","amigos","familia"]', '["cumpleanos","amistad","amarillo"]', null),
    ('oso-con-rosa', 'Oso de peluche con rosa roja / Detalle romántico', 'Dulce Detalle', 'Peluche', 'p-oso-rosa', 89.9, null, 'CO003', 9, '["peluches","rosas"]', '["mas-vendidos","pareja"]', '["san-valentin","aniversario","rojo"]', '{"title":"Tamaño","values":[["Mediano",89.9,"CO003-M",9],["Grande",129.9,"CO003-G",4]]}'),
    ('orquidea-blanca-maceta', 'Orquídea blanca artificial en maceta de cerámica', 'Petalia', 'Arreglo', 'p-orquidea', 249.9, 279.9, 'CO004', 6, '["orquideas","arreglos"]', '["mas-vendidos","familia"]', '["dia-de-las-madres","cumpleanos","blanco"]', null),
    ('caja-sorpresa-te-quiero', 'Caja sorpresa “Te quiero” (Rosas y chocolates)', 'Luna Rosa', 'Caja de regalo', 'p-caja-sorpresa', 79.9, null, 'CO005', 18, '["cajas-de-regalo"]', '["mas-vendidos","pareja","amigos"]', '["cumpleanos","san-valentin","rosa"]', null),
    ('ramo-tulipanes-rosas', 'Ramo de tulipanes con listón de satín', 'Jardín Cielo', 'Ramo', 'p-tulipanes', 99.9, 129.9, 'CO006', 12, '["tulipanes"]', '["regalos-para-enamorar","familia","amigos"]', '["dia-de-las-madres","cumpleanos","rosa"]', '{"title":"Color","values":[["Rosa",99.9,"CO006-RS",12],["Blanco",99.9,"CO006-BL",7],["Amarillo",99.9,"CO006-AM",2]]}'),
    ('rosa-en-cupula', 'Rosa eterna en cúpula de cristal / Luz LED', 'Eterna', 'Arreglo', 'p-rosa-cupula', 139.9, null, 'CO007', 11, '["rosas","arreglos"]', '["regalos-para-enamorar","pareja"]', '["aniversario","san-valentin","rojo"]', null),
    ('corazon-de-rosas', 'Caja corazón con rosas rojas y rosas', 'Luna Rosa', 'Caja de regalo', 'p-corazon-rosas', 239.9, 299.9, 'CO008', 5, '["rosas","cajas-de-regalo"]', '["regalos-para-enamorar","pareja"]', '["san-valentin","rojo","rosa"]', null),
    ('taza-con-flores', 'Taza de cerámica con arreglo floral', 'Dulce Detalle', 'Detalle', 'p-taza', 64.9, 79.9, 'CO009', 25, '["detalles"]', '["regalos-para-enamorar","amigos"]', '["cumpleanos","amistad","rosa"]', null),
    ('vela-aromatica-floral', 'Vela aromática con flores preservadas', 'Petalia', 'Detalle', 'p-vela', 54.9, 69.9, 'CO010', 3, '["detalles","arreglos"]', '["regalos-para-enamorar","familia"]', '["dia-de-las-madres","blanco"]', null),
    ('flores-y-chocolates', 'Caja de rosas y chocolates gourmet', 'Luna Rosa', 'Caja de regalo', 'p-chocolates', 169.9, 209.9, 'CO011', 8, '["cajas-de-regalo","rosas"]', '["regalos-para-enamorar","pareja","familia"]', '["aniversario","dia-de-las-madres","rojo"]', null),
    ('globo-corazon-rosas', 'Globo corazón con mini ramo de rosas blancas', 'Dulce Detalle', 'Globo', 'p-globo', 84.9, 99.9, 'CO012', 15, '["globos","rosas"]', '["regalos-para-enamorar","pareja","amigos"]', '["cumpleanos","aniversario","blanco","rojo"]', null),
    ('lampara-tulipanes-led', 'Lámpara LED de tulipanes decorativa', 'Jardín Cielo', 'Detalle', 'p-lampara', 119.9, null, 'CO013', 0, '["tulipanes","detalles","arreglos"]', '["regalos-para-enamorar","familia","amigos"]', '["cumpleanos","rosa"]', null)
  ) t(handle, title, vendor, ptype, img, price, compare_at, sku, stock, cats, cols, tags, opt) loop
    v_id := internal.upsert_product(jsonb_build_object(
      'title', r.title, 'handle', r.handle, 'status', 'active', 'vendor', r.vendor, 'type', r.ptype,
      'description', 'Flores artificiales de seda premium armadas a mano por nuestros floristas. No necesitan agua, no se marchitan y llegan listas para regalar.',
      'tags', r.tags::jsonb,
      'category_ids', (select coalesce(jsonb_agg(v_cat->>c), '[]') from jsonb_array_elements_text(r.cats::jsonb) c),
      'collection_ids', (select coalesce(jsonb_agg(v_col->>c), '[]') from jsonb_array_elements_text(r.cols::jsonb) c),
      'sales_channel_ids', jsonb_build_array(v_channel, v_whatsapp),
      'images', jsonb_build_array(
        jsonb_build_object('url', '/images/' || r.img || '.svg', 'alt', r.title),
        jsonb_build_object('url', '/images/' || r.img || '-alt.svg', 'alt', r.title || ' (detalle)')),
      'weight', 0.8,
      'options', case when r.opt is null then '[]'::jsonb
                 else jsonb_build_array(jsonb_build_object('title', r.opt::jsonb->>'title',
                        'values', (select jsonb_agg(v->>0) from jsonb_array_elements(r.opt::jsonb->'values') v))) end,
      'variants', case when r.opt is null then
          jsonb_build_array(jsonb_build_object('sku', r.sku, 'cost_amount', round(r.price * 0.45, 2),
            'prices', jsonb_build_array(jsonb_build_object('currency_code', 'pen', 'amount', r.price, 'compare_at_amount', r.compare_at)),
            'inventory', jsonb_build_array(jsonb_build_object('location_id', v_mira, 'stocked_quantity', r.stock),
                                           jsonb_build_object('location_id', v_sanisidro, 'stocked_quantity', greatest(r.stock / 2, 0)))))
        else (select jsonb_agg(jsonb_build_object(
            'sku', v->>2, 'cost_amount', round((v->>1)::numeric * 0.45, 2),
            'options', jsonb_build_object(r.opt::jsonb->>'title', v->>0),
            'prices', jsonb_build_array(jsonb_build_object('currency_code', 'pen', 'amount', (v->>1)::numeric, 'compare_at_amount', r.compare_at)),
            'inventory', jsonb_build_array(jsonb_build_object('location_id', v_mira, 'stocked_quantity', (v->>3)::int),
                                           jsonb_build_object('location_id', v_sanisidro, 'stocked_quantity', (v->>3)::int / 2))))
          from jsonb_array_elements(r.opt::jsonb->'values') v) end
    ));
    v_prod := v_prod || jsonb_build_object(r.handle, v_id);
  end loop;

  -- Un borrador para ver el estado "Borrador" en el panel
  perform internal.upsert_product(jsonb_build_object('title', 'Arreglo de lavanda en canasta', 'status', 'draft', 'vendor', 'Petalia', 'type', 'Arreglo',
    'variants', jsonb_build_array(jsonb_build_object('sku', 'CO014', 'prices', jsonb_build_array(jsonb_build_object('currency_code', 'pen', 'amount', 89.9)),
      'inventory', jsonb_build_array(jsonb_build_object('location_id', v_mira, 'stocked_quantity', 10))))));

  -- Grupos de clientes y promociones --------------------------------------------------
  insert into public.customer_group (name) values ('VIP'), ('Mayoristas');

  insert into public.promotion (code, title, status, usage_limit) values ('BIENVENIDA10', '10 % en tu primera compra', 'active', null) returning id into v_id;
  insert into public.promotion_application_method (promotion_id, type, target_type, value) values (v_id, 'percentage', 'order', 10);

  insert into public.promotion (code, title, status) values ('ENVIOGRATIS', 'Envío gratis desde S/. 100', 'active') returning id into v_id;
  insert into public.promotion_application_method (promotion_id, type, target_type, value) values (v_id, 'free_shipping', 'shipping_methods', 0);
  insert into public.promotion_rule (promotion_id, attribute, operator, values) values (v_id, 'subtotal', 'gte', '[100]');

  insert into public.promotion (code, title, status, starts_at, ends_at) values ('SANVALENTIN', 'S/. 20 de descuento en rosas', 'draft', '2027-02-01', '2027-02-15') returning id into v_id;
  insert into public.promotion_application_method (promotion_id, type, target_type, value, currency_code) values (v_id, 'fixed', 'items', 20, 'pen');
  insert into public.promotion_rule (promotion_id, rule_type, attribute, operator, values)
    values (v_id, 'target_rules', 'items.product_id', 'in', jsonb_build_array(v_prod->>'caja-9-rosas-eternas-rojas', v_prod->>'corazon-de-rosas', v_prod->>'rosa-en-cupula'));

  -- Pedidos de ejemplo (últimos 30 días) ------------------------------------------------
  for r in select * from (values
    (28, 'lucia.torres@ejemplo.pe', 'Lucía', 'Torres', 'Av. Pardo 620', 'Miraflores', '[["caja-9-rosas-eternas-rojas",1],["oso-con-rosa",1]]', 'card', true, 'delivered', null),
    (25, 'diego.ramirez@ejemplo.pe', 'Diego', 'Ramírez', 'Calle Los Pinos 150', 'San Borja', '[["ramo-girasoles",2]]', 'yape', true, 'delivered', null),
    (21, 'maria.quispe@ejemplo.pe', 'María', 'Quispe', 'Jr. Huallaga 320', 'Cercado de Lima', '[["orquidea-blanca-maceta",1]]', 'card', true, 'delivered', null),
    (18, 'lucia.torres@ejemplo.pe', 'Lucía', 'Torres', 'Av. Pardo 620', 'Miraflores', '[["rosa-en-cupula",1],["vela-aromatica-floral",1]]', 'plin', true, 'delivered', 'BIENVENIDA10'),
    (14, 'andrea.flores@ejemplo.pe', 'Andrea', 'Flores', 'Av. Primavera 1200', 'Surco', '[["corazon-de-rosas",1]]', 'card', true, 'shipped', null),
    (10, 'carlos.mendoza@ejemplo.pe', 'Carlos', 'Mendoza', 'Av. Arequipa 2450', 'Lince', '[["flores-y-chocolates",1],["globo-corazon-rosas",1]]', 'transfer', true, 'fulfilled', null),
    (7, 'diego.ramirez@ejemplo.pe', 'Diego', 'Ramírez', 'Calle Los Pinos 150', 'San Borja', '[["taza-con-flores",3]]', 'yape', true, 'none', 'ENVIOGRATIS'),
    (4, 'sofia.vargas@ejemplo.pe', 'Sofía', 'Vargas', 'Av. La Marina 890', 'San Miguel', '[["caja-sorpresa-te-quiero",2]]', 'yape', false, 'none', null),
    (2, 'maria.quispe@ejemplo.pe', 'María', 'Quispe', 'Jr. Huallaga 320', 'Cercado de Lima', '[["ramo-tulipanes-rosas",1],["oso-con-rosa",1]]', 'card', true, 'none', null),
    (1, 'jorge.castillo@ejemplo.pe', 'Jorge', 'Castillo', 'Av. Brasil 1500', 'Jesús María', '[["caja-9-rosas-eternas-rojas",2]]', 'transfer', false, 'none', null),
    (0, 'valeria.rojas@ejemplo.pe', 'Valeria', 'Rojas', 'Av. Javier Prado 4200', 'Surco', '[["globo-corazon-rosas",1]]', 'plin', false, 'canceled', null)
  ) t(days_ago, email, first_name, last_name, address, district, items, provider, captured, stage, promo) loop
    v_order := internal.place_order(jsonb_build_object(
      'email', r.email, 'phone', '9' || lpad((abs(hashtext(r.email)) % 100000000)::text, 8, '0'),
      'customer', jsonb_build_object('first_name', r.first_name, 'last_name', r.last_name, 'accepts_marketing', r.days_ago % 2 = 0),
      'shipping_address', jsonb_build_object('first_name', r.first_name, 'last_name', r.last_name, 'address_1', r.address,
                                             'district', r.district, 'province', 'Lima', 'department', 'Lima', 'country_code', 'pe'),
      'items', (select jsonb_agg(jsonb_build_object(
                  'variant_id', (select pv.id from public.product_variant pv where pv.product_id = (v_prod->>(i->>0))::uuid and pv.deleted_at is null order by pv.variant_rank limit 1),
                  'quantity', (i->>1)::int)) from jsonb_array_elements(r.items::jsonb) i),
      'shipping_option_id', case when r.days_ago = 10 then v_pick_mira when r.days_ago % 3 = 0 then v_ship_express else v_ship_lima end,
      'promotion_code', r.promo,
      'payment', jsonb_build_object('provider', r.provider, 'captured', r.captured),
      'source', case when r.provider = 'yape' then 'whatsapp' else 'web' end,
      'created_at', now() - make_interval(days => r.days_ago, hours => (abs(hashtext(r.email)) % 9))));

    if r.stage in ('fulfilled', 'shipped', 'delivered') then
      v_id := internal.create_fulfillment(v_order.id, null, null,
                case when r.stage = 'fulfilled' then null else '{"company":"Olva Courier","number":"OLV-' || v_order.display_id || '"}' end::jsonb,
                r.stage in ('shipped', 'delivered'));
      if r.stage = 'delivered' then
        update public.fulfillment set delivered_at = v_order.created_at + interval '2 days' where id = v_id;
        insert into public.order_event (order_id, type, message, created_at) values (v_order.id, 'delivered', 'Pedido entregado', v_order.created_at + interval '2 days');
      end if;
      update public.order_event set created_at = v_order.created_at + interval '1 day'
       where order_id = v_order.id and type in ('fulfilled', 'shipped');
      perform internal.recalc_order_status(v_order.id);
    elsif r.stage = 'canceled' then
      perform internal.release_line(li.id, null) from public.order_line_item li where li.order_id = v_order.id;
      update public.orders set status = 'canceled', canceled_at = now(), fulfillment_status = 'canceled', payment_status = 'canceled' where id = v_order.id;
      insert into public.order_event (order_id, type, message) values (v_order.id, 'canceled', 'Pedido cancelado: el cliente cambió de opinión');
    end if;
  end loop;

  -- Direcciones de los clientes a partir de sus pedidos
  insert into public.customer_address (customer_id, first_name, last_name, address_1, district, province, department, phone, is_default_shipping, is_default_billing)
  select distinct on (o.customer_id) o.customer_id, o.shipping_address->>'first_name', o.shipping_address->>'last_name',
         o.shipping_address->>'address_1', o.shipping_address->>'district', 'Lima', 'Lima', o.phone, true, true
  from public.orders o order by o.customer_id, o.created_at;

  insert into public.customer_group_customer (customer_group_id, customer_id)
  select (select id from public.customer_group where name = 'VIP'), id from public.customer where email in ('lucia.torres@ejemplo.pe', 'maria.quispe@ejemplo.pe');
end $seed$;
