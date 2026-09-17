create table if not exists public.lab_requests (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  requested_by uuid not null references public.users(id),
  test_name text not null,
  test_category text not null,
  clinical_notes text,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed', 'cancelled')),
  requested_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.lab_results (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references public.lab_requests(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  recorded_by uuid not null references public.users(id),
  test_name text not null,
  test_category text not null,
  result_value text not null,
  unit text,
  reference_range text,
  status text default 'normal',
  notes text,
  created_at timestamptz default now()
);

alter table public.lab_results
  add column if not exists request_id uuid references public.lab_requests(id) on delete cascade;

create unique index if not exists lab_results_request_id_key
  on public.lab_results(request_id)
  where request_id is not null;

alter table public.lab_requests enable row level security;

alter table public.lab_results enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'lab_results'
  ) then
    alter publication supabase_realtime add table public.lab_results;
  end if;
end;
$$;

drop policy if exists "Service role full access" on public.lab_requests;
create policy "Service role full access"
on public.lab_requests for all to service_role
using (true) with check (true);

drop policy if exists "Doctors can create lab requests" on public.lab_requests;
create policy "Doctors can create lab requests"
on public.lab_requests for insert to authenticated
with check (
  requested_by = auth.uid()
  and exists (
    select 1 from public.users
    where users.id = auth.uid() and users.role = 'doctor'
  )
);

drop policy if exists "Staff can read lab requests" on public.lab_requests;
create policy "Staff can read lab requests"
on public.lab_requests for select to authenticated
using (
  requested_by = auth.uid()
  or exists (
    select 1 from public.users
    where users.id = auth.uid() and users.role in ('doctor', 'lab_technician')
  )
);

drop policy if exists "Service role full access" on public.lab_results;
create policy "Service role full access"
on public.lab_results for all to service_role
using (true) with check (true);

drop policy if exists "Authenticated users can read lab results" on public.lab_results;
create policy "Authenticated users can read lab results"
on public.lab_results for select to authenticated
using (
  exists (
    select 1
    from public.lab_requests
    where lab_requests.id = lab_results.request_id
      and (
        lab_requests.requested_by = auth.uid()
        or exists (
          select 1 from public.users
          where users.id = auth.uid() and users.role = 'doctor'
        )
      )
  )
);

drop policy if exists "Lab technicians can insert" on public.lab_results;
create policy "Lab technicians can insert"
on public.lab_results for insert to authenticated
with check (
  recorded_by = auth.uid()
  and exists (
    select 1 from public.users
    where users.id = auth.uid() and users.role = 'lab_technician'
  )
  and exists (
    select 1 from public.lab_requests
    where lab_requests.id = lab_results.request_id
      and lab_requests.status in ('pending', 'in_progress')
  )
);