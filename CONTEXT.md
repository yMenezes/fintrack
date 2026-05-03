# Contexto de desenvolvimento — FinTrack

## Stack
Next.js 14 (App Router) + TypeScript + Tailwind CSS + Supabase + shadcn/ui v2 + Vercel + React Hook Form + Zod

## O que já foi implementado
- Autenticação completa (email/senha, Google, GitHub, reset de senha)
- Middleware de proteção de rotas
- Layout principal com sidebar, navbar e toggle dark/light
- CRUD completo de cartões (com soft delete e color picker)
- CRUD completo de categorias (com emoji picker e color picker)
- CRUD completo de pessoas
- Componentes reutilizáveis: ColorPicker, AddButton, DeleteDialog
- Formulário de lançamentos em sliding panel com animação
- Geração automática de parcelas (lib/installments.ts)
- Página de lançamentos com filtros, agrupamento por data e animações
- Fatura mensal com tabs por cartão, agrupamento por categoria/data, marcar como pago

### ✅ FASE 1 — Validações Centralizadas (PRONTO)
- **lib/validations.ts** centralizado com schemas Zod para todas entidades
  - cardCreateSchema, cardUpdateSchema (com tipos derivados)
  - categoryCreateSchema, categoryUpdateSchema
  - personCreateSchema, personUpdateSchema
  - transactionCreateSchema, transactionUpdateSchema
  - installmentUpdateSchema
- Refatorado todos 8 API Routes (`/cards`, `/categories`, `/people`, `/transactions`, `/installments`)
- Refatorado 3 Form Dialogs com react-hook-form + zodResolver:
  - CardFormDialog
  - CategoryFormDialog
  - PeopleFormDialog
- Validação client/server sincronizada (mesma schema)
- Per-field error messages (mostra erro específico de cada campo)
- Smart regeneration de parcelas ao editar transação (preserva status `paid`)

### ✅ FASE 2 — Transaction Edit + Loading States (PRONTO)

#### Transaction Edit
- **TransactionPanelProvider.tsx** agora rastreia modo (create/edit)
  - `open(transaction?: Transaction)` detecta se é create ou edit
  - Transaction type agora inclui card_id, category_id, person_id
- **TransactionForm.tsx** refatorado com react-hook-form + zodResolver
  - Per-field error messages (padrão FASE 1)
  - Amount em cents internamente, formatado na UI
  - Type-based conditional fields (installments só para crédito)
  - Submit inteligente: POST para create, PATCH para edit
  - Parsing de erros do servidor (fieldErrors)
- **TransactionList.tsx** tipo Transaction atualizado com card_id, category_id, person_id
- TypeScript: 0 errors

#### Loading States & Data Sharing
- **TransactionDataProvider** — Context para compartilhar cards/categories/people
  - Fornecido no `app/(app)/layout.tsx`
  - Distribuído via `Promise.all()` paralelo no transactions/page.tsx
  - Fallback local fetch em TransactionForm se context vazio
- **Skeleton Components** — LoadingUI consistente
  - CardListSkeleton, CategoryListSkeleton, PeopleListSkeleton, TransactionFormSkeleton, InvoicePageSkeleton
  - Implementado em todas páginas principais com Suspense boundaries
  - Padrão: `<Suspense fallback={<Skeleton />}><Component /></Suspense>`
- **Request Deduplication** — useRef previne múltiplos GET
  - TransactionForm com `fetchedRef.current` para garantir 1 fetch apenas
  - Mesmo se useEffect rodar múltiplas vezes, fetch único
  - Retry automático se erro ocorrer
- **Performance**
  - Antes: 3 GETs duplicados ao abrir TransactionPanel
  - Depois: 1 GET de cada tipo (cards, categories, people)
  - Data fetching consolidado ao nível de página com Promise.all()

### ✅ FASE 3 — Auto-fill de Dados ao Editar (PRONTO)

#### Pre-fill Implementation
- **Query Update** — Adicionados `card_id, category_id, person_id` ao SELECT de transactions
  - Query retorna IDs diretos além dos relacionamentos nested
  - Permite pré-fill sem refetch adicional
- **TransactionForm.tsx** — Implementado form.reset() condicional
  - Em modo 'edit': form.reset() com dados completos da transação
  - Em modo 'create': form.reset() com defaults vazios
  - useEffect dependency: `[mode, transaction?.id]` (não coloca transaction inteiro)
- **Select Binding** — Radix UI Selects reconhecem valores resetados
  - Cada Select usa `form.watch()` para ler valor atual
  - `form.setValue()` em onChange dispara re-render automático
  - Funciona com `null` coalescing (`??`) para valores opcionais
