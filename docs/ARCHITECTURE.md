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
- [Loading States & Data Sharing Pattern](#loading-states--data-sharing-pattern)
- [On-Demand ISR Caching Strategy](#on-demand-isr-caching-strategy)
- [Type Architecture Pattern](#type-architecture-pattern)
- [Pagination: API and UI](#pagination-api-and-ui)
- [Installment generation logic](#installment-generation-logic)
- [Scheduled transactions lifecycle](#scheduled-transactions-lifecycle)
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

## Loading States & Data Sharing Pattern

### Problem

Interactive features (TransactionPanel, form adjustments) fetch data asynchronously after mount. Without proper loading feedback:
- Users don't know if the app is working or frozen
- Multiple fetches can fire when a component renders multiple times (React StrictMode, dependency array bugs)
- Data from Context takes time to arrive

### Solution: Three-Layer Approach

#### 1. **Data Consolidation at Page Level**

Server components fetch all related data in parallel using `Promise.all()`:

```tsx
// app/(app)/transactions/page.tsx
export default async function TransactionsPage() {
  const [{ data: transactions }, cardsRes, catsRes, peopleRes] = await Promise.all([
    supabase.from('transactions').select(...),
    supabase.from('cards').select('id, name').is('deleted_at', null),
    supabase.from('categories').select('id, name, icon').is('deleted_at', null),
    supabase.from('people').select('id, name').is('deleted_at', null),
  ])

  return (
    <TransactionDataProvider 
      cards={cardsRes.data ?? []}
      categories={catsRes.data ?? []}
      people={peopleRes.data ?? []}
    >
      {/* Page content */}
    </TransactionDataProvider>
  )
}
```

**Benefits:**
- Single round-trip fetching (3 queries in parallel, not sequential)
- Data shared via Context, available to all child components
- Server-side, so data is already there when React hydrates

#### 2. **Context-Based Distribution**

Data is provided via `TransactionDataProvider` — a simple Context without business logic:

```tsx
// providers/TransactionDataProvider.tsx
export function useTransactionData() {
  const context = useContext(TransactionDataContext)
  if (context === undefined) {
    return { cards: [], categories: [], people: [] } // Safe empty fallback
  }
  return context
}
```

This makes data available to nested components without prop drilling.

#### 3. **Client-Side Fallback with Request Deduplication**

Components that need data but aren't under the Provider (e.g., TransactionForm opened outside transactions page) fetch locally, but **only once**:

```tsx
// components/transactions/TransactionForm.tsx
const fetchedRef = useRef(false)

useEffect(() => {
  if (contextData.cards.length > 0) {
    setIsLoadingData(false)
    return
  }

  if (fetchedRef.current) {
    return // Prevent duplicate fetch even if effect re-runs
  }

  fetchedRef.current = true

  async function load() {
    try {
      const [cardsRes, catsRes, peopleRes] = await Promise.all([
        fetch("/api/cards"),
        fetch("/api/categories"),
        fetch("/api/people"),
      ])
      // ... parse and setLocalData
    } finally {
      setIsLoadingData(false)
    }
  }

  load()
}, [contextData.cards.length])
```

**Key details:**
- `fetchedRef.current` prevents the same `Promise.all()` from firing multiple times
- If fetch fails, `fetchedRef` resets so retry can happen
- Only fetches if Context data empty (defers to page-level data first)

### Loading Skeleton Components

While data loads, skeleton layouts provide visual feedback:

```tsx
// components/transactions/TransactionFormSkeleton.tsx
export function TransactionFormSkeleton() {
  return (
    <div className="flex flex-col gap-5 p-5">
      {/* Skeleton boxes matching form layout */}
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full animate-pulse" />
      ))}
    </div>
  )
}
```

Skeleton components use `animate-pulse` from Tailwind and are rendered while `isLoadingData === true`.

### Full Page Skeletons with Suspense

List pages use `Suspense` boundaries for smoother streaming:

```tsx
// app/(app)/cards/page.tsx
import { Suspense } from 'react'
import { CardListSkeleton } from '@/components/cards/CardListSkeleton'

export default async function CardsPage() {
  const { data: cards } = await supabase.from('cards').select('*')

  return (
    <div>
      <h1>Cartões</h1>
      <Suspense fallback={<CardListSkeleton />}>
        <CardList cards={cards ?? []} />
      </Suspense>
    </div>
  )
}
```

Server sends HTML immediately with skeleton, then streams the actual list once ready.

### Real-World Flow

**Opening TransactionPanel (edit mode):**
1. User clicks "Edit transaction"
2. TransactionPanel opens, TransactionForm mounts
3. Context check: is `contextData.cards.length > 0`?
   - ✅ **YES** (we're on transactions/page): skip local fetch, use context data
   - ❌ **NO** (we're on a different page): render skeleton, start local fetch
4. Once data arrives, `isLoadingData` flips to false
5. Form renders with data available in selects

**Result:** 
- On transactions page: no extra fetches, instant display
- On other pages: 1 GET request per resource type (not 3 duplicate ones)

---

## On-Demand ISR Caching Strategy

### Problem

Caching is hard. Two naive approaches:

1. **No caching** — Page renders fresh on every request, hammering the database with identical queries for every user visit
2. **Fixed-time caching** — Page cached for 60s/5m, but:
   - During the cache window, new data doesn't show up (old content served to all users)
   - Cache expires automatically even if nothing changed (unnecessary DB hit)
   - For global deployments, deciding on a revalidate time is guesswork

**Both approaches are expensive for Supabase users**, whose pricing scales with database operations.

### Solution: On-Demand Revalidation

Rather than a timer, revalidate the cache **only when data actually changes**.

**Pattern:**
- Page caches indefinitely (no `export const revalidate = 60`)
- After every **mutation** (POST, PATCH, DELETE), the API route calls `revalidatePath()`
- Next.js invalidates that page's cache
- Next request gets fresh data from the database

```ts
// app/api/cards/route.ts
import { revalidatePath } from 'next/cache'

export async function POST(request: Request) {
  const supabase = await createClient()
  // ... validation, insert ...

  const { error, data } = await supabase
    .from('cards')
    .insert({ ...parsed.data, user_id: user.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Invalidate cache ONLY after successful insert
  revalidatePath('/cards')
  return NextResponse.json(data, { status: 201 })
}
```

### Why This Scales

- **1 user, 10k users, same cost** — Whether 1 person or 10,000 people view the cards page, if no one creates/updates a card, that database isn't hit at all (cached response served)
- **Data always fresh after changes** — User creates a card, immediately sees it on next page load
- **No background noise** — No automatic refreshes at 3 AM when no one is using the app
- **Flexible** — Can be extended with `revalidateTag()` for finer control over which pages revalidate together (e.g., editing a transaction might revalidate both `/transactions` and `/invoices`)

### Implementation Details

Every mutation endpoint (POST, PATCH, DELETE) in the app calls `revalidatePath()` with the page that displays its data:

- `/api/cards` POST/PATCH → `revalidatePath('/cards')`
- `/api/categories` POST/PATCH → `revalidatePath('/categories')`
- `/api/people` POST/PATCH → `revalidatePath('/people')`
- `/api/transactions` POST/PATCH → `revalidatePath('/invoices')`
- `/api/installments/[id]` PATCH → `revalidatePath('/invoices')`

This ensures the user sees fresh data immediately after their action, without guessing at cache expiration times.

---

## Type Architecture Pattern

### Problem

In a typical Supabase app, you might define types based on your full database schema:

```ts
type Card = {
  id: string
  name: string
  brand?: string
  closing_day: number
  due_day: number
  limit_amount?: number
  color: string
  user_id: string
  created_at: string
  updated_at: string
  deleted_at?: string
}
```

But real-world pages often query **selective fields**, not the complete schema:

```ts
// /app/(app)/cards/page.tsx
const { data: cards } = await supabase
  .from('cards')
  .select('id, name, color') // Only 3 fields!
  .is('deleted_at', null)
  .eq('user_id', user.id)

// Problem: cards data has type `Card` (expects 11 fields)
// But query returns only 3 fields — TypeScript false positive mismatch
```

This forces developers to either:
1. Use `as any` (type safety lost)
2. Request all fields even if only 3 are needed (wasteful bandwidth)
3. Create duplicate types everywhere (unmaintainable)

### Solution: Two-Tier Type System

Instead, maintain **two distinct type levels**:

#### 1. **Complete Schema Types** (`src/types/database.ts`)

Store the full schema from Supabase in one place:

```ts
// src/types/database.ts — Single source of truth

export type Card = {
  id: string
  name: string
  brand?: string
  closing_day: number
  due_day: number
  limit_amount?: number
  color: string
  user_id: string
  created_at: string
  updated_at: string
  deleted_at?: string
}

export type Transaction = {
  id: string
  description: string
  total_amount: number
  type: 'credit' | 'debit'
  purchase_date: string
  card_id: string
  category_id: string
  person_id?: string
  user_id: string
  created_at: string
  updated_at: string
}

// ... all other tables
```

**Use case:** 
- Insert/Update operations that need full record structure
- API endpoints returning complete records with `select('*')`
- Form validation that needs all possible fields

#### 2. **Query-Specific Local Types**

For each page/component doing selective queries, define a **local type matching the SELECT fields**:

```tsx
// app/(app)/cards/page.tsx
'use client'

type Card = { id: string; name: string; color: string }

export function CardList() {
  const [cards, setCards] = useState<Card[]>([])

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('cards')
        .select('id, name, color') // Matches local type exactly
        .is('deleted_at', null)
    }
  }, [])

  return cards.map(card => <CardRow key={card.id} card={card} />)
}
```

**Why local types?**
- ✅ Match the actual query results (no `as any` needed)
- ✅ TypeScript enforces what you **actually** query
- ✅ No wasted bandwidth fetching unused fields
- ✅ Self-documenting — type = query contract

```tsx
// app/(app)/invoices/page.tsx
type Card = { id: string; name: string; color: string } // Different subset!

export function InvoicePanel() {
  const { data: cards } = await supabase
    .from('cards')
    .select('id, name, color')
  
  // card.brand would be a TypeScript error — we didn't query it
  // This is good! It catches mistakes at compile time
}
```

### Examples Across the Codebase

#### Example 1: TransactionForm (selective fields)

```tsx
// components/transactions/TransactionForm.tsx
'use client'

// Local types matching what transactions/page.tsx queries
type Card = { id: string; name: string }
type Category = { id: string; name: string; icon: string }
type Person = { id: string; name: string }

export function TransactionForm({ cards, categories, people }: {
  cards: Card[]
  categories: Category[]
  people: Person[]
}) {
  // These components can't access .color, .brand, etc.
  // Because the parent page didn't query those fields
  // This is correct and what we want!
}
```

#### Example 2: InvoicePage (different selective fields)

```tsx
// components/invoices/InvoicePage.tsx
'use client'

type Card = { id: string; name: string; color: string }

export function InvoicePage({ cards }: { cards: Card[] }) {
  return (
    <div>
      {cards.map(card => (
        <div key={card.id} style={{ borderColor: card.color }}>
          {card.name} Invoice
        </div>
      ))}
    </div>
  )
}
```

Note: `Card` here has `color` (displayed in UI) but `TransactionForm.Card` doesn't. Both are correct for their context.

#### Example 3: API Endpoints (full schema)

```ts
// app/api/transactions/route.ts (GET all transactions)

import type { Transaction } from '@/types/database'

export async function GET(request: Request) {
  const { data } = await supabase
    .from('transactions')
    .select('*') // Full record

  return NextResponse.json(data as Transaction[])
}
```

Use the centralized `database.ts` type here because we're returning the complete schema.

### Benefits

| Aspect | Result |
|---|---|
| **Type Safety** | ✅ Compile-time errors if query doesn't match type |
| **No Assertions** | ✅ Zero `as any` needed |
| **Bandwidth** | ✅ Only fetch fields used |
| **Maintainability** | ✅ database.ts is single source of truth for schema |
| **Self-Documentation** | ✅ Type signature = query contract |
| **Flexibility** | ✅ Different pages can query different subsets |

### Implementation Checklist

- [ ] Define complete schema types in `src/types/database.ts`
- [ ] For each page/component doing queries, create **local types** matching SELECT fields
- [ ] Never import `database.ts` types into components doing selective queries
- [ ] API endpoints returning `select('*')` use `database.ts` types
- [ ] Form components receive data via props, use local types in prop signatures
- [ ] Run `npx tsc --noEmit` to verify no `any` assertions exist

---

## Pagination: API and UI

### Why Pagination?

Lists can grow large:
- 50 cards
- 100+ categories (accumulated from years of use)
- Potentially 1000s of transactions per year

Loading all of them at once:
- Wastes bandwidth (user scrolls 5 items, rest never seen)
- Makes the page feel slow (time to first paint delayed)
- Strains the database (one query with `LIMIT 10000`)

### API-Level Pagination

All list endpoints support `?page=1&limit=10`:

```ts
// app/api/cards/route.ts

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') ?? '10')))
  const offset = (page - 1) * limit

  // Get total count for metadata
  const { count: total } = await supabase
    .from('cards')
    .select('id', { count: 'exact', head: true })
    .is('deleted_at', null)
    .eq('user_id', user.id)

  // Get paginated data
  const { data } = await supabase
    .from('cards')
    .select('id, name, closing_day, color')
    .is('deleted_at', null)
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1)

  const hasMore = (page * limit) < (total ?? 0)

  return NextResponse.json({
    data: data ?? [],
    pagination: {
      page,
      limit,
      total: total ?? 0,
      hasMore,
    },
  })
}
```

**Response structure:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "hasMore": true
  }
}
```

**Benefits:**
- **Two queries instead of one** (count + data), but we get metadata to render pagination controls
- **Limit capped at 100** — prevents abuse (user can't request `?limit=10000`)
- **`hasMore` flag** — UI knows if there's a next page without calculating `ceil(total / limit)`
- **All filters preserved** — `/api/transactions?page=2&month=3&year=2026&card_id=abc` works as expected

### UI-Level Pagination

CardList, CategoryList, and PeopleList components now manage pagination state themselves (moved from server-side to client-side):

```tsx
'use client'

export function CardList() {
  const [page, setPage] = useState(1)
  const [cards, setCards] = useState<Card[]>([])
  const [pagination, setPagination] = useState({ ... })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCards()
  }, [page]) // Re-fetch when page changes

  async function fetchCards() {
    setLoading(true)
    const res = await fetch(`/api/cards?page=${page}&limit=10`)
    const data: PaginationResponse = await res.json()
    setCards(data.data)
    setPagination(data.pagination)
    setLoading(false)
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* Add button at top — always accessible */}
        <AddButton label="Adicionar cartão" onClick={openCreate} />

        {/* Loading state */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <span className="text-sm text-muted-foreground">Carregando...</span>
          </div>
        ) : (
          <>
            {/* List */}
            <div className="flex flex-col gap-2">
              {cards.length === 0 ? (
                <p>Nenhum cartão encontrado</p>
              ) : (
                cards.map(card => <CardRow key={card.id} card={card} />)
              )}
            </div>

            {/* Pagination controls */}
            <div className="flex items-center justify-between gap-4">
              <Button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
              >
                Anterior
              </Button>

              <span className="text-sm text-muted-foreground">
                Página {pagination.page} de {Math.ceil(pagination.total / pagination.limit)}
              </span>

              <Button
                onClick={() => setPage(p => p + 1)}
                disabled={!pagination.hasMore || loading}
              >
                Próximo
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  )
}
```

### Why Client-Side Pagination Here?

These are **static lists** of user's own data (cards, categories, people). Unlike the infinite-scroll transaction list which needs server-side filtering, these lists:
- Are small enough to manage with simple `useState`
- Don't need complex filtering (just show all of user's items, paginated)
- Benefit from being responsive — user can flip pages without a full page reload
- Share a simple, reusable pattern (prev/next buttons, page indicator)

**UX improvement:** The "Add" button lives at the top of the component, not below pagination controls, so it's always visible regardless of page length.

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

## Scheduled transactions lifecycle

Phase 7 introduced an explicit lifecycle for transactions so planned spending does not pollute real metrics.

### States
- `posted`: the transaction is real and can generate installments
- `scheduled`: the transaction is planned for a future date and does not generate installments yet
- `cancelled`: the transaction will no longer happen

### Core rules
- Only `posted` transactions generate installments
- `scheduled` transactions are excluded from invoice totals and dashboard aggregates by default
- `cancelled` transactions remain available for audit/history but are not treated as active spending

### Why this matters
- It keeps the invoice view strictly factual
- It keeps dashboard KPIs honest by separating realized spend from planned spend
- It prevents duplicate installment generation when a future expense is edited before execution

### UI contract
- Transaction form has two modes: `Agora` and `Agendar`
- Dashboard surfaces a separate scheduled-spend summary card
- Invoice page explicitly states that it only shows realized expenses

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

### Schema Design

Schemas are defined once and exported with separate variants for CREATE and UPDATE operations:

```ts
// lib/validations.ts — Single source of truth

// CREATE schema (all required fields)
export const cardCreateSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  brand: z.string().optional(),
  closing_day: z.number().int().min(1).max(31, 'Fechamento deve ser 1-31'),
  due_day: z.number().int().min(1).max(31, 'Vencimento deve ser 1-31'),
  limit_amount: z.number().positive('Limite deve ser positivo').optional().nullable(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Cor deve ser hex válida').default('#6366f1'),
})

// UPDATE schema (all optional fields using .partial())
export const cardUpdateSchema = cardCreateSchema.partial()

// Types automatically derived from schemas
export type CardInput = z.infer<typeof cardCreateSchema>
export type CardUpdateInput = z.infer<typeof cardUpdateSchema>
```

### Client-Side Validation

Forms use **React Hook Form** with Zod resolver for type-safe, performant validation:

```tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { cardCreateSchema, type CardInput } from '@/lib/validations'

export function CardFormDialog() {
  const form = useForm<CardInput>({
    resolver: zodResolver(cardCreateSchema),
    defaultValues: { name: '', closing_day: 1, ... }
  })

  // Per-field errors automatically display
  form.formState.errors.closing_day?.message // "Fechamento deve ser 1-31"
}
```

### Server-Side Validation

All API Routes validate with the same schema before touching the database:

```ts
// app/api/cards/route.ts

import { cardCreateSchema } from '@/lib/validations'

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = cardCreateSchema.safeParse(body)

  if (!parsed.success) {
    // Return field-level errors to client
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 422 }
    )
  }

  // Insert with validated data
  const { data, error } = await supabase
    .from('cards')
    .insert({ ...parsed.data, user_id: user.id })
    .select()
    .single()
}
```

### Benefits

- **Single source of truth** — Validation rules defined once, used everywhere
- **Type safety** — `z.infer<>` generates TypeScript types automatically
- **Instant feedback** — Client-side validation shows errors before network request
- **Defense in depth** — Server-side validation prevents malformed data even if client bypasses form
- **Consistent UX** — Same error messages client and server
- **Per-field errors** — Users see exactly which field is invalid and why (not just "Error saving")

### Smart Update Logic

When editing resources, PATCH endpoints only regenerate expensive operations (like installments) if relevant fields changed:

```ts
// app/api/transactions/[id]/route.ts

