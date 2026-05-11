-- Optional upgrade script: remove product_segment enum and segment column
-- Run this ONLY for existing databases created with older scripts.

alter table if exists public.product_categories
  drop constraint if exists product_categories_segment_name_unique;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'product_categories_name_unique'
  ) then
    alter table if exists public.product_categories
      add constraint product_categories_name_unique unique (name);
  end if;
end $$;

alter table if exists public.product_categories
  drop column if exists segment;

do $$ begin
  drop type if exists public.product_segment;
exception
  when dependent_objects_still_exist then
    raise notice 'public.product_segment still has dependencies and was not dropped.';
end $$;
