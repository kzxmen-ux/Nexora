alter table public.crm_connections
  drop constraint crm_connections_yclients_required_configuration;

alter table public.crm_connections
  drop constraint crm_connections_application_id;

alter table public.crm_connections
  drop constraint crm_connections_company_id;

alter table public.crm_connections
  drop constraint crm_connections_configuration_keys;

alter table public.crm_connections
  add constraint crm_connections_configuration_keys
  check (
    (configuration - array[
      'workspace_reference',
      'region',
      'salon_id'
    ]::text[]) = '{}'::jsonb
  );

alter table public.crm_connections
  add constraint crm_connections_salon_id
  check (
    not (configuration ? 'salon_id')
    or (
      provider::text = 'yclients'
      and jsonb_typeof(configuration -> 'salon_id') = 'string'
      and (configuration ->> 'salon_id') ~ '^[1-9][0-9]{0,18}$'
      and (configuration ->> 'salon_id')::numeric
        <= 9223372036854775807
    )
  );

drop policy "organization members can create crm connections"
on public.crm_connections;

create policy "organization members can create development crm connections"
on public.crm_connections
for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and created_by = (select auth.uid())
  and status = 'draft'::public.crm_connection_status
  and provider::text = 'custom'
  and private.is_organization_member(organization_id)
);

drop policy "organization members can update crm connections"
on public.crm_connections;

create policy "organization members can update development crm connections"
on public.crm_connections
for update
to authenticated
using (
  provider::text = 'custom'
  and private.is_organization_member(organization_id)
)
with check (
  provider::text = 'custom'
  and private.is_organization_member(organization_id)
);

create table private.yclients_marketplace_connection_attempts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null
    references public.organizations (id) on delete cascade,
  user_id uuid not null
    references auth.users (id) on delete cascade,
  connection_id uuid not null unique
    references public.crm_connections (id) on delete cascade,
  state_hash bytea not null unique,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint yclients_marketplace_attempt_state_hash_size
    check (octet_length(state_hash) = 32),
  constraint yclients_marketplace_attempt_expiry
    check (expires_at > created_at),
  constraint yclients_marketplace_attempt_consumed_at
    check (consumed_at is null or consumed_at >= created_at)
);

create index yclients_marketplace_attempts_organization_user_idx
  on private.yclients_marketplace_connection_attempts (
    organization_id,
    user_id,
    created_at desc
  );

alter table private.yclients_marketplace_connection_attempts
  enable row level security;

alter table private.yclients_marketplace_connection_attempts
  force row level security;

revoke all
on private.yclients_marketplace_connection_attempts
from public, anon, authenticated, service_role;

