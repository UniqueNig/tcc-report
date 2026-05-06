├── src/
│   ├── components/
│   │   ├── Sidebar.tsx   → Shared sidebar for all roles. Accepts a `user` prop with
│   │   │                   role — renders the correct nav links. Has logo,
│   │   │                   role badge, nav, user info, logout.
│   │   │
│   │   └── Topbar.tsx    → Shared top bar for all roles. Has dark/light toggle,
│   │                       notification bell with dropdown, avatar.
│   │                       Notifications show: new report, reviewed, comment.
│   │
│   └── lib/
│       └── unitSchemas.ts  → Defines all field schemas for every unit type.      ✅
│                             The submit form reads this to know what fields
│                             to render per unit. Add/edit units/fields here only.
│
└── app/
    ├── layout.tsx            → Root layout. Has the inline script that sets        ✅
    │                           dark/light class before paint (no flash).
    │                           Applies Plus Jakarta Sans font.
    │
    ├── globals.css           → Tailwind v4 entry. Font import, @variant dark,      ✅
    │                           scrollbar styles, .skeleton shimmer, .fade-up,
    │                           @keyframes grow for redirect progress bar.
    │
    ├── (auth)/
    │   └── login/
    │       └── page.tsx      → Login page. Email + password form. Validates,       ✅
    │                           calls /api/auth/login, reads role from response,
    │                           redirects to the right dashboard. Error states,
    │                           forgot password, show/hide password, spinner.
    │
    ├── api/
    │   └── graphql/
    │       └── route.ts                                                             ⬜ backend phase
    │
    └── dashboard/
        ├── unit-head/
        │   ├── page.tsx          → Unit Head main dashboard. Welcome message,      ✅
        │   │                       3 summary cards (total reports, this week,
        │   │                       last submitted). Reports table with search,
        │   │                       date filter, status filter. Links to submit
        │   │                       and to individual report detail.
        │   │
        │   ├── submit/page.tsx   → Dynamic report submission form. Reads           ✅
        │   │                       unitSchemas.ts based on logged-in user's
        │   │                       unit and renders the correct fields.
        │   │                       Validates required fields, optional file
        │   │                       upload, success state after submission.
        │   │
        │   └── reports/
        │       ├── page.tsx      → Full list of all reports submitted by           ✅
        │       │                   this unit head. Mini stats strip, search,
        │       │                   date + status filters, pagination,
        │       │                   clear filters button, empty state.
        │       │
        │       └── [id]/page.tsx → Single report detail for unit head.             ✅ view only, no comment box
        │                           Shows all report fields, status badge,
        │                           attachment download, comments thread
        │                           from core leader/admin (read-only for
        │                           unit head — they cannot comment back).
        │
        ├── core-leader/
        │   ├── page.tsx          → Core Leader dashboard. Summary cards            ✅
        │   │                       (assigned units, total reports, pending).
        │   │                       Assigned units strip with pending counts.
        │   │                       Reports table with unit + status filter,
        │   │                       search. Inline Mark as reviewed button.
        │   │                       Comment button links to report detail.
        │   │
        │   ├── reports/
        │   │   ├── page.tsx      → Standalone all-reports page for core            ✅
        │   │   │                   leader. Same table as dashboard but as
        │   │   │                   its own route. Mini stats, all filters,
        │   │   │                   pagination, mark reviewed inline.
        │   │   │
        │   │   └── [id]/page.tsx → Report review page. Full report content,        ✅ has comment box + mark reviewed
        │   │                       meta card, mark as reviewed button (in
        │   │                       card + sticky bottom bar), comment thread
        │   │                       with timeline view, comment box (⌘+Enter
        │   │                       shortcut), attachment download.
        │   │                       Auto-scrolls to comment box if
        │   │                       ?comment=true in URL.
        │   │
        │   └── units/page.tsx    → My Units page. Shows each assigned unit         ✅
        │                           as a card with stats strip (total/pending/
        │                           reviewed), last submission date, 3 recent
        │                           reports inline, view all button.
        │
        └── admin/
            ├── page.tsx          → Admin overview dashboard. 4 clickable           ✅ needs attendance/offering cards
            │                       stat cards (reports, pending, users, units)
            │                       that link to their pages. This-week strip.
            │                       Latest 5 reports table. Quick links to
            │                       users and units pages.
            │
            ├── reports/
            │   ├── page.tsx      → All reports across entire system. Mini          ✅
            │   │                   stats, search + unit + core leader +
            │   │                   status + date filters. Sortable columns,
            │   │                   checkbox row selection, bulk delete with
            │   │                   confirm modal, pagination.
            │   │
            │   └── [id]/page.tsx → Admin report detail. Two-column layout:         ✅ has comment box + delete + export
            │                       main (report content, stats row, comments)
            │                       + sidebar (meta, status card, actions).
            │                       Mark reviewed, export to file, delete with
            │                       confirm modal, comment box, toast feedback.
            │
            ├── analytics/page.tsx → Attendance and offering analytics.             ✅
            │                        Toggle between Attendance and Offering
            │                        views. Bar charts grouped by month/quarter/
            │                        year. Service type filter. Attendance:
            │                        total, avg, peak, first timers, gender
            │                        breakdown, raw records table. Offering:
            │                        collected vs banked, discrepancy flag,
            │                        reconciliation note, records table.
            │
            ├── users/page.tsx    → User management. Table of all users with        ✅
            │                       role badges, unit, join date. Search +
            │                       role filter. Create/edit modal (fields
            │                       change by role — unit field only shows
            │                       for UNIT_HEAD). Confirm delete modal.
            │                       Toast on every action. Role stats strip.
            │
            └── units/page.tsx   → Unit management. Table of all units with        ✅
                                    head, core leader, report count, pending
                                    badge. Create/edit modal (name, assign
                                    core leader, assign unit head). Delete
                                    modal warns if unit has existing reports.
                                    Core leader filter, search, toast feedback.