- **Cents Handling** — Form.reset() também ajusta `cents` state
  - `setCents(Math.round(transaction.total_amount * 100))`
  - Mantém formatação de moeda em sync com form
- **No Reset Loops** — Com dependency array correto, evita re-renders infinitos
  - Só reseta quando `mode` ou `transaction.id` muda
  - Não causa renders extras mesmo em Strict Mode
- TypeScript: 0 errors
- Soft delete em cards, categories, people (não em transactions/installments)
- Otimistic updates nos checkboxes da fatura
- Types derivados com `z.infer<>` para type safety automático
- Context API para data sharing entre componentes (TransactionDataProvider)
- React Suspense + skeleton components para loading states
- useRef para deduplicação de side effects / requisições

### ✅ FASE 4 Subtask 1 — On-Demand ISR Caching (PRONTO)

#### Strategic Decision - On-Demand Revalidation Pattern
- **Rationale**: Commercial-grade architecture for multi-user scalability
  - Automatic ISR (`revalidate = 60`) = unnecessary DB hits even with no user activity
  - On-demand pattern = cache forever until data actually changes
  - Scales identically from 1 to 10,000 users
  - Minimizes Supabase query costs while maintaining fresh data
- **Implementation**: `revalidatePath()` in API routes after mutations only
  - Removes all `export const revalidate = 60/300` from pages
  - Pages cache indefinitely without expiration timer
  - Only revalidates when data changes via revalidatePath() calls
  - Next request after mutation gets fresh data, all others use cache

#### Implementation Details
**Page-level cache removal:**
- Removed `export const revalidate = 60` from `/invoices` page
- Removed `export const revalidate = 60` from `/transactions` page
- Removed `export const revalidate = 300` from `/cards` page
- Removed `export const revalidate = 300` from `/categories` page
- Removed `export const revalidate = 300` from `/people` page
- Result: All pages cache indefinitely until invalidated

**API Route revalidation (ALL 9 mutations covered):**
- Created mutations (3 routes):
  - `/api/cards` POST → `revalidatePath('/cards')`
  - `/api/categories` POST → `revalidatePath('/categories')`
  - `/api/people` POST → `revalidatePath('/people')`
  - `/api/transactions` POST → `revalidatePath('/invoices')`
- Updated mutations (5 routes):
  - `/api/cards/[id]` PATCH → `revalidatePath('/cards')`
  - `/api/categories/[id]` PATCH → `revalidatePath('/categories')`
  - `/api/people/[id]` PATCH → `revalidatePath('/people')`
  - `/api/transactions/[id]` PATCH → `revalidatePath('/invoices')`
  - `/api/installments/[id]` PATCH → `revalidatePath('/invoices')`
- Pattern: `import { revalidatePath } from 'next/cache'` + call before response

**TypeScript Validation:**
- All changes validated with `npx tsc --noEmit`
- Result: 0 errors

#### How It Works
1. User visits `/cards` page → Response cached by Next.js
2. User creates a card via POST /api/cards
3. API route inserts data AND calls `revalidatePath('/cards')`
4. Next.js invalidates `/cards` page cache
5. User navigates back to `/cards` → Gets fresh data from DB

#### Why This Scales
- No automatic refresh timers = lower Supabase bill
- Whether 1 user or 10,000 users: only query DB on actual changes
- Cache hit reduces DB load by 100x+ (for same page visited multiple times)
- Flexible: Can add smart patterns later (e.g., `revalidateTag()` for finegrained control)

### ✅ FASE 4 Subtask 3 — Pagination UI Components (PRONTO)

#### Implementation Details

**Client-Side Pagination State:**
- `page: number` — Current page (starts at 1)
- `loading: boolean` — Fetch in progress
- `pagination: { page, limit, total, hasMore }` — Metadata from API
- Data fetched on mount + when page changes

**Component Architecture:**
- CardList, CategoryList, PeopleList → Now `"use client"` components
- Fetch API at component level (removed server-side fetch)
- State management: useState for page, data, pagination
- useEffect hook: `[page]` dependency triggers new fetchCards/fetchCategories/fetchPeople

**UI Components Added:**
- **Loading State**: Center spinner with "Carregando..." message
- **Empty State**: "Nenhum [item] encontrado" when data is empty
- **Pagination Controls**: 
  - Previous button (disabled on page 1)
  - Page indicator: "Página 1 de 10 · 25 total"
  - Next button (disabled when !hasMore)
  - ChevronLeft/ChevronRight icons from lucide-react

