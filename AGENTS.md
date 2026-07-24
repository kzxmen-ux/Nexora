# AGENTS.md

## 1. Project Mission

This repository is a clean, from-scratch implementation of a SaaS AI
manager for service businesses.

The product is **NOT a CRM**.

It connects to: 1. the customer's existing CRM, which remains the source
of truth for operational business data; and 2. messaging channels such
as WhatsApp, Instagram, and Telegram.

The AI manager communicates with the business's customers, reads
required operational data from the connected CRM through safe
server-side tools, and performs CRM operations only through a controlled
provider-independent integration layer.

The core product concept is:

``` text
Messaging channel
→ webhook adapter
→ conversation layer
→ AI orchestrator
→ safe AI tool
→ CRM application service
→ CRM adapter
→ external CRM
```

The response path is:

``` text
External CRM result
→ AI orchestrator
→ outbound messaging adapter
→ customer
```

All implementation decisions must preserve this architecture.

------------------------------------------------------------------------

## 2. Clean-Project Rule

This project is being rebuilt from zero.

Do not recreate old architecture merely because similar code existed
before.

Do not copy old database schemas, domain models, abstractions, routes,
components, or integrations without first verifying that they fit the
architecture defined in this file.

When existing code conflicts with this file, this file wins unless the
user explicitly changes the architecture.

Prefer: - simple foundations; - explicit boundaries; - incremental
implementation; - provider-neutral interfaces; - secure server-side
integrations; - minimal abstractions until they are justified.

Do not introduce speculative infrastructure for hypothetical future
requirements.

------------------------------------------------------------------------

## 3. Primary Technology Stack

Use the following stack unless explicitly instructed otherwise:

-   Next.js with App Router;
-   React;
-   TypeScript with strict mode enabled;
-   Tailwind CSS;
-   Supabase Auth;
-   Supabase/PostgreSQL for SaaS-owned persistent data;
-   PostgreSQL Row Level Security where applicable;
-   server-only integration code for external providers.

The primary programming language is **TypeScript**.

SQL is expected for: - migrations; - database constraints; - indexes; -
PostgreSQL functions where justified; - RLS policies.

Do not introduce Python, a separate backend framework, another database,
or additional infrastructure without a concrete technical reason and
explicit approval.

------------------------------------------------------------------------

## 4. Fundamental Domain Boundary

The external CRM is the source of truth for:

-   services;
-   staff;
-   schedules;
-   availability;
-   customers;
-   bookings;
-   booking changes;
-   booking cancellations.

Our SaaS must not require businesses to duplicate or manually
synchronize this operational data into our product.

The SaaS owns data such as:

-   users/auth;
-   profiles;
-   organizations;
-   organization memberships;
-   CRM connections;
-   CRM connection locations or branches when needed;
-   CRM capabilities;
-   messaging connections;
-   conversations;
-   messages;
-   human handoffs;
-   AI agents or AI manager configurations;
-   integration events;
-   webhook events;
-   AI runs;
-   tool calls;
-   usage metrics;
-   analytics metadata.

The SaaS may store, when technically justified:

-   external provider IDs;
-   provider-neutral DTO-derived cache entries;
-   short-lived caches;
-   local projections;
-   operation records;
-   synchronization checkpoints;
-   webhook cursors;
-   idempotency records;
-   integration health metadata.

These must not evolve into a second CRM.

Do not build internal CRUD systems for:

-   services;
-   staff;
-   schedules;
-   availability;
-   customers;
-   bookings.

Do not create a local booking engine as the primary booking authority.

------------------------------------------------------------------------

## 5. Source-of-Truth Rule

For booking-critical decisions, the connected CRM is authoritative.

Use live CRM reads for: - availability checks; - final booking
validation; - booking mutations; - other decisions where stale data
could create incorrect customer commitments.

Caching policy:

-   service data may be cached for a short period;
-   staff data may be cached for a short period;
-   availability should normally be live or extremely short-lived;
-   stale availability must never be used for final booking
    confirmation;
