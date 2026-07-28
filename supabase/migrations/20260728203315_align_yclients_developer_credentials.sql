alter table public.crm_connections
  drop constraint crm_connections_configuration_keys;

alter table public.crm_connections
  add constraint crm_connections_configuration_keys
  check (
    (configuration - array[
      'workspace_reference',
      'region',
      'company_id',
      'application_id'
    ]::text[]) = '{}'::jsonb
  );

alter table public.crm_connections
  add constraint crm_connections_application_id
  check (
    not (configuration ? 'application_id')
    or (
      provider::text = 'yclients'
      and jsonb_typeof(configuration -> 'application_id') = 'string'
      and char_length(configuration ->> 'application_id') between 1 and 100
      and configuration ->> 'application_id'
        ~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$'
    )
  );

comment on column public.crm_connections.configuration is
  'Strictly non-secret provider configuration. YCLIENTS Application ID and Company ID are allowed; credentials and tokens are forbidden.';
