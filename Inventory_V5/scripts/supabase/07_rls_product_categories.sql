-- Step 7: RLS — product_categories (authenticated read only)

alter table public.product_categories enable row level security;

drop policy if exists "product_categories_select_authenticated" on public.product_categories;

create policy "product_categories_select_authenticated"
  on public.product_categories
  for select
  to authenticated
  using (true);
