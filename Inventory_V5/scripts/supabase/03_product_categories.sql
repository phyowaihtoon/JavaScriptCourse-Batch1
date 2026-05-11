-- Step 3: Reference table — product categories

create table if not exists public.product_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order int,
  constraint product_categories_name_unique unique (name)
);

comment on table public.product_categories is 'Selectable product categories; seeded / maintained outside the browser app.';
