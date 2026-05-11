-- Step 1: Extensions (safe to re-run)
-- gen_random_uuid() exists in PostgreSQL 13+ without pgcrypto; this enables pgcrypto if your project uses it for other features.

create extension if not exists pgcrypto;
