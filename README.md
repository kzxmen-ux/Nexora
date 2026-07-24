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
