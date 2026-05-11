-- Step 4: Reference table — units of measure

create table if not exists public.units (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  label text not null,
  sort_order int,
  constraint units_code_unique unique (code)
);

comment on table public.units is 'Predefined units for dropdowns; seeded / maintained outside the browser app.';
