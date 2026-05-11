-- Step 11: Seed product categories. Safe to re-run.

insert into public.product_categories (name, sort_order) values
  ('Dairy', 10),
  ('Bakery', 20),
  ('Beverages', 30),
  ('Snacks', 40),
  ('Frozen', 50),
  ('Meat & Poultry', 60),
  ('Produce', 70),
  ('Pantry / Dry goods', 80),
  ('Skincare', 90),
  ('Haircare', 100),
  ('Makeup', 110),
  ('Fragrance', 120),
  ('Bath & body', 130),
  ('Oral care', 140)
on conflict on constraint product_categories_name_unique do nothing;
