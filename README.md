# Nexora

Nexora is a SaaS AI manager designed to work with a business's existing CRM
and messaging platforms. It is **not a CRM**: operational business data remains
owned by the connected external system.

## Stack

- Next.js with App Router
- React
- TypeScript in strict mode
- Tailwind CSS
- ESLint
- npm

## Requirements

- Node.js 20.9 or newer
- npm

## Local setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Supabase Auth setup

1. Create or select a Supabase project.
2. Copy `.env.example` to `.env.local`.
3. Set the project values from the Supabase Connect dialog:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your-key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. In **Authentication → URL Configuration**, set the Site URL to:

   ```text
   http://localhost:3000
   ```

5. Add these local Redirect URLs:

   ```text
   http://localhost:3000/auth/callback?next=%2Fapp
   http://localhost:3000/auth/callback?next=%2Fauth%2Fupdate-password
   http://localhost:3000/auth/callback?next=%2Finvitations%2Faccept%3Ftoken%3D*
   ```

   The second callback establishes the recovery session before the application
   redirects internally to `/auth/update-password`. The third callback keeps
   the one-time administrator invitation token through email confirmation.
   Replace the localhost origin with the exact production origin in production.

6. In **Authentication → Providers**, keep Email authentication enabled and
   choose whether email confirmation is required.
7. In **Authentication → Email Templates**, keep the standard
   `{{ .ConfirmationURL }}` link for both **Confirm signup** and
   **Reset password**. If either template was customized, its action link must
   use:

   ```html
   <a href="{{ .ConfirmationURL }}">Continue</a>
   ```

   This application uses the PKCE authorization-code callback model:

   ```text
   Confirm signup → /auth/callback?code=...&next=/app → /app
   Reset password → /auth/callback?code=...&next=/auth/update-password
                  → /auth/update-password
   ```

8. Run `npm run dev`.

Never commit `.env.local`. The browser may use only the public project URL and
publishable key. A secret or service-role key is not required or used by the
Auth foundation.

## Organizations foundation

Apply the SQL migrations in `supabase/migrations` to the configured project
before using organization routes.

Organization creation is atomic: an `AFTER INSERT` database trigger adds the
authenticated creator as the owner in the same transaction. Row Level Security
allows owners and admins to read their organizations and memberships, while
direct membership writes are denied.

Administrator mutations are exposed only through narrowly scoped RPC
functions. They accept no role value, verify `auth.uid()` against an existing
owner membership, and can only add or remove the `admin` role. The privileged
implementation remains in the non-exposed `private` schema with a fixed empty
`search_path`.

The application supports multiple organizations per user. Every organization
route performs a server-side membership lookup and remains protected by RLS;
an organization ID from the URL is never treated as authorization.

Owners can create seven-day administrator invitations from the organization
administrators page. The database stores only a SHA-256 token hash, and the
raw one-time link is returned only when the invitation is created. Acceptance
requires an authenticated account with the exact invited email and atomically
creates the `admin` membership. Pending invitations can be revoked, active
admins can be removed, and the old direct-add RPC is no longer executable by
authenticated clients.

## CRM integration foundation

Organization workspaces include an Integrations area for owner and admin
members. The CRM section currently manages provider-neutral placeholder
connections only; it does not contact a real CRM or copy CRM-owned operational
data into Nexora.

`crm_connections.configuration` accepts only a non-secret workspace reference
and controlled region value. Credentials, access tokens, API keys, and
arbitrary configuration keys are not supported. Placeholder connections cannot
be marked `connected` without a future verified provider flow.

## Verification

```bash
npm run typecheck
npm run lint
npm run build
```

Never commit real secrets. Copy placeholder names from `.env.example` into a
local environment file only when they are needed.

Coding agents must read and follow `AGENTS.md`, the project's primary
architecture and security document, before making changes.
