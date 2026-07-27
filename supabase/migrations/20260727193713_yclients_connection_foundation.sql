alter type public.crm_provider add value 'yclients';

alter table public.crm_connections
  drop constraint crm_connections_configuration_keys;

alter table public.crm_connections
  add constraint crm_connections_configuration_keys
  check (
    (configuration - array[
      'workspace_reference',
      'region',
      'company_id'
    ]::text[]) = '{}'::jsonb
  );

alter table public.crm_connections
  add constraint crm_connections_company_id
  check (
    not (configuration ? 'company_id')
    or (
      provider::text = 'yclients'
      and jsonb_typeof(configuration -> 'company_id') = 'string'
      and char_length(configuration ->> 'company_id') between 1 and 32
      and (configuration ->> 'company_id') ~ '^[0-9]+$'
    )
  );

create table private.crm_connection_credentials (
  connection_id uuid primary key
    references public.crm_connections (id) on delete cascade,
  provider public.crm_provider not null,
  encrypted_payload bytea not null,
  initialization_vector bytea not null,
  authentication_tag bytea not null,
  key_version smallint not null default 1,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint crm_connection_credentials_provider
    check (provider::text = 'yclients'),
  constraint crm_connection_credentials_payload_size
    check (octet_length(encrypted_payload) between 1 and 16384),
  constraint crm_connection_credentials_iv_size
    check (octet_length(initialization_vector) = 12),
  constraint crm_connection_credentials_tag_size
    check (octet_length(authentication_tag) = 16),
  constraint crm_connection_credentials_key_version
    check (key_version > 0)
);

alter table private.crm_connection_credentials enable row level security;
alter table private.crm_connection_credentials force row level security;

revoke all
on private.crm_connection_credentials
from public, anon, authenticated, service_role;

create function private.set_crm_connection_credentials_updated_at()
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
on function private.set_crm_connection_credentials_updated_at()
from public, anon, authenticated, service_role;

create trigger crm_connection_credentials_set_updated_at
before update on private.crm_connection_credentials
for each row
execute function private.set_crm_connection_credentials_updated_at();

