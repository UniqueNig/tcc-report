├── src/
│   ├── components/
│   │   ├── Sidebar.tsx                         ✅
│   │   └── Topbar.tsx                          ✅
│   └── lib/
│       └── unitSchemas.ts                      ✅
│
└── app/
    ├── layout.tsx                              ✅
    ├── globals.css                             ✅
    ├── (auth)/
    │   └── login/
    │       └── page.tsx                        ✅
    ├── api/
    │   └── graphql/
    │       └── route.ts                        ⬜ backend phase
    └── dashboard/
        ├── unit-head/
        │   ├── page.tsx                        ✅
        │   ├── submit/page.tsx                 ✅
        │   ├── reports/
        │   │   ├── page.tsx                    ✅
        │   │   └── [id]/page.tsx               ✅ view only, no comment box
        ├── core-leader/
        │   ├── page.tsx                        ✅
        │   ├── reports/
        │   │   ├── page.tsx                    ✅
        │   │   └── [id]/page.tsx               ✅ has comment box + mark reviewed
        │   └── units/page.tsx                  ✅
        └── admin/
            ├── page.tsx                        ✅ needs attendance/offering cards
            ├── reports/
            │   ├── page.tsx                    ✅
            │   └── [id]/page.tsx               ✅ has comment box + delete + export
            ├── analytics/page.tsx              ✅
            ├── users/page.tsx                  ✅
            └── units/page.tsx                  ✅




            app/
└── api/
    └── graphql/
        └── route.ts              ← Single GraphQL endpoint

src/
├── lib/
│   ├── db.ts                     ← MongoDB connection
│   ├── auth.ts                   ← NextAuth config
│   ├── unitSchemas.ts            ← (already done)
│   └── graphql/
│       ├── schema.ts             ← Full GraphQL type definitions
│       ├── resolvers/
│       │   ├── index.ts          ← Merges all resolvers
│       │   ├── auth.resolvers.ts
│       │   ├── report.resolvers.ts
│       │   ├── user.resolvers.ts
│       │   ├── unit.resolvers.ts
│       │   └── comment.resolvers.ts
│       └── context.ts            ← Request context (session + db)
│
├── models/
│   ├── User.ts                   ← Mongoose model
│   ├── Unit.ts
│   ├── Report.ts
│   └── Comment.ts
│
└── middleware.ts                 ← Route protection by role