-   customer lookup should preferably be request-scoped;
-   booking reads should preferably be request-scoped when correctness
    matters;
-   provider webhooks may invalidate relevant caches.

Never design a full local mirror of the CRM unless the architecture is
explicitly changed.

------------------------------------------------------------------------

## 6. CRM Integration Architecture

All CRM integrations must use a provider-independent adapter
architecture.

The AI layer must not know which CRM provider is connected.

A conceptual provider-neutral interface may include operations such as:

``` ts
interface CrmAdapter {
  listServices(...): Promise<...>;
  getService(...): Promise<...>;
  listStaff(...): Promise<...>;
  getStaff(...): Promise<...>;
  getStaffForService(...): Promise<...>;
  getAvailableSlots(...): Promise<...>;
  getCustomerByPhone(...): Promise<...>;
  getCustomer(...): Promise<...>;
  getBooking(...): Promise<...>;
  createBooking(...): Promise<...>;
  rescheduleBooking(...): Promise<...>;
  cancelBooking(...): Promise<...>;
}
```

This is conceptual guidance, not a requirement to create one oversized
interface immediately.

If provider capabilities differ significantly, prefer capability-aware
interfaces or composed interfaces over fake universal support.

The internal call path should remain:

``` text
AI tool
→ organization resolution
→ authorization
→ CRM connection resolution
→ connection health check
→ capability check
→ CRM application service
→ CRM adapter
→ provider API
```

Provider-specific behavior belongs behind the adapter boundary.

Do not leak provider-specific response shapes into: - AI tools; -
conversation logic; - UI business logic; - generic application services.

------------------------------------------------------------------------

## 7. Canonical CRM DTOs

Use provider-neutral canonical DTOs where cross-provider normalization
is required.

Examples:

-   `CrmService`;
-   `CrmStaff`;
-   `CrmAvailableSlot`;
-   `CrmCustomer`;
-   `CrmBooking`;
-   `CrmOperationResult`.

External provider IDs must be treated as opaque strings.

Never: - parse meaning from an external ID unless the provider contract
explicitly requires it; - assume IDs are numeric; - expose internal
assumptions about provider ID formats.

Canonical DTOs should contain only fields that the application actually
needs.

Do not force every provider into an unnecessarily large universal
schema.

Preserve provider-specific metadata only when required, and keep it
isolated from the generic domain whenever possible.

------------------------------------------------------------------------

## 8. CRM Mutation Results

CRM mutation operations must distinguish at least:

-   `succeeded`;
-   `rejected`;
-   `failed`;
-   `ambiguous`.

Meaning:

### succeeded

The provider has returned sufficient verified evidence that the
requested operation completed successfully.

### rejected

The provider definitively refused the operation for a known business or
validation reason.

Examples: - slot is no longer available; - invalid service/staff
combination; - customer is not eligible for the requested operation.

### failed

The operation is known not to have completed successfully.

Examples: - validation failed before the provider call; - provider
returned a definitive non-success response.

### ambiguous

The system cannot safely determine whether the mutation succeeded.

Examples: - request timeout after the provider may have received the
request; - connection dropped after submission; - malformed or
inconclusive provider response.

For `ambiguous` mutations:

-   do not automatically retry unsafe operations;
-   do not tell the customer the booking definitely succeeded;
-   attempt safe reconciliation if the provider supports it;
-   record enough information for investigation;
-   escalate to a human when necessary.

The AI may tell a customer that a booking is confirmed only after a
verified `succeeded` result.

------------------------------------------------------------------------

## 9. Capability Model

CRM features must be capability-driven.

Example capabilities:

``` text
services.read
staff.read
availability.read
customers.read
bookings.read
bookings.create
bookings.update
bookings.cancel
webhooks.receive
```

Do not assume every CRM supports every operation.

AI tools must only be enabled when: 1. the organization has an active
CRM connection; 2. the connection is healthy enough for the operation;
3. the provider adapter supports the operation; 4. the required
capability is enabled.

Unsupported capabilities must fail explicitly and safely.

