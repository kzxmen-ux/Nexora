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
   ```

   The second callback establishes the recovery session before the application
   redirects internally to `/auth/update-password`.

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
