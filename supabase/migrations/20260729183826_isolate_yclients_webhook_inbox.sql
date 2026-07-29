create schema webhook_private;

revoke all on schema webhook_private from public, anon, authenticated;
grant usage on schema webhook_private to service_role;

alter table private.yclients_webhook_inbox
  set schema webhook_private;

alter function private.store_yclients_webhook_event_internal(
  bigint,
  text,
  bigint,
  text,
  jsonb
)
set schema webhook_private;

create or replace function public.store_yclients_webhook_event(
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
  from webhook_private.store_yclients_webhook_event_internal(
    p_company_id,
    p_resource,
    p_resource_id,
    p_event_status,
    p_payload
  );
$$;

revoke all
on function public.store_yclients_webhook_event(
  bigint,
  text,
  bigint,
  text,
  jsonb
)
from public, anon, authenticated;

grant execute
on function public.store_yclients_webhook_event(
  bigint,
  text,
  bigint,
  text,
  jsonb
)
to service_role;
