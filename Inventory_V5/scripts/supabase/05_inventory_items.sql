-- Step 5: Main inventory table (per-user rows)

create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  code text not null,
  barcode text,
  name text not null,
  category_id uuid not null references public.product_categories (id) on delete restrict,
  supplier text,
  expiry_date date,
  status public.inventory_status not null default 'active',
  cost_price numeric(14, 4),
  selling_price numeric(14, 4),
  quantity numeric(14, 4) not null default 0,
  unit_id uuid not null references public.units (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint inventory_items_user_code_unique unique (user_id, code),
  constraint inventory_items_quantity_nonneg check (quantity >= 0),
  constraint inventory_items_cost_nonneg check (cost_price is null or cost_price >= 0),
  constraint inventory_items_selling_nonneg check (selling_price is null or selling_price >= 0)
);

create unique index if not exists inventory_items_user_barcode_unique
  on public.inventory_items (user_id, barcode)
  where barcode is not null;

create index if not exists inventory_items_user_id_idx
  on public.inventory_items (user_id);

comment on table public.inventory_items is 'Per-user inventory; RLS restricts rows to auth.uid().';
