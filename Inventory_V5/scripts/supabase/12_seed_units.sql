-- Step 12: Seed units of measure. Safe to re-run.

insert into public.units (code, label, sort_order) values
  ('ea', 'Each', 10),
  ('g', 'Gram', 20),
  ('kg', 'Kilogram', 30),
  ('ml', 'Milliliter', 40),
  ('L', 'Liter', 50),
  ('box', 'Box', 60),
  ('bottle', 'Bottle', 70),
  ('pack', 'Pack', 80),
  ('tube', 'Tube', 90),
  ('pair', 'Pair', 100)
on conflict on constraint units_code_unique do nothing;
