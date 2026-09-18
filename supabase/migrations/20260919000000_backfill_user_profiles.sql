insert into public.users (id, full_name, role, is_staff)
select
  auth_users.id,
  nullif(trim(coalesce(auth_users.raw_user_meta_data ->> 'full_name', '')), ''),
  case
    when auth_users.raw_user_meta_data ->> 'role' in ('admin', 'doctor', 'nurse', 'lab_technician', 'receptionist')
      then auth_users.raw_user_meta_data ->> 'role'
    else 'receptionist'
  end,
  true
from auth.users auth_users
left join public.users profiles on profiles.id = auth_users.id
where profiles.id is null;

update public.users profiles
set full_name = nullif(trim(coalesce(auth_users.raw_user_meta_data ->> 'full_name', profiles.full_name, '')), ''),
    updated_at = now()
from auth.users auth_users
where profiles.id = auth_users.id
  and (profiles.full_name is null or trim(profiles.full_name) = '');