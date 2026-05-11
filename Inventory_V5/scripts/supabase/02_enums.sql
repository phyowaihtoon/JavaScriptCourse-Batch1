-- Step 2: Enum types (idempotent)

do $$ begin
  create type public.inventory_status as enum ('active', 'inactive', 'discontinued');
exception
  when duplicate_object then null;
end $$;
