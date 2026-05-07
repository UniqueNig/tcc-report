# TCC Reports Architecture

## Current stack

- Next.js 16.2.4 with the App Router
- React 19.2.4
- Apollo Client on the frontend
- Apollo Server on `/api/graphql`
- MongoDB with Mongoose models
- Tailwind CSS v4
- Custom JWT cookie authentication
- PWA manifest + service worker registration

## Top-level structure

```text
app/
  layout.tsx
  globals.css
  manifest.ts
  (auth)/
    login/page.tsx
  (dashboard)/
    layout.tsx
    page.tsx
    dashboard/
      page.tsx
      admin/
      core-leader/
      unit-head/
  api/
    auth/
      bootstrap/route.ts
      login/route.ts
      logout/route.ts
      session/route.ts
    graphql/route.ts

src/
  components/
  graphql/
  lib/
  models/
  types/

public/
proxy.ts
```

## How the app is organized

- `app/` contains routes, layouts, metadata, and API route handlers.
- `src/components/` contains shared UI such as the sidebar, topbar, pagination, PWA registration, and report display helpers.
- `src/lib/` contains infrastructure and app helpers: auth, DB connection, Apollo client, GraphQL documents, dashboard analytics helpers, role routing, demo bootstrap, and unit form schemas.
- `src/graphql/` contains the active GraphQL context, root schema, and merged resolver implementation.
- `src/models/` contains the Mongoose models for `User`, `Unit`, `Report`, and `Comment`.
- `proxy.ts` protects dashboard routes by role before the page renders.

## Route groups and role flow

- `(auth)` contains the login experience.
- `(dashboard)` contains all protected role-based pages.
- `/dashboard` and `/dashboard/dashboard` both resolve the signed-in user and redirect them to the correct role home:
  - `UNIT_HEAD -> /dashboard/unit-head`
  - `CORE_LEADER -> /dashboard/core-leader`
  - `ADMIN -> /dashboard/admin`

## Backend shape

- Auth is handled with custom JWT cookies in `src/lib/auth.ts`.
- REST-style auth helpers live under `app/api/auth/*`.
- GraphQL is served from `app/api/graphql/route.ts`.
- The GraphQL context connects to MongoDB and reads the authenticated user from the request cookie.
- Business rules for users, units, reports, comments, access control, and review actions live in `src/graphql/resolvers/index.ts`.

## Reporting model

- Unit forms are schema-driven from `src/lib/unitSchemas.ts`.
- Reports are stored as sections with flexible field arrays so each unit can have its own structure.
- Admin analytics are derived from submitted report fields using `src/lib/dashboardHelpers.ts`.
- Finance analytics now track:
  - income
  - banked/deposited totals
  - direct income
  - expenditure
  - net balance
  - deposit variance

## Important implementation notes

- Route protection uses `proxy.ts`, not `middleware.ts`.
- The active GraphQL schema is `src/graphql/typeDefs/index.ts`.
- The active GraphQL resolvers are in `src/graphql/resolvers/index.ts`.
- Some split files under `src/graphql/typeDefs/*` and `src/graphql/resolvers/*` still exist as older placeholders, but they are not the active backend entrypoints right now.
- `next-auth` is installed as a dependency, but the current live auth flow uses the custom JWT cookie helpers in `src/lib/auth.ts`.
