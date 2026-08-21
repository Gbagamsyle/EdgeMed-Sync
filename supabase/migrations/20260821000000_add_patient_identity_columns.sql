alter table public.patients
  add column if not exists did text,
  add column if not exists public_key text,
  add column if not exists pin_hash text,
  add column if not exists pin_salt text,
  add column if not exists identity_created_at timestamp without time zone;

create unique index if not exists patients_did_unique
  on public.patients (did)
  where did is not null;