Do not simulate unsupported CRM functionality by silently storing
authoritative operational data locally.

------------------------------------------------------------------------

## 10. Safe AI Tool Layer

The LLM must never:

-   query the database directly;
-   receive unrestricted database access;
-   see CRM credentials;
-   see messaging provider credentials;
-   call CRM provider APIs directly;
-   call messaging provider APIs directly;
-   choose an organization based solely on a browser-provided
    organization ID;
-   claim that a CRM mutation succeeded without a verified successful
    result.

Example AI tools:

-   `list_services`;
-   `get_staff_for_service`;
-   `get_available_slots`;
-   `get_customer_context`;
-   `create_booking`;
-   `reschedule_booking`;
-   `cancel_booking`;
-   `handoff_to_human`.

Every safe tool must perform the appropriate server-side pipeline:

1.  resolve trusted execution context;
2.  resolve organization server-side;
3.  authorize the actor or conversation context;
4.  resolve the active integration connection;
5.  verify connection state;
6.  verify required capability;
7.  validate and normalize arguments;
8.  call the relevant application service;
9.  call the provider adapter indirectly;
10. normalize the provider response;
11. return a minimal safe structured result.

Tool output sent back to the LLM must not contain secrets or unnecessary
provider internals.

Use strict runtime validation at trust boundaries.

------------------------------------------------------------------------

## 11. AI Orchestration

The conceptual inbound flow is:

``` text
Inbound message
→ webhook verification
→ webhook deduplication
→ event normalization
→ conversation resolution
→ customer identity resolution
→ message persistence
→ ownership/handoff check
→ AI context assembly
→ AI reasoning and tool selection
→ safe tool execution
→ structured result
→ AI response generation
→ outbound messaging adapter
→ provider
```

The orchestrator must support:

-   bounded context windows;
-   rolling conversation summaries;
-   idempotency;
-   safe retry policies;
-   timeout handling;
-   ambiguous CRM mutation handling;
-   human handoff;
-   AI pause and resume;
-   observability;
-   usage accounting.

Do not place all orchestration logic in one route handler.

Keep transport, orchestration, domain/application logic, and provider
adapters separated.

------------------------------------------------------------------------

## 12. Messaging Architecture

Messaging must use a provider-neutral architecture.

Planned channels include:

-   WhatsApp;
-   Instagram;
-   Telegram.

The system must account for:

-   channel connections;
-   provider identity;
-   encrypted credentials or secret references;
-   external account IDs;
-   webhook verification;
-   inbound event normalization;
-   outbound message sending;
-   external conversation IDs;
-   external message IDs;
-   delivery states;
-   retries;
-   idempotency;
-   webhook deduplication;
-   message ordering;
-   integration errors.

Provider-specific webhook payloads must be normalized before entering
generic conversation logic.

Provider-specific outbound API calls must remain behind messaging
adapters.

------------------------------------------------------------------------

## 13. Conversation Ownership

The conversation layer belongs to our SaaS.

A conversation may contain:

-   organization reference;
-   messaging connection reference;
-   external conversation ID;
-   external customer identity;
-   CRM customer external reference when known;
-   messages;
-   message direction;
-   sender type;
-   AI/human ownership state;
-   handoff state;
-   delivery state;
-   external message IDs;
-   idempotency information;
-   timestamps.

Do not turn conversations into customer CRM records.

A local external customer identity is an integration/conversation
concept, not a replacement for the CRM customer entity.

------------------------------------------------------------------------

## 14. Human Handoff

Supported conceptual states:

``` text
ai_active
handoff_requested
human_active
resolved
```

Critical rule:

When a conversation is `human_active`, the AI must not automatically
send replies.

AI responses may resume only after an explicit, authorized transition
back to an AI-active state.

State transitions should be validated server-side.

Avoid boolean combinations such as:

``` text
is_ai_enabled
is_human
needs_handoff
is_resolved
```

when they can create contradictory states.

Prefer an explicit state machine or a single authoritative state field
with controlled transitions.

------------------------------------------------------------------------

## 15. AI Manager Configuration

