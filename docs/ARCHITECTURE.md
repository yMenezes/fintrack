# Architecture decisions — FinTrack

> This document explains **why** things were built the way they were.  
> If you're reading this as a portfolio reviewer or study companion, this is where the real learning is.

---

## Table of contents

- [Overview](#overview)
- [Why Next.js 14 (App Router)?](#why-nextjs-14-app-router)
- [Server Components vs Client Components](#server-components-vs-client-components)
- [Why Supabase?](#why-supabase)
- [Row Level Security explained](#row-level-security-explained)
- [Installment generation logic](#installment-generation-logic)
- [Invoice closing day logic](#invoice-closing-day-logic)
- [Form validation strategy](#form-validation-strategy)
- [Folder structure rationale](#folder-structure-rationale)

---

## Overview

FinTrack is a **full-stack web application** built in a single Next.js project, deployed to Vercel, with Supabase as the backend-as-a-service (database + authentication).

The goal was to minimize infrastructure complexity while practicing modern full-stack patterns — something a solo developer (or small team) can own end-to-end.

```
Browser → Next.js (Vercel) → Supabase (PostgreSQL)
                ↑
         API Routes live here too
         (no separate server needed)
```

---

## Why Next.js 14 (App Router)?

Three alternatives were considered:

| Option | Rejected because |
|---|---|
| React + Node.js (separate) | Two repos, two deploys, CORS config, more cognitive overhead for a solo project |
| Vite + React SPA | No server-side rendering, all data fetching on the client, worse performance on first load |
| Vue.js / Nuxt | Different syntax from React — no benefit for this project, less ecosystem overlap |

**Next.js 14 with App Router** wins because:
- Frontend and backend live in the same codebase and deploy together
- Server Components fetch data at the server, keeping API keys safe and HTML delivery fast
- `app/api/route.ts` files give us a real HTTP API without Express boilerplate
- Vercel (made by the same team) deploys it with zero configuration

---

## Server Components vs Client Components

This is the most important mental model shift in modern Next.js.

### Server Components (default)
- Run on the server at request time (or build time for static pages)
- Can use `async/await` directly — no `useEffect` for data fetching
- **Never sent to the browser as JavaScript** — only the resulting HTML
- Cannot use `useState`, `useEffect`, or browser APIs

```tsx
// app/(app)/dashboard/page.tsx
// This runs on the SERVER — no JS shipped to the browser for this component
export default async function DashboardPage() {
  const transactions = await getTransactionsThisMonth() // direct DB call, safe
  return <Dashboard data={transactions} />
}
```

### Client Components
- Marked with `'use client'` at the top of the file
- Hydrated in the browser — can use hooks, event handlers, browser APIs
- Use for: forms, interactive elements, anything that changes without a page reload

```tsx
'use client'
// components/transactions/TransactionForm.tsx
export function TransactionForm() {
  const [loading, setLoading] = useState(false)
  // ...
}
```

### The rule of thumb
> Push as much as possible to Server Components. Only reach for `'use client'` when you actually need interactivity.

---

## Why Supabase?

Supabase provides:
- **PostgreSQL** — a real relational database, not a NoSQL JSON store
- **Auth** — JWT sessions, OAuth providers (Google, GitHub), email/password — all ready to use
- **Row Level Security** — access control at the database level (see below)
- **Auto-generated TypeScript types** — run one CLI command and get types for every table
- **Free tier** — 500MB database, unlimited auth users, 2 projects

The alternative would be setting up a separate PostgreSQL instance (e.g. on Railway), writing auth from scratch with NextAuth.js, and managing sessions manually. Supabase handles all of that.

---

## Row Level Security explained

RLS is a PostgreSQL feature that enforces access control rules at the database level — not in application code.

**Without RLS:** if there's a bug in the API that accidentally fetches data without filtering by `user_id`, user A could see user B's transactions.

**With RLS:** even if the query has no `WHERE user_id = ?` clause, PostgreSQL silently adds the restriction based on the logged-in user's JWT. The data never leaves the database.

Example RLS policy on the `transactions` table:
```sql
create policy "Users can view their own transactions"
  on public.transactions for select
  using (auth.uid() = user_id);
```

`auth.uid()` is a Supabase function that returns the ID of the currently authenticated user from the JWT token. The `using` clause is automatically appended to every SELECT query on that table.

---

## Installment generation logic

This is the core domain logic of FinTrack. When a user adds a purchase with N installments, the app must:

1. Create one row in `transactions` (the purchase itself)
2. Create N rows in `installments` (one per month, distributed forward from the purchase date)

The logic lives in `lib/installments.ts`:

```ts
export function generateInstallments(
  transactionId: string,
  totalAmount: number,
  count: number,
  purchaseDate: Date,
  card: { closing_day: number }
): Installment[] {
  const installmentAmount = parseFloat((totalAmount / count).toFixed(2))
  const installments = []

  // Determine which month the first installment falls on
  // based on the card's closing day
  let startMonth = getFirstInstallmentMonth(purchaseDate, card.closing_day)

  for (let i = 0; i < count; i++) {
    installments.push({
      transaction_id: transactionId,
      number: i + 1,
      amount: installmentAmount,
      reference_month: startMonth.month,
      reference_year: startMonth.year,
    })
    startMonth = nextMonth(startMonth)
  }

  return installments
}
```

### Why store `reference_month` and `reference_year` separately?

Storing them as integers (e.g. `reference_month: 3, reference_year: 2025`) makes filtering extremely simple:

```sql
-- Get everything on the March 2025 invoice for a card
select * from installments
where reference_month = 3
  and reference_year = 2025
```

Using a full `date` column would require date range comparisons, which are harder to reason about.

---

## Invoice closing day logic

Each card has a `closing_day`. If the closing day is the 5th and you make a purchase on March 3rd, the expense goes to the **February invoice** (because March 5th hasn't closed yet — the February invoice is still open). If you buy on March 6th, it goes to **March's invoice**.

```ts
export function getFirstInstallmentMonth(
  purchaseDate: Date,
  closingDay: number
): { month: number; year: number } {
  const day = purchaseDate.getDate()
  const month = purchaseDate.getMonth() + 1 // JS months are 0-indexed
  const year = purchaseDate.getFullYear()

  // If purchase was made AFTER the closing day, it falls on next month's invoice
  if (day > closingDay) {
    return month === 12
      ? { month: 1, year: year + 1 }
      : { month: month + 1, year }
  }

  // Otherwise it's on this month's invoice
  return { month, year }
}
```

---

## Form validation strategy

All form inputs are validated with **Zod schemas** defined in `lib/validations.ts`. The same schema is used on both the client (React Hook Form) and the server (API Route), so there's no duplication.

```ts
// lib/validations.ts
export const transactionSchema = z.object({
  description:        z.string().min(1, 'Description is required'),
  total_amount:       z.number().positive('Amount must be positive'),
  installments_count: z.number().int().min(1).max(24),
  purchase_date:      z.string().datetime(),
  card_id:            z.string().uuid(),
  category_id:        z.string().uuid().optional(),
  person_id:          z.string().uuid().optional(),
})

export type TransactionInput = z.infer<typeof transactionSchema>
```

Benefits:
- **Single source of truth** for validation rules
- TypeScript types are inferred automatically from the schema
- Client-side errors appear instantly (no round trip needed)
- Server-side validation prevents malformed data even if someone bypasses the form

---

## Folder structure rationale

### Route Groups `(auth)` and `(app)`

Parentheses in folder names create **Route Groups** — they group routes under a shared layout without affecting the URL.

- `(auth)` — login and register pages. No sidebar, centered layout.
- `(app)` — all authenticated pages. Sidebar + top navbar.

This avoids repeating the sidebar component in every page file.

### `lib/` vs `components/`

- `lib/` — pure functions and utilities with no React. Can be tested without rendering anything. Business logic lives here.
- `components/` — React components only. Divided by feature, not by type (no `hooks/`, `utils/`, `helpers/` inside components).

### Why shadcn/ui?

shadcn/ui is not a traditional component library — you copy the component source code into your project. This means:
- No dependency to upgrade
- Full control over every component
- Components are already integrated with Tailwind and Radix UI (accessible primitives)
