alter type public.crm_provider add value 'altegio';

alter table public.crm_connections
  drop constraint crm_connections_salon_id;

alter table public.crm_connections
  add constraint crm_connections_salon_id
  check (
    not (configuration ? 'salon_id')
    or (
      provider::text in ('altegio', 'yclients')
      and jsonb_typeof(configuration -> 'salon_id') = 'string'
      and (configuration ->> 'salon_id') ~ '^[1-9][0-9]{0,18}$'
      and (configuration ->> 'salon_id')::numeric
        <= 9223372036854775807
    )
  );

create unique index crm_connections_provider_salon_id_uidx
  on public.crm_connections (
    provider,
    (configuration ->> 'salon_id')
  )
  where configuration ? 'salon_id';

create table private.altegio_webhook_inbox (
  id uuid primary key default gen_random_uuid(),
  provider public.crm_provider not null,
  organization_id uuid not null
    references public.organizations (id) on delete cascade,
  connection_id uuid not null
    references public.crm_connections (id) on delete cascade,
  company_id bigint not null,
  resource text not null,
  resource_id bigint not null,
  event_status text not null,
  received_at timestamptz not null default clock_timestamp(),
  processing_status text not null default 'pending',
  raw_payload jsonb not null,
  payload_hash bytea not null,
  error_code text,
  processed_at timestamptz,
  constraint altegio_webhook_inbox_provider
    check (provider::text = 'altegio'),
  constraint altegio_webhook_inbox_company_id
    check (company_id > 0),
  constraint altegio_webhook_inbox_resource
    check (
      char_length(resource) between 1 and 64
      and resource ~ '^[a-z][a-z0-9_]{0,63}$'
    ),
  constraint altegio_webhook_inbox_resource_id
    check (resource_id > 0),
  constraint altegio_webhook_inbox_event_status
    check (
      char_length(event_status) between 1 and 32
      and event_status ~ '^[a-z][a-z0-9_-]{0,31}$'
    ),
  constraint altegio_webhook_inbox_processing_status
    check (
      processing_status in (
        'pending',
        'processing',
        'processed',
        'failed'
      )
    ),
  constraint altegio_webhook_inbox_raw_payload_object
    check (jsonb_typeof(raw_payload) = 'object'),
  constraint altegio_webhook_inbox_raw_payload_size
    check (octet_length(raw_payload::text) <= 262144),
  constraint altegio_webhook_inbox_payload_hash_size
    check (octet_length(payload_hash) = 32),
  constraint altegio_webhook_inbox_error_code
    check (
      error_code is null
      or (
        char_length(error_code) between 1 and 64
        and error_code ~ '^[a-z][a-z0-9_]{0,63}$'
      )
    ),
  constraint altegio_webhook_inbox_processing_result
    check (
      (
        processing_status in ('pending', 'processing')
        and processed_at is null
      )
      or (
        processing_status in ('processed', 'failed')
        and processed_at is not null
      )
    ),
  constraint altegio_webhook_inbox_pending_has_no_error
    check (processing_status <> 'pending' or error_code is null),
  constraint altegio_webhook_inbox_payload_hash_unique
    unique (provider, payload_hash)
);

create index altegio_webhook_inbox_organization_idx
  on private.altegio_webhook_inbox (organization_id);

create index altegio_webhook_inbox_connection_idx
  on private.altegio_webhook_inbox (connection_id);

create index altegio_webhook_inbox_pending_received_idx
  on private.altegio_webhook_inbox (received_at)
  where processing_status = 'pending';

alter table private.altegio_webhook_inbox enable row level security;
alter table private.altegio_webhook_inbox force row level security;

revoke all
on private.altegio_webhook_inbox
from public, anon, authenticated, service_role;

