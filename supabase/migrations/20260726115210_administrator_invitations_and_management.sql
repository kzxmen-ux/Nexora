create table public.organization_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null
    references public.organizations (id) on delete cascade,
  email text not null,
  token_hash bytea not null unique,
  invited_by uuid not null references auth.users (id) on delete restrict,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  accepted_at timestamptz,
  accepted_by uuid references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint organization_invitations_email_normalized
    check (
      email = lower(btrim(email))
      and char_length(email) between 3 and 254
      and email ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
    ),
  constraint organization_invitations_token_hash_length
    check (octet_length(token_hash) = 32),
  constraint organization_invitations_expiry_order
    check (expires_at > created_at),
  constraint organization_invitations_revoked_order
    check (revoked_at is null or revoked_at >= created_at),
  constraint organization_invitations_accepted_order
    check (accepted_at is null or accepted_at >= created_at),
  constraint organization_invitations_acceptance_consistent
    check ((accepted_at is null) = (accepted_by is null)),
  constraint organization_invitations_final_state_exclusive
    check (not (revoked_at is not null and accepted_at is not null))
);

create index organization_invitations_organization_created_idx
  on public.organization_invitations (organization_id, created_at desc);

create index organization_invitations_active_email_idx
  on public.organization_invitations (organization_id, email)
  where revoked_at is null and accepted_at is null;

create index organization_invitations_invited_by_idx
  on public.organization_invitations (invited_by);

create index organization_invitations_accepted_by_idx
  on public.organization_invitations (accepted_by)
  where accepted_by is not null;

alter table public.organization_invitations enable row level security;
alter table public.organization_invitations force row level security;

-- Administrator creation now happens only while accepting a valid invitation.
revoke execute
on function public.add_organization_admin(uuid, uuid)
from authenticated, service_role;
revoke execute
on function private.add_organization_admin_internal(uuid, uuid)
from authenticated, service_role;

create policy "owners can read organization invitations"
on public.organization_invitations
for select
to authenticated
using (private.is_organization_owner(organization_id));

revoke all
on public.organization_invitations
from anon, authenticated;

create function private.create_organization_invitation_internal(
  target_organization_id uuid,
  target_email text
)
returns table (
  invitation_id uuid,
  invitation_token text,
  invitation_expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  normalized_email text := lower(btrim(target_email));
  raw_token text;
  new_invitation_id uuid := gen_random_uuid();
  new_expires_at timestamptz := now() + interval '7 days';
begin
  if caller_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if not private.is_organization_owner(target_organization_id) then
    raise exception 'organization owner permission required'
      using errcode = '42501';
  end if;

  if
    normalized_email is null
    or char_length(normalized_email) not between 3 and 254
    or normalized_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
  then
    raise exception 'invalid invitation email' using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      target_organization_id::text || ':' || normalized_email,
      0
    )
  );

  if exists (
    select 1
    from public.organization_invitations
    where organization_id = target_organization_id
      and email = normalized_email
      and revoked_at is null
      and accepted_at is null
      and expires_at > now()
  ) then
    raise exception 'an active invitation already exists'
      using errcode = '23505';
  end if;

  if exists (
    select 1
    from public.organization_members as membership
    join auth.users as member_user
      on member_user.id = membership.user_id
    where membership.organization_id = target_organization_id
      and lower(member_user.email) = normalized_email
  ) then
    raise exception 'user is already an organization member'
      using errcode = '23505';
  end if;

  raw_token := pg_catalog.translate(
    pg_catalog.rtrim(
      pg_catalog.encode(extensions.gen_random_bytes(32), 'base64'),
      '='
    ),
    '+/',
    '-_'
  );

  insert into public.organization_invitations (
    id,
    organization_id,
    email,
    token_hash,
    invited_by,
    expires_at
  )
  values (
    new_invitation_id,
    target_organization_id,
    normalized_email,
    extensions.digest(raw_token, 'sha256'),
    caller_id,
    new_expires_at
  );

  return query
  select new_invitation_id, raw_token, new_expires_at;
end;
$$;

