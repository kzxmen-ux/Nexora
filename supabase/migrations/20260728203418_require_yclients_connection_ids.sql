alter table public.crm_connections
  add constraint crm_connections_yclients_required_configuration
  check (
    provider::text <> 'yclients'
    or configuration ?& array['application_id', 'company_id']::text[]
  );
