-- Super admin email: karvanenigor98@gmail.com
-- GPT profiles.role is text: client | operator | admin

create or replace function public.protect_super_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if lower(old.email) = lower('karvanenigor98@gmail.com')
     and old.role = 'admin'
     and new.role is distinct from 'admin' then
    raise exception 'Main super admin cannot be downgraded';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_super_admin_trigger on public.profiles;
create trigger protect_super_admin_trigger
  before update on public.profiles
  for each row execute function public.protect_super_admin();

update public.profiles
set role = 'admin'
where lower(email) = lower('karvanenigor98@gmail.com')
  and role is distinct from 'admin';

insert into public.site_memberships (user_id, site_slug, role)
select p.id, v.site_slug, 'admin'
from public.profiles p
cross join (values ('gpt-store'), ('subs-store')) as v(site_slug)
where lower(p.email) = lower('karvanenigor98@gmail.com')
on conflict (user_id, site_slug) do update
set role = 'admin', updated_at = now();
