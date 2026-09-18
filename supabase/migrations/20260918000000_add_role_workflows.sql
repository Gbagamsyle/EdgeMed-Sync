create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  scheduled_at timestamptz not null,
  appointment_type text not null default 'general consultation',
  status text not null default 'scheduled' check (status in ('scheduled', 'checked_in', 'completed', 'cancelled')),
  notes text,
  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.nursing_observations (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  recorded_by uuid not null references public.users(id),
  observation text not null,
  created_at timestamptz not null default now()
);

alter table public.appointments enable row level security;
alter table public.nursing_observations enable row level security;

drop policy if exists "Staff can read appointments" on public.appointments;
create policy "Staff can read appointments" on public.appointments for select to authenticated using (true);
drop policy if exists "Front desk can create appointments" on public.appointments;
create policy "Front desk can create appointments" on public.appointments for insert to authenticated
with check (exists (select 1 from public.users where users.id = auth.uid() and users.role in ('admin', 'receptionist')) and created_by = auth.uid());
drop policy if exists "Front desk can update appointments" on public.appointments;
create policy "Front desk can update appointments" on public.appointments for update to authenticated
using (exists (select 1 from public.users where users.id = auth.uid() and users.role in ('admin', 'receptionist')))
with check (exists (select 1 from public.users where users.id = auth.uid() and users.role in ('admin', 'receptionist')));

drop policy if exists "Clinical staff can read observations" on public.nursing_observations;
create policy "Clinical staff can read observations" on public.nursing_observations for select to authenticated
using (exists (select 1 from public.users where users.id = auth.uid() and users.role in ('admin', 'doctor', 'nurse')));
drop policy if exists "Nurses can create observations" on public.nursing_observations;
create policy "Nurses can create observations" on public.nursing_observations for insert to authenticated
with check (recorded_by = auth.uid() and exists (select 1 from public.users where users.id = auth.uid() and users.role = 'nurse'));

drop policy if exists "Admins can read staff profiles" on public.users;
create policy "Admins can read staff profiles" on public.users for select to authenticated
using (auth.uid() = id or exists (select 1 from public.users admin_profile where admin_profile.id = auth.uid() and admin_profile.role = 'admin'));
drop policy if exists "Admins can update staff profiles" on public.users;
create policy "Admins can update staff profiles" on public.users for update to authenticated
using (exists (select 1 from public.users admin_profile where admin_profile.id = auth.uid() and admin_profile.role = 'admin'))
with check (exists (select 1 from public.users admin_profile where admin_profile.id = auth.uid() and admin_profile.role = 'admin'));