-- Seed inventory_items with 10 sample rows for a single user.
--
-- Important:
-- - `inventory_items` rows are scoped via RLS to `user_id = auth.uid()`.
-- - This script should be run with a privileged session (dashboard SQL editor /
--   service role context), and you must set `target_user_id` below to the UUID
--   of the authenticated user you want to see the seeded rows.
--
-- How to use:
-- 1) In Supabase SQL Editor, paste and run this file.
-- 2) Replace the placeholder UUID in `target_user_id`.
-- 3) Verify `product_categories` and `units` were seeded first (steps 11, 12).

do $$
declare
  -- Supabase auth user id this seed data belongs to:
  target_user_id uuid := '72953bb9-937b-4e1f-a9bd-eac316c4718d'::uuid;
begin

  insert into public.inventory_items (
    user_id,
    code,
    barcode,
    name,
    category_id,
    supplier,
    expiry_date,
    status,
    cost_price,
    selling_price,
    quantity,
    unit_id
  )
  values
    (
      target_user_id,
      'MILK-1L',
      'BC-MILK-1L',
      'Milk 1L',
      (select id from public.product_categories where name = 'Dairy' limit 1),
      'Fresh Dairy Co',
      '2026-10-15'::date,
      'active'::public.inventory_status,
      1.1000,
      1.7900,
      24.0000,
      (select id from public.units where code = 'L' limit 1)
    ),
    (
      target_user_id,
      'EGGS-12',
      'BC-EGGS-12',
      'Eggs 12 pack',
      (select id from public.product_categories where name = 'Meat & Poultry' limit 1),
      'Poultry Farm',
      '2026-06-05'::date,
      'active'::public.inventory_status,
      2.5000,
      3.9900,
      8.0000,
      (select id from public.units where code = 'pack' limit 1)
    ),
    (
      target_user_id,
      'BREAD-BOX',
      'BC-BREAD-BOX',
      'Bread loaf',
      (select id from public.product_categories where name = 'Bakery' limit 1),
      'Bakery House',
      '2026-05-20'::date,
      'active'::public.inventory_status,
      1.3000,
      2.1000,
      16.0000,
      (select id from public.units where code = 'box' limit 1)
    ),
    (
      target_user_id,
      'YOGURT-170G',
      'BC-YOGURT-170G',
      'Yogurt 170g',
      (select id from public.product_categories where name = 'Dairy' limit 1),
      'Fresh Dairy Co',
      '2026-09-01'::date,
      'active'::public.inventory_status,
      0.7000,
      1.2000,
      30.0000,
      (select id from public.units where code = 'ea' limit 1)
    ),
    (
      target_user_id,
      'ORANGE-1KG',
      'BC-ORANGE-1KG',
      'Oranges 1kg',
      (select id from public.product_categories where name = 'Produce' limit 1),
      'Produce Market',
      '2026-05-25'::date,
      'active'::public.inventory_status,
      1.4000,
      2.4000,
      12.0000,
      (select id from public.units where code = 'kg' limit 1)
    ),
    (
      target_user_id,
      'OLIVE-OIL-500ML',
      'BC-OLIVE-OIL-500ML',
      'Olive Oil 500ml',
      (select id from public.product_categories where name = 'Pantry / Dry goods' limit 1),
      'Pantry Imports',
      null,
      'active'::public.inventory_status,
      4.2000,
      6.3000,
      10.0000,
      (select id from public.units where code = 'bottle' limit 1)
    ),
    (
      target_user_id,
      'SHAMPOO-250ML',
      'BC-SHAMPOO-250ML',
      'Shampoo 250ml',
      (select id from public.product_categories where name = 'Haircare' limit 1),
      null,
      '2027-01-01'::date,
      'inactive'::public.inventory_status,
      3.1000,
      4.9000,
      6.0000,
      (select id from public.units where code = 'bottle' limit 1)
    ),
    (
      target_user_id,
      'TOOTHPASTE-100ML',
      'BC-TOOTHPASTE-100ML',
      'Toothpaste 100ml',
      (select id from public.product_categories where name = 'Oral care' limit 1),
      null,
      '2026-08-10'::date,
      'active'::public.inventory_status,
      1.2000,
      2.2000,
      20.0000,
      (select id from public.units where code = 'tube' limit 1)
    ),
    (
      target_user_id,
      'FOUNDATION-30ML',
      'BC-FOUNDATION-30ML',
      'Foundation 30ml',
      (select id from public.product_categories where name = 'Makeup' limit 1),
      'Makeup Lab',
      '2027-03-01'::date,
      'discontinued'::public.inventory_status,
      5.5000,
      8.0000,
      3.0000,
      (select id from public.units where code = 'bottle' limit 1)
    ),
    (
      target_user_id,
      'HAND-SOAP-500ML',
      'BC-HAND-SOAP-500ML',
      'Hand soap 500ml',
      (select id from public.product_categories where name = 'Bath & body' limit 1),
      'Bath & body Co',
      '2026-07-01'::date,
      'active'::public.inventory_status,
      2.0000,
      3.2000,
      15.0000,
      (select id from public.units where code = 'bottle' limit 1)
    )
  )
  on conflict on constraint inventory_items_user_code_unique do update set
    barcode = excluded.barcode,
    name = excluded.name,
    category_id = excluded.category_id,
    supplier = excluded.supplier,
    expiry_date = excluded.expiry_date,
    status = excluded.status,
    cost_price = excluded.cost_price,
    selling_price = excluded.selling_price,
    quantity = excluded.quantity,
    unit_id = excluded.unit_id;
end $$;

