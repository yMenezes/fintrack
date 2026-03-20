-- ============================================================
-- FinTrack — Database Schema
-- Run this file in the Supabase SQL Editor to set up the DB.
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- EXTENSIONS
-- ──────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";


-- ──────────────────────────────────────────────────────────────
-- CARDS
-- Stores the user's credit cards.
-- closing_day : day of month when the invoice closes (1–31)
-- due_day     : day of month when payment is due (1–31)
-- ──────────────────────────────────────────────────────────────
create table public.cards (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  name          text not null,                  -- e.g. "Nubank", "Itaú Visa"
  brand         text,                           -- e.g. "Visa", "Mastercard"
  closing_day   int  not null check (closing_day between 1 and 31),
  due_day       int  not null check (due_day between 1 and 31),
  limit_amount  numeric(12, 2),
  color         text default '#6366f1',         -- hex color for UI
  created_at    timestamptz default now()
);

-- ──────────────────────────────────────────────────────────────
-- CATEGORIES
-- User-defined spending categories (e.g. Food, Health, Travel).
-- ──────────────────────────────────────────────────────────────
create table public.categories (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  icon       text default '📦',                -- emoji or icon name
  color      text default '#6366f1',
  created_at timestamptz default now()
);

-- ──────────────────────────────────────────────────────────────
-- PEOPLE
-- People who spend on the user's card (e.g. family members).
-- Used to track "how much does person X owe me".
-- ──────────────────────────────────────────────────────────────
create table public.people (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  name         text not null,
  relationship text,                            -- e.g. "Mãe", "Pai", "Amigo"
  created_at   timestamptz default now()
);

-- ──────────────────────────────────────────────────────────────
-- TRANSACTIONS
-- One row per purchase. Installment info lives here (count, total).
-- The actual monthly breakdown is in the installments table.
--
-- type: 'credit' | 'debit' | 'pix' | 'cash'
-- ──────────────────────────────────────────────────────────────
create table public.transactions (
  id                 uuid primary key default uuid_generate_v4(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  card_id            uuid references public.cards(id) on delete set null,
  category_id        uuid references public.categories(id) on delete set null,
  person_id          uuid references public.people(id) on delete set null,
  description        text not null,
  total_amount       numeric(12, 2) not null check (total_amount > 0),
  installments_count int  not null default 1 check (installments_count >= 1),
  purchase_date      date not null default current_date,
  type               text not null default 'credit',
  notes              text,
  created_at         timestamptz default now()
);

-- ──────────────────────────────────────────────────────────────
-- INSTALLMENTS
-- One row per month per transaction.
-- Example: a 5x purchase generates 5 rows here, one per month.
--
-- reference_month : 1–12
-- reference_year  : e.g. 2025
-- paid            : manually marked by the user
-- ──────────────────────────────────────────────────────────────
create table public.installments (
  id               uuid primary key default uuid_generate_v4(),
  transaction_id   uuid not null references public.transactions(id) on delete cascade,
  number           int  not null,               -- e.g. 1 of 5, 2 of 5 ...
  amount           numeric(12, 2) not null,
  reference_month  int  not null check (reference_month between 1 and 12),
  reference_year   int  not null,
  paid             boolean not null default false,
  created_at       timestamptz default now(),

  unique (transaction_id, number)
);


-- ──────────────────────────────────────────────────────────────
-- INDEXES
-- Speed up the most common queries.
-- ──────────────────────────────────────────────────────────────

-- Get all cards for a user
create index idx_cards_user_id on public.cards(user_id);

-- Get all transactions for a user
create index idx_transactions_user_id on public.transactions(user_id);

-- Get installments by month/year (used in invoice view)
create index idx_installments_month_year
  on public.installments(reference_month, reference_year);

-- Get installments by transaction (used when deleting a transaction)
create index idx_installments_transaction_id
  on public.installments(transaction_id);

-- Get transactions by person (used in "people" report)
create index idx_transactions_person_id on public.transactions(person_id);

-- Get transactions by card
create index idx_transactions_card_id on public.transactions(card_id);


-- ──────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY (RLS)
-- Each user can only access their own data.
-- This is enforced at the database level — independent of app code.
-- ──────────────────────────────────────────────────────────────

alter table public.cards        enable row level security;
alter table public.categories   enable row level security;
alter table public.people       enable row level security;
alter table public.transactions enable row level security;
alter table public.installments enable row level security;

-- CARDS policies
create policy "Users can view their own cards"
  on public.cards for select
  using (auth.uid() = user_id);

create policy "Users can insert their own cards"
  on public.cards for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own cards"
  on public.cards for update
  using (auth.uid() = user_id);

create policy "Users can delete their own cards"
  on public.cards for delete
  using (auth.uid() = user_id);

-- CATEGORIES policies
create policy "Users can view their own categories"
  on public.categories for select
  using (auth.uid() = user_id);

create policy "Users can insert their own categories"
  on public.categories for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own categories"
  on public.categories for update
  using (auth.uid() = user_id);

create policy "Users can delete their own categories"
  on public.categories for delete
  using (auth.uid() = user_id);

-- PEOPLE policies
create policy "Users can view their own people"
  on public.people for select
  using (auth.uid() = user_id);

create policy "Users can insert their own people"
  on public.people for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own people"
  on public.people for update
  using (auth.uid() = user_id);

create policy "Users can delete their own people"
  on public.people for delete
  using (auth.uid() = user_id);

-- TRANSACTIONS policies
create policy "Users can view their own transactions"
  on public.transactions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own transactions"
  on public.transactions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own transactions"
  on public.transactions for update
  using (auth.uid() = user_id);

create policy "Users can delete their own transactions"
  on public.transactions for delete
  using (auth.uid() = user_id);

-- INSTALLMENTS policies
-- Installments don't have user_id directly — access is granted
-- through ownership of the parent transaction.
create policy "Users can view installments of their own transactions"
  on public.installments for select
  using (
    exists (
      select 1 from public.transactions t
      where t.id = transaction_id
        and t.user_id = auth.uid()
    )
  );

create policy "Users can insert installments for their own transactions"
  on public.installments for insert
  with check (
    exists (
      select 1 from public.transactions t
      where t.id = transaction_id
        and t.user_id = auth.uid()
    )
  );

create policy "Users can update installments of their own transactions"
  on public.installments for update
  using (
    exists (
      select 1 from public.transactions t
      where t.id = transaction_id
        and t.user_id = auth.uid()
    )
  );

create policy "Users can delete installments of their own transactions"
  on public.installments for delete
  using (
    exists (
      select 1 from public.transactions t
      where t.id = transaction_id
        and t.user_id = auth.uid()
    )
  );


-- ──────────────────────────────────────────────────────────────
-- SEED DATA (optional — for local development)
-- Uncomment to insert sample data after creating a user.
-- ──────────────────────────────────────────────────────────────

-- insert into public.cards (user_id, name, brand, closing_day, due_day, color)
-- values
--   ('<your-user-uuid>', 'Nubank',     'Mastercard', 3,  10, '#820ad1'),
--   ('<your-user-uuid>', 'Itaú Visa',  'Visa',       15, 22, '#003d82');

-- insert into public.categories (user_id, name, icon, color)
-- values
--   ('<your-user-uuid>', 'Alimentação',  '🍔', '#f97316'),
--   ('<your-user-uuid>', 'Saúde',        '💊', '#22c55e'),
--   ('<your-user-uuid>', 'Transporte',   '🚗', '#3b82f6'),
--   ('<your-user-uuid>', 'Lazer',        '🎮', '#a855f7'),
--   ('<your-user-uuid>', 'Outros',       '📦', '#6b7280');