The SaaS may store AI manager configuration such as:

-   enabled state;
-   business instructions;
-   tone;
-   supported languages;
-   greeting rules;
-   escalation rules;
-   enabled tools;
-   restricted actions;
-   fallback behavior;
-   human handoff rules.

Do not store CRM operational data inside AI configuration.

Examples of data that do not belong in AI settings:

-   copied service catalog;
-   copied staff directory;
-   copied availability;
-   copied customer records;
-   copied bookings.

AI configuration controls behavior.

CRM data provides operational truth.

Keep these concerns separate.

------------------------------------------------------------------------

## 16. Multi-Tenancy and Authorization

This is a multi-tenant SaaS.

Tenant isolation is a critical security requirement.

Rules:

-   every tenant-owned record must have a clear organization ownership
    path;
-   organization context must be resolved and authorized server-side;
-   a browser-provided `organizationId` is input, not proof of
    authorization;
-   never trust client-side organization switching by itself;
-   verify membership and permissions server-side;
-   use RLS on exposed Supabase tables;
-   service-role access must remain server-only;
-   bypassing RLS must be intentional, narrow, and justified;
-   integration operations must be scoped to the resolved organization;
-   external IDs alone must never authorize cross-tenant access.

When implementing a server action, route handler, webhook handler,
background job, or AI tool, explicitly determine where trusted tenant
context comes from.

------------------------------------------------------------------------

## 17. Authentication and Memberships

Authentication and organization membership are separate concerns.

A signed-in user is not automatically authorized for every organization.

Model organization membership explicitly.

Authorization should be based on:

``` text
authenticated user
+ organization membership
+ role/permission when applicable
+ requested operation
```

Do not use frontend visibility as an authorization mechanism.

Do not rely on hidden buttons to protect privileged operations.

------------------------------------------------------------------------

## 18. Credentials and Secrets

CRM and messaging credentials are highly sensitive.

Rules:

-   never expose provider credentials to the browser;
-   never include provider credentials in LLM prompts or tool results;
-   never commit secrets to git;
-   never log raw access tokens, refresh tokens, API keys, client
    secrets, or webhook secrets;
-   store secrets using an approved server-side secure mechanism;
-   encrypt sensitive credentials at rest where applicable;
-   keep decryption server-only;
-   redact sensitive provider payload fields from logs;
-   rotate or revoke credentials when supported;
-   design connection deletion/disconnection safely.

Do not put secrets into `NEXT_PUBLIC_*` environment variables.

------------------------------------------------------------------------

## 19. Webhook Security

All inbound provider webhooks must be treated as untrusted input.

Where supported:

-   verify signatures;
-   verify timestamps;
-   prevent replay attacks;
-   validate payload structure;
-   persist a deduplication key;
-   acknowledge according to provider timing requirements;
-   process asynchronously when appropriate.

Webhook deduplication must occur before side effects that could be
duplicated.

Do not assume webhook delivery is: - exactly once; - ordered; -
immediate.

Design for at-least-once delivery and possible reordering.

------------------------------------------------------------------------

## 20. Idempotency and Retries

Every side-effecting integration operation must be reviewed for
idempotency.

Safe reads may generally be retried with bounded policies.

Mutations require stricter handling.

Before retrying a mutation, determine whether:

-   the provider supports idempotency keys;
-   the operation has a stable client-generated operation ID;
-   the previous attempt is known not to have succeeded;
-   reconciliation can determine the current state.

Never blindly retry `createBooking` after an ambiguous timeout.

Store operation records when needed to prevent duplicate side effects.

------------------------------------------------------------------------

## 21. Database Design Principles

Use PostgreSQL for SaaS-owned state.

For each new table, determine:

-   who owns the row;
-   whether it is tenant-scoped;
-   how authorization works;
-   whether the browser needs direct access;
-   whether RLS is required;
-   what uniqueness constraints are needed;
-   what idempotency constraints are needed;
-   what external references exist;
-   what retention policy may apply.

Prefer database constraints over application-only assumptions.