create function private.create_yclients_marketplace_attempt_internal(
  target_organization_id uuid,
  target_state_hash_hex text
)
returns table (
  attempt_id uuid,
  connection_id uuid,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  created_connection_id uuid := gen_random_uuid();
  created_attempt_id uuid := gen_random_uuid();
  attempt_expires_at timestamptz := clock_timestamp() + interval '10 minutes';
  decoded_state_hash bytea;
begin
  if caller_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if not private.is_organization_member(target_organization_id) then
    raise exception 'organization membership required'
      using errcode = '42501';
  end if;

  if target_state_hash_hex is null
    or target_state_hash_hex !~ '^[0-9a-f]{64}$'
  then
    raise exception 'invalid marketplace state' using errcode = '22023';
  end if;

  decoded_state_hash := decode(target_state_hash_hex, 'hex');

  delete from public.crm_connections as connection
  using private.yclients_marketplace_connection_attempts as attempt
  where attempt.connection_id = connection.id
    and attempt.organization_id = target_organization_id
    and attempt.user_id = caller_id
    and attempt.consumed_at is null
    and connection.provider::text = 'yclients'
    and not (connection.configuration ? 'salon_id');

  insert into public.crm_connections (
    id,
    organization_id,
    provider,
    display_name,
    status,
    configuration,
    created_by
  )
  values (
    created_connection_id,
    target_organization_id,
    'yclients'::public.crm_provider,
    'YCLIENTS',
    'draft'::public.crm_connection_status,
    '{}'::jsonb,
    caller_id
  );

  insert into private.yclients_marketplace_connection_attempts (
    id,
    organization_id,
    user_id,
    connection_id,
    state_hash,
    expires_at
  )
  values (
    created_attempt_id,
    target_organization_id,
    caller_id,
    created_connection_id,
    decoded_state_hash,
    attempt_expires_at
  );

  return query
  select
    created_attempt_id,
    created_connection_id,
    attempt_expires_at;
end;
$$;

create function private.complete_yclients_marketplace_attempt_internal(
  target_attempt_id uuid,
  target_organization_id uuid,
  target_connection_id uuid,
  target_state_hash_hex text,
  target_salon_id bigint
)
returns table (
  organization_id uuid,
  connection_id uuid
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  claimed_attempt private.yclients_marketplace_connection_attempts%rowtype;
  target_provider public.crm_provider;
begin
  if caller_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if target_salon_id is null or target_salon_id <= 0 then
    raise exception 'invalid salon id' using errcode = '22023';
  end if;

  if target_state_hash_hex is null
    or target_state_hash_hex !~ '^[0-9a-f]{64}$'
  then
    raise exception 'invalid marketplace state' using errcode = '22023';
  end if;

  update private.yclients_marketplace_connection_attempts as attempt
  set consumed_at = clock_timestamp()
  where attempt.id = target_attempt_id
    and attempt.organization_id = target_organization_id
    and attempt.connection_id = target_connection_id
    and attempt.user_id = caller_id
    and attempt.state_hash = decode(target_state_hash_hex, 'hex')
    and attempt.consumed_at is null
    and attempt.expires_at > clock_timestamp()
  returning attempt.*
  into claimed_attempt;

  if claimed_attempt.id is null then
    raise exception 'marketplace attempt is unavailable'
      using errcode = 'P0001';
  end if;

  if not private.is_organization_member(claimed_attempt.organization_id) then
    raise exception 'organization membership required'
      using errcode = '42501';
  end if;

  select connection.provider
  into target_provider
  from public.crm_connections as connection
  where connection.id = claimed_attempt.connection_id
    and connection.organization_id = claimed_attempt.organization_id
  for update;

  if target_provider is null or target_provider::text <> 'yclients' then
    raise exception 'crm connection is unavailable' using errcode = 'P0001';
  end if;

  update public.crm_connections
  set
    configuration = jsonb_build_object(
      'salon_id',
      target_salon_id::text
    ),
    status = 'draft'::public.crm_connection_status,
    last_error = null
  where id = claimed_attempt.connection_id;

  return query
  select
    claimed_attempt.organization_id,
    claimed_attempt.connection_id;
end;
$$;

create function private.get_yclients_marketplace_state_internal(
  target_organization_id uuid,
  target_connection_id uuid
)
returns table (
  marketplace_status text,
  salon_id text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  target_configuration jsonb;
begin
  if caller_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if not private.is_organization_member(target_organization_id) then
    raise exception 'organization membership required'
      using errcode = '42501';
  end if;

  select connection.configuration
  into target_configuration
  from public.crm_connections as connection
  where connection.id = target_connection_id
    and connection.organization_id = target_organization_id
    and connection.provider::text = 'yclients';

  if target_configuration is null then
    raise exception 'crm connection is unavailable' using errcode = 'P0001';
  end if;

  if target_configuration ? 'salon_id' then
    return query
    select
      'activation_required'::text,
      target_configuration ->> 'salon_id';
    return;
  end if;

  if exists (
    select 1
    from private.yclients_marketplace_connection_attempts as attempt
    where attempt.connection_id = target_connection_id
      and attempt.organization_id = target_organization_id
      and attempt.user_id = caller_id
      and attempt.consumed_at is null
      and attempt.expires_at > clock_timestamp()
  ) then
    return query select 'waiting'::text, null::text;
    return;
  end if;

  if exists (
    select 1
    from private.yclients_marketplace_connection_attempts as attempt
    where attempt.connection_id = target_connection_id
      and attempt.organization_id = target_organization_id
      and attempt.user_id = caller_id
      and attempt.consumed_at is null
  ) then
    return query select 'failed'::text, null::text;
    return;
  end if;

  return query select 'not_connected'::text, null::text;
end;
$$;

revoke all
on function private.create_yclients_marketplace_attempt_internal(uuid, text)
from public, anon, service_role;

revoke all
on function private.complete_yclients_marketplace_attempt_internal(
  uuid, uuid, uuid, text, bigint
)
from public, anon, service_role;

revoke all
on function private.get_yclients_marketplace_state_internal(uuid, uuid)
from public, anon, service_role;

grant execute
on function private.create_yclients_marketplace_attempt_internal(uuid, text)
to authenticated;

grant execute
on function private.complete_yclients_marketplace_attempt_internal(
  uuid, uuid, uuid, text, bigint
)
to authenticated;

grant execute
on function private.get_yclients_marketplace_state_internal(uuid, uuid)
to authenticated;

create function public.create_yclients_marketplace_attempt(
  p_organization_id uuid,
  p_state_hash text
)
returns table (
  attempt_id uuid,
  connection_id uuid,
  expires_at timestamptz
)
language sql
security invoker
set search_path = ''
as $$
  select *
  from private.create_yclients_marketplace_attempt_internal(
    p_organization_id,
    p_state_hash
  );
$$;

create function public.complete_yclients_marketplace_attempt(
  p_attempt_id uuid,
  p_organization_id uuid,
  p_connection_id uuid,
  p_state_hash text,
  p_salon_id bigint
)
returns table (
  organization_id uuid,
  connection_id uuid
)
language sql
security invoker
set search_path = ''
as $$
  select *
  from private.complete_yclients_marketplace_attempt_internal(
    p_attempt_id,
    p_organization_id,
    p_connection_id,
    p_state_hash,
    p_salon_id
  );
$$;

create function public.get_yclients_marketplace_state(
  p_organization_id uuid,
  p_connection_id uuid
)
returns table (
  marketplace_status text,
  salon_id text
)
language sql
security invoker
set search_path = ''
as $$
  select *
  from private.get_yclients_marketplace_state_internal(
    p_organization_id,
    p_connection_id
  );
$$;

revoke all
on function public.create_yclients_marketplace_attempt(uuid, text)
from public, anon, service_role;

revoke all
on function public.complete_yclients_marketplace_attempt(
  uuid, uuid, uuid, text, bigint
)
from public, anon, service_role;

revoke all
on function public.get_yclients_marketplace_state(uuid, uuid)
from public, anon, service_role;

grant execute
on function public.create_yclients_marketplace_attempt(uuid, text)
to authenticated;

grant execute
on function public.complete_yclients_marketplace_attempt(
  uuid, uuid, uuid, text, bigint
)
to authenticated;

grant execute
on function public.get_yclients_marketplace_state(uuid, uuid)
to authenticated;

comment on table private.yclients_marketplace_connection_attempts is
  'Short-lived, one-time YCLIENTS marketplace redirects. Only a SHA-256 state hash is stored.';

comment on column public.crm_connections.configuration is
  'Strictly non-secret provider configuration. YCLIENTS salon_id is allowed; credentials and tokens are forbidden.';

comment on function private.create_yclients_marketplace_attempt_internal(
  uuid,
  text
)
is 'SECURITY DEFINER atomically creates a draft YCLIENTS connection and private short-lived attempt after checking auth.uid() and organization membership.';

comment on function private.complete_yclients_marketplace_attempt_internal(
  uuid,
  uuid,
  uuid,
  text,
  bigint
)
is 'SECURITY DEFINER atomically consumes the caller-bound one-time state and writes only a validated salon_id to the matching draft connection.';