create function private.save_crm_connection_credentials_internal(
  target_organization_id uuid,
  target_connection_id uuid,
  encrypted_payload_base64 text,
  initialization_vector_base64 text,
  authentication_tag_base64 text,
  target_key_version smallint
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  target_provider public.crm_provider;
  decoded_payload bytea;
  decoded_iv bytea;
  decoded_tag bytea;
begin
  if caller_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if not private.is_organization_member(target_organization_id) then
    raise exception 'organization membership required'
      using errcode = '42501';
  end if;

  select connection.provider
  into target_provider
  from public.crm_connections as connection
  where connection.id = target_connection_id
    and connection.organization_id = target_organization_id
  for update;

  if target_provider is null then
    raise exception 'crm connection is unavailable' using errcode = 'P0001';
  end if;

  if target_provider::text <> 'yclients' then
    raise exception 'credential storage is unavailable for this provider'
      using errcode = '22023';
  end if;

  if target_key_version < 1 then
    raise exception 'invalid encryption key version' using errcode = '22023';
  end if;

  begin
    decoded_payload := decode(encrypted_payload_base64, 'base64');
    decoded_iv := decode(initialization_vector_base64, 'base64');
    decoded_tag := decode(authentication_tag_base64, 'base64');
  exception when others then
    raise exception 'invalid encrypted credential envelope'
      using errcode = '22023';
  end;

  if octet_length(decoded_payload) not between 1 and 16384
    or octet_length(decoded_iv) <> 12
    or octet_length(decoded_tag) <> 16
  then
    raise exception 'invalid encrypted credential envelope'
      using errcode = '22023';
  end if;

  insert into private.crm_connection_credentials (
    connection_id,
    provider,
    encrypted_payload,
    initialization_vector,
    authentication_tag,
    key_version,
    updated_by
  )
  values (
    target_connection_id,
    target_provider,
    decoded_payload,
    decoded_iv,
    decoded_tag,
    target_key_version,
    caller_id
  )
  on conflict (connection_id) do update
  set
    provider = excluded.provider,
    encrypted_payload = excluded.encrypted_payload,
    initialization_vector = excluded.initialization_vector,
    authentication_tag = excluded.authentication_tag,
    key_version = excluded.key_version,
    updated_by = excluded.updated_by;

  update public.crm_connections
  set
    status = 'draft'::public.crm_connection_status,
    last_error = null
  where id = target_connection_id;

  return target_connection_id;
end;
$$;

create function private.get_crm_connection_credential_status_internal(
  target_organization_id uuid,
  target_connection_id uuid
)
returns table (
  credentials_saved boolean,
  credentials_updated_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  target_provider public.crm_provider;
begin
  if caller_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if not private.is_organization_member(target_organization_id) then
    raise exception 'organization membership required'
      using errcode = '42501';
  end if;

  select connection.provider
  into target_provider
  from public.crm_connections as connection
  where connection.id = target_connection_id
    and connection.organization_id = target_organization_id;

  if target_provider is null then
    raise exception 'crm connection is unavailable' using errcode = 'P0001';
  end if;

  if target_provider::text <> 'yclients' then
    raise exception 'credential status is unavailable for this provider'
      using errcode = '22023';
  end if;

  return query
  select
    credentials.connection_id is not null,
    credentials.updated_at
  from (select true) as singleton
  left join private.crm_connection_credentials as credentials
    on credentials.connection_id = target_connection_id;
end;
$$;

create function private.delete_crm_connection_credentials_internal(
  target_organization_id uuid,
  target_connection_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  target_provider public.crm_provider;
begin
  if caller_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if not private.is_organization_member(target_organization_id) then
    raise exception 'organization membership required'
      using errcode = '42501';
  end if;

  select connection.provider
  into target_provider
  from public.crm_connections as connection
  where connection.id = target_connection_id
    and connection.organization_id = target_organization_id
  for update;

  if target_provider is null then
    raise exception 'crm connection is unavailable' using errcode = 'P0001';
  end if;

  if target_provider::text <> 'yclients' then
    raise exception 'credential storage is unavailable for this provider'
      using errcode = '22023';
  end if;

  delete from private.crm_connection_credentials
  where connection_id = target_connection_id;

  update public.crm_connections
  set
    status = 'disconnected'::public.crm_connection_status,
    last_error = null
  where id = target_connection_id;

  return target_connection_id;
end;
$$;

revoke all
on function private.save_crm_connection_credentials_internal(
  uuid, uuid, text, text, text, smallint
)
from public, anon, service_role;

revoke all
on function private.get_crm_connection_credential_status_internal(uuid, uuid)
from public, anon, service_role;

revoke all
on function private.delete_crm_connection_credentials_internal(uuid, uuid)
from public, anon, service_role;

grant execute
on function private.save_crm_connection_credentials_internal(
  uuid, uuid, text, text, text, smallint
)
to authenticated;

grant execute
on function private.get_crm_connection_credential_status_internal(uuid, uuid)
to authenticated;

grant execute
on function private.delete_crm_connection_credentials_internal(uuid, uuid)
to authenticated;

create function public.save_crm_connection_credentials(
  p_organization_id uuid,
  p_connection_id uuid,
  p_encrypted_payload text,
  p_initialization_vector text,
  p_authentication_tag text,
  p_key_version smallint
)
returns uuid
language sql
security invoker
set search_path = ''
as $$
  select private.save_crm_connection_credentials_internal(
    p_organization_id,
    p_connection_id,
    p_encrypted_payload,
    p_initialization_vector,
    p_authentication_tag,
    p_key_version
  );
$$;

create function public.get_crm_connection_credential_status(
  p_organization_id uuid,
  p_connection_id uuid
)
returns table (
  credentials_saved boolean,
  credentials_updated_at timestamptz
)
language sql
security invoker
set search_path = ''
as $$
  select *
  from private.get_crm_connection_credential_status_internal(
    p_organization_id,
    p_connection_id
  );
$$;

create function public.delete_crm_connection_credentials(
  p_organization_id uuid,
  p_connection_id uuid
)
returns uuid
language sql
security invoker
set search_path = ''
as $$
  select private.delete_crm_connection_credentials_internal(
    p_organization_id,
    p_connection_id
  );
$$;

revoke all
on function public.save_crm_connection_credentials(
  uuid, uuid, text, text, text, smallint
)
from public, anon, service_role;

revoke all
on function public.get_crm_connection_credential_status(uuid, uuid)
from public, anon, service_role;

revoke all
on function public.delete_crm_connection_credentials(uuid, uuid)
from public, anon, service_role;

grant execute
on function public.save_crm_connection_credentials(
  uuid, uuid, text, text, text, smallint
)
to authenticated;

grant execute
on function public.get_crm_connection_credential_status(uuid, uuid)
to authenticated;

grant execute
on function public.delete_crm_connection_credentials(uuid, uuid)
to authenticated;

comment on table private.crm_connection_credentials is
  'Encrypted CRM credentials. This private table is not exposed through the Data API.';

comment on column private.crm_connection_credentials.encrypted_payload is
  'AES-256-GCM ciphertext produced by server-only application code.';

comment on column public.crm_connections.configuration is
  'Strictly non-secret provider configuration. Credentials and tokens are forbidden.';

comment on function private.save_crm_connection_credentials_internal(
  uuid, uuid, text, text, text, smallint
)
is 'SECURITY DEFINER is required to write the private credential table. It verifies auth.uid(), organization membership, provider, and ciphertext envelope before writing.';