create function webhook_private.store_altegio_webhook_event_internal(
  target_company_id bigint,
  target_resource text,
  target_resource_id bigint,
  target_event_status text,
  target_payload jsonb
)
returns table (
  outcome text,
  event_id uuid
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_connection_id uuid;
  target_organization_id uuid;
  target_connection_status public.crm_connection_status;
  target_provider public.crm_provider;
  calculated_payload_hash bytea;
  inserted_event_id uuid;
begin
  if target_company_id is null or target_company_id <= 0 then
    raise exception 'invalid company id' using errcode = '22023';
  end if;

  if target_resource_id is null or target_resource_id <= 0 then
    raise exception 'invalid resource id' using errcode = '22023';
  end if;

  if target_resource is null
    or char_length(target_resource) not between 1 and 64
    or target_resource !~ '^[a-z][a-z0-9_]{0,63}$'
  then
    raise exception 'invalid resource' using errcode = '22023';
  end if;

  if target_event_status is null
    or char_length(target_event_status) not between 1 and 32
    or target_event_status !~ '^[a-z][a-z0-9_-]{0,31}$'
  then
    raise exception 'invalid event status' using errcode = '22023';
  end if;

  if target_payload is null
    or jsonb_typeof(target_payload) <> 'object'
    or not (
      target_payload ?& array[
        'company_id',
        'resource',
        'resource_id',
        'status',
        'data'
      ]::text[]
    )
    or (
      target_payload - array[
        'company_id',
        'resource',
        'resource_id',
        'status',
        'data'
      ]::text[]
    ) <> '{}'::jsonb
    or jsonb_typeof(target_payload -> 'company_id') <> 'number'
    or jsonb_typeof(target_payload -> 'resource') <> 'string'
    or jsonb_typeof(target_payload -> 'resource_id') <> 'number'
    or jsonb_typeof(target_payload -> 'status') <> 'string'
    or jsonb_typeof(target_payload -> 'data') <> 'object'
    or (target_payload ->> 'company_id') !~ '^[1-9][0-9]{0,18}$'
    or (target_payload ->> 'resource_id') !~ '^[1-9][0-9]{0,18}$'
    or (target_payload ->> 'company_id')::numeric > 9223372036854775807
    or (target_payload ->> 'resource_id')::numeric > 9223372036854775807
    or (target_payload ->> 'company_id')::bigint <> target_company_id
    or (target_payload ->> 'resource_id')::bigint <> target_resource_id
    or target_payload ->> 'resource' <> target_resource
    or target_payload ->> 'status' <> target_event_status
    or octet_length(target_payload::text) > 262144
  then
    raise exception 'invalid webhook payload' using errcode = '22023';
  end if;

  select
    connection.id,
    connection.organization_id,
    connection.status,
    connection.provider
  into
    target_connection_id,
    target_organization_id,
    target_connection_status,
    target_provider
  from public.crm_connections as connection
  where connection.provider::text = 'altegio'
    and connection.configuration ->> 'salon_id' = target_company_id::text;

  if target_connection_id is null
    or target_connection_status = 'disconnected'::public.crm_connection_status
  then
    return query select 'connection_unavailable'::text, null::uuid;
    return;
  end if;

  calculated_payload_hash := extensions.digest(
    convert_to(target_payload::text, 'UTF8'),
    'sha256'
  );

  insert into private.altegio_webhook_inbox (
    provider,
    organization_id,
    connection_id,
    company_id,
    resource,
    resource_id,
    event_status,
    processing_status,
    raw_payload,
    payload_hash
  )
  values (
    target_provider,
    target_organization_id,
    target_connection_id,
    target_company_id,
    target_resource,
    target_resource_id,
    target_event_status,
    'pending',
    target_payload,
    calculated_payload_hash
  )
  on conflict (provider, payload_hash) do nothing
  returning id into inserted_event_id;

  if inserted_event_id is null then
    select inbox.id
    into inserted_event_id
    from private.altegio_webhook_inbox as inbox
    where inbox.provider::text = 'altegio'
      and inbox.payload_hash = calculated_payload_hash;

    return query select 'duplicate'::text, inserted_event_id;
    return;
  end if;

  return query select 'accepted'::text, inserted_event_id;
end;
$$;

revoke all
on function webhook_private.store_altegio_webhook_event_internal(
  bigint,
  text,
  bigint,
  text,
  jsonb
)
from public, anon, authenticated, service_role;

grant execute
on function webhook_private.store_altegio_webhook_event_internal(
  bigint,
  text,
  bigint,
  text,
  jsonb
)
to service_role;

create function public.store_altegio_webhook_event(
  p_company_id bigint,
  p_resource text,
  p_resource_id bigint,
  p_event_status text,
  p_payload jsonb
)
returns table (
  outcome text,
  event_id uuid
)
language sql
security invoker
set search_path = ''
as $$
  select *
  from webhook_private.store_altegio_webhook_event_internal(
    p_company_id,
    p_resource,
    p_resource_id,
    p_event_status,
    p_payload
  );
$$;

revoke all
on function public.store_altegio_webhook_event(
  bigint,
  text,
  bigint,
  text,
  jsonb
)
from public, anon, authenticated, service_role;

grant execute
on function public.store_altegio_webhook_event(
  bigint,
  text,
  bigint,
  text,
  jsonb
)
to service_role;

comment on table private.altegio_webhook_inbox is
  'Append-only server webhook inbox. Browser roles have no privileges or RLS policies.';

comment on column private.altegio_webhook_inbox.raw_payload is
  'Validated, size-bounded Altegio JSON. It may contain customer data and must never be exposed or logged.';

comment on function webhook_private.store_altegio_webhook_event_internal(
  bigint,
  text,
  bigint,
  text,
  jsonb
)
is 'SECURITY DEFINER is limited to service_role and validates the complete payload before resolving a non-disconnected Altegio connection and appending an event.';

comment on column public.crm_connections.configuration is
  'Strictly non-secret provider configuration. Altegio and YCLIENTS salon_id values are allowed; credentials and tokens are forbidden.';