Use: - foreign keys; - unique constraints; - check constraints; -
appropriate indexes; - explicit timestamps.

Avoid: - unnecessary JSON blobs for core relational data; - giant
universal tables; - premature generic entity systems; - storing provider
credentials in ordinary exposed tables; - duplicating CRM-owned
operational models.

------------------------------------------------------------------------

## 22. RLS Rules

RLS is required on exposed tenant-scoped tables unless there is a strong
reason otherwise.

Policies must be designed intentionally.

Do not create policies equivalent to unrestricted authenticated access.

Avoid patterns where any authenticated user can read rows simply by
knowing an organization ID.

Membership-based access should verify the relationship between:

``` text
auth.uid()
→ organization_members
→ target organization-owned row
```

Server-only integration tables may use a different access pattern, but
browser access must remain minimal.

Never disable RLS as a shortcut to make development easier.

------------------------------------------------------------------------

## 23. Server-Only Boundaries

The following code must be server-only:

-   CRM provider clients;
-   messaging provider clients;
-   secret decryption;
-   service-role Supabase clients;
-   webhook secret verification logic;
-   privileged integration operations;
-   provider credential refresh logic.

Use explicit server-only boundaries where appropriate.

Do not import server-only integration modules into client components.

Do not create API endpoints that merely expose generic provider access
to the browser.

------------------------------------------------------------------------

## 24. API and Application-Service Design

Route handlers, server actions, webhook handlers, and AI tools are
transport boundaries.

They should not contain all business logic.

Prefer:

``` text
transport/controller
→ authorization/context resolution
→ application service
→ domain/integration abstraction
→ adapter/infrastructure
```

Keep application services provider-neutral where possible.

Do not over-engineer with excessive layers for trivial code, but
preserve important security and integration boundaries.

------------------------------------------------------------------------

## 25. Validation

TypeScript types do not validate runtime input.

Validate untrusted input at runtime, including:

-   browser requests;
-   webhook payloads;
-   AI tool arguments;
-   provider responses when necessary;
-   environment configuration.

Use a consistent validation approach.

Validation errors should be explicit and should not leak secrets or
internal implementation details.

------------------------------------------------------------------------

## 26. Error Handling

Do not collapse all failures into generic exceptions.

Differentiate when useful:

-   validation errors;
-   authorization errors;
-   authentication errors;
-   missing capability;
-   unhealthy integration;
-   provider rejection;
-   provider outage;
-   timeout;
-   rate limiting;
-   ambiguous mutation result;
-   internal failure.

User-facing errors should be safe.

Internal logs should contain enough structured context to debug the
issue without leaking secrets.

------------------------------------------------------------------------

## 27. Observability

Important integration operations should be traceable.

Useful correlation identifiers may include:

-   webhook event ID;
-   conversation ID;
-   message ID;
-   AI run ID;
-   tool call ID;
-   integration operation ID;
-   provider request correlation ID when available.

Do not use raw credentials or sensitive customer data as correlation
identifiers.

Record enough information to answer:

-   what inbound event triggered this flow;
-   which conversation was affected;
-   which AI run executed;
-   which tool was called;
-   which integration operation occurred;
-   what normalized outcome was returned.

------------------------------------------------------------------------

## 28. AI Runs and Tool Calls

AI execution should be observable without exposing secrets.

AI run records may include:

-   organization reference;
-   conversation reference;
-   trigger message reference;
-   model metadata;
-   start/end timestamps;
-   status;
-   token/usage metadata;
-   failure category;
-   summary metadata.

Tool call records may include:

-   AI run reference;
-   tool name;
-   sanitized arguments;
-   required capability;
-   status;
-   duration;
-   normalized result metadata;
-   integration operation reference.

Do not persist raw secrets.

Be deliberate about storing sensitive customer message content in logs
or analytics.

------------------------------------------------------------------------

## 29. Analytics Boundary

The dashboard is not a CRM.

Valid dashboard areas include:

-   AI Manager status;
-   CRM connection status;
-   messaging connection status;
-   AI configuration;
-   conversation inbox;
-   human handoffs;
-   integration health;
-   integration errors;
-   usage;
-   AI analytics.

