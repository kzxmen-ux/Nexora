create schema if not exists private;

revoke all on schema private from public;

create type public.organization_role as enum ('owner', 'admin');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organizations_name_length
    check (char_length(name) between 1 and 100),
  constraint organizations_name_trimmed
    check (name = btrim(name)),
  constraint organizations_slug_format
    check (
      char_length(slug) between 3 and 63
      and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    )
);

create index organizations_created_by_idx
  on public.organizations (created_by);

create table public.organization_members (
  organization_id uuid not null
    references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete restrict,
  role public.organization_role not null,
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create index organization_members_user_id_idx
  on public.organization_members (user_id);

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.organizations force row level security;
alter table public.organization_members force row level security;

create function private.is_organization_member(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select auth.uid()) is not null
    and exists (
      select 1
      from public.organization_members
      where organization_id = target_organization_id
        and user_id = (select auth.uid())
    );
$$;

create function private.is_organization_owner(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select auth.uid()) is not null
    and exists (
      select 1
      from public.organization_members
      where organization_id = target_organization_id
        and user_id = (select auth.uid())
        and role = 'owner'::public.organization_role
    );
$$;

revoke all on function private.is_organization_member(uuid) from public;
revoke all on function private.is_organization_owner(uuid) from public;
grant usage on schema private to authenticated;
grant execute on function private.is_organization_member(uuid) to authenticated;
grant execute on function private.is_organization_owner(uuid) to authenticated;

create policy "organization members can read organizations"
on public.organizations
for select
to authenticated
using (private.is_organization_member(id));

create policy "authenticated users can create their organizations"
on public.organizations
for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and created_by = (select auth.uid())
);

create policy "organization members can update organizations"
on public.organizations
for update
to authenticated
using (private.is_organization_member(id))
with check (private.is_organization_member(id));

create policy "organization members can read memberships"
on public.organization_members
for select
to authenticated
using (private.is_organization_member(organization_id));

create function private.add_organization_creator_as_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or new.created_by <> (select auth.uid()) then
    raise exception 'organization creator must match the authenticated user'
      using errcode = '42501';
  end if;

  insert into public.organization_members (
    organization_id,
    user_id,
    role
  )
  values (
    new.id,
    new.created_by,
    'owner'::public.organization_role
  );

  return new;
end;
$$;

revoke all
on function private.add_organization_creator_as_owner()
from public, anon, authenticated;

create trigger organizations_add_creator_as_owner
after insert on public.organizations
for each row
execute function private.add_organization_creator_as_owner();

create function private.set_organization_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all
on function private.set_organization_updated_at()
from public, anon, authenticated;

create trigger organizations_set_updated_at
before update of name, slug on public.organizations
for each row
execute function private.set_organization_updated_at();

create function private.add_organization_admin_internal(
  target_organization_id uuid,
  target_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if not private.is_organization_owner(target_organization_id) then
    raise exception 'organization owner permission required'
      using errcode = '42501';
  end if;

  if not exists (
    select 1
    from auth.users
    where id = target_user_id
  ) then
    raise exception 'user does not exist' using errcode = '22023';
  end if;

  insert into public.organization_members (
    organization_id,
    user_id,
    role
  )
  values (
    target_organization_id,
    target_user_id,
    'admin'::public.organization_role
  );
end;
$$;

create function private.remove_organization_admin_internal(
  target_organization_id uuid,
  target_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if not private.is_organization_owner(target_organization_id) then
    raise exception 'organization owner permission required'
      using errcode = '42501';
  end if;

  delete from public.organization_members
  where organization_id = target_organization_id
    and user_id = target_user_id
    and role = 'admin'::public.organization_role;
end;
$$;

revoke all
on function private.add_organization_admin_internal(uuid, uuid)
from public, anon;
revoke all
on function private.remove_organization_admin_internal(uuid, uuid)
from public, anon;
grant execute
on function private.add_organization_admin_internal(uuid, uuid)
to authenticated;
grant execute
on function private.remove_organization_admin_internal(uuid, uuid)
to authenticated;

create function public.add_organization_admin(
  organization_id uuid,
  user_id uuid
)
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.add_organization_admin_internal(
    organization_id,
    user_id
  );
$$;

create function public.remove_organization_admin(
  organization_id uuid,
  user_id uuid
)
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.remove_organization_admin_internal(
    organization_id,
    user_id
  );
$$;

revoke all
on function public.add_organization_admin(uuid, uuid)
from public, anon;
revoke all
on function public.remove_organization_admin(uuid, uuid)
from public, anon;
grant execute
on function public.add_organization_admin(uuid, uuid)
to authenticated;
grant execute
on function public.remove_organization_admin(uuid, uuid)
to authenticated;

revoke all on public.organizations from anon, authenticated;
revoke all on public.organization_members from anon, authenticated;

grant select, insert on public.organizations to authenticated;
grant update (name, slug) on public.organizations to authenticated;
grant select on public.organization_members to authenticated;
