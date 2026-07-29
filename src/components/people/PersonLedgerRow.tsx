'use client'

import { PaidCheckbox } from '@/components/ui/paid-checkbox'

export type LedgerItem = {
  id: string
  transactionId: string
  description: string
  amount: number
  cardName: string | null
  number: number
  installmentsCount: number
  referenceMonth: number
  referenceYear: number
  overdue: boolean
  reimbursedAt: string | null
}

type Props = {
  item: LedgerItem
  done: boolean
  onToggle: (item: LedgerItem) => void
}

const MONTH_LABELS = [
  'jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez',
]

function formatReference(month: number, year: number) {
  return `${MONTH_LABELS[month - 1]}/${year}`
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function PersonLedgerRow({ item, done, onToggle }: Props) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
        item.overdue && !done
          ? 'border-red-200 bg-red-50/40 dark:border-red-900 dark:bg-red-950/20'
          : 'border-border bg-card'
      }`}
    >
      <PaidCheckbox checked={done} onToggle={() => onToggle(item)} disabled={done} />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2">
          <span className={`truncate text-sm font-medium ${done ? 'text-muted-foreground line-through' : ''}`}>
            {item.description}
          </span>
          {item.installmentsCount > 1 && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 bg-muted text-muted-foreground">
              {item.number}/{item.installmentsCount}
            </span>
          )}
        </div>
        <span className={`text-xs ${item.overdue && !done ? 'text-red-600 dark:text-red-400 font-medium' : 'text-muted-foreground'}`}>
          {done
            ? `Reembolsada em ${formatDate(item.reimbursedAt ?? '')}`
            : `Fatura ${formatReference(item.referenceMonth, item.referenceYear)}${item.overdue ? ' · vencida' : ''}`}
          {item.cardName && ` · ${item.cardName}`}
        </span>
      </div>

      <span className="text-sm font-semibold shrink-0 text-red-600 dark:text-red-400">
        {formatCurrency(item.amount)}
      </span>
    </div>
  )
}
