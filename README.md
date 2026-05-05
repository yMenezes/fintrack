<div align="center">

# Finance Control

**EN** | [PT-BR](#pt-br)

> A personal finance web application to track credit card expenses, installments, recurring bills, and spending by person.

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
- 🔁 **Recurring transactions** — set up monthly bills (rent, subscriptions, etc.) and transactions are created automatically on each due date
- 📅 **Scheduled transactions** — register future expenses in advance; they are published automatically when the date arrives
- 🗂️ **Categories** — create custom categories with icon and color
- 👥 **Spending by person** — tag expenses to a specific person (e.g. a family member using your card) and see how much they owe you
- 📊 **Dashboard with charts** — monthly overview with spending trends, category breakdown and month-over-month comparison
- 🧾 **Monthly invoice view** — browse each card's invoice by month, mark installments as paid
- 🔐 **Authentication** — secure login via Supabase Auth (email/password and OAuth)
- 🌙 **Dark mode** — fully supported

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Framework | [Next.js 14](https://nextjs.org/) (App Router) | Full-stack in one project, Server Components, API Routes |
| Language | [TypeScript](https://www.typescriptlang.org/) | Type safety, better DX, required in serious projects |
| Styling | [Tailwind CSS](https://tailwindcss.com/) | Utility-first, fast to build, easy to maintain |
| Components | [shadcn/ui](https://ui.shadcn.com/) | Accessible, unstyled-by-default, copy-paste components |
| Charts | [Recharts](https://recharts.org/) | Composable chart library built on React |
| Database | [Supabase](https://supabase.com/) (PostgreSQL) | Free tier, built-in auth, Row Level Security |
| Auth | [Supabase Auth](https://supabase.com/docs/guides/auth) | JWT sessions, OAuth providers, SSR-ready |
| Deploy | [Vercel](https://vercel.com/) | Zero-config deploy for Next.js, free for personal projects |
| Forms | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) | Performant forms with schema validation |

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
2. Go to **SQL Editor** and run the full schema file:

```
docs/database/schema.sql
```

This creates all tables, indexes, and RLS policies in one step.

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
│   │   │   ├── layout.tsx              # Sidebar + Navbar + TransactionProcessor
│   │   │   ├── dashboard/page.tsx      # Charts and monthly summary
│   │   │   ├── transactions/page.tsx   # Expense list with filters
│   │   │   ├── invoices/page.tsx       # Monthly invoice per card
│   │   │   ├── recurring/page.tsx      # Recurring bills management
│   │   │   ├── cards/page.tsx          # Card management
│   │   │   ├── categories/page.tsx     # Category management
│   │   │   └── people/page.tsx         # People management
│   │   ├── api/                        # API Routes (backend)
│   │   │   ├── transactions/
│   │   │   │   ├── route.ts            # GET (list), POST (create)
│   │   │   │   └── [id]/route.ts       # PATCH, DELETE
│   │   │   ├── recurring-transactions/
│   │   │   │   ├── route.ts            # GET (list), POST (create)
│   │   │   │   └── [id]/route.ts       # PATCH, DELETE
│   │   │   ├── process-transactions/
│   │   │   │   └── route.ts            # POST — auto-processes recurring and scheduled
│   │   │   ├── invoices/[cardId]/[year]/[month]/route.ts
│   │   │   ├── installments/[id]/route.ts
│   │   │   ├── cards/
│   │   │   ├── categories/
│   │   │   └── people/
│   │   ├── layout.tsx                  # Root layout (theme provider)
│   │   └── page.tsx                    # Root — redirects to /dashboard
│   ├── components/
│   │   ├── ui/                         # shadcn/ui base components
│   │   ├── transactions/               # TransactionForm, TransactionList, TransactionPanel
│   │   ├── recurring/                  # RecurringFormDialog, RecurringList
│   │   ├── invoices/                   # InvoicePage, InstallmentRow
│   │   ├── dashboard/                  # SummaryCards, CategoryBreakdown, charts
│   │   ├── layout/                     # Sidebar, Navbar
│   │   └── TransactionProcessor.tsx    # Silent client component — triggers auto-processing on load
│   ├── providers/
│   │   ├── TransactionDataProvider.tsx # Context: cards, categories, people for forms
│   │   └── TransactionPanelProvider.tsx# Context: sliding panel open/close state
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts               # Browser Supabase client
│   │   │   └── server.ts               # Server Supabase client (API Routes + Server Components)
│   │   ├── installments.ts             # Core logic: generate installment rows from a purchase
│   │   ├── validations.ts              # Zod schemas for all entities
│   │   └── utils.ts                    # Currency formatting, cn() helper
│   └── types/
│       └── database.ts                 # TypeScript types matching the Supabase schema
├── docs/
│   ├── database/
│   │   └── schema.sql                  # Full DB schema with indexes and RLS policies
│   ├── ARCHITECTURE.md                 # Deep-dive into every technical decision
│   ├── CONTEXT.md                      # Development log and phase history
│   └── CONTRIBUTING.md                 # Code standards and workflow
├── middleware.ts                       # Auth guard — redirects unauthenticated users
└── .env.local                          # Environment variables (not committed)
```

---

## Database Schema

See the full schema with RLS policies in [`docs/database/schema.sql`](docs/database/schema.sql).

```
users ──< cards
users ──< categories
users ──< people
users ──< recurring_transactions
users ──< transactions >── cards
                       >── categories
                       >── people
                       >── recurring_transactions  ← origin reference
transactions ──< installments
```

**Key design decisions:**

- A purchase creates one `transaction` row and N `installment` rows (one per month). To get "what's on my March invoice" you just filter installments by `reference_month` and `reference_year`.
- `recurring_transactions` store the template (description, amount, day of month). Each execution creates a real `transaction` linked back by `recurring_transaction_id`.
- `transactions.status` can be `posted` (real, has installments), `scheduled` (future, no installments yet) or `cancelled`.

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

### Recurring transactions

A `recurring_transaction` is a template. Every time the user opens the app, `TransactionProcessor` silently calls `POST /api/process-transactions`, which:

1. Finds all recurring rules with `next_run_date <= today`
2. Creates one `transaction` per pending month (catching up if the app wasn't opened for a while)
3. Generates installments for each
4. Advances `next_run_date` to the next future occurrence

### Scheduled transactions

A transaction with `status = 'scheduled'` has no installments yet. The same automatic processing converts it to `posted` and generates installments when `scheduled_for <= today`.

### Row Level Security (RLS)

Every table has RLS enabled. Users can only read and write their own data — enforced at the database level, not just in application code. Even if there's a bug in the API, no user can access another user's data.

---

## Roadmap

- [x] Authentication (email/password, OAuth)
- [x] Card management (CRUD + soft delete)
- [x] Category management (CRUD + emoji + color)
- [x] People management (CRUD)
- [x] Transaction launch with automatic installment generation
- [x] Monthly invoice view with per-card tabs
- [x] Mark installments as paid
- [x] Dashboard with charts (spending trends, category breakdown, month comparison)
- [x] Scheduled / future transactions
- [x] Recurring transactions with automatic processing
- [ ] CSV export
- [ ] Spending by person report page
- [ ] Email reminders (Resend)

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

> Aplicação web de finanças pessoais para controlar gastos no cartão de crédito, parcelamentos, contas recorrentes e despesas por pessoa.

## Funcionalidades

- 💳 **Gestão de cartões** — cadastre cartões com dia de fechamento, vencimento e limite
- 📦 **Controle de parcelas** — lance uma compra em N vezes e o app distribui cada parcela nos meses corretos automaticamente
- 🔁 **Transações recorrentes** — configure contas mensais fixas (aluguel, assinaturas) e as transações são criadas automaticamente a cada vencimento
- 📅 **Transações agendadas** — registre despesas futuras com antecedência; elas são publicadas automaticamente quando a data chega
- 🗂️ **Categorias** — crie categorias personalizadas com ícone e cor
- 👥 **Gastos por pessoa** — vincule despesas a uma pessoa específica (ex: familiar usando seu cartão) e veja quanto ela te deve
- 📊 **Dashboard com gráficos** — visão mensal com tendências de gasto, breakdown por categoria e comparativo mês a mês
- 🧾 **Fatura mensal** — navegue pela fatura de cada cartão por mês e marque parcelas como pagas
- 🔐 **Autenticação** — login seguro via Supabase Auth (email/senha e OAuth)
- 🌙 **Modo escuro** — suporte completo

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
| Componentes | shadcn/ui | Acessíveis, customizáveis, sem dependência de estilo externo |
| Gráficos | Recharts | Biblioteca de charts composável para React |
| Banco de dados | Supabase (PostgreSQL) | Free tier generoso, auth integrado, RLS nativo |
| Deploy | Vercel | Deploy zero-config para Next.js, gratuito para projetos pessoais |

## Conceitos importantes

### Server Components vs Client Components

No Next.js 14 com App Router, componentes são **Server Components por padrão** — rodam no servidor, buscam dados direto no banco e enviam HTML pronto ao browser. Adicione `'use client'` apenas quando precisar de interatividade (useState, useEffect, eventos de clique).

### Geração de parcelas

Uma compra parcelada cria **uma linha** em `transactions` e **N linhas** em `installments`. Para buscar "o que está na fatura de março", basta filtrar `installments` por `reference_month = 3`. Simples e eficiente.

### Processamento automático

`TransactionProcessor` é um componente invisível montado no layout. Ao abrir o app, ele chama `POST /api/process-transactions` uma vez por dia, que verifica recorrentes vencidos e agendadas cujo prazo chegou — criando as transações e parcelas automaticamente.

### Row Level Security (RLS)

Cada tabela tem RLS ativado no banco. As regras de acesso ficam no PostgreSQL, não apenas no código — mesmo que haja um bug na API, nenhum usuário consegue ler dados de outro.