Do not build:

-   internal Services CRUD;
-   internal Staff CRUD;
-   internal Scheduling CRUD;
-   internal Bookings CRUD as an authoritative CRM;
-   a public booking flow as the main product experience.

Analytics may use metadata and derived aggregates.

Do not turn analytics requirements into justification for creating a
full CRM mirror.

------------------------------------------------------------------------

## 30. Expected Main User Flow

The primary product scenario is:

``` text
Customer:
"I want a haircut tomorrow after 18:00."

AI:
1. identifies the customer's intent;
2. resolves the relevant service through the CRM;
3. finds eligible staff through the CRM;
4. fetches real availability through the CRM;
5. offers valid options;
6. receives customer confirmation;
7. performs the booking through a safe AI tool;
8. waits for a verified CRM result;
9. confirms the booking only if the result is `succeeded`.
```

If the result is: - `rejected`: explain the relevant safe reason and
offer alternatives; - `failed`: apologize and use the configured
fallback; - `ambiguous`: do not claim success; reconcile or escalate.

------------------------------------------------------------------------

## 31. First Technical Roadmap

Implement in this order unless there is a clear reason to change it:

1.  clean project foundation;
2.  authentication foundation;
3.  organizations and memberships;
4.  minimal dashboard;
5.  CRM integration foundation;
6.  select the first CRM based on verified official API capabilities;
7.  implement the first CRM adapter;
8.  conversations foundation;
9.  first messaging channel;
10. safe AI tool layer;
11. AI orchestrator;
12. human handoff;
13. AI Manager configuration UI;
14. conversation inbox;
15. integration health;
16. usage and AI analytics;
17. additional CRM providers;
18. additional messaging channels.

Do not implement future roadmap stages prematurely if the current
foundation is not stable.

------------------------------------------------------------------------

## 32. First CRM Selection Rule

Do not invent or assume the capabilities of any CRM provider.

Before selecting or implementing the first CRM integration, verify
current official documentation.

Evaluate at least:

-   API availability;
-   authentication model;
-   service access;
-   staff access;
-   availability access;
-   customer access;
-   booking read;
-   booking creation;
-   booking rescheduling/update;
-   booking cancellation;
-   webhook support;
-   rate limits;
-   sandbox or test environment;
-   documentation quality;
-   Kazakhstan/CIS relevance;
-   commercial restrictions;
-   partner requirements;
-   app review requirements.

Provider capabilities may change over time.

Use current official documentation as the primary source.

Do not claim support for an operation until it has been verified.

------------------------------------------------------------------------

## 33. Coding Rules for Codex

When making changes:

1.  inspect the relevant existing code first;
2.  understand the current architecture before editing;
3.  make the smallest coherent change that completes the task;
4.  do not rewrite unrelated code;
5.  do not silently change architecture;
6.  do not add dependencies without a clear reason;
7.  preserve strict TypeScript typing;
8.  avoid `any`;
9.  avoid unsafe type assertions;
10. validate external input;
11. handle errors explicitly;
12. preserve tenant isolation;
13. preserve server-only boundaries;
14. add or update tests for important logic where practical;
15. run relevant checks after changes.

Before finishing a task, check for:

-   TypeScript errors;
-   lint errors;
-   broken imports;
-   accidental client/server boundary violations;
-   missing authorization;
-   missing RLS implications;
-   leaked secrets;
-   cross-tenant access risks;
-   non-idempotent retry behavior;
-   accidental CRM data duplication.

------------------------------------------------------------------------

## 34. TypeScript Standards

Use strict TypeScript.

Prefer:

-   explicit domain types;
-   discriminated unions;
-   exhaustive handling of important states;
-   `unknown` over `any`;
-   runtime validation for external data;
-   small focused interfaces;
-   clear return types at important boundaries.

For operation results, prefer discriminated unions similar to:

