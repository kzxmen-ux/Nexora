alter table public.crm_connections
  drop constraint crm_connections_configuration_keys;

alter table public.crm_connections
  add constraint crm_connections_configuration_keys
  check (
    (configuration - array[
      'workspace_reference',
      'region',
      'salon_id',
      'application_id',
      'location_ids',
      'activated_location_ids',
      'verified_location_ids',
      'provider_activation_status',
      'activation_completed_at'
    ]::text[]) = '{}'::jsonb
  );

alter table public.crm_connections
  add constraint crm_connections_altegio_activation_configuration
  check (
    provider::text <> 'altegio'
    or (
      (not (configuration ? 'application_id') or (
        configuration ->> 'application_id' = '2167'
        and jsonb_typeof(configuration -> 'application_id') = 'string'
      ))
      and (not (configuration ? 'location_ids') or (
        jsonb_typeof(configuration -> 'location_ids') = 'array'
        and jsonb_array_length(configuration -> 'location_ids') between 1 and 100
        and not jsonb_path_exists(
          configuration,
          '$.location_ids[*] ? (@.type() != "string" || !(@ like_regex "^[1-9][0-9]{0,17}$"))'
        )
      ))
      and (not (configuration ? 'activated_location_ids') or (
        jsonb_typeof(configuration -> 'activated_location_ids') = 'array'
        and jsonb_array_length(configuration -> 'activated_location_ids') <= 100
        and not jsonb_path_exists(
          configuration,
          '$.activated_location_ids[*] ? (@.type() != "string" || !(@ like_regex "^[1-9][0-9]{0,17}$"))'
        )
      ))
      and (not (configuration ? 'verified_location_ids') or (
        jsonb_typeof(configuration -> 'verified_location_ids') = 'array'
        and jsonb_array_length(configuration -> 'verified_location_ids') <= 100
        and not jsonb_path_exists(
          configuration,
          '$.verified_location_ids[*] ? (@.type() != "string" || !(@ like_regex "^[1-9][0-9]{0,17}$"))'
        )
      ))
      and (not (configuration ? 'provider_activation_status') or (
        jsonb_typeof(configuration -> 'provider_activation_status') = 'string'
        and configuration ->> 'provider_activation_status'
          in ('verified', 'partial', 'error')
      ))
      and (not (configuration ? 'activation_completed_at') or (
        jsonb_typeof(configuration -> 'activation_completed_at') = 'string'
        and char_length(configuration ->> 'activation_completed_at') between 20 and 40
      ))
    )
  );

create table private.altegio_marketplace_connection_attempts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null
    references public.organizations (id) on delete cascade,
  user_id uuid not null
    references auth.users (id) on delete cascade,
  provider public.crm_provider not null default 'altegio'::public.crm_provider,
  connection_id uuid unique
    references public.crm_connections (id) on delete cascade,
  state_hash bytea not null unique,
  status text not null default 'pending',
  selected_location_ids bigint[],
  expires_at timestamptz not null,
  callback_received_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint altegio_marketplace_attempt_state_hash_size
    check (octet_length(state_hash) = 32),
  constraint altegio_marketplace_attempt_provider
    check (provider = 'altegio'::public.crm_provider),
  constraint altegio_marketplace_attempt_status
    check (status in (
      'pending',
      'processing',
      'partial',
      'succeeded',
      'error',
      'expired'
    )),
  constraint altegio_marketplace_attempt_expiry
    check (
      expires_at > created_at
      and expires_at <= created_at + interval '1 hour'
    ),
  constraint altegio_marketplace_attempt_locations
    check (
      selected_location_ids is null
      or (
        cardinality(selected_location_ids) between 1 and 100
        and 0 < all(selected_location_ids)
        and 9007199254740991 >= all(selected_location_ids)
      )
    ),
  constraint altegio_marketplace_attempt_callback_state
    check (
      (callback_received_at is null and selected_location_ids is null)
      or (callback_received_at is not null and selected_location_ids is not null)
    ),
  constraint altegio_marketplace_attempt_completion_state
    check (
      (status = 'succeeded' and completed_at is not null)
      or (status <> 'succeeded' and completed_at is null)
    )
);

create index altegio_marketplace_attempts_organization_user_idx
  on private.altegio_marketplace_connection_attempts (
    organization_id,
    user_id,
    created_at desc
  );

create index altegio_marketplace_attempts_user_idx
  on private.altegio_marketplace_connection_attempts (user_id);

