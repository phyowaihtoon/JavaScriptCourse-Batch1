-- Step 10: Table privileges for authenticated clients (JWT session)

grant usage on schema public to authenticated;

grant usage on type public.inventory_status to authenticated;

grant select on table public.product_categories to authenticated;
grant select on table public.units to authenticated;

grant select, insert, update, delete on table public.inventory_items to authenticated;

-- service_role bypasses RLS by default; grants help if you use the role for maintenance scripts
grant select, insert, update, delete on table public.product_categories to service_role;
grant select, insert, update, delete on table public.units to service_role;
grant select, insert, update, delete on table public.inventory_items to service_role;
