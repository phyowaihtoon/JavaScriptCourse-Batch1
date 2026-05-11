# Supabase manual setup (database only)

Run these scripts **in order** in the Supabase Dashboard: **SQL Editor** → **New query** → paste the file contents → **Run**.

Each script is in [`scripts/supabase/`](../scripts/supabase/). Wait for one script to finish successfully before running the next.

## Before you start

1. Open your project: [Supabase Dashboard](https://supabase.com/dashboard) → your project → **SQL Editor**.
2. These scripts target a **new** schema for this app. If you already created tables with the same names, stop and either use a fresh project or edit/rename objects to avoid clashes.
3. **Secrets:** Do not paste the **service role** key into a public app. The **publishable (anon) key** is for browser clients only, together with strict RLS.

## Run order

| Step | File | Purpose |
|------|------|---------|
| 1 | [`01_extensions.sql`](../scripts/supabase/01_extensions.sql) | Enable `pgcrypto` (for `gen_random_uuid()`). Safe to re-run if already enabled. |
| 2 | [`02_enums.sql`](../scripts/supabase/02_enums.sql) | Create enum type: `inventory_status`. Idempotent. |
| 3 | [`03_product_categories.sql`](../scripts/supabase/03_product_categories.sql) | Create `public.product_categories` reference table. |
| 4 | [`04_units.sql`](../scripts/supabase/04_units.sql) | Create `public.units` reference table. |
| 5 | [`05_inventory_items.sql`](../scripts/supabase/05_inventory_items.sql) | Create `public.inventory_items` + check constraints + indexes (including partial unique on barcode). |
| 6 | [`06_inventory_items_updated_at.sql`](../scripts/supabase/06_inventory_items_updated_at.sql) | Trigger to refresh `updated_at` on row update. |
| 7 | [`07_rls_product_categories.sql`](../scripts/supabase/07_rls_product_categories.sql) | Enable RLS on `product_categories`; **SELECT** for `authenticated` only. |
| 8 | [`08_rls_units.sql`](../scripts/supabase/08_rls_units.sql) | Enable RLS on `units`; **SELECT** for `authenticated` only. |
| 9 | [`09_rls_inventory_items.sql`](../scripts/supabase/09_rls_inventory_items.sql) | Enable RLS on `inventory_items`; full CRUD for own rows (`user_id = auth.uid()`). |
| 10 | [`10_grants.sql`](../scripts/supabase/10_grants.sql) | Grant `USAGE` on enum types and table privileges to `authenticated` (plus `service_role` for maintenance). |
| 11 | [`11_seed_product_categories.sql`](../scripts/supabase/11_seed_product_categories.sql) | Insert sample product categories (`ON CONFLICT DO NOTHING`). |
| 12 | [`12_seed_units.sql`](../scripts/supabase/12_seed_units.sql) | Insert sample **units of measure** (`ON CONFLICT DO NOTHING`). |

## After all scripts succeed

- In **Table Editor**, confirm rows exist in `product_categories` and `units`.
- **Authentication:** Enable **Email** provider under **Authentication** → **Providers** if you have not already (for email + password sign-in in the app).
- Optional: Under **Authentication** → **URL configuration**, set **Site URL** and redirect URLs for your future static site.

## Run the web app locally

1. In [Supabase Dashboard](https://supabase.com/dashboard) → **Project Settings** → **API**, copy **Project URL** and the **anon public** key.
2. Copy [`public/js/config.example.js`](../public/js/config.example.js) to `public/js/config.js` (if you do not already have one) and set `supabaseUrl` and `supabaseAnonKey`. The real `config.js` is **gitignored** so your publishable key is not committed.
3. From the repository root, run `npm start` and open the URL it prints (for example `http://localhost:5173`). The UI is static files under [`public/`](../public/); use any static server if you prefer not to use `npm start`.

## Build for production

1. Ensure [`public/js/config.js`](../public/js/config.js) exists and contains the production **Project URL** and **anon public** key for the Supabase project you will deploy against.
2. From the repository root, run `npm run build`.
3. Deploy the generated `dist/` folder to your static host.

The build is intentionally simple for this app: it copies the static site from [`public/`](../public/) into `dist/` and includes your local `config.js`. Keep using only the **anon** key in that file.

## Changing reference data later

- **Categories / units:** Use SQL Editor with a privileged session (dashboard runs as database owner), or run migrations with the **service role** from a trusted environment—not from the browser.
- **Inventory rows:** Normal users insert/update/delete via the app using the **publishable** key and JWT; RLS restricts rows to `auth.uid()`.

## Upgrading an existing database

If your database was created before removing category segments, run [`13_remove_product_segment.sql`](../scripts/supabase/13_remove_product_segment.sql) once.

## Troubleshooting

- **“type already exists”** on step 2: Enums were created earlier; you can skip step 2 or rely on the `DO` blocks in that file.
- **“relation already exists”** on steps 3–5: Tables exist; only run remaining steps if policies/seeds were missing, or drop tables in reverse dependency order (`inventory_items` → `units` / `product_categories`) in a **maintenance** window if you intend to recreate.
- **Trigger “function does not exist”:** Run step 6 again after step 5; ensure `06` uses the same schema (`public`) as your tables.
- **Trigger syntax:** Step 6 uses `EXECUTE PROCEDURE` (works on Supabase’s PostgreSQL). If your platform rejects it, try replacing that line with `EXECUTE FUNCTION public.set_inventory_items_updated_at();` (PostgreSQL 14+).
- **“permission denied for type …”** when inserting rows: Re-run step 10 so `authenticated` has `USAGE` on `public.inventory_status`.
