-- Step 9: RLS — inventory_items (users manage only their rows)

alter table public.inventory_items enable row level security;

drop policy if exists "inventory_items_select_own" on public.inventory_items;
drop policy if exists "inventory_items_insert_own" on public.inventory_items;
drop policy if exists "inventory_items_update_own" on public.inventory_items;
drop policy if exists "inventory_items_delete_own" on public.inventory_items;

create policy "inventory_items_select_own"
  on public.inventory_items
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "inventory_items_insert_own"
  on public.inventory_items
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "inventory_items_update_own"
  on public.inventory_items
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "inventory_items_delete_own"
  on public.inventory_items
  for delete
  to authenticated
  using (user_id = auth.uid());