``` ts
type CrmOperationResult<T> =
  | {
      status: "succeeded";
      data: T;
    }
  | {
      status: "rejected";
      code: string;
      message: string;
    }
  | {
      status: "failed";
      code: string;
      message: string;
      retryable: boolean;
    }
  | {
      status: "ambiguous";
      code: string;
      message: string;
      reconciliationRequired: true;
    };
```

The exact implementation may evolve, but the semantic distinction must
remain.

Do not use exceptions as the only representation of expected provider
outcomes.

------------------------------------------------------------------------

## 35. Naming Rules

Use clear domain language.

Prefer names such as:

-   `CrmConnection`;
-   `MessagingConnection`;
-   `Conversation`;
-   `CrmAdapter`;
-   `MessagingAdapter`;
-   `CrmApplicationService`;
-   `AiTool`;
-   `IntegrationOperation`;
-   `WebhookEvent`.

Avoid misleading names that imply our SaaS owns CRM entities.

For example, prefer:

``` text
crm_customer_external_id
```

over a local authoritative:

``` text
customer_id
```

when referring to an external CRM customer.

Use provider names only inside provider-specific modules.

------------------------------------------------------------------------

## 36. Suggested Module Boundaries

The exact folder structure may evolve, but preserve conceptual
boundaries similar to:

``` text
src/
  app/
  components/
  features/
  lib/
    auth/
    organizations/
    conversations/
    ai/
      orchestrator/
      tools/
      context/
    integrations/
      crm/
        application/
        adapters/
        providers/
        dto/
        capabilities/
      messaging/
        application/
        adapters/
        providers/
    security/
    validation/
    observability/
```

Do not create this entire structure preemptively if empty folders or
abstractions are unnecessary.

Structure should follow actual implementation.

------------------------------------------------------------------------

## 37. Provider Adapter Rules

Each provider adapter is responsible for translating between:

``` text
our canonical request/DTO
↔ provider-specific API contract
```

An adapter may handle:

-   authentication;
-   token refresh;
-   provider endpoints;
-   pagination;
-   provider-specific request formats;
-   provider-specific errors;
-   rate-limit metadata;
-   provider response normalization.

An adapter must not decide:

-   whether the current user is authorized;
-   which organization the request belongs to based on untrusted input;
-   whether the AI is allowed to use a tool;
-   conversation ownership rules.

Those belong to higher trusted layers.

------------------------------------------------------------------------

## 38. Messaging Adapter Rules

Messaging adapters should normalize inbound events into a common
internal model.

The generic conversation layer should not need to understand raw
WhatsApp, Instagram, or Telegram payloads.

Similarly, outbound sending should use a provider-neutral application
interface where practical.

Do not force every messaging provider into identical behavior when the
providers genuinely differ.

Represent differences explicitly through capabilities or
provider-specific metadata behind the integration boundary.

------------------------------------------------------------------------

## 39. Background Processing

Introduce queues or background workers only when justified by actual
requirements.

Likely candidates include:

-   webhook processing;
-   outbound retries;
-   delivery-status handling;
-   reconciliation;
-   integration health checks;
-   analytics aggregation.

Do not add complex distributed infrastructure during the clean
foundation phase without need.

If asynchronous processing is introduced, preserve:

-   tenant context;
-   idempotency;
-   traceability;
-   retry safety;
-   dead-letter/error visibility.

------------------------------------------------------------------------

## 40. Testing Priorities

Prioritize tests for high-risk boundaries:

-   tenant isolation;
-   authorization;
-   RLS policies;
-   capability checks;
-   adapter normalization;
-   webhook signature verification;
-   webhook deduplication;
-   idempotency;
-   mutation result classification;
-   ambiguous mutation handling;
-   human handoff state transitions;
-   prevention of AI replies during `human_active`;
-   prevention of booking confirmation before verified CRM success.

Provider adapters should use fixtures or mocked provider responses for
deterministic tests.

Do not rely only on happy-path tests.

------------------------------------------------------------------------

## 41. UI Rules

The UI should reflect the product as an AI manager, not a CRM.

Primary navigation should emphasize:

