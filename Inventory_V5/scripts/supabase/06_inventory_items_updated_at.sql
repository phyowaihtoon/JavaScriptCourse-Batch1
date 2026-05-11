-- Step 6: Keep updated_at in sync on inventory_items

create or replace function public.set_inventory_items_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists inventory_items_set_updated_at on public.inventory_items;

create trigger inventory_items_set_updated_at
  before update on public.inventory_items
  for each row
  execute procedure public.set_inventory_items_updated_at();
