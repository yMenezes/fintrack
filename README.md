<div align="center">

# Finance Control

**EN** | [PT-BR](#pt-br)

> A personal finance web application to track credit card expenses, installments, income, recurring bills, bill payments/receivables, and spending by person.

![Next.js](https://img.shields.io/badge/Next.js_14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-black?style=for-the-badge&logo=vercel)

[Features](#features) · [Tech Stack](#tech-stack) · [Getting Started](#getting-started) · [Project Structure](#project-structure) · [Database Schema](#database-schema) · [Contributing](#contributing)

---

</div>

## Features

- 💳 **Credit card management** — register cards with closing day, due date and spending limit
- 📦 **Installment tracking** — add a purchase in N installments and the app distributes each parcel across the correct invoice months automatically
- 💰 **Income tracking** — register income from multiple sources (salary, freelance, investments, gifts), with categories, persons, and its own scheduled/received lifecycle
- 🔁 **Recurring transactions & recurring income** — set up monthly bills (rent, subscriptions) and recurring income (salary, retainer clients) — both are created automatically on each due date
- 📅 **Scheduled transactions** — register future expenses in advance; they are published automatically when the date arrives
- 🧮 **Contas — bill & receivable assistant** — a Nubank-style tracker for what you need to pay and what you're expecting to receive: register a bill or expected income, mark it paid/received with one click, and see "to pay / already paid / to receive / already received" at a glance, including overdue amounts
- 🤝 **Debt-by-person ledger** — tag a purchase to a person (e.g. a family member using your card) and get a dedicated page per person showing exactly how much they owe, broken down by invoice month, with an overdue flag and a reimbursed/pending toggle — independent from your own card-bill-paid status
- ⚡ **Inline quick-create** — while filling out any transaction/income/recurring form, create a missing card, category or person without leaving the form or losing what you've typed
- 🗂️ **Categories** — create custom categories with icon and color
- 📊 **Dashboard with charts** — monthly overview with spending trends, category breakdown, cash flow, and a bills summary card
- 🧾 **Monthly invoice view** — browse each card's invoice by month, mark installments as paid
- 📅 **Advanced period selection** — view data by month, quarter, year, or custom date ranges
- 🔐 **Authentication** — secure login via Supabase Auth (email/password and OAuth)
- 📲 **Installable PWA** — add it to your phone's home screen and use it like a native app (no app store needed)
- 🌙 **Dark mode** — fully supported
- 📱 **Fully responsive** — optimized for mobile, tablet and desktop

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Framework | [Next.js 14](https://nextjs.org/) (App Router) | Full-stack in one project, Server Components, API Routes |
| Language | [TypeScript](https://www.typescriptlang.org/) | Type safety, better DX, required in serious projects |
| Styling | [Tailwind CSS](https://tailwindcss.com/) | Utility-first, fast to build, easy to maintain |
| Components | [shadcn/ui](https://ui.shadcn.com/) (Radix UI) | Accessible, unstyled-by-default, copy-paste components |
| Charts | [Recharts](https://recharts.org/) | Composable chart library built on React |
| Database | [Supabase](https://supabase.com/) (PostgreSQL) | Free tier, built-in auth, Row Level Security |
| Auth | [Supabase Auth](https://supabase.com/docs/guides/auth) | JWT sessions, OAuth providers, SSR-ready |
| Deploy | [Vercel](https://vercel.com/) | Zero-config deploy for Next.js, free for personal projects |
| Forms | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) | Performant forms with schema validation |
| Ops | [Supabase CLI](https://supabase.com/docs/guides/cli) | `supabase db dump` to keep the schema documented and to compare against `src/types/database.ts` |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- A free [Supabase](https://supabase.com/) account

### 1. Clone the repository

```bash
git clone https://github.com/your-username/FinanceControl.git
cd FinanceControl
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com/)
2. Go to **SQL Editor** and run the full schema file: `docs/database/schema.sql`

This creates all tables, indexes, constraints and RLS policies in one step.

> `docs/database/schema.sql` is intentionally not committed to this repo (see `.gitignore`) — generate it yourself once your project is linked:
> ```bash
> npx supabase login
> npx supabase link --project-ref <your-project-ref>
> npx supabase db dump --schema public -f docs/database/schema.sql
> ```
> This requires Docker Desktop running locally (the CLI uses it to pull a matching `pg_dump` version).

### 4. Configure environment variables

Create a `.env.local` file at the root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Both values are available in your Supabase project under **Settings → API**.

> Never commit `.env.local` to version control — it's already in `.gitignore`.

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you should see the login page.

---

## Project Structure

```
FinanceControl/
├── src/
│   ├── app/                            # Next.js App Router
│   │   ├── (auth)/                     # Route group — no sidebar layout
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (app)/                      # Route group — authenticated layout
│   │   │   ├── layout.tsx              # Sidebar + Navbar + fetches cards/categories/people once, server-side
│   │   │   ├── dashboard/page.tsx      # Charts, cash flow, bills summary, monthly summary
│   │   │   ├── transactions/page.tsx   # Expense and income tracking with tabs
│   │   │   ├── contas/page.tsx         # Bill & receivable assistant (Pendentes/Concluídas)
│   │   │   ├── invoices/page.tsx       # Monthly invoice per card
│   │   │   ├── recurring/page.tsx      # Recurring bills + recurring income (tabs)
│   │   │   ├── cards/page.tsx          # Card management
│   │   │   ├── categories/page.tsx     # Category management
│   │   │   └── people/
│   │   │       ├── page.tsx            # People management
│   │   │       └── [id]/page.tsx       # Per-person debt ledger (reimbursement tracking)
│   │   ├── api/                        # API Routes (backend)
│   │   │   ├── transactions/
│   │   │   │   └── [id]/pay/           # Mark a scheduled/posted bill as paid in one call
│   │   │   ├── income/                 # Income endpoints (with scheduled/received lifecycle)
│   │   │   ├── contas/                 # Unified pending/done bills+income list
│   │   │   ├── invoices/
│   │   │   ├── recurring-transactions/
│   │   │   ├── recurring-income/
│   │   │   ├── process-transactions/   # Auto-processes recurring and scheduled entries
│   │   │   ├── people/
│   │   │   │   └── [id]/ledger/        # Per-person installment ledger
│   │   │   ├── installments/
│   │   │   ├── cards/
│   │   │   └── categories/
│   │   ├── manifest.ts                 # PWA manifest (installable app)
│   │   ├── apple-icon.tsx              # iOS home-screen icon (generated with next/og)
│   │   ├── icon-192/ · icon-512/       # Android manifest icons (generated with next/og)
│   │   ├── not-found.tsx               # Custom branded 404 page
│   │   ├── layout.tsx                  # Root layout (theme provider, PWA metadata)
│   │   └── page.tsx                    # Root — redirects to /dashboard
│   ├── components/
│   │   ├── ui/                         # shadcn/ui base components (+ PaidCheckbox)
│   │   ├── transactions/               # Transaction list, form (with quick-create)
│   │   ├── income/                     # Income list and forms (scheduled/received toggle)
│   │   ├── invoices/                   # Invoice view and installments
│   │   ├── recurring/                  # Recurring transactions + tabs
│   │   ├── recurring-income/           # Recurring income list/form
│   │   ├── contas/                     # Bill assistant tabs/list/row
│   │   ├── people/                     # People list + per-person ledger tabs/list/row
│   │   ├── dashboard/                  # Dashboard charts and metrics (incl. BillsSummaryCard)
│   │   ├── layout/                     # Sidebar and Navbar
│   │   └── TransactionProcessor.tsx    # Auto-processes recurring/scheduled transactions
│   ├── providers/
│   │   ├── TransactionDataProvider.tsx # Context: cards, categories, people (populated server-side)
│   │   └── TransactionPanelProvider.tsx# Context: sliding panel open/close state
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts               # Browser Supabase client
│   │   │   └── server.ts               # Server Supabase client (API Routes + Server Components)
│   │   ├── installments.ts             # Core logic: generate installment rows from a purchase
│   │   ├── person-ledger.ts            # Debt-by-person aggregate query
│   │   ├── validations.ts              # Zod schemas for all entities
│   │   └── utils.ts                    # Currency formatting, cn() helper
│   └── types/
│       └── database.ts                 # TypeScript types matching the real Supabase schema
├── supabase/                           # Supabase CLI config (project link, no secrets committed)
├── docs/                               # Not committed — see docs/CONTRIBUTING.md for how to regenerate
│   ├── database/
│   │   └── schema.sql                  # Full DB schema, generated via `supabase db dump`
│   ├── ARCHITECTURE.md                 # Deep-dive into every technical decision
│   ├── CONTEXT.md                      # Development log and phase history
│   └── CONTRIBUTING.md                 # Code standards and workflow
├── middleware.ts                       # Auth guard — redirects unauthenticated users
└── .env.local                          # Environment variables (not committed)
```

---

## Database Schema

Full schema with RLS policies lives in `docs/database/schema.sql` (generated from the live database via the Supabase CLI — see [Getting Started](#3-set-up-supabase); the file itself isn't committed).

```
users ──< cards
users ──< categories
users ──< people
users ──< recurring_transactions
users ──< recurring_income
users ──< income ──> categories, people, recurring_income
users ──< transactions >── cards
                       >── categories
                       >── people
                       >── recurring_transactions  ← origin reference
transactions ──< installments
```

8 tables total: `cards`, `categories`, `people`, `transactions`, `installments`, `income`, `recurring_transactions`, `recurring_income`.

**Key design decisions:**

- A purchase creates one `transaction` row and N `installment` rows (one per month). To get "what's on my March invoice" you just filter installments by `reference_month` and `reference_year`.
- `recurring_transactions` / `recurring_income` store the template (description, amount, day of month). Each execution creates a real `transaction`/`income` row linked back by its `_id` reference.
- `transactions.status` can be `posted` (real, has installments), `scheduled` (future, no installments yet) or `cancelled`. `income.status` is either `scheduled` or `received`.
- **`paid` vs `reimbursed`** on `installments` are two independent booleans: `paid` means "I paid my card issuer" (used by the Invoices page); `reimbursed` means "the person I tagged on this purchase paid me back" (used by the per-person debt ledger). A purchase can be paid to the bank and still pending reimbursement from a third party at the same time.

---

## Key Concepts

### Installment generation

When you add an expense with 5 installments starting in January:

```
transaction: { description: "iPhone case", total: 495.00, installments_count: 5 }

installments auto-generated:
  { number: 1, amount: 99.00, reference_month: 1, reference_year: 2025 }
  { number: 2, amount: 99.00, reference_month: 2, reference_year: 2025 }
  { number: 3, amount: 99.00, reference_month: 3, reference_year: 2025 }
  { number: 4, amount: 99.00, reference_month: 4, reference_year: 2025 }
  { number: 5, amount: 99.00, reference_month: 5, reference_year: 2025 }
```

### Invoice closing day logic

Each card has a `closing_day`. If the closing day is the 5th and you buy on March 3rd, the expense goes to the **March invoice** (still open). If you buy on March 6th, it goes to **April's invoice** (March already closed).

### Recurring transactions & recurring income

A `recurring_transaction`/`recurring_income` row is a template. Every time the user opens the app, `TransactionProcessor` silently calls `POST /api/process-transactions`, which:

1. Finds all recurring rules with `next_run_date <= today`
2. Creates one `transaction`/`income` row per pending month (catching up if the app wasn't opened for a while)
3. Generates installments for each new transaction
4. Advances `next_run_date` to the next future occurrence

### Scheduled transactions & income

A transaction with `status = 'scheduled'` has no installments yet; an income row with `status = 'scheduled'` hasn't been received yet. The same automatic processing converts scheduled transactions to `posted` (generating installments) once `scheduled_for <= today`. Scheduled income is **not** auto-converted — the whole point of "Contas" is that only the user marks it received.

### Contas — the bill & receivable assistant

`/contas` lists everything that's `scheduled` (expense or income) or `posted`-but-unpaid, restricted to single-installment bills (`installments_count = 1` — parceled credit purchases stay in the Invoices page, which already tracks them per card/month). Marking a scheduled bill "paid" (`PATCH /api/transactions/[id]/pay`) posts it and pays its installment in one call. The dashboard's "Contas" card shows outstanding totals plus what's already settled this month.

### Debt-by-person ledger

Tagging a purchase with a `person_id` doesn't just label it — visiting `/people/[id]` sums every installment tied to that person across all cards, split into "Pendentes" (with an overdue flag for invoice months already in the past) and "Reembolsadas". This is deliberately separate from `installments.paid`: you can have already paid your card issuer while a family member still owes you.

### Row Level Security (RLS)

Every table has RLS enabled. Users can only read and write their own data — enforced at the database level, not just in application code. Even if there's a bug in the API, no user can access another user's data.

---

## Roadmap

- [x] Authentication (email/password, OAuth)
- [x] Card, category and people management (CRUD + soft delete)
- [x] Transaction launch with automatic installment generation
- [x] Monthly invoice view with per-card tabs, mark installments as paid
- [x] Dashboard with charts (spending trends, category breakdown, cash flow, month comparison)
- [x] Scheduled / future transactions, published automatically
- [x] Recurring transactions with automatic processing
- [x] Income tracking, with its own scheduled/received lifecycle and recurring income
- [x] Contas — unified bill & receivable assistant with dashboard summary
- [x] Debt-by-person ledger (reimbursement tracking, separate from card-bill-paid)
- [x] Inline quick-create for card/category/person from any form
- [x] Installable PWA (home-screen icon, standalone display)
- [x] Custom branded 404 page
- [ ] Overdue-bill notifications (no cron/push infra yet — client only checks once a day)
- [ ] CSV export
- [ ] Security review pass

---

## Contributing

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for code standards and workflow.

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

<div align="center" id="pt-br">

---

# Finance Control — Documentação em Português

</div>

> Aplicação web de finanças pessoais para controlar gastos no cartão de crédito, parcelamentos, receitas, contas recorrentes, contas a pagar/receber e despesas por pessoa.

## Funcionalidades

- 💳 **Gestão de cartões** — cadastre cartões com dia de fechamento, vencimento e limite
- 📦 **Controle de parcelas** — lance uma compra em N vezes e o app distribui cada parcela nos meses corretos automaticamente
- 💰 **Registro de entradas** — receitas de várias fontes (salário, freela, investimentos, presentes), com categorias, pessoas e ciclo próprio de agendado/recebido
- 🔁 **Transações e receitas recorrentes** — configure contas mensais fixas e receitas recorrentes (salário, cliente fixo) — ambas geradas automaticamente a cada vencimento
- 📅 **Transações agendadas** — registre despesas futuras com antecedência; publicadas automaticamente quando a data chega
- 🧮 **Contas — assistente de pagamento** — no estilo Nubank: registre uma conta a pagar ou receita esperada, marque como paga/recebida com um clique, e veja "a pagar / já pago / a receber / já recebido" de forma consolidada, incluindo o que está vencido
- 🤝 **Extrato de dívida por pessoa** — marque uma compra como sendo de outra pessoa (ex: um familiar que usa seu cartão) e veja, numa página dedicada, exatamente quanto ela deve, mês a mês, com aviso de atraso e status de reembolso independente do pagamento da sua fatura
- ⚡ **Cadastro rápido nos formulários** — ao preencher um lançamento, cadastre um cartão/categoria/pessoa que falta sem sair do formulário nem perder o que já digitou
- 🗂️ **Categorias** — crie categorias personalizadas com ícone e cor
- 📊 **Dashboard com gráficos** — visão mensal com tendências de gasto, breakdown por categoria, fluxo de caixa e card de contas
- 🧾 **Fatura mensal** — navegue pela fatura de cada cartão por mês e marque parcelas como pagas
- 📅 **Seletor avançado de período** — visualize dados por mês, trimestre, ano ou intervalo customizado
- 🔐 **Autenticação** — login seguro via Supabase Auth (email/senha e OAuth)
- 📲 **Instalável como PWA** — adicione à tela inicial do celular e use como um app nativo
- 🌙 **Modo escuro** — suporte completo
- 📱 **Responsivo** — otimizado para mobile, tablet e desktop

## Como rodar localmente

### Pré-requisitos

- Node.js 18+
- npm
- Uma conta gratuita no [Supabase](https://supabase.com/)

### Passo a passo

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/FinanceControl.git
cd FinanceControl

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
# Crie um arquivo .env.local na raiz com:
# NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key

# 4. Crie o banco de dados
# Acesse o SQL Editor do Supabase e execute: docs/database/schema.sql
# (esse arquivo não vem no repo — gere com `npx supabase db dump --schema public -f docs/database/schema.sql`
# depois de rodar `npx supabase login` e `npx supabase link --project-ref <seu-ref>`)

# 5. Inicie o servidor de desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Stack utilizada

| Camada | Tecnologia | Por quê |
|---|---|---|
| Framework | Next.js 14 (App Router) | Full-stack em um projeto, Server Components, API Routes |
| Linguagem | TypeScript | Tipagem estática, melhor DX |
| Estilização | Tailwind CSS | Utilitários, rápido de construir e manter |
| Componentes | shadcn/ui (Radix UI) | Acessíveis, customizáveis, sem dependência de estilo externo |
| Gráficos | Recharts | Biblioteca de charts composável para React |
| Banco de dados | Supabase (PostgreSQL) | Free tier generoso, auth integrado, RLS nativo |
| Deploy | Vercel | Deploy zero-config para Next.js, gratuito para projetos pessoais |
| Ops | Supabase CLI | `supabase db dump` pra manter o schema documentado e comparar com `src/types/database.ts` |

## Conceitos importantes

### Server Components vs Client Components

No Next.js 14 com App Router, componentes são **Server Components por padrão** — rodam no servidor, buscam dados direto no banco e enviam HTML pronto ao browser. Adicione `'use client'` apenas quando precisar de interatividade (useState, useEffect, eventos de clique).

### Geração de parcelas

Uma compra parcelada cria **uma linha** em `transactions` e **N linhas** em `installments`. Para buscar "o que está na fatura de março", basta filtrar `installments` por `reference_month = 3`.

### `paid` vs `reimbursed` — dois conceitos separados

`installments.paid` significa "eu paguei essa parcela pro banco" (usado na tela de Faturas). `installments.reimbursed` significa "a pessoa vinculada a essa compra me pagou de volta" (usado no extrato por pessoa). Uma parcela pode estar paga ao banco e ainda pendente de reembolso ao mesmo tempo — são estados independentes.

### Processamento automático

`TransactionProcessor` é um componente invisível montado no layout. Ao abrir o app, ele chama `POST /api/process-transactions` uma vez por dia, que verifica recorrentes vencidos e agendadas cujo prazo chegou — criando as transações/receitas e parcelas automaticamente. Receita agendada (`income.status = 'scheduled'`) **não** é convertida automaticamente — só o usuário marca como recebida, de propósito.

### Row Level Security (RLS)

Cada tabela tem RLS ativado no banco. As regras de acesso ficam no PostgreSQL, não apenas no código — mesmo que haja um bug na API, nenhum usuário consegue ler dados de outro.
