# TCC Reports Architecture Details

## 1. System overview

TCC Reports is a role-based reporting platform for church operations. Unit Heads submit structured reports, Core Leaders review and comment on reports for their assigned units, and Admins manage the full system, including users, units, reporting oversight, and analytics.

The application is built as a Next.js App Router project with a custom JWT auth flow, Apollo GraphQL API, and MongoDB persistence through Mongoose.

## 2. Runtime stack

- Framework: Next.js 16.2.4
- UI: React 19.2.4
- Styling: Tailwind CSS v4
- Icons: `lucide-react`
- API layer: Apollo Server + GraphQL
- Client data layer: Apollo Client
- Database: MongoDB + Mongoose
- Auth: custom JWT stored in an HTTP-only cookie
- PWA support: `app/manifest.ts`, `public/sw.js`, `src/components/PwaRegistration.tsx`

## 3. Current filesystem map

```text
app/
  layout.tsx
  globals.css
  manifest.ts
  apple-icon.png
  favicon.ico
  icon.png

  (auth)/
    login/page.tsx

  (dashboard)/
    layout.tsx
    page.tsx
    dashboard/
      page.tsx
      admin/
        page.tsx
        analytics/page.tsx
        reports/page.tsx
        reports/[id]/page.tsx
        units/page.tsx
        users/page.tsx
      core-leader/
        page.tsx
        reports/page.tsx
        reports/[id]/page.tsx
        units/page.tsx
      unit-head/
        page.tsx
        reports/page.tsx
        reports/[id]/page.tsx
        submit/page.tsx

  api/
    auth/
      bootstrap/route.ts
      login/route.ts
      logout/route.ts
      session/route.ts
    graphql/route.ts

src/
  components/
    AppProviders.tsx
    PaginationControls.tsx
    PwaRegistration.tsx
    Sidebar.tsx
    Topbar.tsx
    reports/
      ReportFieldValue.tsx
      ReportSections.tsx
      ReportStatusPill.tsx

  graphql/
    context.ts
    index.ts
    resolvers/
      index.ts
      authResolver.ts
      commentResolver.ts
      reportResolver.ts
      unitResolver.ts
      userResolver.ts
    typeDefs/
      index.ts
      report.ts
      unit.ts
      user.ts

  lib/
    apolloClient.ts
    auth.ts
    dashboardHelpers.ts
    db.ts
    devBootstrap.ts
    graphqlDocuments.ts
    roleRoutes.ts
    unitSchemas.ts

  models/
    Comment.ts
    Report.ts
    Unit.ts
    User.ts

  types/
    index.ts

public/
  sw.js
  tcc-logo.png
  tcc-wordmark.png
  apple-touch-icon.png
  maskable-icon.png
  icons/*

proxy.ts
```

## 4. App layer

### `app/layout.tsx`

- Defines global metadata for the app.
- Loads global CSS.
- Mounts `AppProviders`.
- Injects a pre-paint theme script so dark mode is applied before hydration.

### `app/globals.css`

- Holds app-wide Tailwind-driven styling.
- Includes shared animation and visual utility classes used across dashboards.

### `app/manifest.ts`

- Defines PWA metadata, icons, theme color, and start URL.

### `(auth)/login/page.tsx`

- Public login page.
- Calls `/api/auth/login`.
- Handles validation, loading state, failure state, and role-aware redirect after login.

### `(dashboard)/layout.tsx`

- Lightweight route-group layout for dashboard pages.
- Provides route-group metadata for the protected area.

### `(dashboard)/page.tsx` and `(dashboard)/dashboard/page.tsx`

- Both read the signed-in user from the auth cookie.
- Redirect users to the correct dashboard home for their role.

## 5. Role-based pages

### Unit Head

- `/dashboard/unit-head`
  - main dashboard for the submitting user
  - submission stats and recent reports
- `/dashboard/unit-head/submit`
  - schema-driven report submission form
  - supports attachments
  - now includes stronger conditional validation for detail fields such as expenditure notes and discrepancy notes
- `/dashboard/unit-head/reports`
  - list of the unit head's reports