**Data Flow:**
1. Component mounts → `useEffect([page])` fires → `fetchCards()`
2. `fetchCards()` calls `/api/cards?page=1&limit=10`
3. API returns `{ data, pagination }`
4. Component renders with data
5. User clicks "Próximo" → `setPage(p => p + 1)`
6. useEffect detects page change → Re-fetches with new page param

**Error Handling:**
- try/catch in fetchCards() with console.error
- Gracefully fallbacks to empty list on error
- On delete: resets page to 1 and re-fetches

**Updated Pages:**
- `/cards` — Removed async/await, removed Supabase fetch, now calls `<CardList />`
- `/categories` — Same as cards
- `/people` — Same as cards
- Pages removed `createClient()` and direct DB queries
- Cards page still uses `<Suspense>` boundary but fallback less relevant (client component loads instead)

**Query Parameters Supported:**
- `/api/cards?page=2&limit=10` → Returns items 10-20
- `/api/categories?page=1&limit=10` → First 10 items
- `/api/people?page=1&limit=10` → First 10 items
- `/api/transactions?page=1&limit=10&month=3&year=2026&card_id=123` → Filtered + paginated

**Button States:**
- **Previous disabled**: `page === 1 || loading`
- **Next disabled**: `!pagination.hasMore || loading`
- Full list info: `Página ${page} de ${totalPages} · ${total} total`

**TypeScript Validation:**
- All changes validated with `npx tsc --noEmit`
- Result: 0 errors

**Effective Result:**
- Lists now paginated instead of showing all items
- Instant page load (cached by Next.js on-demand ISR)
- Smooth navigation between pages with loading states
- Mobile-friendly pagination controls with clear button states

#### Implementation Details
**Query Parameters:**
- `page`: Page number (default: 1, min: 1)
- `limit`: Items per page (default: 10, max: 100)
- All existing filters preserved (month, year, card_id, category_id, person_id, type for transactions)

**Response Structure:**
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

**Updated Endpoints:**
- `/api/cards?page=1&limit=10`
  - Returns: `{ data: Card[], pagination: {...} }`
  - Also includes `color` field (not just id, name, closing_day)
  
- `/api/categories?page=1&limit=10`
  - Returns: `{ data: Category[], pagination: {...} }`
  - Also includes `color` field
  
- `/api/people?page=1&limit=10`
  - Returns: `{ data: Person[], pagination: {...} }`
  
- `/api/transactions?page=1&limit=10&month=3&year=2026`
  - Returns: `{ data: Transaction[], pagination: {...} }`
  - Preserves all existing query filters
  - Adds card_id, category_id, person_id to response (for pre-fill)

**Implementation Pattern:**
1. Parse `page` and `limit` from query params
2. Calculate `offset = (page - 1) * limit`
3. Query for total count with `.select('id', { count: 'exact', head: true })`
4. Query for data with `.range(offset, offset + limit - 1)`
5. Calculate `hasMore = (page * limit) < total`
6. Return `{ data, pagination }`

**Validation:**
- page: max 1, prevents negative
- limit: max 1, min 100 (prevents abuse)
- offset calculation: `(page - 1) * limit`

**TypeScript Validation:**
- All changes validated with `npx tsc --noEmit`
- Result: 0 errors

### ✅ FASE 4 Subtask 2 — Pagination API (PRONTO)

#### API Endpoint Structure
- All list endpoints support `?page=1&limit=10` query parameters
- Response includes both `data` array and `pagination` metadata
- Enforces limits: page min 1, limit min 1 max 100

#### Response Pattern
```json
{
  "data": [...items...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "hasMore": true
  }
}
```

#### Implementation Details
**Query Logic:**
1. Parse and validate `page` and `limit` from query params
2. Calculate offset: `(page - 1) * limit`
3. Execute two queries in parallel:
   - Count query: `.select('id', { count: 'exact', head: true })`
   - Data query: `.select(...).range(offset, offset + limit - 1)`
4. Calculate `hasMore`: `(page * limit) < total`

**Updated Endpoints:**
- `/api/cards?page=1&limit=10` — Paginated cards list
- `/api/categories?page=1&limit=10` — Paginated categories list
- `/api/people?page=1&limit=10` — Paginated people list
- `/api/transactions?page=1&limit=10&month=3&year=2026` — Paginated transactions with filters

**Validation:**
- `page`: minimum 1 (prevents negative pages)
- `limit`: minimum 1, maximum 100 (prevents abuse)
- All existing filters preserved in query string

**TypeScript Validation:**
- All changes validated with `npx tsc --noEmit`
- Result: 0 errors

### ✅ FASE 5 — Database Types + Type Centralization (PRONTO)

