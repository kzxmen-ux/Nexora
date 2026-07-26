create type public.crm_provider as enum ('custom');

create type public.crm_connection_status as enum (
  'draft',
  'connected',
  'disconnected',
  'error'
);

create table public.crm_connections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null
    references public.organizations (id) on delete cascade,
  provider public.crm_provider not null default 'custom',
  display_name text not null,
  status public.crm_connection_status not null default 'draft',
  configuration jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_sync_at timestamptz,
  last_error text,
  constraint crm_connections_display_name_length
    check (char_length(display_name) between 1 and 100),
  constraint crm_connections_display_name_trimmed
    check (display_name = btrim(display_name)),
  constraint crm_connections_configuration_object
    check (jsonb_typeof(configuration) = 'object'),
  constraint crm_connections_configuration_keys
    check (
      (configuration - array['workspace_reference', 'region']::text[])
      = '{}'::jsonb
    ),
  constraint crm_connections_workspace_reference
    check (
      not (configuration ? 'workspace_reference')
      or (
        jsonb_typeof(configuration -> 'workspace_reference') = 'string'
        and char_length(configuration ->> 'workspace_reference')
          between 1 and 100
        and (configuration ->> 'workspace_reference')
          ~ '^[A-Za-z0-9](?:[A-Za-z0-9_-]{0,99})$'
      )
    ),
  constraint crm_connections_region
    check (
      not (configuration ? 'region')
      or (
        jsonb_typeof(configuration -> 'region') = 'string'
        and (configuration ->> 'region') in ('global', 'eu', 'us', 'apac')
      )
    ),
  constraint crm_connections_last_error_length
    check (last_error is null or char_length(last_error) <= 500)
);

create index crm_connections_organization_created_idx
  on public.crm_connections (organization_id, created_at desc);

create index crm_connections_created_by_idx
  on public.crm_connections (created_by);

alter table public.crm_connections enable row level security;
alter table public.crm_connections force row level security;

create policy "organization members can read crm connections"
on public.crm_connections
for select
to authenticated
using (private.is_organization_member(organization_id));

create policy "organization members can create crm connections"
on public.crm_connections
for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and created_by = (select auth.uid())
  and status = 'draft'::public.crm_connection_status
  and private.is_organization_member(organization_id)
);

create policy "organization members can update crm connections"
on public.crm_connections
for update
to authenticated
using (private.is_organization_member(organization_id))
with check (private.is_organization_member(organization_id));

create policy "organization members can delete crm connections"
on public.crm_connections
for delete
to authenticated
using (private.is_organization_member(organization_id));

create function private.set_crm_connection_updated_at()
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
on function private.set_crm_connection_updated_at()
from public, anon, authenticated, service_role;

create trigger crm_connections_set_updated_at
before update on public.crm_connections
for each row
execute function private.set_crm_connection_updated_at();

create function private.set_crm_connection_status_internal(
  target_organization_id uuid,
  target_connection_id uuid,
  target_status public.crm_connection_status
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  connection_id uuid;
begin
  if caller_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if not private.is_organization_member(target_organization_id) then
    raise exception 'organization membership required'
      using errcode = '42501';
  end if;

  if target_status not in (
    'draft'::public.crm_connection_status,
    'disconnected'::public.crm_connection_status
  ) then
    raise exception 'provider verification is required for this status'
      using errcode = '22023';
  end if;

  select crm_connection.id
  into connection_id
  from public.crm_connections as crm_connection
  where crm_connection.id = target_connection_id
    and crm_connection.organization_id = target_organization_id
  for update;

  if connection_id is null then
    raise exception 'crm connection is unavailable' using errcode = 'P0001';
  end if;

  update public.crm_connections
  set
    status = target_status,
    last_error = null
  where id = connection_id;

  return connection_id;
end;
$$;

revoke all
on function private.set_crm_connection_status_internal(
  uuid,
  uuid,
  public.crm_connection_status
)
from public, anon, service_role;

grant execute
on function private.set_crm_connection_status_internal(
  uuid,
  uuid,
  public.crm_connection_status
)
to authenticated;

create function public.set_crm_connection_status(
  p_organization_id uuid,
  p_connection_id uuid,
  p_status public.crm_connection_status
)
returns uuid
language sql
security invoker
set search_path = ''
as $$
  select private.set_crm_connection_status_internal(
    p_organization_id,
    p_connection_id,
    p_status
  );
$$;

revoke all
on function public.set_crm_connection_status(
  uuid,
  uuid,
  public.crm_connection_status
)
from public, anon, service_role;

grant execute
on function public.set_crm_connection_status(
  uuid,
  uuid,
  public.crm_connection_status
)
to authenticated;

revoke all on public.crm_connections from anon, authenticated, service_role;

grant select (
  id,
  organization_id,
  provider,
  display_name,
  status,
  configuration,
  created_by,
  created_at,
  updated_at,
  last_sync_at
)
on public.crm_connections
to authenticated;

grant insert (
  id,
  organization_id,
  provider,
  display_name,
  configuration,
  created_by
)
on public.crm_connections
to authenticated;

grant update (display_name, configuration)
on public.crm_connections
to authenticated;

grant delete
on public.crm_connections
to authenticated;

revoke usage
on type public.crm_provider, public.crm_connection_status
from public, anon, service_role;

grant usage
on type public.crm_provider, public.crm_connection_status
to authenticated;

comment on table public.crm_connections is
  'Non-secret CRM integration metadata. External CRM data remains authoritative.';

comment on column public.crm_connections.configuration is
  'Strictly non-secret placeholder configuration. Credentials and tokens are forbidden.';

comment on function private.set_crm_connection_status_internal(
  uuid,
  uuid,
  public.crm_connection_status
)
is 'SECURITY DEFINER permits only member-authorized draft/disconnected transitions while direct status updates remain revoked.';