const needsRegenerate =
  parsed.data.total_amount !== undefined ||
  parsed.data.installments_count !== undefined ||
  parsed.data.purchase_date !== undefined ||
  parsed.data.type !== undefined

if (needsRegenerate) {
  // Preserve paid status from old installments when regenerating
  const oldPaidNumbers = oldInstallments.filter(i => i.paid).map(i => i.number)
  
  const newInstallments = generateInstallments(...)
  const withPaid = newInstallments.map(i => ({
    ...i,
    paid: oldPaidNumbers.includes(i.number) // Match by number
  }))
}
```

This ensures that editing a transaction's description doesn't destroy the payment history of its installments.

### Create vs. Edit UI State

Forms that support both creating and editing use a **context-based mode system**:

```ts
// providers/TransactionPanelProvider.tsx

type TransactionPanelContextType = {
  isOpen: boolean
  transaction: Transaction | null  // null = create mode, object = edit mode
  mode: 'create' | 'edit'          // explicit state
  open: (transaction?: Transaction) => void
  close: () => void
}
```

The `open()` function determines mode based on whether a transaction is passed:

```ts
const open = (transaction?: Transaction) => {
  setTransaction(transaction ?? null)
  setMode(transaction ? 'edit' : 'create')
  setIsOpen(true)
}
```

In the form component, the mode determines which schema and URL are used:

```tsx
// components/transactions/TransactionForm.tsx

async function handleSubmit(data: TransactionInput) {
  const url = mode === 'edit'
    ? `/api/transactions/${transaction?.id}`
    : '/api/transactions'
  const method = mode === 'edit' ? 'PATCH' : 'POST'

  // Pre-fill form when editing
  useEffect(() => {
    if (mode === 'edit' && transaction) {
      form.reset({
        description: transaction.description,
        total_amount: transaction.total_amount,
        // ... other fields
      })
    }
  }, [mode, transaction])
}
```

This pattern ensures:
- Same form component handles both operations
- Schema validation is identical (client and server)
- Button labels and URLs change automatically based on mode
- Pre-filled data is loaded and form is reset when switching modes

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
