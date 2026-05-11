-- Step 8: RLS — units (authenticated read only)

alter table public.units enable row level security;

drop policy if exists "units_select_authenticated" on public.units;

create policy "units_select_authenticated"
  on public.units
  for select
  to authenticated
  using (true);