- `/dashboard/unit-head/reports/[id]`
  - read-only report detail view
  - displays comments from higher roles

### Core Leader

- `/dashboard/core-leader`
  - overview of assigned units and pending work
- `/dashboard/core-leader/reports`
  - full report queue for units under that leader
- `/dashboard/core-leader/reports/[id]`
  - review screen
  - add comments
  - mark report as reviewed
- `/dashboard/core-leader/units`
  - cards or summaries for assigned units

### Admin

- `/dashboard/admin`
  - overall system summary
  - latest reports table
  - now includes attendance and finance snapshot cards
- `/dashboard/admin/reports`
  - all reports across the system
  - filters, selection, and bulk workflows
- `/dashboard/admin/reports/[id]`
  - detailed report review page
  - comments, review action, export, delete
- `/dashboard/admin/users`
  - user management
- `/dashboard/admin/units`
  - unit management
- `/dashboard/admin/analytics`
  - attendance and finance analytics
  - finance view now includes expenditure, net balance, direct income, deposit variance, and expenditure notes

## 6. Shared UI components

### `src/components/Sidebar.tsx`

- Shared left navigation for all roles.
- Switches route list based on role.
- Shows current user, role badge, assigned units, and logout action.

### `src/components/Topbar.tsx`

- Shared top bar for all dashboard pages.
- Handles:
  - theme toggle
  - notification dropdown
  - notification read/dismiss persistence via `localStorage`
  - avatar display
- Notifications are derived from GraphQL report data:
  - submitted report notifications for reviewers
  - reviewed report notifications for unit heads
  - new comment notifications for unit heads

### `src/components/AppProviders.tsx`

- Wraps the app in `ApolloProvider`.
- Registers the PWA service worker component.

### `src/components/PaginationControls.tsx`

- Shared pagination footer for table/list pages.

### `src/components/PwaRegistration.tsx`

- Registers `/sw.js` in supported browsers after page load.

### `src/components/reports/*`

- `ReportStatusPill.tsx` renders report status labels.
- `ReportSections.tsx` renders report sections consistently.
- `ReportFieldValue.tsx` renders field values by type.
- Report field rendering now uses safer numeric coercion and consistent currency formatting.

## 7. API routes

### `app/api/auth/login/route.ts`

- Validates email/password.
- Connects to MongoDB.
- Verifies password using `bcryptjs`.
- Creates a JWT with role and unit assignment info.
- Stores the JWT in an HTTP-only cookie.

### `app/api/auth/logout/route.ts`

- Clears the auth cookie.

### `app/api/auth/session/route.ts`

- Returns the current signed-in user from the auth cookie.

### `app/api/auth/bootstrap/route.ts`

- Development-only helper.
- Creates or refreshes demo accounts and a demo unit.

### `app/api/graphql/route.ts`

- Starts Apollo Server in the Next.js route handler.
- Supports `GET` and `POST`.
- Uses Node.js runtime and dynamic rendering.

## 8. Auth and access control

### `src/lib/auth.ts`

- Central auth utility for:
  - signing JWTs
  - verifying JWTs
  - setting/clearing the auth cookie
  - reading the authenticated user from cookies or request objects

### `proxy.ts`

- Protects `/dashboard/:path*`.
- Redirects unauthenticated users to `/login`.
- Redirects authenticated users away from routes that do not match their role.
- This file is the active route guard. The project does not currently use `middleware.ts`.

### `src/lib/roleRoutes.ts`

- Single source of truth for role home paths.

## 9. Data layer

### `src/lib/db.ts`

- Handles the MongoDB connection.
- Uses a global cache so hot reload does not reconnect on every request in development.

### `src/models/User.ts`

- Stores name, email, password hash, role, and unit assignment data.
- Supports both `unitId` and `unitIds` to handle multi-unit assignment for unit heads.

### `src/models/Unit.ts`

- Stores unit name, core leader assignment, and optional schema override data.

### `src/models/Report.ts`

- Stores title, unit, submitter, review metadata, optional attachment info, and schema-driven sections/fields.
- The report structure is flexible because fields are stored as typed section arrays instead of a hard-coded per-unit schema in MongoDB.