create function private.revoke_organization_invitation_internal(
  target_invitation_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  invitation_row public.organization_invitations%rowtype;
begin
  if caller_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select *
  into invitation_row
  from public.organization_invitations
  where id = target_invitation_id
  for update;

  if invitation_row.id is null then
    raise exception 'invitation is unavailable' using errcode = 'P0001';
  end if;

  if not private.is_organization_owner(invitation_row.organization_id) then
    raise exception 'organization owner permission required'
      using errcode = '42501';
  end if;

  if
    invitation_row.revoked_at is not null
    or invitation_row.accepted_at is not null
    or invitation_row.expires_at <= now()
  then
    raise exception 'invitation is not pending' using errcode = 'P0001';
  end if;

  update public.organization_invitations
  set revoked_at = now()
  where id = invitation_row.id;

  return invitation_row.organization_id;
end;
$$;

create function private.accept_organization_invitation_internal(
  raw_invitation_token text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  caller_email text;
  invitation_row public.organization_invitations%rowtype;
begin
  if caller_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if
    raw_invitation_token is null
    or char_length(raw_invitation_token) <> 43
    or raw_invitation_token !~ '^[A-Za-z0-9_-]{43}$'
  then
    raise exception 'invitation is unavailable' using errcode = 'P0001';
  end if;

  select lower(email)
  into caller_email
  from auth.users
  where id = caller_id;

  if caller_email is null then
    raise exception 'authenticated email is unavailable'
      using errcode = '42501';
  end if;

  select *
  into invitation_row
  from public.organization_invitations
  where token_hash = extensions.digest(raw_invitation_token, 'sha256')
  for update;

  if
    invitation_row.id is null
    or invitation_row.revoked_at is not null
    or invitation_row.accepted_at is not null
    or invitation_row.expires_at <= now()
  then
    raise exception 'invitation is unavailable' using errcode = 'P0001';
  end if;

  if caller_email <> invitation_row.email then
    raise exception 'authenticated email does not match invitation'
      using errcode = '42501';
  end if;

  begin
    insert into public.organization_members (
      organization_id,
      user_id,
      role
    )
    values (
      invitation_row.organization_id,
      caller_id,
      'admin'::public.organization_role
    );
  exception when unique_violation then
    raise exception 'invitation is unavailable' using errcode = 'P0001';
  end;

  update public.organization_invitations
  set
    accepted_at = now(),
    accepted_by = caller_id
  where id = invitation_row.id;

  return invitation_row.organization_id;
end;
$$;

create function private.list_organization_administrators_internal(
  target_organization_id uuid
)
returns table (
  administrator_user_id uuid,
  administrator_email text,
  administrator_created_at timestamptz
)
language plpgsql
stable
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

  return query
  select
    membership.user_id,
    member_user.email::text,
    membership.created_at
  from public.organization_members as membership
  join auth.users as member_user
    on member_user.id = membership.user_id
  where membership.organization_id = target_organization_id
    and membership.role = 'admin'::public.organization_role
  order by membership.created_at, membership.user_id;
end;
$$;

create function private.list_organization_invitations_internal(
  target_organization_id uuid
)
returns table (
  invitation_id uuid,
  invitation_email text,
  invitation_status text,
  invitation_created_at timestamptz,
  invitation_expires_at timestamptz
)
language plpgsql
stable
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

  return query
  select
    invitation.id,
    invitation.email,
    case
      when invitation.accepted_at is not null then 'accepted'
      when invitation.revoked_at is not null then 'revoked'
      when invitation.expires_at <= now() then 'expired'
      else 'pending'
    end,
    invitation.created_at,
    invitation.expires_at
  from public.organization_invitations as invitation
  where invitation.organization_id = target_organization_id
  order by invitation.created_at desc
  limit 100;
end;
$$;

revoke all
on function private.create_organization_invitation_internal(uuid, text)
from public, anon, service_role;
revoke all
on function private.revoke_organization_invitation_internal(uuid)
from public, anon, service_role;
revoke all
on function private.accept_organization_invitation_internal(text)
from public, anon, service_role;
revoke all
on function private.list_organization_administrators_internal(uuid)
from public, anon, service_role;
revoke all
on function private.list_organization_invitations_internal(uuid)
from public, anon, service_role;

grant execute
on function private.create_organization_invitation_internal(uuid, text)
to authenticated;
grant execute
on function private.revoke_organization_invitation_internal(uuid)
to authenticated;
grant execute
on function private.accept_organization_invitation_internal(text)
to authenticated;
grant execute
on function private.list_organization_administrators_internal(uuid)
to authenticated;
grant execute
on function private.list_organization_invitations_internal(uuid)
to authenticated;

create function public.create_organization_invitation(
  p_organization_id uuid,
  p_email text
)
returns table (
  invitation_id uuid,
  invitation_token text,
  invitation_expires_at timestamptz
)
language sql
security invoker
set search_path = ''
as $$
  select *
  from private.create_organization_invitation_internal(
    p_organization_id,
    p_email
  );
$$;

create function public.revoke_organization_invitation(
  p_invitation_id uuid
)
returns uuid
language sql
security invoker
set search_path = ''
as $$
  select private.revoke_organization_invitation_internal(p_invitation_id);
$$;

create function public.accept_organization_invitation(
  p_token text
)
returns uuid
language sql
security invoker
set search_path = ''
as $$
  select private.accept_organization_invitation_internal(p_token);
$$;

create function public.list_organization_administrators(
  p_organization_id uuid
)
returns table (
  administrator_user_id uuid,
  administrator_email text,
  administrator_created_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  select *
  from private.list_organization_administrators_internal(p_organization_id);
$$;

create function public.list_organization_invitations(
  p_organization_id uuid
)
returns table (
  invitation_id uuid,
  invitation_email text,
  invitation_status text,
  invitation_created_at timestamptz,
  invitation_expires_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  select *
  from private.list_organization_invitations_internal(p_organization_id);
$$;

revoke all
on function public.create_organization_invitation(uuid, text)
from public, anon, service_role;
revoke all
on function public.revoke_organization_invitation(uuid)
from public, anon, service_role;
revoke all
on function public.accept_organization_invitation(text)
from public, anon, service_role;
revoke all
on function public.list_organization_administrators(uuid)
from public, anon, service_role;
revoke all
on function public.list_organization_invitations(uuid)
from public, anon, service_role;

grant execute
on function public.create_organization_invitation(uuid, text)
to authenticated;
grant execute
on function public.revoke_organization_invitation(uuid)
to authenticated;
grant execute
on function public.accept_organization_invitation(text)
to authenticated;
grant execute
on function public.list_organization_administrators(uuid)
to authenticated;
grant execute
on function public.list_organization_invitations(uuid)
to authenticated;

comment on table public.organization_invitations is
  'Administrator invitations. Only SHA-256 token hashes are persisted.';

comment on function private.create_organization_invitation_internal(uuid, text)
is 'SECURITY DEFINER is required for owner-authorized invitation writes while direct table mutations remain revoked.';

comment on function private.accept_organization_invitation_internal(text)
is 'SECURITY DEFINER is required to verify auth.users email and atomically create an admin membership.';
