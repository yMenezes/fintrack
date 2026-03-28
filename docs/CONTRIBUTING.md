# Contributing to FinTrack

Thank you for your interest in contributing! This guide explains the standards and workflow for this project.

> **PT-BR:** Guia de contribuição em português disponível abaixo. [Ir para PT-BR →](#pt-br)

---

## Development workflow

### 1. Branch naming

```
feature/short-description     # new feature
fix/short-description          # bug fix
docs/short-description         # documentation only
refactor/short-description     # code change with no behavior change
```

Examples:
```
feature/installment-generation
fix/closing-day-calculation
docs/update-architecture
```

### 2. Commit messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add installment generation on transaction create
fix: correct closing day logic for December purchases
docs: add RLS explanation to ARCHITECTURE.md
refactor: extract date helpers to lib/utils.ts
chore: update dependencies
```

### 3. Pull requests

- One feature/fix per PR
- Include a short description of what changed and why
- Reference the related issue if there is one: `Closes #12`

---

## Code standards

### TypeScript

- Always type function parameters and return values explicitly
- Prefer `type` over `interface` for object shapes
- Use `z.infer<typeof schema>` to derive types from Zod schemas — don't duplicate type definitions

```ts
// ✅ Good
export async function getCardById(id: string): Promise<Card | null> { ... }

// ❌ Avoid
export async function getCardById(id) { ... }
```

### Components

- One component per file
- File name matches the exported component name: `TransactionForm.tsx` exports `TransactionForm`
- Server Components are the default — add `'use client'` only when needed
- Props types go right above the component, not in a separate file

```tsx
// ✅ Good
type TransactionListProps = {
  transactions: Transaction[]
  onDelete: (id: string) => void
}

export function TransactionList({ transactions, onDelete }: TransactionListProps) {
  // ...
}
```

### API Routes

Every API route must:
1. Validate the request body with Zod schema from `lib/validations.ts`
2. Return consistent error responses (422 for validation, 401 for auth, 500 for server errors)
3. Check that the authenticated user owns the resource before modifying it
4. Use status codes correctly (201 for POST, 422 for validation errors)

```ts
// app/api/cards/route.ts — standard structure
import { cardCreateSchema } from '@/lib/validations'

export async function POST(request: Request) {
  // 1. Auth check first
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  // 2. Validate body with centralized schema
  const body = await request.json()
  const result = cardCreateSchema.safeParse(body)
  
  if (!result.success) {
    // Return field-level errors so client can show per-field messages
    return NextResponse.json(
      { error: result.error.flatten().fieldErrors },
      { status: 422 }
    )
  }

  // 3. Database operation (RLS ensures user_id is always the authenticated user)
  const { data, error } = await supabase
    .from('cards')
    .insert({ ...result.data, user_id: user.id })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
```

### Form Components with React Hook Form

All forms use React Hook Form with Zod resolver for consistent validation:

```tsx
// components/cards/CardFormDialog.tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { cardCreateSchema, type CardInput } from '@/lib/validations'

type CardFormDialogProps = {
  open: boolean
  onClose: () => void
  card?: Card // for edit mode
}

export function CardFormDialog({ open, onClose, card }: CardFormDialogProps) {
  const form = useForm<CardInput>({
    resolver: zodResolver(card ? cardUpdateSchema : cardCreateSchema),
    defaultValues: { /* ... */ }
  })

  // Pre-fill when editing
  useEffect(() => {
    if (open && card) {
      form.reset(card)
    }
  }, [open, card, form])

  async function handleSubmit(data: CardInput) {
    const url = card ? `/api/cards/${card.id}` : '/api/cards'
    const method = card ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const errorData = await res.json()
      
      // Handle server validation errors
      if (errorData.error?.fieldErrors) {
        Object.entries(errorData.error.fieldErrors).forEach(([key, msgs]) => {
          form.setError(key as any, { message: msgs[0] })
        })
        return
      }

      form.setError('root', { message: errorData.error ?? 'Erro ao salvar' })
      return
    }

    router.refresh()
    onClose()
    form.reset()
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)}>
      {/* Fields with form.register() */}
      {form.formState.errors.name && (
        <span>{form.formState.errors.name.message}</span>
      )}
    </form>
  )
}
```

### Naming conventions

| Thing | Convention | Example |
|---|---|---|
| Files (components) | PascalCase | `TransactionForm.tsx` |
| Files (lib/utils) | camelCase | `installments.ts` |
| Files (API routes) | lowercase | `route.ts` |
| Variables/functions | camelCase | `getCardById` |
| Types/interfaces | PascalCase | `Transaction`, `CardInput` |
| Zod schemas | camelCase with Suffix | `cardCreateSchema`, `cardUpdateSchema` |
| Database columns | snake_case | `closing_day`, `user_id` |
| CSS classes | Tailwind utilities only | `text-sm font-medium` |

---

## Running locally

```bash
npm run dev      # development server on localhost:3000
npm run build    # production build
npm run lint     # ESLint
npm run type-check  # tsc --noEmit
```

---

<div id="pt-br">

## PT-BR — Guia de contribuição

</div>

### Fluxo de trabalho

#### Nomenclatura de branches

```
feature/descricao-curta     # nova funcionalidade
fix/descricao-curta          # correção de bug
docs/descricao-curta         # somente documentação
refactor/descricao-curta     # mudança de código sem alterar comportamento
```

#### Mensagens de commit

Siga o padrão [Conventional Commits](https://www.conventionalcommits.org/pt-br/):

```
feat: adicionar geração de parcelas ao criar transação
fix: corrigir cálculo de fechamento para compras em dezembro
docs: adicionar explicação de RLS no ARCHITECTURE.md
refactor: extrair helpers de data para lib/utils.ts
```

### Padrões de código

#### TypeScript

- Sempre tipar parâmetros e retorno de funções explicitamente
- Preferir `type` a `interface` para formatos de objeto
- Usar `z.infer<typeof schema>` para derivar tipos dos schemas Zod

#### Componentes

- Um componente por arquivo
- Server Components são o padrão — adicione `'use client'` apenas quando necessário (useState, useEffect, eventos)
- Tipos de props ficam logo acima do componente

#### API Routes

Toda API Route deve:
1. Validar o corpo da requisição com Zod antes de acessar o banco
2. Retornar erros consistentes com status HTTP correto
3. Verificar que o usuário autenticado é dono do recurso antes de modificar

#### Convenções de nomenclatura

| Coisa | Convenção | Exemplo |
|---|---|---|
| Arquivos (componentes) | PascalCase | `TransactionForm.tsx` |
| Arquivos (lib/utils) | camelCase | `installments.ts` |
| Variáveis e funções | camelCase | `getCardById` |
| Types | PascalCase | `Transaction`, `CardInput` |
| Colunas do banco | snake_case | `closing_day`, `user_id` |

### Comandos

```bash
npm run dev          # servidor de desenvolvimento em localhost:3000
npm run build        # build de produção
npm run lint         # ESLint
npm run type-check   # verificação de tipos com tsc
```
