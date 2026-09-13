-- Keep the application profile in sync with Supabase Auth users.
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role text not null default 'receptionist',
  is_staff boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.users
  add column if not exists full_name text,
  add column if not exists role text not null default 'receptionist',
  add column if not exists is_staff boolean not null default true,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table public.users enable row level security;

drop policy if exists "Users can read their own profile" on public.users;
create policy "Users can read their own profile"
  on public.users for select
  to authenticated
  using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, full_name, role, is_staff)
  values (
    new.id,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), ''),
    case
      when (new.raw_user_meta_data ->> 'role') in ('receptionist', 'nurse', 'clinician', 'doctor')
        then new.raw_user_meta_data ->> 'role'
      else 'receptionist'
    end,
    true
  )
  on conflict (id) do update
    set full_name = excluded.full_name,
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

grant select on public.users to authenticated;