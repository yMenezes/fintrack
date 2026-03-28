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

### ✅ FASE 2 — Transaction Edit (PRONTO)
- **TransactionPanelProvider.tsx** agora rastreia modo (create/edit)
  - `open(transaction?: Transaction)` detecta se é create ou edit
  - Transaction type agora inclui card_id, category_id, person_id
- **TransactionForm.tsx** refatorado com react-hook-form + zodResolver
  - Pre-fill de dados ao editar via form.reset()
  - Per-field error messages (padrão FASE 1)
  - Amount em cents internamente, formatado na UI
  - Type-based conditional fields (installments só para crédito)
  - Submit inteligente: POST para create, PATCH para edit
  - Parsing de erros do servidor (fieldErrors)
- **TransactionList.tsx** tipo Transaction atualizado com card_id, category_id, person_id
- TypeScript: 0 errors

## Padrões adotados
- Server Components para busca de dados (page.tsx sempre async)
- Client Components com react-hook-form para formulários (zodResolver)
- Server Actions para delete (soft delete — campo deleted_at)
- API Routes para POST/PATCH com validação Zod centralizada
- Soft delete em cards, categories, people (não em transactions/installments)
- Otimistic updates nos checkboxes da fatura
- Types derivados com `z.infer<>` para type safety automático

## Status dos próximos passos
1. ✅ FASE 1 — Validações Centralizadas
2. ✅ FASE 2 — Transaction Edit (reescrever TransactionForm com RHF)
3. ⏳ FASE 3 — Invoice Refetch + Pagination
4. ⏳ FASE 4 — Database Types + ISR Caching
5. ⏳ FASE 5 — Melhorias em TransactionForm
6. ⏳ FASE 6 — Performance Optimizations

## Problemas conhecidos / em solução
- ⏳ Navegação de mês na fatura ainda não rebusca dados do servidor (FASE 3)
- ✅ Edição de transação totalmente funcional (FIXADO em FASE 2)
- ✅ Validações desincronizadas (FIXADO em FASE 1)

## Próximos passos (após FASE 2)
1. Gastos futuros (flag scheduled nas transactions)
2. Contas recorrentes (tabela recurring_transactions + pg_cron)
3. Dashboard com gráficos
4. Revisão de segurança
5. Mobile responsiveness audit