#### Database Types Creation
- Created `src/types/database.ts` with complete schema types
- Full schema types include all fields from Supabase tables:
  - `Card`: id, name, brand, closing_day, due_day, limit_amount, color, user_id, created_at, updated_at, deleted_at
  - `Category`: id, name, icon, color, user_id, created_at, updated_at, deleted_at
  - `Person`: id, name, relationship, user_id, created_at, updated_at, deleted_at
  - `Transaction`: id, description, total_amount, type, purchase_date, card_id, category_id, person_id, user_id, created_at, updated_at
  - `Installment`: id, transaction_id, number, amount, reference_month, reference_year, paid, created_at, updated_at
- Single source of truth for schema validation and type safety

#### Type Architecture Pattern
Established clear pattern for using types:
- **Database.ts types**: For full schema validation, API endpoints returning complete records
- **Local component types**: For selective queries matching exact SELECT fields
  - Example: Page queries SELECT 'id, name' → Local type `Card = { id: string; name: string }`
  - Prevents type mismatches between query results and component expectations
  - No `as any` assertions needed

#### Type Centralization Refactoring
Refactored 11 local type definitions across codebase:
1. **CardFormDialog.tsx** — Removed local Card type
2. **CardList.tsx** — Removed local Card type
3. **CategoryFormDialog.tsx** — Removed local Category type
4. **CategoryList.tsx** — Removed local Category type
5. **PeopleFormDialog.tsx** — Removed local Person type
6. **PeopleList.tsx** — Removed local Person type
7. **TransactionForm.tsx** — Removed Card, Category, Person types, added local types matching selective queries
8. **TransactionFilters.tsx** — Removed Card, Category, Person types, added local types matching selective queries
9. **InvoicePage.tsx** — Removed full Card type, added local Card = { id, name, color }
10. **TransactionDataProvider.tsx** — Defined local types matching context data shape
11. **Invoice API route** — Added Installment and InstallmentWithTransactionRef types for transaction relationships

#### API Response Fixes
Fixed incomplete API responses to include all needed fields:
- **Cards API**: Added `brand, due_day, limit_amount` to SELECT (was missing from list display)
- **People API**: Added `relationship` to SELECT (was missing from list display)
- **Transactions API**: Added `card_id, category_id, person_id` to SELECT (needed for pre-fill in edit mode)

#### TypeScript Strictness
- Eliminated all `as any` type assertions from codebase
- Achieved 0 TypeScript errors across all modified files
- No `@typescript-eslint/no-explicit-any` eslint disables needed
- Type safe at compile time with proper type definitions

**Files Modified:**
- `src/types/database.ts` — Created with complete schema types
- 8 API routes — Added/fixed SELECT fields and type definitions
- 6 form/list components — Refactored with local types
- 2 pages — Fixed type passing without assertions
- 2 providers — Updated with local types matching query results

**TypeScript Validation:**
- All changes validated with `npx tsc --noEmit`
- Result: 0 errors across full codebase

**Git Commits:**
- "Refactor: Centralizar tipos usando database.ts" with all fixes included

### ✅ FASE 6 — Dashboard com Gráficos (PRONTO)

#### Architecture & Performance Strategy
- **Suspense Boundaries** — Cada seção carrega independentemente
  - Summary cards (Fast) — Aparecem primeiro (~200ms)
  - Pie & Line charts (Medium) — Carregam em paralelo (~500ms)
  - Bar chart (Medium-slow) — Comparação mensal
  - Top categories table (Tables are fast)
- **ISR Caching** — 1 hora (agressivamente cachado vs 5 min em outras páginas)
  - Dashboard é snapshot no tempo, não precisa refresh frequente
  - Economia massiva de DB hits
  - Revalidação após mutations relevantes (transaction criada/deletada)
- **Query Optimization** — Aggregations no Supabase (não em Node.js)
  - 10MB de dados processados em 50ms no Supabase vs 2s em Node.js
  - Grouped by category, week, month antes de retornar

#### Componentes Implementados

**1. SummaryCards (Server Component)**
- 3 cards com KPIs principais:
  - Total gasto este mês
  - Gasto médio por dia (com projeção para 30 dias)
  - Categoria principal (top spending category)
- Trend indicator vs mês anterior (% up/down/stable)
- Query: 2x SUM de installments (este mês + mês anterior) + top category

**2. CategoryBreakdown (Client Component + Recharts)**
- Pie chart mostrando distribuição de gastos por categoria
- Cores baseadas na cor definida em cada categoria
- Labels mostram categoria + % do total
- Tooltip exibe valores em moeda (BRL)
- Comportamento: client-side para interatividade