create table private.altegio_marketplace_activation_locations (
  attempt_id uuid not null
    references private.altegio_marketplace_connection_attempts (id)
    on delete cascade,
  location_id bigint not null,
  status text not null default 'pending',
  last_stage text,
  error_code text,
  activation_completed_at timestamptz,
  verification_completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (attempt_id, location_id),
  constraint altegio_activation_location_id
    check (location_id between 1 and 9007199254740991),
  constraint altegio_activation_location_status
    check (status in ('pending', 'activated', 'verified', 'failed')),
  constraint altegio_activation_location_stage
    check (last_stage is null or last_stage in ('activation', 'verification')),
  constraint altegio_activation_location_error_code
    check (
      error_code is null
      or (
        char_length(error_code) between 1 and 64
        and error_code ~ '^[a-z0-9_]+$'
      )
    ),
  constraint altegio_activation_location_result
    check (
      (status = 'pending'
        and activation_completed_at is null
        and verification_completed_at is null
        and error_code is null)
      or (status = 'activated'
        and activation_completed_at is not null
        and verification_completed_at is null
        and error_code is null)
      or (status = 'verified'
        and activation_completed_at is not null
        and verification_completed_at is not null
        and error_code is null)
      or (status = 'failed'
        and last_stage is not null
        and error_code is not null
        and verification_completed_at is null)
    )
);

alter table private.altegio_marketplace_connection_attempts
  enable row level security;
alter table private.altegio_marketplace_connection_attempts
  force row level security;
alter table private.altegio_marketplace_activation_locations
  enable row level security;
alter table private.altegio_marketplace_activation_locations
  force row level security;

revoke all
on private.altegio_marketplace_connection_attempts,
  private.altegio_marketplace_activation_locations
from public, anon, authenticated, service_role;

create function private.assert_altegio_marketplace_attempt_access(
  target_attempt_id uuid,
  target_organization_id uuid,
  target_state_hash_hex text
)
returns private.altegio_marketplace_connection_attempts
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  target_attempt private.altegio_marketplace_connection_attempts%rowtype;
begin
  if caller_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if target_state_hash_hex is null
    or target_state_hash_hex !~ '^[0-9a-f]{64}$'
  then
    raise exception 'invalid marketplace state' using errcode = '22023';
  end if;

  select attempt.*
  into target_attempt
  from private.altegio_marketplace_connection_attempts as attempt
  where attempt.id = target_attempt_id
    and attempt.organization_id = target_organization_id
    and attempt.user_id = caller_id
    and attempt.state_hash = decode(target_state_hash_hex, 'hex');

  if target_attempt.id is null then
    raise exception 'marketplace attempt is unavailable'
      using errcode = 'P0001';
  end if;

  if not private.is_organization_member(target_attempt.organization_id) then
    raise exception 'organization membership required'
      using errcode = '42501';
  end if;

  return target_attempt;
end;
$$;

create function private.create_altegio_marketplace_attempt_internal(
  target_organization_id uuid,
  target_state_hash_hex text
)
returns table (
  attempt_id uuid,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  created_attempt_id uuid := gen_random_uuid();
  attempt_expires_at timestamptz := clock_timestamp() + interval '55 minutes';
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

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      target_organization_id::text || ':' || caller_id::text,
      0
    )
  );

  update private.altegio_marketplace_connection_attempts
  set status = 'expired', updated_at = clock_timestamp()
  where organization_id = target_organization_id
    and user_id = caller_id
    and callback_received_at is null
    and status = 'pending';

  insert into private.altegio_marketplace_connection_attempts (
    id,
    organization_id,
    user_id,
    state_hash,
    expires_at
  )
  values (
    created_attempt_id,
    target_organization_id,
    caller_id,
    decode(target_state_hash_hex, 'hex'),
    attempt_expires_at
  );

  return query select created_attempt_id, attempt_expires_at;
end;
$$;