-   overview;
-   conversations;
-   handoffs;
-   AI Manager;
-   integrations;
-   usage/analytics;
-   settings.

Do not create CRM-style navigation centered around:

-   services;
-   employees;
-   schedules;
-   customers;
-   bookings.

If CRM data is displayed for context, make it clear that it comes from
the connected CRM and is not managed locally.

------------------------------------------------------------------------

## 42. Performance Rules

Do not optimize prematurely, but avoid obvious architectural problems.

Use: - bounded queries; - pagination; - appropriate indexes; - bounded
AI context; - short-lived caching where safe; - request timeouts for
provider calls.

Do not cache booking-critical data longer than correctness allows.

Correctness is more important than saving one provider API call during
booking confirmation.

------------------------------------------------------------------------

## 43. Data Privacy

Minimize collected data.

Store only what the product needs.

Do not duplicate external CRM data merely because it is available.

Be deliberate with: - message retention; - AI prompt logging; - customer
identifiers; - phone numbers; - provider payloads; - analytics events.

Avoid placing sensitive customer data into generic logs.

------------------------------------------------------------------------

## 44. Decision-Making Rule

When choosing between two designs, prefer the design that:

1.  keeps the CRM as operational source of truth;
2.  keeps provider credentials server-side;
3.  keeps the LLM behind safe tools;
4.  preserves tenant isolation;
5.  makes mutation outcomes verifiable;
6.  supports provider differences explicitly;
7.  avoids unnecessary duplication;
8.  is simpler to reason about and test.

If a proposed feature violates these principles, stop and reconsider the
design before implementing it.

------------------------------------------------------------------------

## 45. Anti-Patterns

Do not introduce any of the following without explicit architectural
approval:

-   a local authoritative `services` table;
-   a local authoritative `staff` table;
-   a local authoritative `customers` table;
-   a local authoritative `bookings` table;
-   direct LLM-to-database access;
-   direct LLM-to-provider access;
-   CRM credentials in prompts;
-   CRM credentials in browser code;
-   service-role keys in browser code;
-   trusting client-provided tenant IDs as authorization;
-   blind retries of booking mutations;
-   confirmation of bookings before verified success;
-   unrestricted generic provider proxy endpoints;
-   disabling RLS to solve application bugs;
-   giant route handlers containing integration and domain logic;
-   provider-specific types leaking through the whole application;
-   boolean handoff state combinations that can contradict each other.

------------------------------------------------------------------------

## 46. Current Product Definition

The product is:

> An AI manager for businesses that connects to the business's existing
> CRM and messaging channels, automatically communicates with customers,
> consults them, retrieves live operational information through the CRM,
> and performs bookings through the customer's CRM.

The product is not:

> A CRM with an AI feature.

Every major implementation decision must be checked against this
distinction.

------------------------------------------------------------------------

## 47. Instructions When a Task Is Ambiguous

If a requested implementation conflicts with these architectural rules,
do not silently implement the conflict.

Instead:

1.  identify the conflict;
2.  explain the architectural consequence briefly;
3.  propose the smallest compatible alternative;
4.  ask for confirmation only if the decision materially changes the
    product architecture.

For ordinary implementation details, make reasonable engineering
decisions and proceed without unnecessary questions.

------------------------------------------------------------------------

## 48. Definition of Done

A task is not complete merely because the UI appears to work.

Before considering work complete, verify as applicable:

-   behavior matches the requested scope;
-   TypeScript remains strict;
-   authorization is enforced server-side;
-   tenant isolation is preserved;
-   RLS implications are handled;
-   external input is validated;
-   credentials remain server-only;
-   LLM access is properly constrained;
-   provider calls go through the intended adapter/service boundary;
-   mutation outcomes are handled correctly;
-   idempotency and retry safety are considered;
-   errors are observable;
-   no CRM-owned operational data has accidentally become locally
    authoritative;
-   relevant tests/checks pass.

When reporting completed work, state: - what changed; - which files
changed; - what checks were run; - any remaining risks or follow-up
work.

Do not claim tests passed unless they were actually run.