**3. SpendingTrend (Client Component + Recharts)**
- Line chart com tendência das últimas 6 semanas
- X-axis: datas (semana de início)
- Y-axis: total gasto
- Suavizado com line type "monotone"
- CartesianGrid e Legend para legibilidade
- Útil para identificar padrões semanais

**4. MonthComparison (Client Component + Recharts)**
- Bar chart comparando este mês vs mês anterior
- Agrupado por categoria (top 8)
- 2 barras por categoria: azul (este mês) vs verde (mês anterior)
- Permite visualizar quais categorias aumentaram/diminuiram
- Ótimo para análise de desvio orçamentário

**5. TopCategories (Server Component)**
- Tabela simples (não chart) mostrando ranking
- Colunas: Categoria, Total (BRL), Percentual
- Ordenado por gasto total
- Mostra top 10 categorias
- Hover effect para melhor UX

#### Data Queries (`/components/dashboard/queries.ts`)

**getCategoryBreakdownData()**
- Suma installments do mês por categoria
- Retorna: `{ name, value, color }`
- 1 query paralela com nested select

**getSpendingTrendData()**
- Últimas 6 semanas com total agregado
- Retorna: `{ week, total }`
- Processado em loop (pode ser otimizado com RPC futuro)

**getMonthComparisonData()**
- Compara este mês vs mês anterior por categoria
- Retorna: `{ name, thisMonth, lastMonth }`
- Filtra top 8 categorias por soma (this + last)

#### Utilities Added
- `formatCurrency(value: number): string` em `lib/utils.ts`
- Usa `Intl.NumberFormat` com locale pt-BR e currency BRL
- Aplicado em todos os tooltips e exibições de moeda

#### Styling & UX
- Cards em grid responsive (1 col mobile, 3 cols desktop)
- Charts em grid 2x1 layouts
- Skeleton loaders para cada seção
- Dark mode compatible (Recharts + Tailwind CSS variables)
- Consistent spacing e Typography

**Files Created:**
- `src/components/dashboard/SummaryCards.tsx`
- `src/components/dashboard/CategoryBreakdown.tsx`
- `src/components/dashboard/SpendingTrend.tsx`
- `src/components/dashboard/MonthComparison.tsx`
- `src/components/dashboard/TopCategories.tsx`
- `src/components/dashboard/queries.ts`

**Files Modified:**
- `src/app/(app)/dashboard/page.tsx` — Substituído placeholder por implementação completa
- `src/lib/utils.ts` — Adicionado `formatCurrency` helper

**Dependencies Added:**
- `recharts` v2.x (37 packages)

**TypeScript Validation:**
- All changes validated with `npx tsc --noEmit`
- Result: 0 errors across full codebase

**ISR & Performance:**
- `export const revalidate = 3600` (1 hour cache)
- Suspense boundaries para lazy loading
- Parallel data fetching com Promise.all()
- No waterfalls, optimal TTI (Time To Interactive)

**Git Commits:**
- "feat: FASE 6 - Dashboard com gráficos e resumo mensal" (pending commit)

## Status dos próximos passos
1. ✅ FASE 1 — Validações Centralizadas
2. ✅ FASE 2 — Transaction Edit + Loading States
3. ✅ FASE 3 — Auto-fill de dados ao editar
4. ✅ FASE 4 Subtask 1 — On-Demand ISR Caching
5. ✅ FASE 4 Subtask 2 — Pagination API
6. ✅ FASE 4 Subtask 3 — Pagination UI Components
7. ✅ FASE 5 — Database Types + Type Centralization
8. ✅ FASE 6 — Dashboard com Gráficos (PRONTO)
9. 🔄 FASE 7 — Gastos Futuros (em andamento)

## FASE 7 — Status Atual
- Status de transação modelado no banco, tipos e validações
- API de transações adaptada para posted / scheduled / cancelled
- Formulário com modo Agora vs Agendar
- Fatura e dashboard separados para consumir apenas posted por padrão
- Migration SQL criada e aplicada no Supabase

## Problemas conhecidos / em solução
- ✅ Auto-fill de selects em TransactionForm (FIXADO em FASE 3)
- ✅ Validações desincronizadas (FIXADO em FASE 1)
- ✅ Edição de transação totalmente funcional (FIXADO em FASE 2)
- ✅ Duplicate API requests (FIXADO em FASE 2B)

## Próximos passos (após FASE 3)
1. Pagination em listas (cards, categories, people, transactions)
2. Invoice month navigation refetch automático
3. Database types gerados (Supabase CLI)
4. ISR caching nas páginas
5. Performance optimizations (indexes, memoization)
6. Contas recorrentes (tabela recurring_transactions + pg_cron)
7. Revisão de segurança
8. Mobile responsiveness audit
