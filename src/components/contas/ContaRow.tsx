'use client'

import { PaidCheckbox } from '@/components/ui/paid-checkbox'

export type ContaItem = {
  id: string
  kind: 'expense' | 'income'
  description: string
  amount: number
  dueDate: string | null
  completedAt: string | null
  overdue: boolean
  transactionId?: string
  category: { id: string; name: string; icon: string; color: string } | null
  person: { id: string; name: string } | null
}

type Props = {
  item: ContaItem
  done: boolean
  onToggle: (item: ContaItem) => void
}

function formatDate(dateStr: string) {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function ContaRow({ item, done, onToggle }: Props) {
  const isExpense = item.kind === 'expense'

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
        item.overdue && !done
          ? 'border-red-200 bg-red-50/40 dark:border-red-900 dark:bg-red-950/20'
          : 'border-border bg-card'
      }`}
    >
      <PaidCheckbox checked={done} onToggle={() => onToggle(item)} disabled={done} />

      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base"
        style={{ background: item.category ? `${item.category.color}22` : 'hsl(var(--muted))' }}
      >
        {item.category?.icon ?? (isExpense ? '💸' : '💰')}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2">
          <span className={`truncate text-sm font-medium ${done ? 'text-muted-foreground line-through' : ''}`}>
            {item.description}
          </span>
          <span
            className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
              isExpense
                ? 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400'
                : 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400'
            }`}
          >
            {isExpense ? 'A pagar' : 'A receber'}
          </span>
        </div>
        <span className={`text-xs ${item.overdue && !done ? 'text-red-600 dark:text-red-400 font-medium' : 'text-muted-foreground'}`}>
          {done
            ? `Concluída em ${formatDate((item.completedAt ?? '').split('T')[0])}`
            : `Vencimento ${formatDate(item.dueDate ?? '')}${item.overdue ? ' · vencida' : ''}`}
          {item.person && ` · ${item.person.name}`}
        </span>
      </div>

      <span className={`text-sm font-semibold shrink-0 ${isExpense ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
        {isExpense ? '-' : '+'}{formatCurrency(item.amount)}
      </span>
    </div>
  )
}