create function private.claim_altegio_marketplace_callback_internal(
  target_attempt_id uuid,
  target_organization_id uuid,
  target_state_hash_hex text,
  target_location_ids bigint[]
)
returns table (
  claim_status text,
  should_process boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_attempt private.altegio_marketplace_connection_attempts%rowtype;
  normalized_location_ids bigint[];
begin
  target_attempt := private.assert_altegio_marketplace_attempt_access(
    target_attempt_id,
    target_organization_id,
    target_state_hash_hex
  );

  select array_agg(distinct location_id order by location_id)
  into normalized_location_ids
  from unnest(target_location_ids) as location_id;

  if normalized_location_ids is null
    or cardinality(normalized_location_ids) > 100
    or not (0 < all(normalized_location_ids))
    or not (9007199254740991 >= all(normalized_location_ids))
  then
    raise exception 'invalid location ids' using errcode = '22023';
  end if;

  select attempt.*
  into target_attempt
  from private.altegio_marketplace_connection_attempts as attempt
  where attempt.id = target_attempt_id
  for update;

  if target_attempt.expires_at <= clock_timestamp() then
    update private.altegio_marketplace_connection_attempts
    set status = 'expired', updated_at = clock_timestamp()
    where id = target_attempt.id and status <> 'succeeded';
    return query select 'expired'::text, false;
    return;
  end if;

  if target_attempt.callback_received_at is not null then
    if target_attempt.selected_location_ids <> normalized_location_ids then
      return query select 'mismatch'::text, false;
    else
      return query select 'reused'::text, false;
    end if;
    return;
  end if;

  if target_attempt.status <> 'pending' then
    return query select 'unavailable'::text, false;
    return;
  end if;

  update private.altegio_marketplace_connection_attempts
  set
    callback_received_at = clock_timestamp(),
    selected_location_ids = normalized_location_ids,
    status = 'processing',
    updated_at = clock_timestamp()
  where id = target_attempt.id;

  insert into private.altegio_marketplace_activation_locations (
    attempt_id,
    location_id
  )
  select target_attempt.id, location_id
  from unnest(normalized_location_ids) as location_id;

  return query select 'accepted'::text, true;
end;
$$;

create function private.begin_altegio_marketplace_retry_internal(
  target_attempt_id uuid,
  target_organization_id uuid,
  target_state_hash_hex text
)
returns table (
  claim_status text,
  should_process boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_attempt private.altegio_marketplace_connection_attempts%rowtype;
begin
  target_attempt := private.assert_altegio_marketplace_attempt_access(
    target_attempt_id,
    target_organization_id,
    target_state_hash_hex
  );

  select attempt.*
  into target_attempt
  from private.altegio_marketplace_connection_attempts as attempt
  where attempt.id = target_attempt_id
  for update;

  if target_attempt.expires_at <= clock_timestamp() then
    update private.altegio_marketplace_connection_attempts
    set status = 'expired', updated_at = clock_timestamp()
    where id = target_attempt.id and status <> 'succeeded';
    return query select 'expired'::text, false;
    return;
  end if;

  if target_attempt.status not in ('partial', 'error') then
    return query select 'unavailable'::text, false;
    return;
  end if;

  update private.altegio_marketplace_connection_attempts
  set status = 'processing', updated_at = clock_timestamp()
  where id = target_attempt.id;

  return query select 'accepted'::text, true;
end;
$$;

create function private.list_altegio_marketplace_locations_internal(
  target_attempt_id uuid,
  target_organization_id uuid,
  target_state_hash_hex text
)
returns table (
  location_id bigint,
  activation_status text,
  activation_succeeded boolean,
  last_stage text,
  error_code text
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.assert_altegio_marketplace_attempt_access(
    target_attempt_id,
    target_organization_id,
    target_state_hash_hex
  );

  return query
  select
    location.location_id,
    location.status,
    location.activation_completed_at is not null,
    location.last_stage,
    location.error_code
  from private.altegio_marketplace_activation_locations as location
  where location.attempt_id = target_attempt_id
  order by location.location_id;
end;
$$;

create function private.record_altegio_marketplace_location_result_internal(
  target_attempt_id uuid,
  target_organization_id uuid,
  target_state_hash_hex text,
  target_location_id bigint,
  target_result text,
  target_error_code text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.assert_altegio_marketplace_attempt_access(
    target_attempt_id,
    target_organization_id,
    target_state_hash_hex
  );

  if target_location_id is null
    or target_location_id <= 0
    or target_location_id > 9007199254740991
  then
    raise exception 'invalid location id' using errcode = '22023';
  end if;

  if target_result not in (
    'activated',
    'verified',
    'activation_failed',
    'verification_failed'
  ) then
    raise exception 'invalid activation result' using errcode = '22023';
  end if;

  if target_result like '%_failed' and (
    target_error_code is null
    or target_error_code !~ '^[a-z0-9_]{1,64}$'
  ) then
    raise exception 'invalid error code' using errcode = '22023';
  end if;

  if target_result = 'activated' then
    update private.altegio_marketplace_activation_locations
    set
      status = 'activated',
      last_stage = 'activation',
      error_code = null,
      activation_completed_at = coalesce(
        activation_completed_at,
        clock_timestamp()
      ),
      verification_completed_at = null,
      updated_at = clock_timestamp()
    where attempt_id = target_attempt_id
      and location_id = target_location_id
      and status <> 'verified';
  elsif target_result = 'verified' then
    update private.altegio_marketplace_activation_locations
    set
      status = 'verified',
      last_stage = 'verification',
      error_code = null,
      activation_completed_at = coalesce(
        activation_completed_at,
        clock_timestamp()
      ),
      verification_completed_at = clock_timestamp(),
      updated_at = clock_timestamp()
    where attempt_id = target_attempt_id
      and location_id = target_location_id
      and activation_completed_at is not null;
  elsif target_result = 'activation_failed' then
    update private.altegio_marketplace_activation_locations
    set
      status = 'failed',
      last_stage = 'activation',
      error_code = target_error_code,
      activation_completed_at = null,
      verification_completed_at = null,
      updated_at = clock_timestamp()
    where attempt_id = target_attempt_id
      and location_id = target_location_id
      and status <> 'verified';
  else
    update private.altegio_marketplace_activation_locations
    set
      status = 'failed',
      last_stage = 'verification',
      error_code = target_error_code,
      verification_completed_at = null,
      updated_at = clock_timestamp()
    where attempt_id = target_attempt_id
      and location_id = target_location_id
      and activation_completed_at is not null
      and status <> 'verified';
  end if;

  if not found then
    raise exception 'activation location is unavailable'
      using errcode = 'P0001';
  end if;
end;
$$;

create function private.finalize_altegio_marketplace_attempt_internal(
  target_attempt_id uuid,
  target_organization_id uuid,
  target_state_hash_hex text,
  target_application_id integer
)
returns table (
  activation_status text,
  connection_id uuid,
  organization_id uuid
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_attempt private.altegio_marketplace_connection_attempts%rowtype;
  total_count integer;
  activated_count integer;
  verified_count integer;
  final_status text;
  target_connection_id uuid;
  selected_ids jsonb;
  activated_ids jsonb;
  verified_ids jsonb;
  activation_finished_at timestamptz;
begin
  target_attempt := private.assert_altegio_marketplace_attempt_access(
    target_attempt_id,
    target_organization_id,
    target_state_hash_hex
  );

  if target_application_id <> 2167 then
    raise exception 'invalid application id' using errcode = '22023';
  end if;

  select
    count(*),
    count(*) filter (where location.activation_completed_at is not null),
    count(*) filter (where location.status = 'verified'),
    coalesce(jsonb_agg(location.location_id::text order by location.location_id), '[]'::jsonb),
    coalesce(jsonb_agg(location.location_id::text order by location.location_id)
      filter (where location.activation_completed_at is not null), '[]'::jsonb),
    coalesce(jsonb_agg(location.location_id::text order by location.location_id)
      filter (where location.status = 'verified'), '[]'::jsonb),
    max(location.activation_completed_at)
  into
    total_count,
    activated_count,
    verified_count,
    selected_ids,
    activated_ids,
    verified_ids,
    activation_finished_at
  from private.altegio_marketplace_activation_locations as location
  where location.attempt_id = target_attempt.id;

  if total_count = 0 then
    raise exception 'activation locations are unavailable'
      using errcode = 'P0001';
  end if;

  final_status := case
    when verified_count = total_count then 'succeeded'
    when activated_count > 0 or verified_count > 0 then 'partial'
    else 'error'
  end;

  target_connection_id := coalesce(
    target_attempt.connection_id,
    gen_random_uuid()
  );

  insert into public.crm_connections (
    id,
    organization_id,
    provider,
    display_name,
    status,
    configuration,
    created_by,
    last_error
  )
  values (
    target_connection_id,
    target_attempt.organization_id,
    'altegio'::public.crm_provider,
    'Altegio',
    case
      when final_status = 'succeeded'
        then 'connected'::public.crm_connection_status
      else 'error'::public.crm_connection_status
    end,
    jsonb_strip_nulls(jsonb_build_object(
      'application_id', target_application_id::text,
      'location_ids', selected_ids,
      'activated_location_ids', activated_ids,
      'verified_location_ids', verified_ids,
      'provider_activation_status', case
        when final_status = 'succeeded' then 'verified'
        else final_status
      end,
      'activation_completed_at', activation_finished_at
    )),
    target_attempt.user_id,
    case
      when final_status = 'succeeded' then null
      when final_status = 'partial' then 'altegio_activation_partial'
      else 'altegio_activation_failed'
    end
  )
  on conflict (id) do update
  set
    status = excluded.status,
    configuration = excluded.configuration,
    last_error = excluded.last_error,
    updated_at = clock_timestamp();

  update private.altegio_marketplace_connection_attempts
  set
    connection_id = target_connection_id,
    status = final_status,
    completed_at = case
      when final_status = 'succeeded' then clock_timestamp()
      else null
    end,
    updated_at = clock_timestamp()
  where id = target_attempt.id;

  return query
  select final_status, target_connection_id, target_attempt.organization_id;
end;
$$;

create function private.get_altegio_marketplace_attempt_state_internal(
  target_attempt_id uuid,
  target_organization_id uuid,
  target_state_hash_hex text
)
returns table (
  activation_status text,
  connection_id uuid,
  expires_at timestamptz,
  selected_location_ids bigint[],
  verified_location_ids bigint[],
  failed_location_ids bigint[]
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_attempt private.altegio_marketplace_connection_attempts%rowtype;
begin
  target_attempt := private.assert_altegio_marketplace_attempt_access(
    target_attempt_id,
    target_organization_id,
    target_state_hash_hex
  );

  return query
  select
    case
      when target_attempt.expires_at <= clock_timestamp()
        and target_attempt.status <> 'succeeded'
        then 'expired'::text
      else target_attempt.status
    end,
    target_attempt.connection_id,
    target_attempt.expires_at,
    target_attempt.selected_location_ids,
    coalesce((
      select array_agg(location.location_id order by location.location_id)
      from private.altegio_marketplace_activation_locations as location
      where location.attempt_id = target_attempt.id
        and location.status = 'verified'
    ), '{}'::bigint[]),
    coalesce((
      select array_agg(location.location_id order by location.location_id)
      from private.altegio_marketplace_activation_locations as location
      where location.attempt_id = target_attempt.id
        and location.status = 'failed'
    ), '{}'::bigint[]);
end;
$$;

revoke all on function private.assert_altegio_marketplace_attempt_access(uuid, uuid, text)
from public, anon, authenticated, service_role;
revoke all on function private.create_altegio_marketplace_attempt_internal(uuid, text)
from public, anon, service_role;
revoke all on function private.claim_altegio_marketplace_callback_internal(uuid, uuid, text, bigint[])
from public, anon, service_role;
revoke all on function private.begin_altegio_marketplace_retry_internal(uuid, uuid, text)
from public, anon, service_role;
revoke all on function private.list_altegio_marketplace_locations_internal(uuid, uuid, text)
from public, anon, service_role;
revoke all on function private.record_altegio_marketplace_location_result_internal(uuid, uuid, text, bigint, text, text)
from public, anon, service_role;
revoke all on function private.finalize_altegio_marketplace_attempt_internal(uuid, uuid, text, integer)
from public, anon, service_role;
revoke all on function private.get_altegio_marketplace_attempt_state_internal(uuid, uuid, text)
from public, anon, service_role;

grant execute on function private.create_altegio_marketplace_attempt_internal(uuid, text)
to authenticated;
grant execute on function private.claim_altegio_marketplace_callback_internal(uuid, uuid, text, bigint[])
to authenticated;
grant execute on function private.begin_altegio_marketplace_retry_internal(uuid, uuid, text)
to authenticated;
grant execute on function private.list_altegio_marketplace_locations_internal(uuid, uuid, text)
to authenticated;
grant execute on function private.record_altegio_marketplace_location_result_internal(uuid, uuid, text, bigint, text, text)
to authenticated;
grant execute on function private.finalize_altegio_marketplace_attempt_internal(uuid, uuid, text, integer)
to authenticated;
grant execute on function private.get_altegio_marketplace_attempt_state_internal(uuid, uuid, text)
to authenticated;

create function public.create_altegio_marketplace_attempt(
  p_organization_id uuid,
  p_state_hash text
)
returns table (attempt_id uuid, expires_at timestamptz)
language sql
security invoker
set search_path = ''
as $$
  select * from private.create_altegio_marketplace_attempt_internal(
    p_organization_id,
    p_state_hash
  );
$$;

create function public.claim_altegio_marketplace_callback(
  p_attempt_id uuid,
  p_organization_id uuid,
  p_state_hash text,
  p_location_ids bigint[]
)
returns table (claim_status text, should_process boolean)
language sql
security invoker
set search_path = ''
as $$
  select * from private.claim_altegio_marketplace_callback_internal(
    p_attempt_id,
    p_organization_id,
    p_state_hash,
    p_location_ids
  );
$$;

create function public.begin_altegio_marketplace_retry(
  p_attempt_id uuid,
  p_organization_id uuid,
  p_state_hash text
)
returns table (claim_status text, should_process boolean)
language sql
security invoker
set search_path = ''
as $$
  select * from private.begin_altegio_marketplace_retry_internal(
    p_attempt_id,
    p_organization_id,
    p_state_hash
  );
$$;

create function public.list_altegio_marketplace_locations(
  p_attempt_id uuid,
  p_organization_id uuid,
  p_state_hash text
)
returns table (
  location_id bigint,
  activation_status text,
  activation_succeeded boolean,
  last_stage text,
  error_code text
)
language sql
security invoker
set search_path = ''
as $$
  select * from private.list_altegio_marketplace_locations_internal(
    p_attempt_id,
    p_organization_id,
    p_state_hash
  );
$$;

create function public.record_altegio_marketplace_location_result(
  p_attempt_id uuid,
  p_organization_id uuid,
  p_state_hash text,
  p_location_id bigint,
  p_result text,
  p_error_code text default null
)
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.record_altegio_marketplace_location_result_internal(
    p_attempt_id,
    p_organization_id,
    p_state_hash,
    p_location_id,
    p_result,
    p_error_code
  );
$$;

create function public.finalize_altegio_marketplace_attempt(
  p_attempt_id uuid,
  p_organization_id uuid,
  p_state_hash text,
  p_application_id integer
)
returns table (
  activation_status text,
  connection_id uuid,
  organization_id uuid
)
language sql
security invoker
set search_path = ''
as $$
  select * from private.finalize_altegio_marketplace_attempt_internal(
    p_attempt_id,
    p_organization_id,
    p_state_hash,
    p_application_id
  );
$$;

create function public.get_altegio_marketplace_attempt_state(
  p_attempt_id uuid,
  p_organization_id uuid,
  p_state_hash text
)
returns table (
  activation_status text,
  connection_id uuid,
  expires_at timestamptz,
  selected_location_ids bigint[],
  verified_location_ids bigint[],
  failed_location_ids bigint[]
)
language sql
security invoker
set search_path = ''
as $$
  select * from private.get_altegio_marketplace_attempt_state_internal(
    p_attempt_id,
    p_organization_id,
    p_state_hash
  );
$$;

revoke all on function public.create_altegio_marketplace_attempt(uuid, text)
from public, anon, service_role;
revoke all on function public.claim_altegio_marketplace_callback(uuid, uuid, text, bigint[])
from public, anon, service_role;
revoke all on function public.begin_altegio_marketplace_retry(uuid, uuid, text)
from public, anon, service_role;
revoke all on function public.list_altegio_marketplace_locations(uuid, uuid, text)
from public, anon, service_role;
revoke all on function public.record_altegio_marketplace_location_result(uuid, uuid, text, bigint, text, text)
from public, anon, service_role;
revoke all on function public.finalize_altegio_marketplace_attempt(uuid, uuid, text, integer)
from public, anon, service_role;
revoke all on function public.get_altegio_marketplace_attempt_state(uuid, uuid, text)
from public, anon, service_role;

grant execute on function public.create_altegio_marketplace_attempt(uuid, text)
to authenticated;
grant execute on function public.claim_altegio_marketplace_callback(uuid, uuid, text, bigint[])
to authenticated;
grant execute on function public.begin_altegio_marketplace_retry(uuid, uuid, text)
to authenticated;
grant execute on function public.list_altegio_marketplace_locations(uuid, uuid, text)
to authenticated;
grant execute on function public.record_altegio_marketplace_location_result(uuid, uuid, text, bigint, text, text)
to authenticated;
grant execute on function public.finalize_altegio_marketplace_attempt(uuid, uuid, text, integer)
to authenticated;
grant execute on function public.get_altegio_marketplace_attempt_state(uuid, uuid, text)
to authenticated;

comment on table private.altegio_marketplace_connection_attempts is
  'Short-lived, single-use Altegio Marketplace callbacks bound to auth.uid(), organization, provider state hash, and a maximum one-hour activation window.';

comment on table private.altegio_marketplace_activation_locations is
  'Per-location activation and verification outcomes. Contains no provider tokens or customer data.';

comment on column public.crm_connections.configuration is
  'Strictly non-secret provider configuration. Altegio may store application and location activation metadata; provider tokens are forbidden.';