### `src/models/Comment.ts`

- Stores report comments from Core Leaders and Admins.

## 10. GraphQL layer

### Active entrypoints

- Active schema: `src/graphql/typeDefs/index.ts`
- Active resolvers: `src/graphql/resolvers/index.ts`
- Active context: `src/graphql/context.ts`

### What the live GraphQL backend does

- `Query`
  - `me`
  - `users`
  - `units`
  - `reports`
  - `report`
  - `comments`
- `Mutation`
  - `createUser`
  - `updateUser`
  - `deleteUser`
  - `createUnit`
  - `updateUnit`
  - `deleteUnit`
  - `createReport`
  - `markReportReviewed`
  - `deleteReport`
  - `addComment`

### Important note about stale GraphQL files

- `src/graphql/typeDefs/report.ts`, `unit.ts`, and `user.ts` still exist, but they are older placeholder fragments and are not the live schema source now.
- `src/graphql/resolvers/authResolver.ts`, `commentResolver.ts`, `reportResolver.ts`, `unitResolver.ts`, and `userResolver.ts` also exist, but the current application logic lives in `src/graphql/resolvers/index.ts`.
- `src/graphql/index.ts` is present but currently not an active integration point.

## 11. Client data layer

### `src/lib/apolloClient.ts`

- Configures Apollo Client for `/api/graphql`.
- Sends same-origin credentials for cookie auth.
- Uses a custom cache policy for `reports` queries so incoming filtered results replace previous results.

### `src/lib/graphqlDocuments.ts`

- Holds the frontend GraphQL queries, fragments, and mutations.
- This is the shared document registry used by page components.

## 12. Schema-driven report system

### `src/lib/unitSchemas.ts`

- Defines the default schema catalog for known units.
- Each unit schema is built from sections and typed fields.
- Supports field types:
  - `text`
  - `number`
  - `textarea`
  - `select`
  - `multiselect`
  - `boolean`
  - `currency`
- Includes helper logic to:
  - normalize unit names
  - resolve aliases
  - fall back to configured or generated schemas for unmatched units

### Why this matters

- The report form is not hard-coded per page.
- The Unit Head submission page renders fields dynamically from the selected unit schema.
- Admin analytics later interpret selected field IDs from those stored reports.

## 13. Analytics and reporting helpers

### `src/lib/dashboardHelpers.ts`

- Shared helper layer for:
  - converting GraphQL data for the dashboard
  - formatting dates and currency
  - building attendance records
  - building finance records
  - extracting field values from flexible report sections

### Current finance analytics support

- offering collected
- tithe collected
- seed/donation collected
- direct income
- banked/deposited amount
- expenditure
- expenditure notes
- net balance
- deposit variance

This helper is the core reason the admin analytics page can compute totals from schema-driven report data.

## 14. Public assets and PWA support

### `public/`

- church branding assets
- app icons
- `sw.js`

### PWA flow

- `app/manifest.ts` defines install metadata
- `app/layout.tsx` exposes manifest metadata
- `src/components/PwaRegistration.tsx` registers the service worker

## 15. Current implementation notes and caveats

- Authentication is currently custom JWT cookie auth, not NextAuth, even though `next-auth` is installed in dependencies.
- Route guarding is in `proxy.ts`, not `middleware.ts`.
- There are duplicate role-redirect entry pages at:
  - `app/(dashboard)/page.tsx`
  - `app/(dashboard)/dashboard/page.tsx`
- GraphQL split files under `src/graphql/typeDefs/*` and `src/graphql/resolvers/*` should be treated as legacy placeholders unless they are wired back into the active entrypoints.

## 16. Short data flow summary

1. User logs in through `/login`.
2. `/api/auth/login` verifies credentials and sets the JWT cookie.
3. `proxy.ts` guards protected routes on navigation.
4. Dashboard pages query `/api/graphql` through Apollo Client.
5. GraphQL context opens the DB connection and reads the user from the request.
6. Resolvers enforce role access, read/write Mongoose models, and return structured GraphQL data.
7. Shared helpers transform report data into dashboard cards, tables, and analytics views.
